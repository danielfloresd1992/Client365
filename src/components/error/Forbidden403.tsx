'use client';

/**
 * Forbidden403
 * ──────────────────────────────────────────────────────────────────────────
 * Pantalla a pantalla completa para cuando un usuario AUTENTICADO entra a una
 * ruta que exige permisos de administrador, típicamente escribiendo la URL a
 * mano en la barra del navegador.
 *
 * Antes esos casos se resolvían con una redirección silenciosa al panel: el
 * usuario veía un parpadeo y nunca entendía por qué no llegaba. Mostrar el 403
 * explica el motivo y deja la salida a la vista.
 *
 * Mismo lenguaje visual que ServerConnectionError: fondo marfil, `card-glass`,
 * `accent-strip` y `btn-primary` del design system.
 *
 * OJO: esto es solo la capa de UX. La seguridad real la impone el backend, que
 * vuelve a exigir el permiso en cada endpoint.
 */

import { useRouter } from 'next/navigation';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/libs/auth/routes.config';

interface Forbidden403Props {
    /** Ruta que se intentó abrir; se muestra para que se entienda qué se bloqueó. */
    pathname?: string;
}

export default function Forbidden403({ pathname }: Forbidden403Props) {
    const router = useRouter();

    return (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-gradient-to-br from-[#f7f2e4] via-[#f1e9d7] to-[#e9dec8]'>
            <div className='card-glass relative w-full max-w-md overflow-hidden text-center !p-6 sm:!p-8'>
                <span className='accent-strip absolute top-0 left-0' />

                <LockedIllustration />

                <p className='text-[42px] sm:text-[52px] font-black leading-none text-[#1f9a08] tracking-tight'>
                    403
                </p>
                <h1 className='mt-1 text-lg sm:text-xl font-bold text-slate-800'>
                    Acceso restringido
                </h1>
                <p className='mt-2 text-sm text-slate-600'>
                    Esta sección es solo para usuarios con permisos de <strong>administrador</strong>.
                    Tu sesión está activa, pero no tiene acceso a esta parte del sistema.
                </p>

                {pathname && (
                    <p className='mt-3 inline-block max-w-full truncate rounded-md bg-slate-900/5 px-2.5 py-1 font-mono text-[11px] text-slate-500'>
                        {pathname}
                    </p>
                )}

                <button
                    onClick={() => router.replace(DEFAULT_AUTHENTICATED_ROUTE)}
                    className='btn-primary mt-6 mx-auto'
                >
                    <ArrowIcon />
                    Volver al panel
                </button>

                <p className='mt-4 text-[11px] text-slate-400'>
                    Si necesitas entrar, pídele el permiso a un administrador.
                </p>
            </div>
        </div>
    );
}

/** Ilustración: un candado cerrado sobre un escudo. */
function LockedIllustration() {
    return (
        <div className='mx-auto mb-5 w-32 sm:w-40'>
            <svg
                viewBox='0 0 200 160'
                fill='none'
                className='w-full h-auto'
                role='img'
                aria-label='Acceso restringido'
            >
                <defs>
                    <radialGradient id='lockHalo' cx='50%' cy='45%' r='62%'>
                        <stop offset='0%' stopColor='#29c50c' stopOpacity='0.12' />
                        <stop offset='60%' stopColor='#d9a441' stopOpacity='0.06' />
                        <stop offset='100%' stopColor='#d9a441' stopOpacity='0' />
                    </radialGradient>
                </defs>

                <ellipse cx='100' cy='80' rx='94' ry='66' fill='url(#lockHalo)' />

                {/* Escudo */}
                <path
                    d='M100 22l42 16v34c0 26-17 47-42 58-25-11-42-32-42-58V38l42-16z'
                    fill='#faf5ea'
                    stroke='#29c50c'
                    strokeWidth='3.5'
                    strokeLinejoin='round'
                />

                {/* Arco del candado */}
                <path
                    d='M86 74V64a14 14 0 0 1 28 0v10'
                    stroke='#b5763b'
                    strokeWidth='6'
                    strokeLinecap='round'
                />

                {/* Cuerpo del candado */}
                <rect x='78' y='74' width='44' height='34' rx='7' fill='#7bd42a' opacity='0.22' />
                <rect x='78' y='74' width='44' height='34' rx='7' stroke='#1f9a08' strokeWidth='3.5' />
                <circle cx='100' cy='89' r='4.5' fill='#1f9a08' />
                <line x1='100' y1='92' x2='100' y2='99' stroke='#1f9a08' strokeWidth='3.5' strokeLinecap='round' />
            </svg>
        </div>
    );
}

/** Flecha del botón de salida. */
function ArrowIcon() {
    return (
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M11 17l-5-5m0 0l5-5m-5 5h12' />
        </svg>
    );
}
