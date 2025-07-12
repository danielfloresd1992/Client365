'use client';
import { createSlice } from '@reduxjs/toolkit';


const alertLiveDateStore = createSlice({
    name: 'alertLiveDate',
    initialState: null,
    reducers: {
        setDateReport: (state, action) => {
            return action.payload;
        }
    },
});

export const { setDateReport } = alertLiveDateStore.actions;

export default alertLiveDateStore.reducer;