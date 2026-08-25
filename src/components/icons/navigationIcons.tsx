import type { ReactElement } from 'react';
import type { IconProps } from '@/types/icon';
import { createIcon } from './createIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Iconos de NAVEGACIÓN — uno por sección de la barra lateral (AppDock).
// Reutilizables en cualquier parte: <DashboardIcon size={20} className="…" />.
// ─────────────────────────────────────────────────────────────────────────────

export const DashboardIcon = createIcon('DashboardIcon', (
    <>
        <rect width='7' height='9' x='3' y='3' rx='1' />
        <rect width='7' height='5' x='14' y='3' rx='1' />
        <rect width='7' height='9' x='14' y='12' rx='1' />
        <rect width='7' height='5' x='3' y='16' rx='1' />
    </>
));

export const NewsIcon = createIcon('NewsIcon', (
    <>
        <path d='M15 18h-5' />
        <path d='M18 14h-8' />
        <path d='M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2h2' />
        <rect width='4' height='4' x='10' y='6' rx='1' />
    </>
));

export const CalendarIcon = createIcon('CalendarIcon', (
    <>
        <path d='M8 2v4' />
        <path d='M16 2v4' />
        <rect width='18' height='18' x='3' y='4' rx='2' />
        <path d='M3 10h18' />
        <path d='M8 14h.01' /><path d='M12 14h.01' /><path d='M16 14h.01' />
        <path d='M8 18h.01' /><path d='M12 18h.01' /><path d='M16 18h.01' />
    </>
));

export const AttendanceIcon = createIcon('AttendanceIcon', (
    <>
        <rect width='8' height='4' x='8' y='2' rx='1' ry='1' />
        <path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' />
        <path d='m9 14 2 2 4-4' />
    </>
));

export const UsersIcon = createIcon('UsersIcon', (
    <>
        <path d='M18 21a8 8 0 0 0-16 0' />
        <circle cx='10' cy='8' r='5' />
        <path d='M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3' />
    </>
));

// Un solo usuario (para vistas individuales, p. ej. el reporte por empleado).
export const UserIcon = createIcon('UserIcon', (
    <>
        <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
    </>
));

export const BellIcon = createIcon('BellIcon', (
    <>
        <path d='M10.268 21a2 2 0 0 0 3.464 0' />
        <path d='M22 8c0-2.3-.8-4.3-2-6' />
        <path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' />
        <path d='M4 2C2.8 3.7 2 5.7 2 8' />
    </>
));

export const StoreIcon = createIcon('StoreIcon', (
    <>
        <path d='m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7' />
        <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
        <path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4' />
        <path d='M2 7h20' />
    </>
));

/**
 * ESTRELLA DORADA — el sistema de bonificación.
 *
 * Es el único icono del set que trae su propio color en vez de heredar
 * `currentColor`, y es a propósito: el bono es lo que se le paga a alguien, y
 * que su entrada del menú se distinga del resto es la señal.
 *
 * El brillo lo hace un destello que cruza la estrella una vez por segundo,
 * recortado a su silueta. La animación vive en styles.css —`.estrella-brillo`—
 * porque ahí está el `prefers-reduced-motion` que la apaga para quien pidió
 * menos movimiento.
 *
 * Los `id` del degradado y el recorte llevan prefijo propio: se montan una sola
 * vez en el dock, pero un id repetido en el documento haría que otro SVG tomara
 * este relleno sin que nadie entienda por qué.
 */
export const StarIcon = ({ size = 24, ...props }: IconProps): ReactElement => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        {...props}
    >
        <defs>
            <linearGradient id='estrella-oro' x1='4' y1='2' x2='20' y2='22' gradientUnits='userSpaceOnUse'>
                <stop offset='0' stopColor='#f4d03f' />
                <stop offset='.55' stopColor='#d9a441' />
                <stop offset='1' stopColor='#b8860b' />
            </linearGradient>

            {/* El destello: transparente en los bordes para que entre y salga
                sin un corte duro. */}
            <linearGradient id='estrella-destello' x1='0' y1='0' x2='1' y2='0'>
                <stop offset='0' stopColor='#fff' stopOpacity='0' />
                <stop offset='.5' stopColor='#fff' stopOpacity='.85' />
                <stop offset='1' stopColor='#fff' stopOpacity='0' />
            </linearGradient>

            <clipPath id='estrella-silueta'>
                <path d='M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.95z' />
            </clipPath>
        </defs>

        <path
            d='M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.95z'
            fill='url(#estrella-oro)'
            stroke='#a97514'
            strokeWidth='1'
            strokeLinejoin='round'
        />

        <g clipPath='url(#estrella-silueta)'>
            <rect className='estrella-brillo' x='-14' y='-2' width='10' height='28'
                fill='url(#estrella-destello)' transform='rotate(18 12 12)' />
        </g>
    </svg>
);
StarIcon.displayName = 'StarIcon';


/**
 * ENCHUFE — las herramientas de integración.
 *
 * Un enchufe y no una llave inglesa: lo que la pantalla administra son las
 * credenciales con las que OTROS sistemas se conectan a este. La llave inglesa
 * habría dicho «ajustes», que es lo que ya dice el engranaje de Configuración.
 */
export const PlugIcon = createIcon('PlugIcon', (
    <>
        <path d='M9 2v6' />
        <path d='M15 2v6' />
        <path d='M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Z' />
        <path d='M12 17v5' />
    </>
));
