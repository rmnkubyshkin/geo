/* eslint-disable no-undef */
/* eslint-disable no-bitwise */

import {ScatterplotLayer, ColumnLayer, GeoJsonLayer} from '@deck.gl/layers';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { MapboxOverlay } from '@deck.gl/mapbox'
import {useMemo, useState, useEffect, useRef} from "react";
import {Button} from "@mui/material";
import { useControl, Map, Source, Layer } from 'react-map-gl/maplibre';
import { cellToLatLng } from 'h3-js';


const INITIAL_VIEW_STATE = {
    longitude: 30.20254900,
    latitude: 59.93972700,
    zoom: 16,
    pitch: 60,
    bearing: 30
};

const polygonLayerStyle = {
    id: 'mapbox-polygon-layer',
    type: 'fill',
    paint: {
        'fill-color': '#880808',
        'fill-opacity': 0.5,
        'fill-outline-color': '#ffffff'
    },
    layout: {
        'visibility': 'visible'
    }
};

function getH3Coordinates(h3Index) {
    try {
        let hexIndex = String(h3Index);
        hexIndex = BigInt(hexIndex).toString(16);
        
        const [lat, lng] = cellToLatLng(hexIndex);
        
        console.log("latitude:", lat);
        console.log("longitude:", lng);
        
        return { latitude: lat, longitude: lng };
    } catch (err) {
        console.error('Ошибка конвертации H3 индекса:', err);
        return null;
    }
}

class SquareScatterplotLayer extends ScatterplotLayer {
    getShaders() {
        const shaders = super.getShaders();
        return {
            ...shaders,
            fs: `#version 300 es
              precision highp float;
              in vec4 vFillColor;
              out vec4 fragColor;

              void main(void) {
                if (vFillColor.a == 0.0) discard;
                if (abs(gl_PointCoord.x - 0.5) > 0.5 || abs(gl_PointCoord.y - 0.5) > 0.5) {
                    discard;
                }
                fragColor = vFillColor;
              }
            `
        };
    }
}

function DeckGL({ layers, mapRef }) {
    const overlay = useControl(() => new MapboxOverlay({
        interleaved: true
    }));

    useEffect(() => {
        const map = mapRef?.current?.getMap();
        if (!map || !overlay) return;

        const update = () => {
            const style = map.getStyle();
            if (!style) return;

            overlay.setProps({ layers });
        };

        if (map.isStyleLoaded()) update();
        else map.once('style.load', update);

    }, [layers, overlay, mapRef]);

    return null;
}

export default function Desk() {
    const [geojsonData, setGeojsonData] = useState(null);
   // const [pointJsonData, setPointJsonData] = useState([]);
    const [typeLayer, setTypeLayer] = useState('2D');
    const [h3Points, setH3Points] = useState([]);
    const mapRef = useRef();

useEffect(() => {
    const fetchData = async () => {
        try {
            const [geoRes, h3Res] = await Promise.all([
                fetch('http://localhost:5000/api/coordinates/geo'),
                fetch('http://localhost:5000/api/points/h3/indexes/simple?limit=100000')
            ]);

            if (geoRes.ok) {
                const geoData = await geoRes.json();
                setGeojsonData(geoData);
                console.log('Здания загружены');
            }

            if (h3Res.ok) {
                const points = await h3Res.json();
                console.log(`Получено ${points.length} точек`);
                setH3Points(points);
            }
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        }
    };

    fetchData();
}, []);

    const displayPoints = useMemo(() => {
        if (h3Points.length === 0) return [];
        
        console.log('Обработка точек, количество:', h3Points.length);
        
        const grouped = {};
        h3Points.forEach(point => {
            if (!grouped[point.h3Index]) {
                const coords = getH3Coordinates(point.h3Index);
                console.log('Точка:', point.h3Index, 'координаты:', coords);
                if (coords) {
                    grouped[point.h3Index] = {
                        h3Index: point.h3Index,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        altitudes: [],
                        count: 0
                    };
                }
            }
            if (grouped[point.h3Index]) {
                grouped[point.h3Index].altitudes.push(point.altitude);
                grouped[point.h3Index].count++;
            }
        });
        
        const result = Object.values(grouped).map(group => ({
            longitude: group.longitude,
            latitude: group.latitude,
            altitude: group.altitudes.reduce((a,b) => a+b, 0) / group.altitudes.length,
            h3Index: group.h3Index,
            pointCount: group.count
        }));
        
        console.log('Результат displayPoints:', result.length, 'первый:', result[0]);
        return result;
    }, [h3Points]);
        

    const layers = useMemo(() => {
        const deckLayers = [];

        if (displayPoints.length === 0) 
            return deckLayers;

        if (typeLayer === '3D') {
            deckLayers.push(new ColumnLayer({
                id: 'cubes-3d',
                data: displayPoints,
                getPosition: d => {
                    return [Number(d.longitude), Number(d.latitude), Number(d.altitude || 0)];
                },
                getElevation: 1.2,
                radius: 1,
                diskResolution: 4,
                radiusUnits: 'meters',
                opacity: 0.3,
                getFillColor: [255, 255, 0, 255],
                extruded: true,
            }));
                if (geojsonData) {
                    deckLayers.push(new GeoJsonLayer({
                        id: 'buildings-layer',
                        data: geojsonData,
                        extruded: true,
                        getElevation: d => Number(d.properties.height || 0),
                        getFillColor: [136, 8, 8, 200],
                        parameters: { cull: true },
                    }));
                }
        } else {
                deckLayers.push(new SquareScatterplotLayer({
                    id: 'sq-2d',
                    data: displayPoints,
                    getPosition: d => [Number(d.longitude), Number(d.latitude), 0.01],
                    getRadius: 2,
                    getFillColor: [255, 255, 0, 255],
                }));
        }
        return deckLayers;
    }, [displayPoints, typeLayer, geojsonData]);
    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                key={typeLayer}
                ref={mapRef}
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            >
                <DeckGL layers={layers} mapRef={mapRef} />
                {typeLayer === '2D' && geojsonData && (
                    <Source id="my-polygons-2d" type="geojson" data={geojsonData}>
                        <Layer {...polygonLayerStyle} />
                    </Source>
                )}
            </Map>
            
            <Button
                onClick={() => setTypeLayer(prev => prev === '2D' ? '3D' : '2D')}
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 10,
                    backgroundColor: "#2e7d32",
                    color: "white",
                }}
            >
                Сменить тип отображения ({typeLayer === '2D' ? '3D' : '2D'})
            </Button>
        </div>
    );
}