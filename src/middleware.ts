import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de autenticación Server-Side para Next.js
 * 
 * Usa una cookie marcadora `jarvis_session` en el dominio de Next.js
 * para saber si el usuario se autenticó. La cookie real de sesión
 * (`connect.sid`) vive en el dominio del backend API y no es visible aquí.
 * 
 * La validación real sigue ocurriendo en el cliente cuando LoandingPage
 * llama a GET /auth/isAuth con la cookie del backend.
 */

// Nombre de la cookie marcadora en el dominio de Next.js
const SESSION_MARKER_COOKIE = 'jarvis_session';

// ─── Rutas públicas (accesibles sin sesión) ───────────────────────────
const PUBLIC_ROUTES = [
    '/',
    '/auth',
    '/user',
];

// ─── Rutas estáticas que el middleware debe ignorar ───────────────────
const IGNORED_PREFIXES = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/logo',
    '/img',
    '/ico',
    '/font',
    '/style',
    '/gif',
    '/video',
    '/audio',
];


function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => {
        if (route === '/') return pathname === '/';
        return pathname === route || pathname.startsWith(route + '/');
    });
}


function isIgnoredPath(pathname: string): boolean {
    return IGNORED_PREFIXES.some(prefix => pathname.startsWith(prefix));
}


export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Ignorar archivos estáticos y rutas de API
    if (isIgnoredPath(pathname)) {
        return NextResponse.next();
    }

    // 2. Verificar cookie marcadora (se establece en el dominio de Next.js
    //    después de un login exitoso en el hook useAuthOnServer)
    const sessionMarker = request.cookies.get(SESSION_MARKER_COOKIE);
    const hasSession = sessionMarker?.value === '1';

    // 3. Ruta pública + tiene sesión → redirigir a Lobby
    if (isPublicRoute(pathname) && hasSession) {
        if (pathname === '/' || pathname === '/auth') {
            return NextResponse.redirect(new URL('/Lobby', request.url));
        }
        return NextResponse.next();
    }

    // 4. Ruta protegida + NO tiene sesión → redirigir a landing/login
    if (!isPublicRoute(pathname) && !hasSession) {
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 5. Todo OK → continuar
    return NextResponse.next();
}


// ─── Configuración del matcher ─────────────────────────────────────────
// Solo ejecutar middleware en rutas de páginas (excluir assets estáticos)
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|mp4|webm|mp3)$).*)',
    ],
};
