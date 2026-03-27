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



export default function AlertLiveJarvis() {

    const { speak, voice_definitive } = useSpeckAlert();


    // Registrar Service Worker y pedir permiso al primer gesto del usuario
    useEffect(() => {
        registerServiceWorker();

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


        socket_jarvis.on('warning', handlerMsmSocket);
        socket_jarvis.on('alert', handdlerAlertSocket);

        socket.on('created_Alert', handdlerCreateSocket);
        socket.on('document_updated', handdlerPutSocket);


        return () => {
            isSubscribed = false;
            socket_jarvis.off('warning', handlerMsmSocket);
            socket_jarvis.off('alert', handdlerAlertSocket);
            socket.off('document_created', handdlerCreateSocket);
            socket.off('document_updated', handdlerPutSocket);
        }
    }, [voice_definitive]);


    return null;
}
