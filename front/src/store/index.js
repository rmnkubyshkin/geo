import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import pointsReducer from './slices/pointsSlice';
import buildingsReducer from './slices/buildingsSlice';

export const store = configureStore({
    reducer: {
        map: mapReducer,
        points: pointsReducer,
        buildings: buildingsReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
        serializableCheck: {
            warnAfter: 200,
        },
    }),
});

export default store;