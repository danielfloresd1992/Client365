'use client';
import { createSlice } from '@reduxjs/toolkit';


const dateNoveltyForListStore = createSlice({
    name: 'dateNoveltyForListStore',
    initialState:[],
    reducers: {
        setDateNoveltyForList: (state, action) => {
            return [ action.payload ];
        },
        addDateNoveltyForList: (state, action) => {
            const indexObject = state.findIndex(item => item.dataEstablishment.name === action.payload.dataEstablishment.name);
            console.log(indexObject);
            if(indexObject < 0) {
                return [...state, action.payload];
            }
            else{
                return [ ...state ];
            }
        },
        removeItemFromToArray: (state, action) => {
            const filteredArray = state.filter(item => item.dataEstablishment.idCreate !== action.payload);
            return filteredArray;
        }
    }
});


export const { setDateNoveltyForList, addDateNoveltyForList, removeItemFromToArray } = dateNoveltyForListStore.actions;

export default dateNoveltyForListStore.reducer;