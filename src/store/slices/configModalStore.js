'use client';
import { createSlice } from '@reduxjs/toolkit';


const configModalStore = createSlice({
    name: 'configModal',
    initialState: false,
    reducers: {
        setOpenWindowConfig : (state, action) => {
            return action.payload;
        }
    }
});


export const { setOpenWindowConfig } = configModalStore.actions;

export default configModalStore.reducer;