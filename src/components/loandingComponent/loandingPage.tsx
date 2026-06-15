'use client';
import { useContext, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';

import Loader3D from './Loader3D';

import { myUserContext } from '@/contexts/userContext';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { setClient } from '@/store/slices/Client';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch';
import { SessionState } from '@/types/submitAuth';
import { isPublicRoute, isLoginRoute, isAdminRoute, DEFAULT_AUTHENTICATED_ROUTE } from '@/libs/auth/routes.config';




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




    // Efecto principal: verificar la sesión contra el backend (la única fuente de verdad)
    // Sin middleware, este es el único mecanismo de protección de rutas
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


            // Diagnóstico temporal — confirma qué devuelve /auth/isAuth (quitar luego)
            console.log('[auth/isAuth]', { code: error?.code, status: error?.response?.status, hasUser: !!dataSession });

            if (error?.code === 'ERR_NETWORK') {
                // Backend inaccesible → mostrar error, NO redirigir a '/'
                dataState.errorHttp.message = 'Sin conexión al servidor';
                dataState.errorHttp.status = 503;
                dataState.errorHttp.error = 'Bad Gateway';
                dataState.errorHttp.error_connection = true;
                dataState.stateSession = 'Error conection';
                dataState.dataSession = null;
            }
            else if (dataSession) {
                // Sesión válida → autenticado
                dataState.errorHttp.message = '';
                dataState.errorHttp.status = 200;
                dataState.errorHttp.error = '';
                dataState.errorHttp.error_connection = false;
                dataState.stateSession = 'authenticated';
                dataState.dataSession = dataSession;
            }
            else {
                // 401, 200 sin usuario, o cualquier otra cosa → NO autenticado (redirige)
                dataState.stateSession = 'unauthenticated';
                dataState.dataSession = null;
                if (error?.response) dataState.errorHttp = error.response.data;
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
        
        // Redirecciones basadas en estado de autenticación (client-side, sin middleware)
        if (dataSessionState.stateSession === 'authenticated') {
            if (isLoginRoute(pathName)) {
                // Usuario autenticado en página de login → ir al Lobby
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
                redirectAttempted.current = true;
            }
            else if (isAdminRoute(pathName) && !dataSessionState.dataSession?.admin) {
                // Autenticado pero sin permisos de admin en ruta admin → al Lobby
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
                redirectAttempted.current = true;
            }
        }
        else if (dataSessionState.stateSession === 'unauthenticated') {
            if (!isPublicRoute(pathName)) {
                // Usuario no autenticado en ruta protegida → ir al login
                router.replace('/');
                redirectAttempted.current = true;
            }
        }
            
    }, [dataSessionState, pathName, router]);



    // ── Render según estado RESUELTO + autorización (evita el "flash" de
    //    contenido protegido: nunca montamos children hasta confirmar acceso) ──
    const session = dataSessionState?.stateSession;
    const isAdmin = !!dataSessionState?.dataSession?.admin;

    // 0. Servidor no responde / CORS → pantalla de error de conexión
    //    (el navegador no expone el texto exacto del error CORS a JS: solo
    //     sabemos que la petición no obtuvo respuesta → ERR_NETWORK)
    if (session === 'Error conection' || dataSessionState?.errorHttp?.error_connection) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-gradient-to-br from-[#f7f2e4] via-[#f1e9d7] to-[#e9dec8]">
                <div className="card-glass relative w-full max-w-md overflow-hidden text-center !p-6 sm:!p-8">
                    <span className="accent-strip absolute top-0 left-0" />

                    <div className="mx-auto mb-6 w-36 sm:w-44">
                        <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto" role="img" aria-label="Conexión con el servidor interrumpida">
                            <defs>
                                <radialGradient id="cnxHalo" cx="50%" cy="42%" r="62%">
                                    <stop offset="0%" stopColor="#29c50c" stopOpacity="0.12" />
                                    <stop offset="60%" stopColor="#d9a441" stopOpacity="0.06" />
                                    <stop offset="100%" stopColor="#d9a441" stopOpacity="0" />
                                </radialGradient>
                            </defs>
                            <ellipse cx="100" cy="84" rx="96" ry="66" fill="url(#cnxHalo)" />
                            {/* Ondas de señal (interrumpidas) */}
                            <g stroke="#b5763b" strokeWidth="6" strokeLinecap="round" opacity="0.5">
                                <path d="M58 70a60 60 0 0 1 84 0" />
                                <path d="M74 88a37 37 0 0 1 52 0" />
                            </g>
                            <circle cx="100" cy="104" r="6.5" fill="#b5763b" opacity="0.5" />
                            {/* Servidor */}
                            <rect x="60" y="110" width="80" height="40" rx="10" fill="#faf5ea" stroke="#29c50c" strokeWidth="3.5" />
                            <line x1="74" y1="124" x2="112" y2="124" stroke="#7bd42a" strokeWidth="3.5" strokeLinecap="round" />
                            <line x1="74" y1="137" x2="100" y2="137" stroke="#7bd42a" strokeWidth="3.5" strokeLinecap="round" />
                            <circle cx="126" cy="130" r="4.5" fill="#ef4444" />
                            {/* Tachón rojo = interrupción */}
                            <line x1="46" y1="36" x2="154" y2="140" stroke="#fff7e0" strokeWidth="11" strokeLinecap="round" />
                            <line x1="46" y1="36" x2="154" y2="140" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                        </svg>
                    </div>

                    <h1 className="text-lg sm:text-xl font-bold text-slate-800">Sin conexión con el servidor</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        El servidor no está respondiendo. Puede estar caído o haber un problema de red
                        (incluida la política <strong>CORS</strong>). Inténtalo de nuevo en unos momentos.
                    </p>

                    <button onClick={() => window.location.reload()} className="btn-primary mt-6 mx-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // 1. Resolviendo la sesión → loader (bloquea todo)
    if (session === 'loading' && clientsStore.length === 0) {
        return <Loader3D title={title} />;
    }

    // 2. No autenticado en ruta protegida → loader mientras redirige a '/'
    if (session === 'unauthenticated' && !isPublicRoute(pathName)) {
        return <Loader3D title={title} />;
    }

    // 3. Autenticado en página de login → loader mientras redirige al Lobby
    if (session === 'authenticated' && isLoginRoute(pathName)) {
        return <Loader3D title={title} />;
    }

    // 4. Ruta de admin sin permisos → loader mientras redirige al Lobby
    if (session === 'authenticated' && isAdminRoute(pathName) && !isAdmin) {
        return <Loader3D title={title} />;
    }

    // 5. Autorizado → render normal
    return children;
}