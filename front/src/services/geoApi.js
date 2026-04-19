const BASE_URL = 'http://localhost:5000/api';

export const geoApi = {
    fetchBuildings: () => fetch(`${BASE_URL}/coordinates/geo`).then(res => res.json()),

    fetchH3Points: (limit = 100000) => 
        fetch(`${BASE_URL}/points/h3/indexes/simple?limit=${limit}`).then(res => res.json()),


    fetchPlacesByH3: async (h3Index) => {
        console.log(" h3Index in fetchPlacesByH3 :", h3Index)
        const res = await fetch(`${BASE_URL}/points/by-h3?h3_index=${h3Index}`);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return await res.json();
    }
};