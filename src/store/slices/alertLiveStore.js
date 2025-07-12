'use client';
import { createSlice } from '@reduxjs/toolkit';


const AlertLiveStore = createSlice({
    name: 'AlertLive',
    initialState:[],
    reducers: {
        
        addReportForArr: (state, action) => {
            if(Array.isArray(action.payload)) return  action.payload;
            
            if( typeof action.payload === 'object'){
                const existsData = state.findIndex(item => item.establishment?._id === action.payload.establishment?._id );
                if(existsData < 0) return  [ ...state, action.payload ];
    
                const cloneArrData = [ ...state ];
                cloneArrData[existsData] = action.payload;
                return cloneArrData;
            }
        }
    }
});


export const { addReportForArr } = AlertLiveStore.actions;

export default AlertLiveStore.reducer;