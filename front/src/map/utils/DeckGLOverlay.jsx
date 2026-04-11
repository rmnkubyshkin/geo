import { useEffect } from "react";
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';

export default function DeckGLOverlay({ layers, mapRef }) {
    const overlay = useControl(() => new MapboxOverlay({
        interleaved: true
    }));

    useEffect(() => {
        const map = mapRef?.current?.getMap();
        if (!map || !overlay) return;

        const update = () => {
            if (map.isStyleLoaded()) {
                overlay.setProps({ layers });
            }
        };

        map.on('style.load', update);
        update();

        return () => map.off('style.load', update);
    }, [layers, overlay, mapRef]);

    return null;
}