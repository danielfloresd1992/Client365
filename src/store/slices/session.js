'use client';
import { createSlice } from '@reduxjs/toolkit';


const sessionStore = createSlice({
    name: 'session',
    initialState: {
        stateSession: 'loading',
        dataSession: null
    },
    reducers: {
        setSession : (state, action) => {
            return action.payload;
        }
    }
});


export const { setSession } = sessionStore.actions;

export default sessionStore.reducer;