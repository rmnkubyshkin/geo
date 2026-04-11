/* eslint-disable no-undef */
/* eslint-disable no-bitwise */

import { cellToLatLng } from 'h3-js';

export function getH3Coordinates(h3Index) {
    try {
        let hexIndex = String(h3Index);
        hexIndex = BigInt(hexIndex).toString(16);
        const [lat, lng] = cellToLatLng(hexIndex);
        return { latitude: lat, longitude: lng };
    } catch (err) {
        console.error('Ошибка конвертации H3 индекса:', err);
        return null;
    }
}