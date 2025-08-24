'use client';
import { useEffect, useCallback, useMemo, useContext } from 'react';
import { setSession } from '@/store/slices/session';

import { useRouter, usePathname } from 'next/navigation';
import { myUserContext } from '@/contexts/userContext';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch'
//types 
import { DataToCreateUserBasic, SessionState, SessionContextProps, ReturFunc, ErrorAuth } from '@/types/submitAuth';


// fetchins

import { requestLogin, closeSession } from '@/libs/ajaxClient/authFetch';



export default function useAuthOnServer(): ReturFunc {


    const { dataSessionState, setState }: any = useContext(myUserContext);
    const router = useRouter();




    const signIn = useCallback((data: DataToCreateUserBasic, callbackUrl: string | undefined): void => {
        requestLogin(data, (error, dataRes) => {

            //if (error?.response) return setErrorState(error?.response?.data);

            const setDataResult: SessionState = {
                stateSession: 'loading',
                dataSession: null,
                error: null
            };

            setDataResult.stateSession = 'authenticated';
            setDataResult.dataSession = dataRes;

            setState(setDataResult);

            if (callbackUrl) router.push(callbackUrl);
        });
    }, [router]);




    const logOut = useCallback((callbackUrl: string | undefined): void => {
        closeSession(error => {
            if (error) throw console.log(error);

            const setDataResult: SessionState = {
                stateSession: 'unauthenticated',
                dataSession: null,
                error: null
            }
            setState(setDataResult);
            if (callbackUrl) router.push(callbackUrl);
        });
    }, [router]);




    return useMemo(() => ({
        signIn,
        logOut,
        dataSessionState,
    }), [dataSessionState]);
}