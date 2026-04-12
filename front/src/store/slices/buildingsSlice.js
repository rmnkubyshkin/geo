import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { geoApi } from '../../services/geoApi';

export const loadBuildings = createAsyncThunk(
    'buildings/loadBuildings',
    async () => {
        const buildings = await geoApi.fetchBuildings();
        return buildings;
    }
);

const buildingsSlice = createSlice({
    name: 'buildings',
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadBuildings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadBuildings.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(loadBuildings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export default buildingsSlice.reducer;