'use client';
import { createSlice } from '@reduxjs/toolkit';


const typeForm = createSlice({
    name: 'typeForm',
    initialState: null,
    reducers: {
        setTypeForm: (state, action) => {
            return action.payload;
        }
    },
});

export const { setTypeForm } = typeForm.actions;

export default typeForm.reducer;