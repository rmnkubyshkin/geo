import { useMemo, useState, useEffect, useRef } from "react";
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { Button } from "@mui/material";
import { GeoJsonLayer } from '@deck.gl/layers';
import { HexagonLayer } from "@deck.gl/aggregation-layers";

import DeckGLOverlay from './DeckGLOverlay';
import { getH3Coordinates } from './h3Utils';
import { INITIAL_VIEW_STATE, POLYGON_LAYER_STYLE, MAP_STYLE } from './constants';
import { geoApi } from '../../services/geoApi';



export default function MapContainer() {
    const [geojsonData, setGeojsonData] = useState(null);
    const [typeLayer, setTypeLayer] = useState('2D');
    const [h3Points, setH3Points] = useState([]);
    const mapRef = useRef();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [buildings, points] = await Promise.all([
                    geoApi.fetchBuildings(),
                    geoApi.fetchH3Points()
                ]);
                setGeojsonData(buildings);
                setH3Points(points);
            } catch (err) {
                console.error('Data loading error:', err);
            }
        };
        loadData();
    }, []);

    const displayPoints = useMemo(() => {
        const grouped = {};
        h3Points.forEach(point => {
            if (!grouped[point.h3Index]) {
                const coords = getH3Coordinates(point.h3Index);
                if (coords) {
                    grouped[point.h3Index] = { ...coords, altitudes: [], count: 0 };
                }
            }
            if (grouped[point.h3Index]) {
                grouped[point.h3Index].altitudes.push(point.altitude);
                grouped[point.h3Index].count++;
            }
        });

        return Object.values(grouped).map(group => ({
            ...group,
            altitude: group.altitudes.reduce((a, b) => a + b, 0) / group.altitudes.length
        }));
    }, [h3Points]);

    const layers = useMemo(() => {
        if (typeLayer === '3D') {
            return [
                new HexagonLayer({
                    id: "hexagon-3d",
                    data: displayPoints,
                    getPosition: d => [d.longitude, d.latitude],
                    getElevation: d => d.altitude || 1,
                    radius: 3,
                    radiusUnits: "meters",
                    colorRange: [
                        [0, 255, 0, 200], 
                        [255, 255, 0, 200],    
                        [255, 0, 0, 200]       
                    ],
                    elevationScale: 0.5,    
                    elevationRange: [0, 100],
                    opacity: 0.8,
                    extruded: true,
                    pickable: true
                    }),
                geojsonData && new GeoJsonLayer({
                    id: 'buildings-layer',
                    data: geojsonData,
                    extruded: true,
                    getElevation: d => Number(d.properties.height || 0),
                    getFillColor: [180, 180, 180, 180], 
                    getLineColor: [255, 255, 255, 200],
                    lineWidthUnits: "pixels",
                    lineWidth: 1,
                    material: {
                        ambient: 0.6,
                        diffuse: 0.6,
                        shininess: 90,
                        specularColor: [100, 100, 100]
                    }
                })
            ].filter(Boolean);
        }

        return [
             new HexagonLayer({
                id: "hexagon-2d",
                data: displayPoints,
                getPosition: d => [d.longitude, d.latitude],
                radius: 3,
                colorRange: [
                    [0, 200, 0, 150], 
                    [255, 220, 0, 180],
                    [220, 50, 0, 200]    
                ],
                elevationScale: 0,
                elevationRange: [0, 0],
                opacity: 0.9,
                extruded: false,
                pickable: true
            })
        ];
    }, [displayPoints, typeLayer, geojsonData]);

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                ref={mapRef}
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={MAP_STYLE}
            >
                <DeckGLOverlay  key={typeLayer} layers={layers} mapRef={mapRef} />
                
                {typeLayer === '2D' && geojsonData && (
                    <Source id="my-polygons-2d" type="geojson" data={geojsonData}>
                        <Layer {...POLYGON_LAYER_STYLE} />
                    </Source>
                )}
            </Map>
            
            <Button
                onClick={() => setTypeLayer(prev => prev === '2D' ? '3D' : '2D')}
                variant="contained"
                color="success"
                style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}
            >
                Сменить тип ({typeLayer})
            </Button>
        </div>
    );
}