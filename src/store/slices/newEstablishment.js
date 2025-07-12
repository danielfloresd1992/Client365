'use client';
import { createSlice } from '@reduxjs/toolkit';


const newEstablishmentStore = createSlice({
    name: 'newEstablishment',
    initialState:[],
    reducers: {

        addNewEstablishment: (state, action) => {
            return [...state, action.payload];
        },
        
    }
});


export const { addNewEstablishment } = newEstablishmentStore.actions;

export default newEstablishmentStore.reducer;