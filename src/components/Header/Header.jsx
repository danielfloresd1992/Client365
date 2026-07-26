'use client';
import Image from 'next/image';
import useAuthOnServer from '@/hook/auth';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import socket from '@/libs/socket/socketIo';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import { setClient } from '@/store/slices/Client.js';
import { setConfigModal } from '@/store/slices/globalModal';
import getisDaylightSavingTime from '@/libs/ajaxServer/getIsDaylightSavingTime';
import { apdateLightSavingTime } from '@/store/slices/isDaylightSavingTimeStore';


// Avatar por defecto cuando el usuario no tiene foto
const AVATAR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC4UlEQVR4nO3XSW/TQBgG4OkB+BOQpUmT1onjOOGIhOAEZxD8HZYziAoE4tosLemWZo/ttDcQEjdatXBs4jh2PJPQ5AIq+tAkgHpoqyb1dvArzdHS81kzntcIuXHjxs3JJEXC8lJvMS6QXU4gQ66Kh2xF341Wuq9iRRxFTk2wAtd4qfeWl8jvuEiAEwhwNQyxKga2okO0rANT0o4XtrQ3TA6uIsfhG2Sbl3pwFj5S6gJT6MLClgbzm2qDye06Z4hEo/fuwvi8BuFNFULrndfIOXv+7G1zOl6F0JpyHFhVInb70ejATozvwNxqBwI55aXdfsQJZG8afDCnQOBD+6vdfsTVyWA6vAL+rHxktx9xNXw0DX52uQ2+rPzDbj9iq3hvGrw/2wZvpmX/FqI37DR4X0YGT1p+Ybcf0XpAb9hJ8d5U69iTajPICaH1YCJ8WoYbqdYickpotwnnNemieE+qKSbff7mCnBTabWg9oDfseduGvnnH4U+G1gN6w9JLyp+VB76MPKBfG3pgHbPn3bgxIwAzie1+khfws3gd73ACOeBqeMhW8TBWwftsRd9hy92nbEFLIMfBhf4jXiLfeJFAnDZTuuoYYv9KXlX/35WiJR2YonbAFNWH9Flb7clGP8CL5DMvEbgonlaOSHFcO5iC9im0pfjtwYvkVkIi6iXwo+oRzmt6aF25ay1e6t3hRfLrsvj5/OgHH0Kb6s/5De22JfhYvedPSEQzCh+ma0OFuTVVD+TUoLl6gJlL7vlT8SHan9Y7MLemfDT1YPNi/7F5+M64AK60H5j39if4VE6Fz40K4L4pfl7o3zQbH/zbYIPZFm/4AHEBP7cCH1hRwL8sPzF+gHE9MB0/S/8fluWG4QPE6vi7FfjZ8Q/QgeEDcDU8sAgP3nRrYPgAVuF9GXm0jB/AQrw3bcIAVuK9qZbxA0TL3aZVeM9S89DwAdgyvh8pdptW4K8vHd4zfAA3btwgR+YPVDJLQrWoQIYAAAAASUVORK5CYII=';


export default function Header() {


    const { logOut, dataSessionState } = useAuthOnServer();
    const establishmentState = useSelector(state => state.clients).length;

    const dispatch = useDispatch();
    const router = useRouter();
    const pathName = usePathname();

    // Menú desplegable del usuario (Configuración / Cerrar sesión)
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Estado de notificaciones — placeholder estético. Cuando exista el sistema,
    // saldrá de Redux: useSelector(s => s.notifications.noLeidas > 0).
    // El onClick que lo alterna es TEMPORAL, solo para previsualizar ambos iconos.
    const [hasUnread, setHasUnread] = useState(true);




    useEffect(() => {
        let isSubscribed = dataSessionState ? true : false;



        const closeSession = data => {
            if (isSubscribed) {
                if (dataSessionState.dataSession._id === data._id) {
                    logOut('/');
                }
            }
        };

        const reloadPage = () => {
            if (window) {
                window.location.reload();
            }
        };

        socket.on('receivesclose-userClientAppManager', closeSession);
        socket.on('reload-client-appmanager', reloadPage);

        return () => {
            isSubscribed = false;
            socket.off('close-sessión-expire', closeSession);
            socket.off('reload-client-appmanager', reloadPage);
        }


    }, [dataSessionState]);



    useEffect(() => {

        if (dataSessionState.stateSession === 'authenticated') {

            getisDaylightSavingTime()
                .then(response => {
                    dispatch(apdateLightSavingTime(response.data.IsDaylightSavingTime));
                })
                .catch(error => {
                    console.log(error);
                });
        }

    }, [dataSessionState, establishmentState]);


    // Cerrar el menú del usuario al hacer click fuera o con Escape
    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);



    const redirectAuth = async () => {
        router.push('/auth');
    };


    const handleLogout = () => {
        setMenuOpen(false);
        logOut('/');
    };


    const handleConfig = () => {
        setMenuOpen(false);
        if (dataSessionState?.dataSession?.admin) {
            return dispatch(setOpenWindowConfig(true));
        }
        dispatch(setConfigModal({
            type: 'warning',
            title: 'Error',
            description: 'Solo los administradores tienen acceso a esta función.',
            isCallback: null,
            modalOpen: true
        }));
    };




    const returnHtmlLogin = () => {
        if (dataSessionState.stateSession === 'loading') {
            return <p className='t-white' style={{ width: '50px' }}>...</p>
        }
        else if (dataSessionState.stateSession === 'authenticated') {
            const userName = `${dataSessionState?.dataSession?.name || ''} ${dataSessionState?.dataSession?.surName || ''}`.trim();
            return (
                <div className='header-main__menu'>

                    {/* Campana de notificaciones — dos estados (solo estético por ahora).
                        onClick temporal para previsualizar; luego abrirá el panel. */}
                    <button
                        type='button'
                        className={`header-main__iconBtn ${hasUnread ? 'header-main__iconBtn--active' : ''}`}
                        title={hasUnread ? 'Tienes notificaciones sin leer' : 'Sin notificaciones nuevas'}
                        aria-label={hasUnread ? 'Notificaciones sin leer' : 'Notificaciones'}
                        onClick={() => setHasUnread(v => !v)}
                    >
                        {hasUnread ? (
                            <>
                                {/* Campana activa (hay notificaciones nuevas) */}
                                <svg xmlns='http://www.w3.org/2000/svg' width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                    <path d='M10.268 21a2 2 0 0 0 3.464 0'></path>
                                    <path d='M22 8c0-2.3-.8-4.3-2-6'></path>
                                    <path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'></path>
                                    <path d='M4 2C2.8 3.7 2 5.7 2 8'></path>
                                </svg>
                                <span className='header-main__notifDot' aria-hidden='true'></span>
                            </>
                        ) : (
                            /* Campana en reposo (sin notificaciones pendientes) */
                            <svg xmlns='http://www.w3.org/2000/svg' width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                            </svg>
                        )}
                    </button>

                    {/* Usuario con menú desplegable (Configuración / Cerrar sesión) */}
                    <div className='header-main__user' ref={menuRef}>
                        <button
                            type='button'
                            className='header-main__userBtn'
                            onClick={() => setMenuOpen(o => !o)}
                            aria-haspopup='menu'
                            aria-expanded={menuOpen}
                            title='Opciones de usuario'
                        >
                            <span className='header-main__avatar'>
                                <img
                                    src={dataSessionState?.dataSession?.img || AVATAR_PLACEHOLDER}
                                    alt='avatar'
                                />
                            </span>
                            <span className='header-main__userName'>{userName || '...'}</span>
                            <svg className={`header-main__chevron ${menuOpen ? 'is-open' : ''}`} xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                <polyline points='6 9 12 15 18 9'></polyline>
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className='header-main__dropdown' role='menu'>
                                <button
                                    type='button'
                                    role='menuitem'
                                    className='header-main__dropItem'
                                    onClick={handleConfig}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <circle cx='12' cy='12' r='3'></circle>
                                        <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                                    </svg>
                                    Configuración
                                </button>

                                <div className='header-main__dropDivider'></div>

                                <button
                                    type='button'
                                    role='menuitem'
                                    className='header-main__dropItem header-main__dropItem--danger'
                                    onClick={handleLogout}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'></path>
                                        <polyline points='16 17 21 12 16 7'></polyline>
                                        <line x1='21' y1='12' x2='9' y2='12'></line>
                                    </svg>
                                    Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        else return <span className='text-[#3b3b3b] px-3 py-1.5 border border-white/30 rounded-full text-xs font-semibold cursor-pointer bg-white/10 tag-yelow' onClick={redirectAuth}>Iniciar sesión</span>
    };



    return (
        <nav className='header-main' >
            <div className='header-main__brand'>
                {
                    pathName !== '/' ?
                        <Link href={'/dashboard'}>
                            <div className='header-main__brandInner'>
                                <Image priority={false} className='header-logo-title header-main__logo' alt='logo' src='/img/LOGO-SLIDER.png' width={170} height={54} />
                            </div>
                        </Link>
                        :
                        null
                }

            </div>

            <div className='header-main__actions'>{returnHtmlLogin()}</div>

        </nav>
    );
}