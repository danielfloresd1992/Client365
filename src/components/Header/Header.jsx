'use client';
import Image from 'next/image';
import useAuthOnServer from '@/hook/auth';
import Link from 'next/link';
import { useRouter, usePathname} from 'next/navigation';
import { useEffect } from 'react';
import socket from '@/libs/socketIo';
import socket_jarvis from '@/libs/socketIo_jarvis';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import { setClient } from '@/store/slices/Client.js';
import { setConfigModal } from '@/store/slices/globalModal';
import getisDaylightSavingTime from '@/libs/ajaxServer/getIsDaylightSavingTime';
import { apdateLightSavingTime } from '@/store/slices/isDaylightSavingTimeStore';
import { getLightEstablishment } from '@/libs/ajaxClient/establishmentFetching'





export default function Header() {


    const {  logOut, dataSessionState } = useAuthOnServer();
    const establishmentState = useSelector(state => state.clients).length;

    const dispatch = useDispatch();
    const router = useRouter();
    const pathName = usePathname();


    console.log(dataSessionState)


    useEffect(() => {
        let isSubscribed = dataSessionState ? true : false;
        socket.on('connect_error', error => {
            dispatch(setConfigModal({
                type: 'error',
                title: 'Error al comunicarse con el servidor',
                description: 'Há ocurrido un error en unos de los socked , por favor comuníquese con el administrador.',
                isCallback: null,
                modalOpen: true
            }));
        });

        socket_jarvis.on('connect_error', error => {
            dispatch(setConfigModal({
                type: 'error',
                title: 'Error al comunicarse con el servidor',
                description: 'Há ocurrido un error en unos de los socked , por favor comuníquese con el administrador.',
                isCallback: null,
                modalOpen: true
            }));
            /////////////////
        });

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
        

    }, [ dataSessionState ]);



    useEffect(() => {

        if (dataSessionState.stateSession === 'authenticated') {
            
            getisDaylightSavingTime()
                .then(response => {
                    dispatch(apdateLightSavingTime(response.data.IsDaylightSavingTime));
                })
                .catch(error => {
                    console.log(error);
                });
            if(establishmentState < 1){
                getLightEstablishment({ all: null }, (error, data) => {
                    if(error) throw console.log(error);
                    dispatch(setClient(data));
                })
            }
        }

    }, [ dataSessionState, establishmentState ]);



    const redirectAuth = async () => {
        router.push('/auth');
    };
    
    
    const closeSession = async () => {
        logOut('/');
    };

        


    const returnHtmlLogin = () => {
        if (dataSessionState.stateSession === 'loading') {
            return <p className='t-white' style={{ width: '50px' }}>...</p>
        }
        else if(dataSessionState.stateSession === 'authenticated') {
            return (
                <div className='header-buttonContain'>
                    <button
                        className='btn-item btn-item__btn-for-head btn-item_cancel-style'
                        title='Opciones de usuario'
                    >
                        <img className='divContentNovelties-pDateImg divContentNovelties-pDateImg__for-header' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC4UlEQVR4nO3XSW/TQBgG4OkB+BOQpUmT1onjOOGIhOAEZxD8HZYziAoE4tosLemWZo/ttDcQEjdatXBs4jh2PJPQ5AIq+tAkgHpoqyb1dvArzdHS81kzntcIuXHjxs3JJEXC8lJvMS6QXU4gQ66Kh2xF341Wuq9iRRxFTk2wAtd4qfeWl8jvuEiAEwhwNQyxKga2okO0rANT0o4XtrQ3TA6uIsfhG2Sbl3pwFj5S6gJT6MLClgbzm2qDye06Z4hEo/fuwvi8BuFNFULrndfIOXv+7G1zOl6F0JpyHFhVInb70ejATozvwNxqBwI55aXdfsQJZG8afDCnQOBD+6vdfsTVyWA6vAL+rHxktx9xNXw0DX52uQ2+rPzDbj9iq3hvGrw/2wZvpmX/FqI37DR4X0YGT1p+Ybcf0XpAb9hJ8d5U69iTajPICaH1YCJ8WoYbqdYickpotwnnNemieE+qKSbff7mCnBTabWg9oDfseduGvnnH4U+G1gN6w9JLyp+VB76MPKBfG3pgHbPn3bgxIwAzie1+khfws3gd73ACOeBqeMhW8TBWwftsRd9hy92nbEFLIMfBhf4jXiLfeJFAnDZTuuoYYv9KXlX/35WiJR2YonbAFNWH9Flb7clGP8CL5DMvEbgonlaOSHFcO5iC9im0pfjtwYvkVkIi6iXwo+oRzmt6aF25ay1e6t3hRfLrsvj5/OgHH0Kb6s/5De22JfhYvedPSEQzCh+ma0OFuTVVD+TUoLl6gJlL7vlT8SHan9Y7MLemfDT1YPNi/7F5+M64AK60H5j39if4VE6Fz40K4L4pfl7o3zQbH/zbYIPZFm/4AHEBP7cCH1hRwL8sPzF+gHE9MB0/S/8fluWG4QPE6vi7FfjZ8Q/QgeEDcDU8sAgP3nRrYPgAVuF9GXm0jB/AQrw3bcIAVuK9qZbxA0TL3aZVeM9S89DwAdgyvh8pdptW4K8vHd4zfAA3btwgR+YPVDJLQrWoQIYAAAAASUVORK5CYII=' />
                        {
                            dataSessionState.stateSession === 'authenticated' && dataSessionState?.dataSession ?
                                `${dataSessionState?.dataSession?.name} ${dataSessionState?.dataSession?.surName}` || ''
                                :
                                '...'
                        }
                        <img style={{ width: '15px', filter: 'invert()' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAZ0lEQVR4nO3WwQmAQAwF0SlPt/+zC4t9RGxAZRH84DzIPTkEBiRJek8DOlDh04H16pARsGQ9nP0Xh6zAFrBk3cy54zL7P5IkSR9pZjxZ9TsCyrbMeEmSpGzNjCerfkdAnpcZL0kScw7zFAKxsVXx1wAAAABJRU5ErkJggg==' />
                    </button>

                    <button
                        onClick={() => {
                            if (dataSessionState?.dataSession?.admin){
                                return dispatch(setOpenWindowConfig(true));
                            }
                            dispatch(setConfigModal({
                                type: 'warning',
                                title: 'Error',
                                description: 'Solo los administradores tienen acceso a esta función.',
                                isCallback: null,
                                modalOpen: true
                            }));
                        }}
                        className='btn-item btn-item__btn-for-head btn-item__white btn-item_cancel-style'
                        title='Ir a mi configuración'
                    >
                        Mi configuración
                        <img className='img-btn-circle' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD3ElEQVR4nO1Zz0tUURT+mtEU0iDXJmS7dDUb0U31Byga4iq3WZJl22wd4l+hlGFWqwzMFml/gJlFP8wkiGybaZLkOHHge3Aa773vvjvjjEN9cJnh3fPOPee+c8+vC/zHPjQBmAOwAyDHscNnMnfo8UwJnj+eogKwQ2Eb1LMGPvuFCkCOw/d5yZAuoQJpFBHNABYAZAG8BJCx0NUC6PRQoJO0JmS4RpZrytoF4TSAL1x4l7/fAbQpmg4A0wA2lZBfDbzW1bzQ3gfQrubbyDtHBXJcW2QIQrMSXnbjBIAppUQ/gBkl1BYVuQqg0cCvkXNC81O9N0NekfBTXGtBKRH0JSIG8nuMz6qUEtH4BOCSovFBHYABvqt5TXENkF8kw3xS4dM0mWyeO4yUGAewAeAmgGqE4yh5CK8JJXyEBsqwG3Kwlwy7onEkXG4vXlXqa8vBToxMnl2alDgoVOWdN5vni4X2DGI2pcK4xeMFoZ/MxE5THjbdB+AegPf0TFv8P8k5oXEhxbVyXLtgPCEzOWwuXDB4FdNYBdATw2tEudiC0KEWrXbs2JgS8BWAawDO0BXKaAFwHcCyoht1fFH5Smuk08EuMabJRPy8DWMq0xyIMTOZu0LaSAkbLpNGInYQahnytxh4bGYTCX82Ae9zSoluC009I/amI3dyIkrM5CvYPnNk87LzSTHIdz86zPMhabpCysBoSP5iQp+y+TjvZIJE1tfk0WuhGTLIYyxPbWXguiUxA11ljgc2FMPkcdcy35iXxVrLU1MZGIcPfEe8TShayEPihC+M5WlIuRfl/7YD7oN6VR8kwT55y6XAcRXlk2CfvOUyodZimdCc5aB8cxziSdJIhA3FDfK4Y5k/SRlMss1qwiae6hA3ulyAG30T6EZnqZxXIHvgCGSrpJH0IClkY+TdFUcge6Q6GQeSSvQoe5T0wBfnuZN7jigrHmobwI/QVEInc65UYVQpMRhTu6a585Gp3vZINYKTOTCVjToPtkIkpZTIMT0YZpCq42jlgY1sfo/Cpyw8awB8LkY6DdX7kSLDhW4mZnEFzYpHcnaLtI9RBCQpKavpUSS3ecczJOMtXWWvRxsmRbuXNS8WKnxFF/WZSm+rLMUIHxK8bEjFKLEY2lrctbQWJ3gmRjzaJC7U8MBu0GxsrcXfIa1F3+buGiOxBJ4kWaj4+chV5gxfW9zvCz5/jhK017dZww452utDTA+2Y9rrDUr44PZ6/gVH1uIZ2hkt9QWHlIFlv+AwXTEtFuGKqcvzimkewCkUERV7yZcUxVCgrKj4i+45RyL3Vxl4WGEqT73LQPxr+AMdos4R86gAYAAAAABJRU5ErkJggg==' />
                    </button>

                    <button
                        onClick={ closeSession }
                        className='btn-item btn-item__btn-for-head btn-item__white btn-item_cancel-style'
                        title='Cerrar session'
                    >
                        Cerrar sessión
                        <img className='img-btn-circle' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABNklEQVR4nO3aMU4DMRCF4R8KWiRofRHEwWi3gcBNOEEaxAEoAhR0tCzXcGTJkdAqGzyJgt4MfpJLS/NpdtdrywBnwAPwDWSRMQKLWltz7gUKnxt3FshYJ12hk+sfnWnORq+WbK2rQ46c3Dsiltw7IpabKB0pGQgCMaVDjphHYAmce+/Iqtb0YsEoQhLwWesqqAuvkL0wqpAp5vU3jDLEhFGHbMNc4hTShPECmWLephhPkJ0Yb5BZzCGQE+Bd4NhodSjktL547iFhHi2pz3B2BEm71hIvkBRhQUwt/1vqkNT6O68MSZY9iSokRdhYpShb3Y8ohw/PwFOE46C90iF/kCFCRwZrXaqQ3CFiyb0jYsn/tiNjnVAusqhdqvmyTFoIHOfMjVsLpFzuKphNZxRG6URBNF88WwOccZGxk5w4qAAAAABJRU5ErkJggg==' />
                    </button>
                </div>

            )
        }
        else return <span className='t-white' style={{ padding: '0 2rem', cursor: 'pointer' }} onClick={redirectAuth}>Iniciar sessión</span>
    };



    return (
         <nav className='header' >
            <div style={{ height: '100%', overflow: 'hidden' }}>
                {
                    pathName !== '/' ?
                        <Link href={'/Lobby'}>
                            <Image priority={false} className='header-logo-title' alt='logo' src='/img/LOGO-SLIDER.png' width={200} height={70} style={{ position: 'relative', top: '-15px' }} />
                        </Link>
                    :
                        null
                }

            </div>

            {
                returnHtmlLogin()
            }

        </nav>
    );
}