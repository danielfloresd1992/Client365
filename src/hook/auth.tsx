'use client';
import { useEffect, useCallback, useMemo, useContext } from 'react';


import { myUserContext } from '@/contexts/userContext';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch'
//types 
import { DataToCreateUserBasic, SessionState, SessionContextProps, ReturFunc, ErrorAuth } from '@/types/submitAuth';

// fetchins

import { requestLogin, closeSession } from '@/libs/ajaxClient/authFetch';



export default function useAuthOnServer(): ReturFunc {


    const { dataSessionState, setState }: any = useContext(myUserContext);


    const signIn = useCallback((data: DataToCreateUserBasic, callback: () => void ): void => {

        requestLogin(data, (error, dataRes) => {
            const setDataResult: SessionState = {
                stateSession: 'loading',
                dataSession: null,
                errorHttp: {
                    error: null,
                    status: null,
                    message: ''
                }
            };


            if (error) {
                if(error?.response){
                    setDataResult.errorHttp = error.response.data;
                    setDataResult.stateSession = 'unauthenticated';
                    setDataResult.dataSession = null
                }
            }
            else {
                setDataResult.stateSession = 'authenticated';
                setDataResult.dataSession = dataRes;
                if(typeof callback === 'function') callback()
            }

            setState(setDataResult);
        });
    }, []);




    const logOut = (redirectTo: string = '/'): void => {
        closeSession(error => {
            // Aunque el backend falle, se cierra la sesión en el cliente y se
            // navega igual (la comprobación en la ruta pública reevalúa).
            if (error) console.log(error);

            const setDataResult: SessionState = {
                stateSession: 'unauthenticated',
                dataSession: null,
                errorHttp: {
                    status: null,
                    error:null,
                    message: ''
                }
            }
            setState(setDataResult);

            // Recarga COMPLETA a la ruta pública: limpia todo el estado en
            // memoria (Redux, contextos y los refs del LoadingGuard) y evita
            // quedar atascado en el loader tras cerrar sesión.
            if (typeof window !== 'undefined') window.location.href = redirectTo;
        });
    };




    return useMemo(() => ({
        signIn,
        logOut,
        dataSessionState,
    }), [dataSessionState]);
}