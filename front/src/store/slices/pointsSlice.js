import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { geoApi } from '../../services/geoApi';

export const loadH3Points = createAsyncThunk(
    'points/loadH3Points',
    async (limit = 100000) => {
        const points = await geoApi.fetchH3Points(limit);
        return points;
    }
);

export const loadPlacesByHex = createAsyncThunk(
    'points/loadPlacesByHex',
    async (h3Index) => {
        if (!h3Index) {
            console.warn("h3Index is empty");
            return [];
        }

        const res = await fetch(`/api/places/by-h3?h3_index=${h3Index}`);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();
    }
);

const pointsSlice = createSlice({
    name: 'points',
    initialState: {
        rawPoints: [],
        displayPoints: [],
        loading: false,
        error: null,
        selectedHex: null,
        selectedPlaces: [],
    },
    reducers: {
        clearPoints: (state) => {
          state.rawPoints = [];
          state.displayPoints = [];
        },
        setSelectedHex: (state, action) => {
            state.selectedHex = action.payload;
        },
        setSelectedPlaces: (state, action) => {
            state.selectedPlaces = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadH3Points.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadH3Points.fulfilled, (state, action) => {
                state.loading = false;
                state.rawPoints = action.payload;
            })
            .addCase(loadH3Points.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(loadPlacesByHex.fulfilled, (state, action) => {
                    state.selectedPlaces = action.payload;
            });
    }
});

export const { clearPoints, setSelectedHex, setSelectedPlaces } = pointsSlice.actions;
export default pointsSlice.reducer;
