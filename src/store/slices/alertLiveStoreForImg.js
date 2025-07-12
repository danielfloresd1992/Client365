'use client';
import { createSlice } from '@reduxjs/toolkit';


const reportLiveForImgStore = createSlice({
    name: 'reportLiveForImg',
    initialState: null,
    reducers: {
        setReportForImg: (state, action) => {
            return action.payload;
        },
        removeReportForImg: (state, action) => {
            return null;
        }
    }
});


export const { setReportForImg, removeReportForImg } = reportLiveForImgStore.actions;

export default reportLiveForImgStore.reducer;