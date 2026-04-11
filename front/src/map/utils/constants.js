export const INITIAL_VIEW_STATE = {
    longitude: 30.202549,
    latitude: 59.939727,
    zoom: 16,
    pitch: 60,
    bearing: 30
};

export const POLYGON_LAYER_STYLE = {
    id: 'mapbox-polygon-layer',
    type: 'fill',
    paint: {
        'fill-color': '#880808',
        'fill-opacity': 0.5,
        'fill-outline-color': '#ffffff'
    },
    layout: {
        'visibility': 'visible'
    }
};

export const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";