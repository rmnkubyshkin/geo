import { useMemo, useState, useEffect, useRef } from "react";
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { Button } from "@mui/material";
import { GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import DeckGLOverlay from './DeckGLOverlay';
import { INITIAL_VIEW_STATE, POLYGON_LAYER_STYLE, MAP_STYLE } from './constants';
import { toggleTypeLayer, setViewState } from '../../store/slices/mapSlice';
import { loadH3Points, loadPlacesByHex } from '../../store/slices/pointsSlice';
import { setSelectedHex } from '../../store/slices/pointsSlice';
import { loadBuildings } from '../../store/slices/buildingsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export default function MapContainer() {
    const dispatch = useAppDispatch();

    const typeLayer = useAppSelector((state) => state.map.typeLayer);
    const displayPoints = useAppSelector(state => state.points.rawPoints);
    const pointsLoading = useAppSelector((state) => state.points.loading);
    const geojsonData = useAppSelector((state) => state.buildings.data);
    const buildingsLoading = useAppSelector((state) => state.buildings.loading);
    const selectedPlaces = useAppSelector(state => state.points.selectedPlaces);
    const [key, setKey] = useState(0);
    const selectedHex = useAppSelector(state => state.points.selectedHex);

    const handleHexClick = (info) => {
        const hex = info.object;
        if (!hex) return;
        dispatch(setSelectedHex(hex));
        dispatch(loadPlacesByHex(hex.h3Index));
        console.log("CLICK HEX:", hex);
    };

    useEffect(() => {
        dispatch(loadH3Points(100000));
        dispatch(loadBuildings());
    }, [dispatch]);

    useEffect(() => {
        if (displayPoints.length > 0) {
            console.log('Type layer changed to:', typeLayer);
            setKey(prev => prev + 1);
        }
    }, [typeLayer, displayPoints.length]);
    const mapRef = useRef();


    const layers = useMemo(() => {
        if (displayPoints.length === 0) return [];
        console.log(displayPoints[0])
        const resultLayers = [
            new H3HexagonLayer({
            id: 'h3-layer',
            data: displayPoints,

            pickable: true,
            autoHighlight: true,

            getHexagon: d => d.h3Index,

            getFillColor: d => {
                const count = d.pointCount;

                if (count > 50) return [255, 0, 0, 200];
                if (count > 20) return [255, 200, 0, 180];
                return [0, 200, 0, 150];
            },

            extruded: typeLayer === '3D',
            getElevation: d => d.pointCount,
            elevationScale: typeLayer === '3D' ? 10 : 0
        })
        ];

        if (typeLayer === '3D' && geojsonData) {
            resultLayers.push(
                new GeoJsonLayer({
                    id: 'buildings-layer',
                    data: geojsonData,
                    extruded: true,
                    getElevation: d => Number(d.properties.height || 0),
                    getFillColor: [180, 180, 180, 180],
                    getLineColor: [255, 255, 255, 200],
                    lineWidthUnits: "pixels",
                    lineWidth: 1
                })
            );
        }

        return resultLayers;
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
                <DeckGLOverlay 
                    layers={layers} 
                    onClick={handleHexClick}
                    controller={true} 
                />                
                {typeLayer === '2D' && geojsonData && (
                    <Source id="my-polygons-2d" type="geojson" data={geojsonData}>
                        <Layer {...POLYGON_LAYER_STYLE} />
                    </Source>
                )}
            </Map>
            {selectedHex && (
                <div style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: 320,
                    height: "100%",
                    background: "white",
                    overflow: "auto",
                    zIndex: 1000,
                    padding: 12
                }}>
                    <h3>H3: {selectedHex.h3Index}</h3>

                    <div>Точек: {selectedHex.pointCount}</div>

                    <hr />

                   {selectedPlaces?.map(p => (
                        <div key={p.place_id} style={{ marginBottom: 10 }}>
                            <b>{p.name}</b>
                            <div>⭐ {p.rating}</div>
                            <div>{p.business_status}</div>
                        </div>
                    ))}
                </div>
            )}
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