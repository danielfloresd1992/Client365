'use client';
import { useEffect } from 'react';
import useSpeckAlert from '@/hook/useSpeckAlert';
import socket_jarvis from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import { requestNotificationPermission } from '@/libs/notification_push/native';
import { prepararAvisos, avisar } from '@/libs/notification_push/plataforma';



export default function AlertLiveJarvis() {

    const { speak, voice_definitive } = useSpeckAlert();


    // Preparar la plataforma de avisos y pedir el permiso.
    //
    // Decidir si estamos en Cordova o en la web ya no vive acá: lo hace
    // `prepararAvisos`, una sola vez por carga de página, para que cualquier
    // parte de la aplicación pueda notificar sin depender de este componente.
    // Llamarlo de nuevo no cuesta nada; si ya se preparó, devuelve lo mismo.
    //
    // El permiso SÍ se queda: los navegadores solo lo conceden dentro de un
    // gesto del usuario, así que necesita a alguien escuchando el primer toque.
    useEffect(() => {
        prepararAvisos();

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
                avisar('Alerta Jarvis', {
                    body: msm.text,
                    icon: '/ico/icons8-campana-48.png',
                });
            }
        };

        const handdlerAlertSocket = (msm) => {
            if (isSubscribed) {
                speak(msm.text);
                avisar(msm.text, {
                    body: msm.body,
                    icon: msm.profilePic || '/ico/icons8-campana-48.png',
                });
            }
        };

        const handdlerCreateSocket = (msm) => {
            if (isSubscribed) {
                const text = `Nueva alerta en ${msm.doc?.local?.localName}, por validar`;
                speak(text);
                /*
                avisar('Nueva alerta', {
                    body: msm.doc?.title || text,
                    image: msm.doc?.imageToShare,
                    icon: '/ico/icons8-campana-48.png',
                });
                */
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
                /*
                avisar('Inicio de monitoreo', {
                    body: text,
                    icon: '/ico/icons8-campana-48.png',
                });
                */
            }
        };

        const handdlerMonitoringEnd = (msm) => {
            if (isSubscribed) {
                const tipo = monitoringTypeLabel(msm);
                const text = `Fin de Monitoreo${tipo ? ` ${tipo}` : ''} en ${msm?.name ?? 'establecimiento'}`;
                speak(text);
                avisar('Fin de monitoreo', {
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
