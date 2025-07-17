'use client';
import { useState, useEffect, useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import axiosStand from '@/libs/axios.fetch';
import getScheduleRequest from '@/libs/ajaxServer/getScheduleRequest';
import getRportLiveRequest from '@/libs/ajaxServer/getRportLiveRequest';
import socket from '@/libs/socketIo'; //app manager core
import socket_jarvis from '@/libs/socketIo_jarvis';
import IP from '@/libs/ajaxClient/dataFecth';
import BoxClientInputs from "./BoxClientInputs";
import LoandingData from '@/components/loandingComponent/loanding';
import ContainerToCreateImages from '../ContainerToCreateImages';
import { useSelector, useDispatch } from 'react-redux';
import useSpeckAlert from '@/hook/useSpeckAlert';
import { addReportForArr } from '@/store/slices/alertLiveStore';
import { setDateReport } from '@/store/slices/alertLiveDateStore';
import { setReportForImg } from '@/store/slices/alertLiveStoreForImg';
import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';
import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoices } from '@/store/slices/voice';
import { setConfigModal } from '@/store/slices/globalModal';
import { setChangueStateIsAdmin } from '@/store/slices/boolean_admin_session';
import AppManagerConfigStorange from '@/libs/app_manager_config_DB';
import sendTextJarvis from '@/libs/sendMsmJarvis';
import getFiledDvrRequest from '@/libs/getFailedDvrRequest';
import GROUP_KEY from '@/libs/API_JARVIS';
import useNotificationSound from '@/hook/useNotificationSound';
import { getLightEstablishment } from '@/libs/ajaxClient/establishmentFetching';


export default function ContainForm() {

    const { speak, changeVoice, changueVolume, voices } = useSpeckAlert();
    const { play } = useNotificationSound();
    const dispatch = useDispatch();


    const [failedState, setFailedState] = useState([]);
    const [scheduleState, setSchedule] = useState([]);
    const clientState = useSelector(state => state.clients);
    const isAdmin = useSelector(state => state.isAdminSession);

    const isDaylightSavingTimeState = useSelector(state => state.isDaylightSavingTime);
    const voiceDefinitive = useSelector(store => store.voiceDefinitive);
    const volumeDefinitive = useSelector(store => store.volumeVoiceDefinitive);


    useEffect(() => {


        const voiceStorange = AppManagerConfigStorange.get('voice_definitive');
        const volume = AppManagerConfigStorange.get('voice_volume');
        const isAdmin = AppManagerConfigStorange.get('admin_session');
        volume ? dispatch(setVoiceVolumeDefinitive(volume)) : dispatch(setVoiceVolumeDefinitive(1));
        if (voiceStorange) dispatch(setVoicesDefinitive(voiceStorange));
        isAdmin ? dispatch(setChangueStateIsAdmin(isAdmin)) : dispatch(setChangueStateIsAdmin(false));


        getFiledDvrRequest()
            .then(data => {
                setFailedState(state => state = data);
            })
            .catch(err => {
                console.log(err);
            });

        getScheduleRequest()
            .then(data => {
                setSchedule(state => state = data);
            })
            .catch(err => {
                console.log(err);
            });


        return () => {
        };
    }, []);



    useEffect(() => {
        if (voiceDefinitive) {
            changeVoice(voiceDefinitive, err => {
                console.log(err)
            });
        }
        if (volumeDefinitive) changueVolume(Number(volumeDefinitive));
    }, [voiceDefinitive, volumeDefinitive]);


    useEffect(() => {   // Handler listener text on audio 
        let isSubscribed = true;

        dispatch(setVoices(voices));

        const handlerMsmSocket = msm => {

            if (!isMobile && isSubscribed) {
                if (msm.type === 'complete') {
                    play('tree_tone', () => {
                        speak(msm.text);
                    });
                }
                else if (msm.type === 'simple') {
                    play('one_tone', () => {
                        speak(msm.text);
                    });
                }
                else {
                    speak(msm.text);
                }
            }
        }
        socket_jarvis.on('warning', handlerMsmSocket);

        return () => {
            isSubscribed = false;
            socket_jarvis.off('warnin', handlerMsmSocket);
        }
    }, [voices]);



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



        const receiveErrorConnectionEstablishment = msm => {
            if (isMount) {
                setFailedState(state => state = [...state, msm]);
                sendTextJarvisFailed(msm);
            };
            const receiveErrorConnectionEstablishmentDelete = msm => {
                if (isMount) {
                    const result = failedState.filter(item => msm.idLocal !== item.idLocal);
                    setFailedState(result);
                }
            }
            socket.on('failed-connection', receiveErrorConnectionEstablishment);
            socket.on('failed-connection-deleteItem', receiveErrorConnectionEstablishmentDelete);

            return () => {
                socket.off('failed-connection', receiveErrorConnectionEstablishment);
                socket.off('failed-connection-deleteItem', receiveErrorConnectionEstablishmentDelete);
                isMount = false;
                clearInterval(loopEvent);
            }
        }
    }, [isDaylightSavingTimeState, failedState]);



    useEffect(() => {
        if (typeof isDaylightSavingTimeState === 'boolean' && clientState.length > 0) {
            getReportRequest((data, err) => {
                if (err === 404 && isAdmin) {
                    createNewReportRequest((result, error) => {
                        if (error === 409) {
                        }
                        else {
                            loadData(result, true);
                        }
                    });
                }
                else {
                    loadData(data);
                }
            });
        }
    }, [isDaylightSavingTimeState, clientState]);



    const getReportRequest = (callback) => {
        axiosStand.get(`https://${IP}/alertNoveltie/recordsLive?date=${getDateNow()}&shift=${getShift()}`)
            .then(response => {
                if (response.status === 200) {
                    callback(response.data);
                }
            })
            .catch(err => {
                if (err.response) callback(null, err.response.status);
            });
    };




    const sendTextJarvisFailed = (msm) => {
        sendTextJarvis(`*${msm.localName}*\nFalla de conexión con dvr\n@584126042988`, GROUP_KEY, true, '+584126042988'.substring(1) + '@c.us', msm.buffer_img)
            .then(response => {
                console.log(response);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                sendTextJarvis(`@584267371177`, GROUP_KEY, true, '+584267371177'.substring(1) + '@c.us')
                speak(`Atención, protocolo de seguimiento en ${msm.localName}, falla de conexión con deve erre`);
            });
    };



    const createNewReportRequest = useCallback(async callback => {
        const listOrderClient = [...clientState].sort((x, y) => {
            return x.order - y.order;
        });
        if (listOrderClient.length < 1) {
            getLightEstablishment({ all: null }, (error, data) => {
                if (error) throw console.log(error);
                console.log(data);
                const listOrderClient = data.sort((x, y) => {
                    return x.order - y.order;
                });

                fetchingNewReportRequest(listOrderClient, callback)
            })
        }
        else {
            fetchingNewReportRequest(listOrderClient, callback)
        }
    }, [clientState]);







    const fetchingNewReportRequest = useCallback((listOrderClient, callback) => {

        const newData = listOrderClient.map(stablishment => {
            return {
                establishment: {
                    _id: stablishment._id,
                    name: stablishment.name
                },
                alert: 0,
                line: AppManagerConfigStorange.get(`${stablishment.name}`),
                important: 0,
                failed: false,
                monitoring: null
            }
        });

        const goalFDay = AppManagerConfigStorange.get(`goalAlert-${new Date().getDay()}-${getShift()}`) ? `&goalDay=${AppManagerConfigStorange.get(`goalAlert-${new Date().getDay()}-${getShift()}`)}` : '';

        axiosStand.post(`https://${IP}/alertNoveltie/recordsLive?date=${getDateNow()}&shift=${getShift()}${goalFDay}`, newData)
            .then(res => {
                if (res.status === 200) {
                    callback(res.data);
                }
            })
            .catch(err => {
                console.log(err);
                if (err.response) callback(null, err.response.status);
            });
    }, []);





    const loadData = (data, isNew = false) => {
        if (data) {
            dispatch(addReportForArr(data.data));
            dispatch(setDateReport({ shift: data.shift, date: data.createdAt, goalDay: data.goalDay }));
            if (isNew) {
                dispatch(setConfigModal({
                    type: 'successfull',
                    title: '¡Registro creado!',
                    description: `Se ha generado el registro: ${data.createdAt} ${data.shift}`,
                    callback: null,
                    modalOpen: true
                }));
            }
        }
    };


    const getShift = () => {
        return (new Date().getHours() > (isDaylightSavingTimeState ? 17 : 16)) ? 'nocturno' : 'diurno';
    };


    const getDateNow = () => {
        return new Date(Date.now()).toLocaleDateString();
    };


    const handlerSpeack = text => {
        speak(text)
    };


    const getReportAlertAndSend = () => {
        getRportLiveRequest()
            .then(response => {
                dispatch(setReportForImg(response.data));
            })
            .catch(err => {
                console.log(err);
            });
    };


    const getDateFailedDrv = () => {
        axiosStand.get(`https://${IP}/failed/all`)
            .then(response => {
                if (response.status === 200) {
                    if (response.data < 1) return;
                    speak(`Atención, protocolo de seguimiento de falla`);
                    response.data.forEach(item => {
                        speak(`Confirmar si el DVR DE ${item.localName}, siguen estado offline o desconectado`);
                        sendTextJarvis(`*${item.localName}*\nContinua la falla de conexión con dvr\n@584267371177`, GROUP_KEY, true, '+@584267371177'.substring(1) + '@c.us', item.buffer_img)
                            .then(response => {
                                console.log(response);
                            })
                            .catch(err => {
                                console.log(err);
                            })
                            .finally(() => {
                                sendTextJarvis(`@584126042988`, GROUP_KEY, true, '+584126042988'.substring(1) + '@c.us');
                                sendTextJarvis(`@584267371177`, GROUP_KEY, true, '+584267371177'.substring(1) + '@c.us');
                            });
                    });
                }
            })
            .catch(err => {
                console.log(err);
            });
    };



    return (
        <>
            <form className='scrolltheme1' style={{ backgroundColor: '#fff', height: 'calc(100% - 30px)', display: 'relative', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
                {
                    clientState.length > 0 && typeof isDaylightSavingTimeState === 'boolean' && scheduleState.length > 0 ?
                        (
                            clientState.map((item, index) => (
                                <BoxClientInputs
                                    dataEstablishment={item}
                                    key={index}
                                    dataForRequest={{ shift: getShift(), date: getDateNow() }}
                                    isFailed={failedState}
                                    schedule={scheduleState.filter(schedule => schedule.idLocal === item._id)}
                                    setSpeack={handlerSpeack}
                                />
                            ))
                        )
                        :
                        (
                            <LoandingData title='Cargando el reporte de alertas' />
                        )
                }
            </form>

            <ContainerToCreateImages schedule={scheduleState} />
        </>
    );
}