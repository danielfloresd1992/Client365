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

const MENU_ITEMS = [
    { name: 'Horario y Guardias',   path: '/user',            Icon: CalendarIcon },
    { name: 'Consultar Asistencia', path: '/user/asistencia', Icon: ClipboardCheckIcon },
    { name: 'Gestión de Perfiles',  path: '/user/config',     Icon: UsersIcon },
];

export default function AsideNav() {

    const pathname = usePathname();

    // true = sidebar visible. Se persiste en localStorage (misma clave de siempre).
    const [isOpen, setIsOpen] = useState(false);

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
                    <div className='w-full'>

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
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                        >
                                            <Icon />
                                            {name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>

                    {/* Volver al Lobby — control secundario, mismo vocabulario que los botones de la página */}
                    <div className='w-full pt-2 border-t border-gray-100'>
                        <Link
                            href='/Lobby'
                            className='w-full h-9 flex items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap'
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