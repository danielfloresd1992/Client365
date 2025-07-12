'use client';
import { useState, useEffect, createContext } from 'react';
import useAxios from '@/hook/useAxios';
import IP from '@/libs/dataFecth';


const ClientContext = createContext();

const ClientProvider = ({ children }) => {

    const [ client, setClient ] = useState([]);
    const { requestAction } = useAxios({ isInterceptor: false });


    useEffect(() => {
        requestAction({ url: `https://${ IP }/localforCort` , action: 'GET' })
            .then(response => {
                if(response.status === 200){
                    setClient(response.data);
                }
            })
    }, []);


    return(
        <ClientContext.Provider value={ client } >
            { children }
        </ClientContext.Provider>
    );
};


export { ClientContext, ClientProvider }