import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import IP from '@/libs/ajaxClient/dataFecth';



export const isDaylightSavingTimeStore = createSlice({
    name: 'isDaylightSavingTime',
    initialState: null,
    reducers: {
        apdateLightSavingTime: (state, action) => {
            return action.payload;
        }

    }
});


export const { apdateLightSavingTime } = isDaylightSavingTimeStore.actions;

export default isDaylightSavingTimeStore.reducer;