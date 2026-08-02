'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isLoginRoute } from '@/libs/auth/routes.config';
import useAuthOnServer from '@/hook/auth';
import socket from '@/libs/socket/socketIo';
import AppDock from './AppDock';

/*
 * AppShell — coloca el dock de navegación (AppDock) a la izquierda de TODA la
 * app y deja el contenido a la derecha. Es un componente cliente porque el
 * layout raíz es un Server Component y no puede leer la ruta: aquí se usa
 * usePathname() para OCULTAR el dock en las pantallas de login (/ y /auth),
 * que se muestran a pantalla completa.
 *
 * El contenedor del contenido lleva su propio scroll (overflow-y-auto) y toda
 * la altura, así las páginas de altura fija (dashboard) y las que crecen
 * conviven sin romper el scroll.
 */
export default function AppShell({ children }) {

    const pathname = usePathname();
    const { logOut, dataSessionState } = useAuthOnServer();
    const sessionUserId = dataSessionState?.dataSession?._id;

    // Cierre de sesión remoto: cuando el usuario marca su SALIDA laboral en
    // bioJarvis, la API emite 'close-session-user' con su _id. Si es el
    // usuario de ESTA sesión, se reutiliza el logOut del hook de auth.
    useEffect(() => {
        if (!sessionUserId) return;

        const closeIfCurrentUser = (payload) => {
            if (String(payload?.userId) === String(sessionUserId)) logOut('/');
        };

        socket.on('close-session-user', closeIfCurrentUser);
        return () => {
            socket.off('close-session-user', closeIfCurrentUser);
        };
    }, [sessionUserId, logOut]);

    // Portada y login: sin dock, pantalla completa
    if (isLoginRoute(pathname)) return children;

    return (
        <div className='h-full w-full flex gap-2'>
            <AppDock />
            <div className='flex-1 min-w-0 h-full overflow-y-auto'>
                {children}
            </div>
        </div>
    );
}
