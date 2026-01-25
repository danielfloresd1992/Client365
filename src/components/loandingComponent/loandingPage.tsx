'use client';
import { useContext, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

import { myUserContext } from '@/contexts/userContext';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { setClient } from '@/store/slices/Client';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch';
import { SessionState } from '@/types/submitAuth';
import { ContinuousColorLegend } from '@mui/x-charts';




export default function LoadingGuard({ title = "Cargando...", children }: any): JSX.Element | null {



    const { dataSessionState, setState }: any = useContext(myUserContext);

    const clientsStore = useSelector((store: any) => store.clients);
    const dispatch = useDispatch();

    const router = useRouter();
    const pathName = usePathname();

    
    const sessionCheckAttempted = useRef(false);
    const redirectAttempted = useRef(false);


    const { fetchData } = useSingleFetch({
        resource: '/localforCort',
        method: 'get',
    }, false);




    // Efecto principal para verificar la sesión
    useEffect(() => {
        if (sessionCheckAttempted.current) return;
        sessionCheckAttempted.current = true;

        dataSessionState.stateSession === 'loading' && checkIfSessionExists((error, dataSession) => {
            
            const dataState: SessionState = {
                stateSession: '',
                dataSession: null,
                errorHttp: {
                    status: null,
                    message: '',
                    error: null
                }
            }


            if (error?.code === 'ERR_NETWORK') {
                dataState.errorHttp.message = 'Sin conexión al servidor';
                dataState.errorHttp.status = 503;
                dataState.errorHttp.error = 'Bad Gateway';
                dataState.errorHttp.error_connection = true;
                dataState.stateSession  = 'Error conection';
                dataState.dataSession = null
            }

             
            if(error?.response){
                dataState.dataSession = null;
                dataState.stateSession  = 'unauthenticated';
                dataState.errorHttp = error.response.data;
              
            }

            if(dataSession){
                dataState.errorHttp.message = '';
                dataState.errorHttp.status = 200;
                dataState.errorHttp.error = '';
                dataState.errorHttp.error_connection = false;
                dataState.stateSession  = 'authenticated';
                dataState.dataSession = dataSession
            }

            setState(dataState);

        });

    }, [ fetchData, setState]);




    useEffect(() => {
        if (dataSessionState?.stateSession === 'authenticated' && clientsStore.length < 1) {
            fetchData({
                url: '/localforCort',
                method: 'get',
                autoGetData: false,
                callback: (response: any) => {
                    if (response?.data) dispatch(setClient(response?.data));
                },
            });
        }
    }, [dataSessionState]);



    
    useEffect(() => {
      
        
        // Manejar redirecciones basadas en estado de autenticación
        if (dataSessionState.stateSession === 'authenticated') {
            if (pathName === '/' || pathName === '/auth') {
                router.replace('/Lobby');
                redirectAttempted.current = true;
            }
        } 
        else if (dataSessionState.stateSession === 'unauthenticated') {
            if(pathName == '/auth'){
                console.log('hla')
                redirectAttempted.current = true;
            }    
            else if(pathName !== '/') {
                router.replace('/');
                redirectAttempted.current = true;
            }
        }
            
    }, [dataSessionState]);



    // Manejar estados de renderizado
    if (dataSessionState?.error?.status === 503) {
        return (
            <div className="error-screen">
                <h1>Error de conexión</h1>
                <p>No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.</p>
                <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
        );
    }


    if (dataSessionState?.stateSession === 'loading' && clientsStore.length === 0) {
        return (
            <div className='__width-complete __center_center' style={{ height: '100%', width: '100%', top: '0', position: 'fixed', backgroundColor: '#fff', zIndex: 1000 }}>
                <div className='__center_center columns' style={{ gap: '1rem' }}>
                    <Image className='logo-loadingPage_animated' src='/logo-page-removebg.png' width={100} height={100} alt='logo-bg_transparent' />
                    <h3 className='text-intermittence' style={{ color: '#676767', textAlign: 'center' }} >{title}</h3>
                </div>
            </div>
        );
    }

    return children;
}