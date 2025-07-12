import {  useCallback, useMemo, useContext } from 'react';
import { setSession } from '@/store/slices/session';
import { useRouter } from 'next/navigation';
import { myUserContext } from '@/contexts/userContext';

//types 
import { DataToCreateUserBasic, SessionState, SessionContextProps, ReturFunc, ErrorAuth } from '@/types/submitAuth';


// fetchins
import { requestLogin, closeSession } from '@/libs/ajaxClient/authFetch';



export default function useAuthOnServer(): ReturFunc {


    const { dataSessionState, setState,  errorState, setErrorState, }: any =  useContext(myUserContext);

  //  const dataSessionState: SessionState = useSelector((state: any) => state.session);

    const router = useRouter();


    const signIn = useCallback((data: DataToCreateUserBasic, callbackUrl: string | undefined): void => {

        requestLogin(data, (error, dataRes) => {

            if(error?.response) return setErrorState(error?.response?.data);


            const setDataResult: SessionState = {
                stateSession: 'loading',
                dataSession: null
            };

            setDataResult.stateSession = 'authenticated';
            setDataResult.dataSession = dataRes;
            setState(setDataResult);
            if (callbackUrl) router.push(callbackUrl);

        });
    }, [ router ]);



    const logOut = useCallback((callbackUrl: string | undefined): void => {
        closeSession(error => {
            if (error) throw console.log(error);

            const setDataResult: SessionState = {
                stateSession: 'unauthenticated',
                dataSession: null
            }
            setState(setDataResult);
            if (callbackUrl) router.push(callbackUrl);
        });
    }, [router]);



    return useMemo(() => ({
        signIn,
        logOut,
        dataSessionState,
        errorState
    }), [ dataSessionState, errorState ]);
}