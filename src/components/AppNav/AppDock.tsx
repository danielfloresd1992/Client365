'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { isAdminRoute } from '@/libs/auth/routes.config';
import useAuthOnServer from '@/hook/auth';
import { useDayRole } from '@/contexts/dayRoleContext';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import { setConfigModal } from '@/store/slices/globalModal';
import type { NavItem } from '@/config/nav.types';
import type { ISessionUser } from '@/interfaces/ISession';
import { NAV_SECTIONS } from '@/config/navigation.generated';
import { navigationIconByKey, fallbackNavigationIcon } from './navigationIconRegistry';
import { BellOffIcon, SettingsIcon, LogoutIcon, userAvatarPlaceholder } from '@/components/icons';
import { NotificationBell } from '@/components/Notifications';

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
    const { onDuty, auxiliary, hasDayRole, roleLabel, roleWindow } = useDayRole() as {
        onDuty: boolean;
        auxiliary: boolean;
        hasDayRole: boolean;
        roleLabel: string | null;
        roleWindow: string | null;
    };

    const user: ISessionUser | undefined = dataSessionState?.dataSession;
    const userName = `${user?.name || ''} ${user?.surName || ''}`.trim();
    const isAdmin = user?.admin === true;

    // El menú solo ofrece lo que el usuario puede abrir. La lista de rutas de
    // administrador es la MISMA que aplica LoadingGuard (routes.config), así no
    // hay dos definiciones que se desincronicen: agregar una ruta allí la oculta
    // acá y la bloquea con el 403 en la página.
    //
    // Mientras la sesión se resuelve, `user` es undefined y las rutas de admin
    // quedan ocultas. Es el default seguro: aparecen al confirmarse el permiso,
    // en vez de mostrarse y desaparecer.
    const visibleSections = useMemo(
        () => NAV_SECTIONS
            .map(section => ({
                ...section,
                items: section.items.filter(item => isAdmin || !isAdminRoute(item.path)),
            }))
            .filter(section => section.items.length > 0),
        [isAdmin],
    );

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
                /* Al expandirse, la barra se monta SOBRE el contenido: la sombra
                   es direccional (hacia la derecha, que es por donde crece) para
                   que se lea como una capa despegada y no como un borde. Va en la
                   transición junto al ancho, si no aparece de golpe. */
                className='group absolute inset-y-0 left-0 w-[52px] hover:w-[232px] transition-[width,box-shadow] duration-200 ease-out bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-[26px_0_44px_-10px_rgba(15,23,42,0.42),4px_0_12px_-2px_rgba(15,23,42,0.20)] flex flex-col py-2 overflow-hidden z-40'
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
                    {visibleSections.map(section => (
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

                    {/* Notificaciones: la campana se monta entera desde su
                        modulo. AppDock solo le presta las clases del riel para
                        que la fila encaje con las demas. */}
                    <NotificationBell rowClass={ROW} iconBoxClass={ICON_BOX} labelClass={LABEL} />

                    {/* Usuario (avatar + nombre/rol). Si el horario de hoy lo
                        designa encargado/auxiliar, la campanita lo resalta. */}
                    <div className={`${ROW} h-auto py-1.5 pointer-events-none`}>
                        <span className={`${ICON_BOX} relative`}>
                            <img src={user?.img || userAvatarPlaceholder} alt={userName || 'avatar'} className={`w-8 h-8 rounded-full object-cover border-2 ${onDuty ? 'border-blue-700' : auxiliary ? 'border-red-600' : 'border-gray-200'}`} />
                            {hasDayRole && (
                                <span className={`absolute -top-1 right-0.5 flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white text-white ${onDuty ? 'bg-blue-700' : 'bg-red-600'}`} title={roleWindow ? `${roleLabel} · ${roleWindow}` : (roleLabel ?? undefined)}>
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
                                    <span className='leading-tight'>
                                        {roleLabel}
                                        {/* Ventana del rol: el día operativo respeta el turno
                                            (nocturno cruza la medianoche hasta las 07:00) */}
                                        {roleWindow && (
                                            <span className='block text-[8px] font-bold tracking-widest opacity-90 normal-case'>
                                                {roleWindow}
                                            </span>
                                        )}
                                    </span>
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
