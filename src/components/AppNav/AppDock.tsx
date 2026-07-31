'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import useAuthOnServer from '@/hook/auth';
import { useDayRole } from '@/contexts/dayRoleContext';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import { setConfigModal } from '@/store/slices/globalModal';
import type { NavItem } from '@/config/nav.types';
import type { ISessionUser } from '@/interfaces/ISession';
import { NAV_SECTIONS } from '@/config/navigation.generated';
import { navigationIconByKey, fallbackNavigationIcon } from './navigationIconRegistry';
import { BellIcon, BellOffIcon, SettingsIcon, LogoutIcon, userAvatarPlaceholder } from '@/components/icons';

/*
 * AppDock: barra de navegación GLOBAL de la app. En reposo es un riel delgado
 * de iconos (52px); al pasar el mouse CRECE hacia la derecha (sobre el
 * contenido, sin reacomodarlo) y revela el nombre de cada sección. El ítem
 * activo es una pastilla en el verde de marca. Abajo, fijos: notificaciones,
 * el usuario, Configuración y Cerrar sesión.
 *
 * El menú (NAV_SECTIONS) se AUTO-GENERA desde el file-system: cada ruta con
 * page.* + nav.meta.ts aparece sola (ver scripts/generate-nav.mjs). Los iconos
 * se resuelven por su clave con el registro (navigationIconRegistry) sobre el set @/components/icons.
 */

// ── Clases de una fila del menú ─────────────────────────────────────────────
const ROW = 'flex items-center h-10 mx-[7px] rounded-lg transition-colors';
const ICON_BOX = 'w-[38px] shrink-0 flex items-center justify-center';
const LABEL = 'whitespace-nowrap text-[12.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150';

// Fila ACTIVA: verde con texto BLANCO en reposo Y en hover. Se fuerza el blanco
// con `!` (important) porque una regla global de styles.css
// (a,p,h1-h6,b { color:#0f5673 }, fuera de @layer) le gana por herencia al
// text-white normal del <a>.


const ROW_ACTIVE = 'bg-[#29c50c] !text-white shadow-sm hover:bg-[#1f9a08] hover:!text-white';
const ROW_INACTIVE = 'text-gray-500 hover:bg-gray-100 hover:text-gray-800';



// Un ítem del menú: icono (resuelto por su clave) + etiqueta que aparece al expandir.
function NavRow({ item, active }: { item: NavItem; active: boolean }) {
    const NavigationIcon = navigationIconByKey[item.icon] ?? fallbackNavigationIcon;
    return (
        <Link
            href={item.path}
            title={item.name}
            aria-current={active ? 'page' : undefined}
            className={`${ROW} ${active ? ROW_ACTIVE : ROW_INACTIVE}`}
        >
            <span className={`${ICON_BOX} ${active ? 'brightness-0 invert' : ''}`}><NavigationIcon size={18} /></span>
            <span className={`${LABEL} ${active ? 'text-white' : ''}`}>{item.name}</span>
        </Link>
    );
}



export default function AppDock() {

    const pathname = usePathname();
    const dispatch = useDispatch();
    const { logOut, dataSessionState } = useAuthOnServer() as {
        logOut: (path: string) => void;
        dataSessionState?: { dataSession?: ISessionUser };
    };
    // Rol del día según el horario (encargado de turno / auxiliar): se resalta
    // sobre el avatar (colapsado) y como chip al expandir la barra.
    const { onDuty, auxiliary, hasDayRole, roleLabel } = useDayRole() as {
        onDuty: boolean;
        auxiliary: boolean;
        hasDayRole: boolean;
        roleLabel: string | null;
    };

    // Notificaciones — placeholder estético (igual que en el Header)
    const [hasUnread, setHasUnread] = useState(true);

    const user: ISessionUser | undefined = dataSessionState?.dataSession;
    const userName = `${user?.name || ''} ${user?.surName || ''}`.trim();

    const handleLogout = (): void => logOut('/');

    const handleConfig = (): void => {
        if (user?.admin) {
            dispatch(setOpenWindowConfig(true));
            return;
        }
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

                {/* Navegación (auto-generada desde el file-system; scroll propio si no cabe) */}
                <div className='flex-1 min-h-0 w-full flex flex-col overflow-y-auto overflow-x-hidden'>
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label} className='w-full pt-1'>
                            <p className='h-4 flex items-center px-[13px] text-[9.5px] font-bold uppercase tracking-wider text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
                                {section.label}
                            </p>
                            {section.items.map(item => (
                                <NavRow key={item.path} item={item} active={pathname === item.path} />
                            ))}
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
                                {hasUnread ? <BellIcon size={18} /> : <BellOffIcon size={18} />}
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

                    {/* Usuario (avatar + nombre/rol). Si el horario de hoy lo
                        designa encargado/auxiliar, la campanita lo resalta. */}
                    <div className={`${ROW} h-auto py-1.5 pointer-events-none`}>
                        <span className={`${ICON_BOX} relative`}>
                            <img src={user?.img || userAvatarPlaceholder} alt={userName || 'avatar'} className={`w-8 h-8 rounded-full object-cover border-2 ${onDuty ? 'border-blue-700' : auxiliary ? 'border-red-600' : 'border-gray-200'}`} />
                            {hasDayRole && (
                                <span className={`absolute -top-1 right-0.5 flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white text-white ${onDuty ? 'bg-blue-700' : 'bg-red-600'}`} title={roleLabel ?? undefined}>
                                    <BellOffIcon size={10} strokeWidth={2.5} />
                                </span>
                            )}
                        </span>
                        <span className='min-w-0 flex-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
                            <span className='block text-[12.5px] font-semibold text-gray-700 truncate'>{userName || 'Usuario'}</span>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${user?.admin ? 'text-[#29c50c]' : 'text-gray-400'}`}>
                                {user?.admin ? 'Administrador' : 'Usuario'}
                            </span>
                            {roleLabel && (
                                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-[2px] rounded ${onDuty ? 'bg-blue-700' : 'bg-red-600'}`}>
                                    <BellOffIcon size={10} strokeWidth={2.5} />
                                    {roleLabel}
                                </span>
                            )}
                        </span>
                    </div>

                    {/* Configuración */}
                    <button
                        type='button'
                        onClick={handleConfig}
                        title='Configuración'
                        className={`${ROW} w-[calc(100%-14px)] text-gray-500 hover:bg-gray-100 hover:text-gray-800`}
                    >
                        <span className={ICON_BOX}><SettingsIcon size={18} /></span>
                        <span className={LABEL}>Configuración</span>
                    </button>

                    {/* Cerrar sesión */}
                    <button
                        type='button'
                        onClick={handleLogout}
                        title='Cerrar sesión'
                        className={`${ROW} w-[calc(100%-14px)] text-red-500 hover:bg-red-50 hover:text-red-600`}
                    >
                        <span className={ICON_BOX}><LogoutIcon size={18} /></span>
                        <span className={LABEL}>Cerrar sesión</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}