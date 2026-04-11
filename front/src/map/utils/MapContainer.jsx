import React, { useMemo, useState, useEffect, useRef } from "react";
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { Button } from "@mui/material";
import { ColumnLayer, GeoJsonLayer } from '@deck.gl/layers';

import DeckGLOverlay from './DeckGLOverlay';
import { SquareScatterplotLayer } from '../layers/SquareScatterplotLayer';
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
                new ColumnLayer({
                    id: 'cubes-3d',
                    data: displayPoints,
                    getPosition: d => [Number(d.longitude), Number(d.latitude), Number(d.altitude || 0)],
                    getElevation: 1.2,
                    radius: 1,
                    diskResolution: 4,
                    radiusUnits: 'meters',
                    opacity: 0.3,
                    getFillColor: [255, 255, 0, 255],
                    extruded: true,
                }),
                geojsonData && new GeoJsonLayer({
                    id: 'buildings-layer',
                    data: geojsonData,
                    extruded: true,
                    getElevation: d => Number(d.properties.height || 0),
                    getFillColor: [136, 8, 8, 200],
                })
            ].filter(Boolean);
        }

        return [
            new SquareScatterplotLayer({
                id: 'sq-2d',
                data: displayPoints,
                getPosition: d => [Number(d.longitude), Number(d.latitude), 0.01],
                getRadius: 2,
                getFillColor: [255, 255, 0, 255],
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