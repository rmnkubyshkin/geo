import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { Button } from "@mui/material";
import { GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import DeckGLOverlay from './DeckGLOverlay';
import { INITIAL_VIEW_STATE, POLYGON_LAYER_STYLE, MAP_STYLE } from './constants';
import { toggleTypeLayer, setViewState } from '../../store/slices/mapSlice';
import { loadH3Points, loadPlacesByHex, setSelectedPlaces } from '../../store/slices/pointsSlice';
import { setSelectedHex } from '../../store/slices/pointsSlice';
import { loadBuildings } from '../../store/slices/buildingsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import debounce from 'lodash.debounce';



export default function MapContainer() {
    const dispatch = useAppDispatch();
    const typeLayer = useAppSelector((state) => state.map.typeLayer);
    const displayPoints = useAppSelector(state => state.points.rawPoints);
    const pointsLoading = useAppSelector((state) => state.points.loading);
    const geojsonData = useAppSelector((state) => state.buildings.data);
    const buildingsLoading = useAppSelector((state) => state.buildings.loading);
    const selectedPlaces = useAppSelector(state => state.points.selectedPlaces);
    const selectedHex = useAppSelector(state => state.points.selectedHex);
    const mapRef = useRef();
    const viewState = useAppSelector(state => state.map.viewState);
    const initialLoadDoneRef = useRef(false);
    
    const debouncedLoad = useMemo(() => {
        return debounce((params) => {
            dispatch(loadH3Points(params));
        }, 300);
    }, [dispatch]);

    useEffect(() => {
        return () => {
            debouncedLoad.cancel();
        };
    }, [debouncedLoad]);

    const handleHexClick = (info) => {

        const hex = info.object;
        if (!hex) return;
        dispatch(setSelectedHex({
            h3Index: hex.h3Index,
            pointCount: hex.pointCount,
            resolution: hex.resolution,
        }));
        dispatch(loadPlacesByHex({
            h3Index: hex.h3Index,
            resolution: hex.resolution
        }));

    };

    useEffect(() => {
        dispatch(loadBuildings());
    }, [dispatch]);

    function getH3Resolution(zoom) {
        if (zoom < 8) return 5;
        if (zoom < 10) return 6;
        if (zoom < 11.5) return 7;
        if (zoom < 13) return 8;
        return 9;
    }

    const layers = useMemo(() => {
        const resultLayers = [];

        if (displayPoints.length > 0) {
            resultLayers.push(
                new H3HexagonLayer({
                    id: 'h3-layer',
                    data: displayPoints,
                    pickable: true,
                    autoHighlight: true,
                    getHexagon: d => d.h3Index,
                    stroked: false,
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
            );
        }

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
        console.log('displayPoints length', displayPoints.length);
        console.log('displayPoints sample', displayPoints[0]);
        return resultLayers;
    }, [displayPoints, typeLayer, geojsonData]);

    const handleMoveEnd = (evt) => {
        if (!mapRef.current) return;

        const { zoom } = evt.viewState;
        const bounds = mapRef.current.getBounds();

        const bbox = {
            minLng: bounds.getWest(),
            maxLng: bounds.getEast(),
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
        };

        const resolution = getH3Resolution(zoom);

        debouncedLoad({
            limit: 50000,
            resolution,
            bbox
        });
    };
    const handleMapLoad = useCallback((evt) => {
        if (initialLoadDoneRef.current) return;
        initialLoadDoneRef.current = true;

        const zoom = evt.target.getZoom();
        const bounds = evt.target.getBounds();

        const bbox = {
            minLng: bounds.getWest(),
            maxLng: bounds.getEast(),
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
        };

        const resolution = getH3Resolution(zoom);

        debouncedLoad({
            limit: 50000,
            resolution,
            bbox
        });
    }, [debouncedLoad]);

    return (
        <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={MAP_STYLE}
                ref={mapRef}
                onMoveEnd={handleMoveEnd}
                onLoad={handleMapLoad}
            >
                <DeckGLOverlay 
                    layers={layers} 
                    onClick={handleHexClick}
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
                            <div>Рейтинг: {p.rating}⭐</div>
                            <div>Кол-во отзывов: {p.reviews}</div>
                            <div>Цена: {p.price}</div>
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