'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';

/*
 * Presencia GLOBAL de "Conectados · App Manager".
 *
 * Vive en el layout raíz, así que SOBREVIVE a la navegación entre rutas (en
 * App Router los layouts no se desmontan al navegar). Mantiene la lista de
 * usuarios conectados por socket y — clave — sigue ANUNCIANDO la presencia de
 * este usuario (responde a 'set-ask-user' con 'send-ask-user') sin importar
 * en qué página esté, para que los demás siempre lo vean en línea.
 *
 * Cualquier componente (el widget del dashboard, etc.) consume la lista con
 * useConnectedUsers(); no vuelve a montar sockets ni pierde el estado al
 * cambiar de ruta.
 */

const ConnectedUsersContext = createContext({ connectedUsers: [], closeRemoteSession: () => {} });

export const useConnectedUsers = () => useContext(ConnectedUsersContext);

export function ConnectedUsersProvider({ children }) {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const userId = user?._id;

    const [connectedUsers, setConnectedUsers] = useState([]);

    useEffect(() => {
        if (!user) {
            setConnectedUsers([]);
            return;
        }

        const emitUser = () => socket.emit('send-ask-user', user);
        const addData = (data) => {
            if (!data?._id) return;
            setConnectedUsers(prev => prev.some(u => u._id === data._id) ? prev : [...prev, data]);
        };
        const askNow = () => socket.emit('get-ask-user', user);

        askNow();
        socket.on('set-ask-user', emitUser);      // otro cliente pregunta → me anuncio
        socket.on('return-ask-user', addData);    // llega un conectado → lo agrego
        socket.on('connect', askNow);             // tras reconectar, vuelvo a preguntar

        // Refresco periódico: limpia y vuelve a preguntar (lista siempre fresca)
        const interval = setInterval(() => {
            setConnectedUsers([]);
            askNow();
        }, 90000);

        return () => {
            socket.off('set-ask-user', emitUser);
            socket.off('return-ask-user', addData);
            socket.off('connect', askNow);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const closeRemoteSession = (userClient) => socket.emit('close-userClientAppManager', userClient);

    return (
        <ConnectedUsersContext.Provider value={{ connectedUsers, closeRemoteSession }}>
            {children}
        </ConnectedUsersContext.Provider>
    );
}
