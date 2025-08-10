'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useSpeckAlert from '@/hook/useSpeckAlert';
import socket_jarvis from '@/libs/socket/socketIo_jarvis';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import { isMobile } from 'react-device-detect';
import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoices } from '@/store/slices/voice';

import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';
import useNotificationSound from '@/hook/useNotificationSound';

import { showBrowserNotification } from '@/libs/notification_push/native';


export default function AlertLiveJarvis() {

    const { speak, changeVoice, changueVolume, voices } = useSpeckAlert();


    const { play } = useNotificationSound();
    const dispatch = useDispatch();


    const voiceDefinitive = useSelector(store => store.voiceDefinitive);
    const volumeDefinitive = useSelector(store => store.volumeVoiceDefinitive);




    useEffect(() => {   // Handler listener text on audio 
        let isSubscribed = true;

        dispatch(setVoices(voices));


        const handlerMsmSocket = msm => {
            if (isSubscribed) {
                speak(msm.text);
                if (!isMobile) showBrowserNotification('Nueva alerta', { body: msm.text, icon: '/ico/icons8-campana-48.png' });
            }
        };


        const handdlerAlertSocket = (msm) => {
            if (isSubscribed) {
                speak(msm.text);
                if (!isMobile) showBrowserNotification(msm.text, { body: msm.body, icon: msm.profilePic });
            }
        }


        /*
        body
        : 
        "."
        nameChat
        : 
        "Jarvis365"
        profilePic
        : 
        "https://pps.whatsapp.net/v/t61.24694-24/354038018_281930564308868_4429190779667048423_n.jpg?ccb=11-4&oh=01_Q5Aa2QG2GdAmfOvQwAdDIjl-mFEC3-Sn3bbB4WrdYb1Zy0pYtw&oe=68A5DC47&_nc_sid=5e03e0&_nc_cat=110"
        text
        : 
        "¡Atención! el backup, a escrito en el grupo de Jarvis365."
        type
        : 
        "complete" */

        socket_jarvis.on('warning', handlerMsmSocket);
        socket_jarvis.on('alert', handdlerAlertSocket);


        return () => {
            isSubscribed = false;
            socket_jarvis.off('warnin', handlerMsmSocket);
            socket_jarvis.off('alert', handdlerAlertSocket);
        }
    }, [voices]);



    useEffect(() => {
        if (voiceDefinitive) {
            changeVoice(voiceDefinitive, err => {
                console.log(err)
            });
        }
        if (volumeDefinitive) changueVolume(Number(volumeDefinitive));
    }, [voiceDefinitive, volumeDefinitive]);





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
