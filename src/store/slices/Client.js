'use client';
import { createSlice } from '@reduxjs/toolkit';


const clients = createSlice({
    name: 'globalClient',
    initialState:[],
    reducers: {

        setClient: (state, action) => {
            return action.payload;
        },

        addClient: (state, action) => {
            console.log(action.payload)
            return [...state, action.payload];
        },
        
    }
});


export const { setClient, addClient } = clients.actions;

export default clients.reducer;