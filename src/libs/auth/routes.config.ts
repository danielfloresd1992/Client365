/**
 * Configuración centralizada de rutas y autenticación
 * 
 * Este archivo define qué rutas son públicas, protegidas y de admin.
 * Se usa tanto en el middleware (server-side) como en el LoadingGuard (client-side).
 */


// Rutas accesibles sin autenticación
export const PUBLIC_ROUTES: string[] = [
    '/',
    '/auth',
    '/user',
];


// Rutas que requieren permisos de administrador
export const ADMIN_ROUTES: string[] = [
    '/clients&manasgement',
    '/alertmanasgement',
    '/Corte365',
];


// Rutas que son el destino después del login
export const DEFAULT_AUTHENTICATED_ROUTE = '/Lobby';

// Rutas desde las que se redirige si el usuario ya está autenticado
export const LOGIN_ROUTES = ['/', '/auth'];


/**
 * Verifica si una ruta es pública
 */
export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => {
        if (route === '/') return pathname === '/';
        return pathname === route || pathname.startsWith(route + '/');
    });
}


/**
 * Verifica si una ruta es de admin
 */
export function isAdminRoute(pathname: string): boolean {
    return ADMIN_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );
}


/**
 * Verifica si es una ruta de login (donde redirigir usuarios ya autenticados)
 */
export function isLoginRoute(pathname: string): boolean {
    return LOGIN_ROUTES.includes(pathname);
}
