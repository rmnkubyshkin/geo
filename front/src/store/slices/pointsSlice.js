import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { geoApi } from '../../services/geoApi';
import { getH3Coordinates } from '../../map/utils/h3Utils';

export const loadH3Points = createAsyncThunk(
    'points/loadH3Points',
    async (limit = 100000) => {
        const points = await geoApi.fetchH3Points(limit);
        return points;
    }
);

const processDisplayPoints = (points) => {
    const grouped = {};
    points.forEach(point => {
        if (!grouped[point.h3Index]) {
            const coords = getH3Coordinates(point.h3Index);
            if (coords) {
                grouped[point.h3Index] = { 
                    ...coords, 
                    altitudes: [], 
                    count: 0,
                    h3Index: point.h3Index
                };
            }
        }
        if (grouped[point.h3Index]) {
            grouped[point.h3Index].altitudes.push(point.altitude);
            grouped[point.h3Index].count++;
        }
    });

    return Object.values(grouped).map(group => ({
        longitude: group.longitude,
        latitude: group.latitude,
        altitude: group.altitudes.reduce((a, b) => a + b, 0) / group.altitudes.length,
        h3Index: group.h3Index,
        pointCount: group.count
    }));
};

const pointsSlice = createSlice({
    name: 'points',
    initialState: {
        rawPoints: [],
        displayPoints: [],
        loading: false,
        error: null
    },
    reducers: {
      clearPoints: (state) => {
          state.rawPoints = [];
          state.displayPoints = [];
      },
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
                state.displayPoints = processDisplayPoints(action.payload);
            })
            .addCase(loadH3Points.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { clearPoints } = pointsSlice.actions;
export default pointsSlice.reducer;