'use client';
import { useContext, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { myUserContext } from '@/contexts/userContext';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { setClient } from '@/store/slices/Client';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch';
import { SessionState } from '@/types/submitAuth';
import { isPublicRoute, isLoginRoute, DEFAULT_AUTHENTICATED_ROUTE } from '@/libs/auth/routes.config';
import { setSessionMarker, removeSessionMarker } from '@/libs/auth/sessionMarker';




export default function LoadingGuard({ title = "Cargando...", children }: any): JSX.Element | null {



    const { dataSessionState, setState }: any = useContext(myUserContext);

    const clientsStore = useSelector((store: any) => store.clients);
    const dispatch = useDispatch();

    const router = useRouter();
    const pathName = usePathname();
    const searchParams = useSearchParams();

    
    const sessionCheckAttempted = useRef(false);
    const redirectAttempted = useRef(false);


    const { fetchData } = useSingleFetch({
        resource: '/localforCort',
        method: 'get',
    }, false);




    // Efecto principal para verificar la sesión con el backend
    // El middleware ya protege las rutas a nivel servidor,
    // pero este check valida que la sesión siga activa en el backend
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
                dataState.dataSession = dataSession;
                setSessionMarker(); // Sincronizar cookie marcadora
            } else {
                removeSessionMarker(); // Sesión inválida, limpiar marcador
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
        if (redirectAttempted.current) return;
        
        // Manejar redirecciones basadas en estado de autenticación
        // Nota: El middleware ya bloquea a nivel servidor, esto es la segunda capa (client-side)
        if (dataSessionState.stateSession === 'authenticated') {
            if (isLoginRoute(pathName)) {
                // Si hay un callbackUrl (el middleware lo puso), ir ahí. Si no, al Lobby
                const callbackUrl = searchParams.get('callbackUrl');
                router.replace(callbackUrl || DEFAULT_AUTHENTICATED_ROUTE);
                redirectAttempted.current = true;
            }
        } 
        else if (dataSessionState.stateSession === 'unauthenticated') {
            if (isPublicRoute(pathName)) {
                // Ya está en ruta pública, no redirigir
                redirectAttempted.current = true;
            }    
            else {
                router.replace('/');
                redirectAttempted.current = true;
            }
        }
            
    }, [dataSessionState, pathName, searchParams]);



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