import { useMemo, useEffect } from "react";
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { Button } from "@mui/material";
import { GeoJsonLayer } from '@deck.gl/layers';
import { HexagonLayer } from "@deck.gl/aggregation-layers";

import DeckGLOverlay from './DeckGLOverlay';
import { INITIAL_VIEW_STATE, POLYGON_LAYER_STYLE, MAP_STYLE } from './constants';
import { toggleTypeLayer, setViewState } from '../../store/slices/mapSlice';
import { loadH3Points } from '../../store/slices/pointsSlice';
import { loadBuildings } from '../../store/slices/buildingsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export default function MapContainer() {
    const dispatch = useAppDispatch();

    const typeLayer = useAppSelector((state) => state.map.typeLayer);
    const displayPoints = useAppSelector((state) => state.points.displayPoints);
    const pointsLoading = useAppSelector((state) => state.points.loading);
    const geojsonData = useAppSelector((state) => state.buildings.data);
    const buildingsLoading = useAppSelector((state) => state.buildings.loading);

    useEffect(() => {
        dispatch(loadH3Points(100000));
        dispatch(loadBuildings());
    }, [dispatch]);

    const layers = useMemo(() => {
        if (displayPoints.length === 0) return [];
        
        const hexagonConfig = {
            id: `hexagon-${typeLayer}`,
            data: displayPoints,
            getPosition: d => [d.longitude, d.latitude],
            radius: typeLayer === '3D' ? 3 : 3,
            radiusUnits: "meters",
            pickable: true,
            colorRange: typeLayer === '3D' 
                ? [[0, 255, 0, 200], [255, 255, 0, 200], [255, 0, 0, 200]]
                : [[0, 200, 0, 150], [255, 220, 0, 180], [220, 50, 0, 200]],
            opacity: 0.8
        };

        const layers = [
            new HexagonLayer({
                ...hexagonConfig,
                extruded: typeLayer === '3D',
                getElevation: typeLayer === '3D' ? d => d.altitude || 1 : undefined,
                elevationScale: typeLayer === '3D' ? 0.5 : 0,
                elevationRange: typeLayer === '3D' ? [0, 100] : [0, 0]
            })
        ];

        
        if (typeLayer === '3D' && geojsonData) {
            layers.push(new GeoJsonLayer({
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
            }));
        }

        return layers;
    }, [displayPoints, typeLayer, geojsonData]);

    const handleViewStateChange = (newViewState) => {
            dispatch(setViewState(newViewState));
        };
    if (pointsLoading || buildingsLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                Загрузка данных...
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={MAP_STYLE}
                onMove={evt => handleViewStateChange(evt.viewState)}
            >
                <DeckGLOverlay layers={layers} />                
                {typeLayer === '2D' && geojsonData && (
                    <Source id="my-polygons-2d" type="geojson" data={geojsonData}>
                        <Layer {...POLYGON_LAYER_STYLE} />
                    </Source>
                )}
            </Map>
            
            <Button
                onClick={() => dispatch(toggleTypeLayer())}
                variant="contained"
                color="success"
                style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}
            >
                Сменить тип ({typeLayer})
            </Button>
        </div>
    );
}