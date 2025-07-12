'use client';
import { createSlice } from '@reduxjs/toolkit';


const voiceStore = createSlice({
    name: 'voices',
    initialState: [],
    reducers: {
        setVoices: (state, action) => {
            return action.payload;
        }
    },
});

export const { setVoices } = voiceStore.actions;

export default voiceStore.reducer;