import { useEffect } from "react";
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox'

export default function DeckGLOverlay({ layers, onClick }) {
    const overlay = useControl(() => new MapboxOverlay({ 
        interleaved: true,
        layers: [],
        onClick }));

    useEffect(() => {
        overlay.setProps({ layers, onClick });
    }, [layers, overlay, onClick]);
    return null;
}