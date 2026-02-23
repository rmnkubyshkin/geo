import {ScatterplotLayer, ColumnLayer  } from '@deck.gl/layers';
import { Map, useControl } from 'react-map-gl/maplibre';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { MapboxOverlay } from '@deck.gl/mapbox'
import { useMemo, useState, useEffect } from "react";
import {Button} from "@mui/material";
import { Source, Layer } from 'react-map-gl/maplibre';
const INITIAL_VIEW_STATE = {
    longitude: 30.20254900,
    latitude: 59.93972700,
    zoom: 16,
    pitch: 60,
    bearing: 30
};


class SquareScatterplotLayer extends ScatterplotLayer {
    getShaders() {
        const shaders = super.getShaders();
        shaders.vs = super.getShaders().vs;
        shaders.fs = `
          precision highp float;
          varying vec4 vFillColor;
          void main(void) {
                if (vFillColor.a == 0.0) discard;
                if (abs(gl_PointCoord.x - 0.5) > 0.5 || abs(gl_PointCoord.y - 0.5) > 0.5) discard;
                gl_FragColor = vFillColor;
              }
            `;
    return shaders;
    }
}

const polygonLayerStyle = {
    id: 'mapbox-polygon-layer',
    type: 'fill',
    paint: {
        'fill-color': '#dc0000',
        'fill-opacity': 0.6,
        'fill-outline-color': '#ffffff'
    }
};
const polygon3DLayerStyle = {
    id: 'mapbox-polygon-3d',
    type: 'fill-extrusion',
    paint: {
        'fill-extrusion-color': '#c9c9c9',
        'fill-extrusion-height': ['to-number', ['get', 'AGL'], 0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.6
    }
};

function DeckGLOverlay(props) {
    const overlay = useControl(() => new MapboxOverlay(props));
    useEffect(() => {
        overlay.setProps(props);
    }, [props]);
    return null;
}

export default function Desk() {
    const [geojsonData, setGeojsonData] = useState(null);
    const [pointJsonData, setPointJsonData] = useState([]);
    const [typeLayer, setTypeLayer] = useState('2D');


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
    const layers = useMemo(() => [
        typeLayer === '2D' ?
            new SquareScatterplotLayer({
                id: 'sq-2d',
                data: pointJsonData,
                getPosition: d => [d.longitude, d.latitude],
                getFillColor: [100, 100, 255],
                getRadius: 3,
                radiusUnits: 'pixels',
            }) :
            new ColumnLayer({
                id: 'cubes-3d',
                data: pointJsonData,
                getPosition: d => [d.longitude, d.latitude, d.height || 0],
                getElevation: 2,
                elevationScale: 1,
                diskResolution: 4,
                angle: 45,
                extruded: true,
                radius: 1,
                getFillColor: [100, 255, 100],
            }),
    ], [typeLayer, pointJsonData, geojsonData]);
    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            >
                <Source id="my-polygons" type="geojson" data={geojsonData}>
                    {typeLayer === '2D' ? (
                        <Layer
                            key="mapbox-polygon-layer"
                            {...polygonLayerStyle}
                        />
                    ) : (
                        <Layer
                            key="mapbox-polygon-3d"
                            {...polygon3DLayerStyle}
                        />
                    )}
                </Source>
                <DeckGLOverlay layers={layers} />
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