import { useEffect } from "react";
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox'

export default function DeckGLOverlay({ layers }) {
    const overlay = useControl(() => new MapboxOverlay({ interleaved: true }));

    useEffect(() => {
        overlay.setProps({ layers });
    }, [layers, overlay]);
    return null;
}