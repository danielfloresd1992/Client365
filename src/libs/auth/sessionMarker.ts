/**
 * Cookie marcadora de sesión en el dominio de Next.js
 * 
 * El backend API (express-session) establece `connect.sid` en su propio dominio,
 * pero el middleware de Next.js no puede leerla porque están en dominios diferentes.
 * 
 * Esta cookie `jarvis_session` actúa como un marcador ligero:
 * - Se establece cuando el login es exitoso o cuando isAuth confirma sesión activa
 * - Se elimina al hacer logout o cuando isAuth indica sesión expirada
 * - El middleware de Next.js la usa para decidir si bloquear o permitir rutas
 * 
 * NO es un token de seguridad — la autenticación real la maneja el backend
 * con `connect.sid`. Esto solo evita que el middleware redirija innecesariamente.
 */

const COOKIE_NAME = 'jarvis_session';

/**
 * Establece la cookie marcadora después de un login exitoso
 */
export function setSessionMarker(): void {
    if (typeof document === 'undefined') return; // SSR guard
    
    // Cookie de sesión del navegador (sin maxAge = se borra al cerrar navegador)
    // Igual que connect.sid que no tiene maxAge en el backend
    document.cookie = `${COOKIE_NAME}=1; path=/; SameSite=Lax; Secure`;
}

/**
 * Elimina la cookie marcadora al hacer logout o sesión expirada
 */
export function removeSessionMarker(): void {
    if (typeof document === 'undefined') return; // SSR guard
    
    // Expirar la cookie estableciendo una fecha pasada
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
}

/**
 * Verifica si la cookie marcadora existe (para uso client-side)
 */
export function hasSessionMarker(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie.split(';').some(c => c.trim().startsWith(`${COOKIE_NAME}=1`));
}
