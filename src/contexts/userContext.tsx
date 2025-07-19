'use client';
import { createContext, useState } from 'react';
import { SessionState, SessionContextProps, SessionProviderProps, ErrorAuth } from '@/types/submitAuth';




export const myUserContext = createContext<SessionContextProps | undefined>(undefined);



export const SessionProvider = ({ children }: SessionProviderProps) => {


    const [dataSessionState, setState] = useState<SessionState>({
        stateSession: 'loading',
        dataSession: null
    });


    const [errorState, setErrorState] = useState<ErrorAuth | null>(null);


    return (
        <myUserContext.Provider value={{ dataSessionState, setState, errorState, setErrorState }} >
            {children}
        </myUserContext.Provider>
    );
};