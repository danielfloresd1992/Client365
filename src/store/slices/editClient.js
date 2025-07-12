'use client';
import { createSlice } from '@reduxjs/toolkit';


const idClientEdit = createSlice({
    name: 'idClientEdit',
    initialState: '',
    reducers: {
        setiD: (state, action) => {
            return action.payload;
        }
    },
});

export const { setiD } = idClientEdit.actions;

export default idClientEdit.reducer;