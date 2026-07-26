'use client';
import { useEffect } from 'react';
import useSpeckAlert from '@/hook/useSpeckAlert';
import socket_jarvis from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import {
    showBrowserNotification,
    registerServiceWorker,
    requestNotificationPermission,
} from '@/libs/notification_push/native';
import {
    waitForDeviceReady,
    initPushNotifications,
} from '@/libs/script/cordovaInit';



export default function AlertLiveJarvis() {

    const { speak, voice_definitive } = useSpeckAlert();


    // Inicializar plataforma: Cordova o Web
    useEffect(() => {
        async function initPlatform() {
            const inCordova = await waitForDeviceReady();

            if (inCordova) {
                // En Cordova: inicializar push plugin (pide permisos automáticamente en Android 13+)
                initPushNotifications();
            } else {
                // En Web: registrar Service Worker
                registerServiceWorker();
            }
        }

        initPlatform();

        const askPermission = () => {
            requestNotificationPermission();
            window.removeEventListener('click', askPermission);
            window.removeEventListener('touchend', askPermission);
        };

        window.addEventListener('click', askPermission, { once: true });
        window.addEventListener('touchend', askPermission, { once: true });

        return () => {
            window.removeEventListener('click', askPermission);
            window.removeEventListener('touchend', askPermission);
        };
    }, []);





    // Socket listeners para alertas
    useEffect(() => {
        let isSubscribed = true;

        const handlerMsmSocket = msm => {
            if (isSubscribed) {
                speak(msm.text);
                showBrowserNotification('Alerta Jarvis', {
                    body: msm.text,
                    icon: '/ico/icons8-campana-48.png',
                });
            }
        };

        const handdlerAlertSocket = (msm) => {
            if (isSubscribed) {
                speak(msm.text);
                showBrowserNotification(msm.text, {
                    body: msm.body,
                    icon: msm.profilePic || '/ico/icons8-campana-48.png',
                });
            }
        };

        const handdlerCreateSocket = (msm) => {
            if (isSubscribed) {
                const text = `Nueva alerta en ${msm.doc?.local?.localName}, por validar`;
                speak(text);
                console.log(msm);
                showBrowserNotification('Nueva alerta', {
                    body: msm.doc?.title || text,
                    image: msm.doc?.imageToShare,
                    icon: '/ico/icons8-campana-48.png',
                });

            }
        };

        const handdlerPutSocket = (msm) => {
            if (isSubscribed) {
               // console.log(msm);
            }
        };


        // Watcher de monitoreo (jarvis_api): anuncia por voz el inicio y el fin
        // de la ventana de monitoreo de cada establecimiento (invierno incluido).
        const monitoringTypeLabel = (msm) =>
            msm?.typeLabel
            ?? (msm?.type === 'perimeter' ? 'perimetral'
              : msm?.type === 'analytical' ? 'analítico'
              : '');

        const handdlerMonitoringStart = (msm) => {
            if (isSubscribed) {
                const tipo = monitoringTypeLabel(msm);
                const text = `Inicio de Monitoreo${tipo ? ` ${tipo}` : ''} en ${msm?.name ?? 'establecimiento'}`;
                speak(text);
                showBrowserNotification('Inicio de monitoreo', {
                    body: text,
                    icon: '/ico/icons8-campana-48.png',
                });
            }
        };

        const handdlerMonitoringEnd = (msm) => {
            if (isSubscribed) {
                const tipo = monitoringTypeLabel(msm);
                const text = `Fin de Monitoreo${tipo ? ` ${tipo}` : ''} en ${msm?.name ?? 'establecimiento'}`;
                speak(text);
                showBrowserNotification('Fin de monitoreo', {
                    body: text,
                    icon: '/ico/icons8-campana-48.png',
                });
            }
        };

        socket_jarvis.on('warning', handlerMsmSocket);
        socket_jarvis.on('alert', handdlerAlertSocket);

        socket.on('created_Alert', handdlerCreateSocket);
        socket.on('document_updated', handdlerPutSocket);
        socket.on('monitoring-start', handdlerMonitoringStart);
        socket.on('monitoring-end', handdlerMonitoringEnd);


        return () => {
            isSubscribed = false;
            socket_jarvis.off('warning', handlerMsmSocket);
            socket_jarvis.off('alert', handdlerAlertSocket);
            socket.off('created_Alert', handdlerCreateSocket);
            socket.off('document_updated', handdlerPutSocket);
            socket.off('monitoring-start', handdlerMonitoringStart);
            socket.off('monitoring-end', handdlerMonitoringEnd);
        }
    }, [voice_definitive]);


    return null;
}
