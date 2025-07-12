'use client';
import { useState, createContext } from 'react';


const ImgContext = createContext();


const ImgProvider = ({ children }) => {

    const [ src, setSrc ] = useState(null);

    const setImg = img=> {
        setSrc(img)
    };
    

    const closeImg = () => {
        setSrc(null);
    };


    return(
        <ImgContext.Provider value={{ src, setImg, closeImg }}>
            { children }
        </ImgContext.Provider>
    );
};

export { ImgContext, ImgProvider };