'use client';
import { createSlice } from '@reduxjs/toolkit';


const voiceVolumeStore = createSlice({
    name: 'voiceVolume',
    initialState: 1,
    reducers: {
        setVoiceVolumeDefinitive: (state, action) => {
            return action.payload;
        }
    },
});

export const { setVoiceVolumeDefinitive } = voiceVolumeStore.actions;

export default voiceVolumeStore.reducer;