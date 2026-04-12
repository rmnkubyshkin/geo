import { createSlice } from '@reduxjs/toolkit';

const INITIAL_VIEW_STATE = {
    longitude: 30.20254900,
    latitude: 59.93972700,
    zoom: 16,
    pitch: 60,
    bearing: 30
};

const mapSlice = createSlice({
    name: 'map',
    initialState: {
        typeLayer: '2D',
        viewState: INITIAL_VIEW_STATE
    },
    reducers: {
        setTypeLayer: (state, action) => {
            state.typeLayer = action.payload;
        },
        toggleTypeLayer: (state) => {
            state.typeLayer = state.typeLayer === '2D' ? '3D' : '2D';
        },
        setViewState: (state, action) => {
            state.viewState = { ...state.viewState, ...action.payload };
        }
    }
});

export const { setTypeLayer, toggleTypeLayer, setViewState } = mapSlice.actions;
export default mapSlice.reducer;