import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { geoApi } from '../../services/geoApi';

export const loadH3Points = createAsyncThunk(
    'points/loadH3Points',
    async ({ limit, resolution, bbox }) => {
        const points = await geoApi.fetchH3Points({ limit, resolution, bbox });
        return points;
    }
);

export const loadPlacesByHex = createAsyncThunk(
    'points/loadPlacesByHex',
    async ({ h3Index, resolution }) => {
        if (!h3Index || resolution == null) {
            console.warn("h3Index or resolution is empty");
            return [];
        }
    const places = await geoApi.fetchPlacesByH3(h3Index, resolution);
    return places;
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
                    console.log('selectedPlaces fulfilled', action.payload);
                    state.selectedPlaces = action.payload;
            })
            .addCase(loadPlacesByHex.rejected, (state, action) => {
                console.error('loadPlacesByHex rejected', action.error);
                state.error = action.error.message;
            });
    }
});

export const { clearPoints, setSelectedHex, setSelectedPlaces } = pointsSlice.actions;
export default pointsSlice.reducer;
