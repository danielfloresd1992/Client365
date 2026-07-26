'use client';
import { usePathname } from 'next/navigation';
import { isLoginRoute } from '@/libs/auth/routes.config';
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
