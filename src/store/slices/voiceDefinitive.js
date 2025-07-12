'use client';
import { createSlice } from '@reduxjs/toolkit';


const voiceDefinitiveStore = createSlice({
    name: 'voiceDefinitive',
    initialState: null,
    reducers: {
        setVoicesDefinitive: (state, action) => {
            return action.payload;
        }
    },
});

export const { setVoicesDefinitive } = voiceDefinitiveStore.actions;

export default voiceDefinitiveStore.reducer;