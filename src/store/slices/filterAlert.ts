// store/filterClientSlice.ts
'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



type FilterClientState = {
    isActivated: boolean,
    clientList: string[]
};


const initialState: FilterClientState = {
    isActivated: false,
    clientList: []
};



const initState = () => {
    if (typeof window !== 'undefined') {
        const getItems = localStorage.getItem('filterClient');
        if (!getItems) return initialState;
        return JSON.parse(getItems);
    }
}


const setState = (data: string[]) => {
    localStorage.setItem('filterClient', JSON.stringify(data));
    return data;
}


const filterClientSlice = createSlice({
    name: 'filterClient',
    initialState: initState(),
    reducers: {
      
        addClientFilterList: (state, action: PayloadAction<string>) => {
            const exists = state.clientList.includes(action.payload);
            if (!exists) {
                return setState({ ...state, clientList: [...state.clientList, action.payload] });
            }
        },

       
        removeClientFilterList: (state, action: PayloadAction<string>) => {
            return setState({ ...state, clientList: [state.clientList.filter((id: string) => id !== action.payload)] });
        },



        addRankByFranchise: (state, action: PayloadAction<[]>) => {
            const adds = action.payload.filter(itemArr => {
                const thisItem: any = state.clientList.filter((stateArr: string) => stateArr === itemArr);
                if (thisItem.length < 1) return itemArr;
            })
            return setState({ ...state, clientList: [...adds, ...state.clientList] });
        },



        removeRankByFranchise: (state, action: PayloadAction<string[]>) => {


            const newList = state.clientList.filter((item: string) => {
                const index: number = action.payload.indexOf(item);
                if(index < 0) return item
            });

            console.log(newList);
            return setState({ ...state, clientList: newList });
        },


        clearClientFilters: (state, action: PayloadAction<string>) => {
            return setState({ ...state, clientList: [] })
        },


        toogleActivateFilter: (state, action: PayloadAction<string>) => {
            return setState({ ...state, isActivated: action.payload })
        }
    }
});



export const {
    addClientFilterList,
    removeClientFilterList,
    clearClientFilters,
    toogleActivateFilter,
    addRankByFranchise,
    removeRankByFranchise
} = filterClientSlice.actions;

export default filterClientSlice.reducer;