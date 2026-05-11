'use client';
import { createContext, useState } from 'react';

//types 
import { SessionState, SessionProviderProps, SessionContextProps } from '@/types/submitAuth';






export const myUserContext = createContext<SessionContextProps | undefined>(undefined);



export const SessionProvider = ({ children }: SessionProviderProps) => {


    const [dataSessionState, setState] = useState<SessionState>({
        stateSession: 'loading',
        dataSession: null,
        errorHttp: {
            error: null,
            status: null,
            message: ''
        }
    });
   

    return (
        <myUserContext.Provider value={{ dataSessionState, setState }} >
            {children}
        </myUserContext.Provider>
    );
};