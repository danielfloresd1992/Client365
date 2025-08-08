'use client';





import { useEffect, useCallback, useMemo, useContext, createContext, useState } from 'react';


//types 
import { DataToCreateUserBasic, SessionState, SessionProviderProps, SessionContextProps, ReturFunc, ErrorAuth } from '@/types/submitAuth';


// fetchins
import { requestLogin, closeSession } from '@/libs/ajaxClient/authFetch';



export const myUserContext = createContext<SessionContextProps | undefined>(undefined);



export const SessionProvider = ({ children }: SessionProviderProps) => {


    const [dataSessionState, setState] = useState<SessionState>({
        stateSession: 'loading',
        dataSession: null,
        error: null
    });
   




    return (
        <myUserContext.Provider value={{ dataSessionState, setState }} >
            {children}
        </myUserContext.Provider>
    );
};