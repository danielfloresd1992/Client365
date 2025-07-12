'use client';
import { useState, createContext } from 'react';


const ModalContext = createContext();


const ModalProvider = ({ children }) => {

    const [ config, setConfig ] = useState({
        modalOpen: false,
        title: '',
        description: '',
        isCallback: null,
        type: 'error'
    });


    const returnState = () => {
        return config;
    }


    const openModal = configModal => {
        setConfig(configModal);
    };

    console.log(config);

    const closeModal = () => {
        setConfig({
            modalOpen: false,
            title: '',
            description: '',
            isCallback: null,
            type: ''
        })
    };



    return(
        <ModalContext.Provider value={{ config, returnState, openModal, closeModal }}>
            { children }
        </ModalContext.Provider>
    );
};


export { ModalContext, ModalProvider };