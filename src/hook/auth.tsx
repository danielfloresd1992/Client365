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




    const logOut = (): void => {
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