'use client';
import { createSlice } from '@reduxjs/toolkit';


const sessionAdminStore = createSlice({
    name: 'isAdminSession',
    initialState: false,
    reducers: {
        setChangueStateIsAdmin: (state, action) => {
            return action.payload;
        }
    }
});


export const { setChangueStateIsAdmin } = sessionAdminStore.actions;

export default sessionAdminStore.reducer;