'use client';
import { useContext, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';

import Loader3D from './Loader3D';
import ServerConnectionError from '@/components/error/ServerConnectionError';

import { myUserContext } from '@/contexts/userContext';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { setClient } from '@/store/slices/Client';
import { apdateLightSavingTime } from '@/store/slices/isDaylightSavingTimeStore';
import getisDaylightSavingTime from '@/libs/ajaxServer/getIsDaylightSavingTime';
import { checkIfSessionExists } from '@/libs/ajaxClient/authFetch';
import { SessionState } from '@/types/submitAuth';
import { isPublicRoute, isLoginRoute, isAdminRoute, DEFAULT_AUTHENTICATED_ROUTE } from '@/libs/auth/routes.config';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';
import useSpeckAlert from '@/hook/useSpeckAlert';


// Aviso por voz que se repite mientras el servidor esté caído.
const CONNECTION_LOST_MESSAGE =
    'Atención. Se ha perdido la conexión con el servidor. Por favor, comuníquese con el personal de sistemas para restaurar la conexión con el sistema.';

const VOICE_ALERT_INTERVAL_MS = 60_000; // cada minuto


/**
 * Traduce la respuesta de `/auth/isAuth` a un SessionState.
 *  - error de red (ERR_NETWORK)  → 'Error conection'  (servidor caído / CORS)
 *  - hay usuario válido          → 'authenticated'
 *  - cualquier otra cosa         → 'unauthenticated'  (401, 200 sin usuario…)
 */
function resolveSessionState(error: any, dataSession: any): SessionState {
    const state: SessionState = {
        stateSession: '',
        dataSession: null,
        errorHttp: { status: null, message: '', error: null },
    };

    if (error?.code === 'ERR_NETWORK') {
        state.stateSession = 'Error conection';
        state.dataSession = null;
        state.errorHttp.message = 'Sin conexión al servidor';
        state.errorHttp.status = 503;
        state.errorHttp.error = 'Bad Gateway';
        state.errorHttp.error_connection = true;
    }
    else if (dataSession) {
        state.stateSession = 'authenticated';
        state.dataSession = dataSession;
        state.errorHttp.message = '';
        state.errorHttp.status = 200;
        state.errorHttp.error = '';
        state.errorHttp.error_connection = false;
    }
    else {
        state.stateSession = 'unauthenticated';
        state.dataSession = null;
        if (error?.response) state.errorHttp = error.response.data;
    }

    return state;
}


export default function LoadingGuard({ title = 'Cargando...', children }: any): JSX.Element | null {

    // ── Dependencias ───────────────────────────────────────────────────────
    const { dataSessionState, setState }: any = useContext(myUserContext);
    const clientsStore = useSelector((store: any) => store.clients);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathName = usePathname();
    const { speak } = useSpeckAlert();
    const { fetchData } = useSingleFetch({ resource: '/localforCort', method: 'get' }, false);

    // Evitan repetir el chequeo de sesión / la redirección.
    const sessionCheckAttempted = useRef(false);
    const redirectAttempted = useRef(false);

    // El servidor está caído según el socket (eventos disconnect / connect_error).
    const [socketDown, setSocketDown] = useState(false);

    // Para el control remoto entre instancias (cerrar sesión / recargar).
    const { logOut }: any = useAuthOnServer();


    // ── 1. Verificar la sesión contra el backend (única fuente de verdad) ────
    //    Sin middleware, este es el mecanismo de protección de rutas.
    useEffect(() => {
        if (sessionCheckAttempted.current) return;
        sessionCheckAttempted.current = true;
        if (dataSessionState.stateSession !== 'loading') return;

        checkIfSessionExists((error: any, dataSession: any) => {
            setState(resolveSessionState(error, dataSession));
        });
    }, [fetchData, setState]);


    // ── 2. Al autenticar, cargar la lista de clientes una sola vez ───────────
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


    // ── 2b. Flag de horario de verano al store (lo cargaba el Header, que se
    //        retiró del layout). Lo leen los formularios de alerta. ───────────
    useEffect(() => {
        if (dataSessionState?.stateSession === 'authenticated') {
            getisDaylightSavingTime()
                .then((response: any) => dispatch(apdateLightSavingTime(response.data.IsDaylightSavingTime)))
                .catch((error: any) => console.log(error));
        }
    }, [dataSessionState]);


    // ── 3. Redirecciones según el estado de autenticación ────────────────────
    useEffect(() => {
        if (redirectAttempted.current) return;

        if (dataSessionState.stateSession === 'authenticated') {
            // Autenticado en login → al Lobby
            if (isLoginRoute(pathName)) {
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
                redirectAttempted.current = true;
            }
            // Autenticado sin permisos de admin en ruta admin → al Lobby
            else if (isAdminRoute(pathName) && !dataSessionState.dataSession?.admin) {
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
                redirectAttempted.current = true;
            }
        }
        else if (dataSessionState.stateSession === 'unauthenticated') {
            // No autenticado en ruta protegida → al login
            if (!isPublicRoute(pathName)) {
                router.replace('/');
                redirectAttempted.current = true;
            }
        }
    }, [dataSessionState, pathName, router]);


    
    // ── 4. Caída / recuperación del servidor vía socket (mismo puerto) ───────
    useEffect(() => {
        const onDown = () => setSocketDown(true);
        const onUp = () => setSocketDown(false);
        socket.on('disconnect', onDown);
        socket.on('connect_error', onDown);
        socket.on('connect', onUp);
        return () => {
            socket.off('disconnect', onDown);
            socket.off('connect_error', onDown);
            socket.off('connect', onUp);
        };
    }, []);


    // ── 5. Control remoto entre instancias (desde el panel de configuración):
    //    cerrar la sesión de un usuario o recargar a todos. Estos listeners
    //    vivían en el Header (ya retirado); se reubican aquí, que SIEMPRE está
    //    montado, para que el circuito vuelva a funcionar. ────────────────────
    useEffect(() => {
        const closeSession = (data: any) => {
            if (data?._id && dataSessionState?.dataSession?._id === data._id) logOut('/');
        };
        const reloadPage = () => { if (typeof window !== 'undefined') window.location.reload(); };

        socket.on('receivesclose-userClientAppManager', closeSession);
        socket.on('reload-client-appmanager', reloadPage);
        return () => {
            socket.off('receivesclose-userClientAppManager', closeSession);
            socket.off('reload-client-appmanager', reloadPage);
        };
    }, [dataSessionState, logOut]);


    // ¿Hay error de conexión? (chequeo de sesión por red caída O socket sin conexión)
    const connectionError =
        dataSessionState?.stateSession === 'Error conection' ||
        dataSessionState?.errorHttp?.error_connection ||
        socketDown;


    // ── 5. Mientras dure la caída, avisar por voz cada minuto ────────────────
    useEffect(() => {
        if (!connectionError) return;
        speak(CONNECTION_LOST_MESSAGE); // aviso inmediato
        const id = setInterval(() => speak(CONNECTION_LOST_MESSAGE), VOICE_ALERT_INTERVAL_MS);
        return () => clearInterval(id);
    }, [connectionError, speak]);


    // ── Render: por estado RESUELTO + autorización ───────────────────────────
    //    Nunca montamos `children` hasta confirmar acceso (evita el "flash").
    const session = dataSessionState?.stateSession;
    const isAdmin = !!dataSessionState?.dataSession?.admin;

    // Servidor no responde / CORS → pantalla a pantalla completa
    if (connectionError) {
        return <ServerConnectionError />;
    }

    // Resolviendo la sesión → loader (bloquea todo)
    if (session === 'loading' && clientsStore.length === 0) {
        return <Loader3D title={title} />;
    }

    // No autenticado en ruta protegida → loader mientras redirige a '/'
    if (session === 'unauthenticated' && !isPublicRoute(pathName)) {
        return <Loader3D title={title} />;
    }

    // Autenticado en página de login → loader mientras redirige al Lobby
    if (session === 'authenticated' && isLoginRoute(pathName)) {
        return <Loader3D title={title} />;
    }

    // Ruta de admin sin permisos → loader mientras redirige al Lobby
    if (session === 'authenticated' && isAdminRoute(pathName) && !isAdmin) {
        return <Loader3D title={title} />;
    }

    // Autorizado → render normal
    return children;
}
