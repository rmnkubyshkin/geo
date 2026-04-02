import {ScatterplotLayer, ColumnLayer, GeoJsonLayer} from '@deck.gl/layers';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { MapboxOverlay } from '@deck.gl/mapbox'
import {useMemo, useState, useEffect, useRef} from "react";
import {Button} from "@mui/material";
import { useControl, Map, Source, Layer } from 'react-map-gl/maplibre';
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
    const [pointJsonData, setPointJsonData] = useState([]);
    const [typeLayer, setTypeLayer] = useState('2D');
    const mapRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pointsRes, geoRes] = await Promise.all([
                    fetch('http://localhost:5000/api/coordinates/points'),
                    fetch('http://localhost:5000/api/coordinates/geo')
                ]);

                if (pointsRes.ok) {
                    const res = await pointsRes.json();
                    setPointJsonData(Array.isArray(res) ? res : res.data || []);
                }
                if (geoRes.ok) setGeojsonData(await geoRes.json());
            } catch (err) {
                console.error('Ошибка загрузки:', err);
            }
        };
        fetchData();
    }, []);


    const layers = useMemo(() => {
        const deckLayers = [];
        if (typeLayer === '3D') {
            deckLayers.push(new ColumnLayer({
                id: 'cubes-3d',
                data: pointJsonData,
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
                    parameters: {
                        cull: true
                    },
                }));
            }
        } else {
            if (geojsonData) {
                deckLayers.push(new SquareScatterplotLayer({
                    id: 'sq-2d',
                    data: pointJsonData,
                    getPosition: d => {
                        const coords = d.geometry?.coordinates || [d.longitude, d.latitude];
                        const [lon, lat] = coords;
                        return [Number(lon), Number(lat), 0.01];
                    },
                    getRadius: 2,
                    getFillColor: [255, 255, 0, 255],
                }));
            }
        }
        return deckLayers;
    }, [pointJsonData, typeLayer, geojsonData]);
    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                key={typeLayer}
                ref={mapRef}
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            >
                <DeckGL
                    layers={layers}
                    mapRef={mapRef}
                >
                </DeckGL>
                {typeLayer === '2D' && geojsonData && (
                    <Source id="my-polygons-2d" type="geojson" data={geojsonData}>
                        <Layer
                            key="mapbox-polygon-layer"
                            {...polygonLayerStyle}
                        />
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
                Сменить тип отображения
            </Button>
        </div>
    );
}