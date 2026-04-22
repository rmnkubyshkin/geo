const BASE_URL = 'http://localhost:5000/api';

export const geoApi = {
    fetchBuildings: () => fetch(`${BASE_URL}/coordinates/geo`).then(res => res.json()),

    fetchH3Points: async ({ limit, resolution, bbox }) => {
        const url =
            `${BASE_URL}/points/h3/indexes/simple` +
            `?limit=${limit}` +
            `&resolution=${resolution}` +
            `&minLat=${bbox.minLat}` +
            `&maxLat=${bbox.maxLat}` +
            `&minLng=${bbox.minLng}` +
            `&maxLng=${bbox.maxLng}`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`fetchH3Points failed: HTTP ${res.status}`);
        }

        return await res.json();
    },

    fetchPlacesByH3: async (h3Index, resolution) => {
        const res = await fetch(
            `${BASE_URL}/points/by-h3?h3_index=${h3Index}&resolution=${resolution}`
        );

        if (!res.ok) {
            throw new Error(`fetchPlacesByH3 failed: HTTP ${res.status}`);
        }

        return await res.json();
    }
};