'use client';
import { createSlice } from '@reduxjs/toolkit';


const modal = createSlice({
    name: 'globalModal',
    initialState:{
        modalOpen: false,
        title: '',
        description: '',
        isCallback: null,
        type: ''
    },
    reducers: {
        setConfigModal: (state, action) => {
            return action.payload;
        },
        closeModal: (state, action) => {
            return {
                modalOpen: false,
                title: '',
                description: '',
                isCallback: null,
                type: ''
            }
        }
    },
});

export const { setConfigModal, closeModal } = modal.actions;

export default modal.reducer;