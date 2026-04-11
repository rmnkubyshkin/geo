const BASE_URL = 'http://localhost:5000/api';

export const geoApi = {
    fetchBuildings: () => fetch(`${BASE_URL}/coordinates/geo`).then(res => res.json()),
    fetchH3Points: (limit = 100000) => 
        fetch(`${BASE_URL}/points/h3/indexes/simple?limit=${limit}`).then(res => res.json()),
};