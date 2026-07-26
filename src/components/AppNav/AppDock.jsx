'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import useAuthOnServer from '@/hook/auth';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import { setConfigModal } from '@/store/slices/globalModal';

/*
 * AppDock: barra de navegación GLOBAL de la app. En reposo es un riel delgado
 * de iconos (52px); al pasar el mouse CRECE hacia la derecha (sobre el
 * contenido, sin reacomodarlo) y revela el nombre de cada sección. El ítem
 * activo es una pastilla en el verde de marca. Abajo, fijos: notificaciones,
 * el usuario, Configuración y Cerrar sesión.
 */

// Avatar por defecto cuando el usuario no tiene foto (mismo que usaba el Header)
const AVATAR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC4UlEQVR4nO3XSW/TQBgG4OkB+BOQpUmT1onjOOGIhOAEZxD8HZYziAoE4tosLemWZo/ttDcQEjdatXBs4jh2PJPQ5AIq+tAkgHpoqyb1dvArzdHS81kzntcIuXHjxs3JJEXC8lJvMS6QXU4gQ66Kh2xF341Wuq9iRRxFTk2wAtd4qfeWl8jvuEiAEwhwNQyxKga2okO0rANT0o4XtrQ3TA6uIsfhG2Sbl3pwFj5S6gJT6MLClgbzm2qDye06Z4hEo/fuwvi8BuFNFULrndfIOXv+7G1zOl6F0JpyHFhVInb70ejATozvwNxqBwI55aXdfsQJZG8afDCnQOBD+6vdfsTVyWA6vAL+rHxktx9xNXw0DX52uQ2+rPzDbj9iq3hvGrw/2wZvpmX/FqI37DR4X0YGT1p+Ybcf0XpAb9hJ8d5U69iTajPICaH1YCJ8WoYbqdYickpotwnnNemieE+qKSbff7mCnBTabWg9oDfseduGvnnH4U+G1gN6w9JLyp+VB76MPKBfG3pgHbPn3bgxIwAzie1+khfws3gd73ACOeBqeMhW8TBWwftsRd9hy92nbEFLIMfBhf4jXiLfeJFAnDZTuuoYYv9KXlX/35WiJR2YonbAFNWH9Flb7clGP8CL5DMvEbgonlaOSHFcO5iC9im0pfjtwYvkVkIi6iXwo+oRzmt6aF25ay1e6t3hRfLrsvj5/OgHH0Kb6s/5De22JfhYvedPSEQzCh+ma0OFuTVVD+TUoLl6gJlL7vlT8SHan9Y7MLemfDT1YPNi/7F5+M64AK60H5j39if4VE6Fz40K4L4pfl7o3zQbH/zbYIPZFm/4AHEBP7cCH1hRwL8sPzF+gHE9MB0/S/8fluWG4QPE6vi7FfjZ8Q/QgeEDcDU8sAgP3nRrYPgAVuF9GXm0jB/AQrw3bcIAVuK9qZbxA0TL3aZVeM9S89DwAdgyvh8pdptW4K8vHd4zfAA3btwgR+YPVDJLQrWoQIYAAAAASUVORK5CYII=';

// ── Iconos (línea, currentColor) ────────────────────────────────────────
const ICON = 'w-[18px] h-[18px]';
const svgProps = { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className: ICON };

const IconDashboard = () => (
    <svg {...svgProps}><rect width='7' height='9' x='3' y='3' rx='1' /><rect width='7' height='5' x='14' y='3' rx='1' /><rect width='7' height='9' x='14' y='12' rx='1' /><rect width='7' height='5' x='3' y='16' rx='1' /></svg>
);
const IconNews = () => (
    <svg {...svgProps}><path d='M15 18h-5' /><path d='M18 14h-8' /><path d='M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2h2' /><rect width='4' height='4' x='10' y='6' rx='1' /></svg>
);
const IconCalendar = () => (
    <svg {...svgProps}><path d='M8 2v4' /><path d='M16 2v4' /><rect width='18' height='18' x='3' y='4' rx='2' /><path d='M3 10h18' /><path d='M8 14h.01' /><path d='M12 14h.01' /><path d='M16 14h.01' /><path d='M8 18h.01' /><path d='M12 18h.01' /><path d='M16 18h.01' /></svg>
);
const IconAttendance = () => (
    <svg {...svgProps}><rect width='8' height='4' x='8' y='2' rx='1' ry='1' /><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' /><path d='m9 14 2 2 4-4' /></svg>
);
const IconUsers = () => (
    <svg {...svgProps}><path d='M18 21a8 8 0 0 0-16 0' /><circle cx='10' cy='8' r='5' /><path d='M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3' /></svg>
);
const IconBell = () => (
    <svg {...svgProps}><path d='M10.268 21a2 2 0 0 0 3.464 0' /><path d='M22 8c0-2.3-.8-4.3-2-6' /><path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' /><path d='M4 2C2.8 3.7 2 5.7 2 8' /></svg>
);
const IconBellOff = () => (
    <svg {...svgProps}><path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' /><path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' /></svg>
);
const IconStore = () => (
    <svg {...svgProps}><path d='m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7' /><path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' /><path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4' /><path d='M2 7h20' /></svg>
);
const IconGear = () => (
    <svg {...svgProps}><circle cx='12' cy='12' r='3' /><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' /></svg>
);
const IconLogout = () => (
    <svg {...svgProps}><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' /><polyline points='16 17 21 12 16 7' /><line x1='21' y1='12' x2='9' y2='12' /></svg>
);

// Secciones de navegación (Corte 365 retirado)
const NAV_SECTIONS = [
    {
        label: 'Principal',
        items: [
            { name: 'Panel analítico',   path: '/dashboard', Icon: IconDashboard },
            { name: 'Muro de novedades', path: '/Lobby',     Icon: IconNews },
        ],
    },
    {
        label: 'Empleados',
        items: [
            { name: 'Horario y guardias',   path: '/user',            Icon: IconCalendar },
            { name: 'Consultar asistencia', path: '/user/asistencia', Icon: IconAttendance },
            { name: 'Gestión de perfiles',  path: '/user/config',     Icon: IconUsers },
        ],
    },
    {
        label: 'Operación',
        items: [
            { name: 'Gestión de alertas', path: '/alertmanasgement',    Icon: IconBell },
            { name: 'Establecimientos',   path: '/clients&manasgement', Icon: IconStore },
        ],
    },
];

// Clases comunes de una fila (icono fijo a la izquierda + etiqueta que aparece)
const ROW = 'flex items-center h-10 mx-[7px] rounded-lg transition-colors';
const ICON_BOX = 'w-[38px] shrink-0 flex items-center justify-center';
const LABEL = 'whitespace-nowrap text-[12.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150';

export default function AppDock() {

    const pathname = usePathname();
    const dispatch = useDispatch();
    const { logOut, dataSessionState } = useAuthOnServer();

    // Notificaciones — placeholder estético (igual que en el Header)
    const [hasUnread, setHasUnread] = useState(true);

    const user = dataSessionState?.dataSession;
    const userName = `${user?.name || ''} ${user?.surName || ''}`.trim();

    const handleLogout = () => logOut('/');

    const handleConfig = () => {
        if (user?.admin) return dispatch(setOpenWindowConfig(true));
        dispatch(setConfigModal({
            type: 'warning',
            title: 'Error',
            description: 'Solo los administradores tienen acceso a esta función.',
            isCallback: null,
            modalOpen: true,
        }));
    };

    return (
        // Huella fija de 52px: la barra crece por encima del contenido sin moverlo
        <div className='relative w-[52px] h-full shrink-0'>
            <nav
                aria-label='Navegación de la aplicación'
                className='group absolute inset-y-0 left-0 w-[52px] hover:w-[232px] transition-[width] duration-200 ease-out bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl flex flex-col py-2 overflow-hidden z-40'
            >
                {/* Marca: logo de Jarvis365 centrado; el nombre aparece al expandir */}
                <div className='flex items-center h-10 shrink-0 mb-1 mx-[7px]'>
                    <span className={ICON_BOX}>
                        <img src='/logo-page-removebg.png' alt='Jarvis365' className='w-8 h-8 object-contain' />
                    </span>
                    <span className='whitespace-nowrap font-black text-[15px] text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
                        Jarvis<span className='text-[#29c50c]'>365</span>
                    </span>
                </div>

                {/* Navegación (scroll propio si no cabe) */}
                <div className='flex-1 min-h-0 w-full flex flex-col overflow-y-auto overflow-x-hidden'>
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label} className='w-full pt-1'>
                            <p className='h-4 flex items-center px-[13px] text-[9.5px] font-bold uppercase tracking-wider text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
                                {section.label}
                            </p>
                            {section.items.map(({ name, path, Icon }) => {
                                const isActive = pathname === path;
                                return (
                                    <Link
                                        key={path}
                                        href={path}
                                        title={name}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`${ROW} ${isActive
                                            ? 'bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08]'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                                    >
                                        <span className={ICON_BOX}><Icon /></span>
                                        <span className={LABEL}>{name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Zona inferior fija: notificaciones · usuario · config · salir */}
                <div className='shrink-0 w-full pt-1.5 mt-1 border-t border-gray-100'>

                    {/* Notificaciones — resalta cuando hay sin leer (campana con
                        badge pulsante y, al expandir, contador a la derecha) */}
                    <button
                        type='button'
                        onClick={() => setHasUnread(v => !v)}
                        title={hasUnread ? 'Tienes notificaciones sin leer' : 'Sin notificaciones nuevas'}
                        className={`${ROW} w-[calc(100%-14px)] ${hasUnread
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                        <span className={`${ICON_BOX} relative`}>
                            <span className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${hasUnread ? 'bg-rose-100' : ''}`}>
                                {hasUnread ? <IconBell /> : <IconBellOff />}
                            </span>
                            {hasUnread && (
                                <span className='absolute top-0.5 right-1 flex h-[9px] w-[9px]' aria-hidden='true'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                                    <span className='relative inline-flex rounded-full h-[9px] w-[9px] bg-rose-500 ring-2 ring-white'></span>
                                </span>
                            )}
                        </span>
                        <span className={`${LABEL} flex-1 flex items-center justify-between`}>
                            <span>Notificaciones</span>
                            {hasUnread && (
                                <span className='mr-2 text-[10px] font-black text-white bg-rose-500 rounded-full px-1.5 py-0.5 leading-none'>3</span>
                            )}
                        </span>
                    </button>

                    {/* Usuario (avatar + nombre/rol) */}
                    <div className={`${ROW} h-12 pointer-events-none`}>
                        <span className={ICON_BOX}>
                            <img src={user?.img || AVATAR_PLACEHOLDER} alt={userName || 'avatar'} className='w-8 h-8 rounded-full object-cover border-2 border-gray-200' />
                        </span>
                        <span className='min-w-0 flex-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
                            <span className='block text-[12.5px] font-semibold text-gray-700 truncate'>{userName || 'Usuario'}</span>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${user?.admin ? 'text-[#29c50c]' : 'text-gray-400'}`}>
                                {user?.admin ? 'Administrador' : 'Usuario'}
                            </span>
                        </span>
                    </div>

                    {/* Configuración */}
                    <button
                        type='button'
                        onClick={handleConfig}
                        title='Configuración'
                        className={`${ROW} w-[calc(100%-14px)] text-gray-500 hover:bg-gray-100 hover:text-gray-800`}
                    >
                        <span className={ICON_BOX}><IconGear /></span>
                        <span className={LABEL}>Configuración</span>
                    </button>

                    {/* Cerrar sesión */}
                    <button
                        type='button'
                        onClick={handleLogout}
                        title='Cerrar sesión'
                        className={`${ROW} w-[calc(100%-14px)] text-red-500 hover:bg-red-50 hover:text-red-600`}
                    >
                        <span className={ICON_BOX}><IconLogout /></span>
                        <span className={LABEL}>Cerrar sesión</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
