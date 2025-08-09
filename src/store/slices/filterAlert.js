'use client';
import { createSlice } from '@reduxjs/toolkit';



const initialState = {
    isActivated: false,
    groupIdWhatsapp: null,
    clientList: []
};



const setState = (data) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('filterClient', JSON.stringify(data));
    }
    return data;
}


const filterClientSlice = createSlice({
    name: 'filterClient',
    initialState: initialState,
    reducers: {

        toogleActivateFilter: (state, action) => {
            return setState({ ...state, isActivated: action.payload })
        },


        addGropupIdWhatsapp: (state, action) => {
            console.log('action.payload', action.payload);
            setState({ ...state, groupIdWhatsapp: action.payload })
            return setState({ ...state, groupIdWhatsapp: action.payload });
        },



        addClientFilterList: (state, action) => {
            const exists = state.clientList.includes(action.payload);
            if (!exists) {
                return setState({ ...state, clientList: [...state.clientList, action.payload] });
            }
        },


        removeClientFilterList: (state, action) => {
            setState({ ...state, clientList: [...state.clientList.filter((id) => id !== action.payload)] });
            return { ...state, clientList: [...state.clientList.filter((id) => id !== action.payload)] };
        },



        addRankByFranchise: (state, action) => {
            const adds = action.payload.filter(itemArr => {
                const thisItem = state.clientList.filter((stateArr) => stateArr === itemArr);
                if (thisItem.length < 1) return itemArr;
            })
            return setState({ ...state, clientList: [...adds, ...state.clientList] });
        },



        removeRankByFranchise: (state, action) => {
            const newList = state.clientList.filter((item) => {
                const index = action.payload.indexOf(item);
                if (index < 0) return item
            });
            return setState({ ...state, clientList: newList });
        },


        clearClientFilters: (state, action) => {
            localStorage.setItem('filterClient', JSON.stringify(initialState));
            return { ...initialState, groupIdWhatsapp: state.groupIdWhatsapp };
        },


        loadLocalStorage: () => {
            if (typeof window !== 'undefined') {
                const getItems = localStorage.getItem('filterClient');
                if (getItems === 'undefined' || getItems === null) {
                    localStorage.setItem('filterClient', JSON.stringify(initialState));
                    return initialState;
                }
                else {
                    return JSON.parse(getItems);
                }
            }
            return initialState;
        }
    }
});



export const {
    addGropupIdWhatsapp,
    addClientFilterList,
    removeClientFilterList,
    clearClientFilters,
    toogleActivateFilter,
    addRankByFranchise,
    removeRankByFranchise,
    loadLocalStorage
} = filterClientSlice.actions;

export default filterClientSlice.reducer;