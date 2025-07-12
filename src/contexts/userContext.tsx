'use client';
import { createContext, useState, useEffect } from 'react';


import { SessionState, SessionContextProps, SessionProviderProps, ErrorAuth } from '@/types/submitAuth'

import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch'




export const myUserContext = createContext<SessionContextProps | undefined>(undefined);





export const SessionProvider = ({ children }: SessionProviderProps) => {

    const [dataSessionState, setState] = useState<SessionState>({
        stateSession: 'loading',
        dataSession: null
    });

    const [ errorState, setErrorState ] = useState<ErrorAuth | null>(null);


    useEffect(() => {
        if (dataSessionState.stateSession === 'loading') {
            checkIfSessionExists((error, dataSession) => {
                const setDataResult: SessionState = {
                    stateSession: 'loading',
                    dataSession: null
                }
    
                if (error?.response) {
                    setDataResult.stateSession = 'unauthenticated';
                    setDataResult.dataSession = null;
                    setErrorState(error.response.data);
                    setState(setDataResult);
                }
                else {
                    setDataResult.stateSession = 'authenticated';
                    setDataResult.dataSession = dataSession;
                }
                setState(setDataResult);
            });
        }
    }, []);


    
    return (
        <myUserContext.Provider value={{ dataSessionState, setState, errorState, setErrorState }} >
            {children}
        </myUserContext.Provider>
    );
};