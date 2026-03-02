'use client';
import { useEffect, useCallback, useMemo, useContext } from 'react';


import { myUserContext } from '@/contexts/userContext';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch'
//types 
import { DataToCreateUserBasic, SessionState, SessionContextProps, ReturFunc, ErrorAuth } from '@/types/submitAuth';
import { setSessionMarker, removeSessionMarker } from '@/libs/auth/sessionMarker';


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
                removeSessionMarker();
            }
            else {
                setDataResult.stateSession = 'authenticated';
                setDataResult.dataSession = dataRes;
                setSessionMarker(); // Marcar sesión en el dominio de Next.js
                if(typeof callback === 'function') callback()
            }

            setState(setDataResult);
        });
    }, []);




    const logOut = (): void => {
        removeSessionMarker(); // Eliminar cookie marcadora
        closeSession(error => {
            if (error) throw console.log(error);

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
        });
    };




    return useMemo(() => ({
        signIn,
        logOut,
        dataSessionState,
    }), [dataSessionState]);
}