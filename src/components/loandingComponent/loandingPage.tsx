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







export default function LoadingGuard({
    title = "Cargando...",
    children,
}: any): JSX.Element | null {
    const { dataSessionState, setState }: any = useContext(myUserContext);
    const clientsStore = useSelector((store: any) => store.clients);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathName = usePathname();

    const [isInitializing, setIsInitializing] = useState(true);
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

        const handleSessionCheck = async () => {
            try {
                const result = await new Promise<SessionState>((resolve) => {
                    checkIfSessionExists((error, dataSession) => {
                        if (dataSession) {
                            resolve({
                                stateSession: 'authenticated',
                                dataSession,
                                error: null,
                            });
                        } else {
                            resolve({
                                stateSession: 'unauthenticated',
                                dataSession: null,
                                error: error?.code === 'ERR_NETWORK' ? {
                                    status: 503,
                                    message: 'Sin conexión al servidor',
                                    error: 'Bad Gateway',
                                    error_connection: true,
                                } : null
                            });
                        }
                    });
                });

                setState(result);

                // Cargar datos del cliente si está autenticado
                if (result.stateSession === 'authenticated' && clientsStore.length < 1) {
                    fetchData({
                        url: '/localforCort',
                        method: 'get',
                        autoGetData: false,
                        callback: (response: any) => {
                            dispatch(setClient(response.data));
                        },
                    });
                }

            } catch (error) {
                console.error('Error verifying session:', error);
                setState({
                    stateSession: 'unauthenticated',
                    dataSession: null,
                    error: {
                        status: 500,
                        message: 'Error interno',
                        error: 'Internal Server Error',
                    },
                });
            } finally {
                setIsInitializing(false);
            }
        };

        handleSessionCheck();
    }, [clientsStore, dispatch, fetchData, setState]);

    // Efecto para manejar redirecciones
    useEffect(() => {
        if (isInitializing) return;
        if (redirectAttempted.current) return;

        // Manejar redirecciones basadas en estado de autenticación
        if (dataSessionState?.stateSession === 'authenticated') {
            if (pathName === '/') {
                router.replace('/Lobby');
                redirectAttempted.current = true;
            }
        } else if (dataSessionState?.stateSession === 'unauthenticated') {
            if (pathName !== '/') {
                router.replace('/');
                redirectAttempted.current = true;
            }
        }
    }, [dataSessionState, pathName, router, isInitializing]);

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

    if (isInitializing ||
        (dataSessionState?.stateSession === 'loading' && clientsStore.length === 0)) {
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