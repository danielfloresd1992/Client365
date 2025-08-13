'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useSpeckAlert from '@/hook/useSpeckAlert';
import socket_jarvis from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import { isMobile } from 'react-device-detect';
import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoices } from '@/store/slices/voice';

import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';
import useNotificationSound from '@/hook/useNotificationSound';

import { showBrowserNotification } from '@/libs/notification_push/native';



export default function AlertLiveJarvis() {

    const { speak, voice_definitive } = useSpeckAlert();

    const { play } = useNotificationSound();



    useEffect(() => {   // Handler listener text on audio 
        let isSubscribed = true;


        const handlerMsmSocket = msm => {
            if (isSubscribed) {
                speak(msm.text);
                //    if (!isMobile) showBrowserNotification('Nueva alerta', { body: msm.text, icon: '/ico/icons8-campana-48.png' });
            }
        };


        const handdlerAlertSocket = (msm) => {
            if (isSubscribed) {
                speak(msm.text);
                if (!isMobile) showBrowserNotification(msm.text, { body: msm.body, icon: msm.profilePic });
            }
        };

        const handdlerCreateSocket = (msm) => {
            if (isSubscribed) {
                speak(`Nueva alerta en ${msm.doc?.local?.name}`);
                showBrowserNotification('Nueva alerta', {
                    image: msm.doc.imageToShare,
                    body: msm.doc.title, icon: '/ico/icons8-campana-48.png'
                });
            }
        };

        const handdlerPutSocket = (msm) => {
            if (isSubscribed) {
                console.log(msm);
            }
        };


        socket_jarvis.on('warning', handlerMsmSocket);
        socket_jarvis.on('alert', handdlerAlertSocket);
        socket.on('document_created', handdlerCreateSocket);
        socket.on('document_updated', handdlerPutSocket);


        return () => {
            isSubscribed = false;
            socket_jarvis.off('warnin', handlerMsmSocket);
            socket_jarvis.off('alert', handdlerAlertSocket);
            socket.off('document_created', handdlerCreateSocket);
            socket.off('document_updated', handdlerPutSocket);
        }
    }, [voice_definitive]);






    useEffect(() => {
        let isMount = true;
        let loopEvent;
        let greetBoolean = true;

        if (isMount && typeof isDaylightSavingTimeState === 'boolean' && isAdmin) {   // event loop List
            loopEvent = setInterval(() => {

                let date = new Date();

                if (false) {
                    if (date.getHours() > 5 && date.getHours() < 12) {
                        speak('buenos dias, reportes de alertas activo');
                    }
                    else if (date.getHours() >= 12 && date.getHours() < 17) {
                        speak('buenos tardes, reportes de alertas activo');
                    }
                    else {
                        speak('buenos noches, reportes de alertas activo');
                    }
                    greetBoolean = false;
                }

                //   fallas de conexiones con drv
                if ((date.getMinutes() === 2 && date.getSeconds() === 0)) {
                    //socketAppManager.emit('from-failed-connection', undefined);
                }

                /*
                                if((date.getHours() === 12 && date.getMinutes() === 0 && date.getSeconds() === 0) || date.getHours() === 17  && date.getMinutes() === 0 && date.getSeconds() === 0){
                                    play('tree_tone')
                                        .then((result) => {
                                            console.log(result);
                                            speak(`Realizar verificación para confirmar a los gerentes en los Franciscas`);
                                            speak(`repito, Realizar verificación para confirmar a los gerentes en los Franciscas`);
                                        })
                                   
                                }
                                
                                */

                if ((date.getMinutes() === 15 || date.getMinutes() === 30 || date.getMinutes() === 45) && date.getSeconds() === 0) {
                    //   speak('Recordatorio, llevar el seguimiento de terraza en Francisca Doral');
                }

                if (date.getHours() === 23 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                    speak('Atención, realizar perimetral de avila, mochima, macarao, ráko, y canaima.');
                }



                if (date.getHours() >= 11 && date.getHours() <= 23) {

                    if (date.getMinutes() === 55 && date.getSeconds() === 0) {
                        //speak('Atención, recordatorio, para realizar el corte por hora.');
                    }


                    //CREACION DE LA IMAGEN Y ENVIO DE IMAGEN CADA 30 MINUTOS
                    if ((date.getMinutes() === 1 && date.getSeconds() === 0) || (date.getMinutes() === 31 && date.getSeconds() === 0)) {
                        getReportAlertAndSend();
                    }
                }

                //falla de conexión con dvr cada 30 min
                if ((date.getMinutes() === 0 && date.getSeconds() === 0) || (date.getMinutes() === 30 && date.getSeconds() === 0)) {
                    //getDateFailedDrv();
                }

                // CREACIÓN DEL REGISTRO DIURNO AUTOMATICO
                if (date.getHours() === 0 && date.getMinutes() === 3 && date.getSeconds() === 0 && isAdmin) {
                    createNewReportRequest((result, error) => {
                        console.log(error);
                        if (error === 409) {
                        }
                        else {
                            loadData(result, true);
                        }
                    });
                }

                // CREACIÓN DEL REGISTRO NOCTURNO AUTOMATICO
                if (date.getHours() === (isDaylightSavingTimeState ? 18 : 17) && date.getMinutes() === 3 && date.getSeconds() === 0 && isAdmin) {
                    createNewReportRequest((result, error) => {
                        console.log(error);
                        if (error === 409) {
                        }
                        else {
                            loadData(result, true);
                        }
                    });
                }
            }, 1000);
        };

    }, []);


    return null;


}
