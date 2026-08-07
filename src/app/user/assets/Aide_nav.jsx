'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/*
 * Iconos inline (stroke: currentColor) para que hereden el color del item
 * activo/inactivo, igual que los iconos de zoom de page.jsx.
 */
const CalendarIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
        <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
        <line x1='16' y1='2' x2='16' y2='6'></line>
        <line x1='8' y1='2' x2='8' y2='6'></line>
        <line x1='3' y1='10' x2='21' y2='10'></line>
    </svg>
);

const ClipboardCheckIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
        <path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path>
        <rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect>
        <path d='m9 14 2 2 4-4'></path>
    </svg>
);

const UsersIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
        <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
        <circle cx='9' cy='7' r='4'></circle>
        <path d='M22 21v-2a4 4 0 0 0-3-3.87'></path>
        <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
    </svg>
);

const ArrowLeftIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
        <line x1='19' y1='12' x2='5' y2='12'></line>
        <polyline points='12 19 5 12 12 5'></polyline>
    </svg>
);

const ChevronLeftIcon = ({ className }) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className={className}>
        <polyline points='15 18 9 12 15 6'></polyline>
    </svg>
);

/*
 * Reloj de horas extras — misma figura y grosor que el distintivo del pie de
 * la celda en user.list.jsx, para que la leyenda se lea como una réplica.
 * El color lo decide el estado de la hora extra (ver OVERTIME_LEGEND).
 */
const OvertimeClockIcon = ({ color }) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round' className='w-3.5 h-3.5 flex-shrink-0'>
        <circle cx='12' cy='12' r='10'></circle>
        <polyline points='12 6 12 12 16 14'></polyline>
    </svg>
);

/*
 * Estados de la hora extra. Los colores son literalmente los que pinta la
 * celda: verde aprobada, azul por aprobar, rojo rechazada.
 */
const OVERTIME_LEGEND = [
    { color: '#16a34a', label: 'Reloj verde: hora extra aprobada' },
    { color: '#2563eb', label: 'Reloj azul: hora extra por aprobar' },
    { color: '#dc2626', label: 'Reloj rojo: hora extra rechazada' },
];

const MENU_ITEMS = [
    { name: 'Horario y Guardias',   path: '/user',            Icon: CalendarIcon },
    { name: 'Consultar Asistencia', path: '/user/asistencia', Icon: ClipboardCheckIcon },
    { name: 'Gestión de Perfiles',  path: '/user/config',     Icon: UsersIcon },
];

export default function AsideNav() {

    const pathname = usePathname();

    // true = sidebar visible. Abierto por defecto; el estado guardado en
    // localStorage (misma clave de siempre) tiene la última palabra.
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const savedState = localStorage.getItem('asideNavHidden');
        if (savedState !== null) {
            setIsOpen(JSON.parse(savedState));
        }
    }, []);

    const handdlerClickToogleHidden = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem('asideNavHidden', JSON.stringify(newState));
    };

    return (
        <div className={`relative h-full transition-all duration-300 motion-reduce:transition-none ${isOpen ? 'w-[250px]' : 'w-[0px]'} max-[599px]:absolute max-[599px]:top-0 max-[599px]:left-0 max-[599px]:z-[200] max-[599px]:h-full`}>
            <aside className={`absolute top-0 left-0 h-full bg-white rounded-xl shadow-sm transition-all duration-300 motion-reduce:transition-none overflow-hidden flex flex-col justify-between ${isOpen ? 'w-[250px] p-2.5 opacity-100 border' : 'w-[0px] p-0 opacity-0 border-transparent'}`}>
                <div className='w-[230px] h-full flex flex-col justify-between'>
                    <div className='w-full overflow-y-auto'>

                        {/* Encabezado del panel — misma jerarquía que los headers de página */}
                        <div className='px-2.5 pt-2 pb-3 border-b border-gray-100 mb-2'>
                            <h2 className='text-sm font-bold text-gray-800 leading-tight whitespace-nowrap'>Panel de Empleados</h2>
                            <p className='text-[11px] text-gray-500 whitespace-nowrap'>Horarios, asistencia y perfiles</p>
                        </div>

                        <nav className='w-full'>
                            <p className='px-2.5 pt-1 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Tipos de consultas</p>

                            <div className='w-full flex flex-col gap-1'>
                                {MENU_ITEMS.map(({ name, path, Icon }) => {
                                    const isActive = pathname === path;
                                    return (
                                        <Link
                                            key={path}
                                            href={path}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors
                                                ${isActive
                                                    ? 'bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08] hover:text-white'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                        >
                                            <Icon />
                                            {name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Leyenda del sistema de colores de la grilla de horarios */}
                        <div className='w-full mt-4'>
                            <p className='px-2.5 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Leyenda de colores</p>
                            <ul className='flex flex-col gap-1.5 px-2.5 text-[11px] text-gray-600'>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-gray-400 bg-white flex-shrink-0 flex items-center justify-center'>
                                        <span className='w-1.5 h-1.5 bg-teal-700 rotate-45' />
                                    </span>
                                    Laboral (por defecto)
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-yellow-400 bg-yellow-100 flex-shrink-0' />
                                    Cambio de guardia / Permiso
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-green-400 bg-green-100 flex-shrink-0 flex items-center justify-center'>
                                        <span
                                            className='w-2.5 h-2.5 bg-green-700'
                                            style={{ clipPath: 'polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)' }}
                                        />
                                    </span>
                                    Día extra
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-gray-400 bg-gray-200 flex-shrink-0' />
                                    Descanso / Libre
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-cyan-400 bg-cyan-100 flex-shrink-0' />
                                    Vacaciones
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-rose-400 bg-rose-100 flex-shrink-0' />
                                    Llegada tarde
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-red-700 bg-red-600 flex-shrink-0' />
                                    Falta
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span
                                        className='mt-0.5 w-3.5 h-3.5 rounded border border-purple-500 flex-shrink-0'
                                        style={{ background: 'linear-gradient(to bottom, #6b21a8, #f3e8ff)' }}
                                    />
                                    Empleado nuevo: degrada del día 1 a los 3 meses
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded bg-blue-50 border-2 border-blue-500 flex-shrink-0' />
                                    Marco azul: columna del día de hoy
                                </li>
                                <li className='flex items-start gap-2'>
                                    {/* Réplica en miniatura de la celda con comentarios: marco + 4 muescas */}
                                    <span className='relative mt-0.5 w-3.5 h-3.5 rounded-sm bg-white border border-[#f0a500] flex-shrink-0 overflow-hidden'>
                                        <span className='absolute top-0 right-0' style={{ borderTop: '5px solid #f0a500', borderLeft: '5px solid transparent' }} />
                                        <span className='absolute top-0 left-0' style={{ borderTop: '5px solid #f0a500', borderRight: '5px solid transparent' }} />
                                        <span className='absolute bottom-0 right-0' style={{ borderBottom: '5px solid #f0a500', borderLeft: '5px solid transparent' }} />
                                        <span className='absolute bottom-0 left-0' style={{ borderBottom: '5px solid #f0a500', borderRight: '5px solid transparent' }} />
                                    </span>
                                    Muesca dorada: comentarios
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-blue-900 bg-blue-700 text-white flex items-center justify-center flex-shrink-0'>
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    </span>
                                    Encargado de turno (depto.)
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='mt-0.5 w-3.5 h-3.5 rounded border border-red-800 bg-red-600 text-white flex items-center justify-center flex-shrink-0'>
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    </span>
                                    Auxiliar del día (depto.)
                                </li>

                                {/*
                                 * Horas extras: no pintan el fondo de la celda,
                                 * aparecen como reloj + "extra" al pie. Por eso
                                 * se listan juntas y con su propio separador.
                                 */}
                                <li className='pt-1.5 mt-0.5 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>
                                    Horas extras (pie de celda)
                                </li>
                                {OVERTIME_LEGEND.map(({ color, label }) => (
                                    <li key={color} className='flex items-start gap-2'>
                                        <span className='mt-0.5 flex items-center flex-shrink-0'>
                                            <OvertimeClockIcon color={color} />
                                        </span>
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Volver al Lobby — control secundario, mismo vocabulario que los botones de la página */}
                    <div className='w-full pt-2 border-t border-gray-100'>
                        <Link
                            href='/Lobby'
                            className='btn-neutral btn-sm w-full h-9 py-0 text-xs whitespace-nowrap'
                        >
                            <ArrowLeftIcon />
                            Volver al Lobby
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Toggle — mismo estilo que los controles de la barra superior (blanco, borde, chevron que rota) */}
            <div className='absolute top-0 right-[-46px] z-10'>
                <button
                    type='button'
                    onClick={handdlerClickToogleHidden}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
                    title={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
                    className='w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all'
                >
                    <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? '' : 'rotate-180'}`} />
                </button>
            </div>
        </div>
    );
}