'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { setConfigModal } from '@/store/slices/globalModal'; 
import BannerContain from './BannerConaint';
import IP from '@/libs/dataFecth';
import axiosStand from '@/libs/axios.fetch';
import WindowFormLayaut from '@/layaut/windowForForm';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import LoandingData from '@/components/loandingComponent/loanding';
import { ScheduleBox } from  '@/components/box/ScheduleBox';
import useAuthOnServer from '@/hook/auth';




export default function Layautbody(){


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const selectEstablishment = useSelector(state => state.clients);

    const searchParams = useSearchParams()
    const id = searchParams.get('id');
    const [ configLocalDate, setConfigLocalDate ] = useState(null);
    const [ openFormBoolean, setOpenForm ] = useState(false);
    const [ openCloneWIndowBooleanState , setOpenCloneWIndowBooleanState ] = useState(false);
    const dispatch = useDispatch();
    const dayRef = useRef(null);


    
    useEffect(()=> {
        axiosStand.get(`https://${IP}/schedule/idLocal=${id}`)
            .then(response => {
                console.log(response);
                if(response.status === 200) {
                    setConfigLocalDate(response.data[0]);
                }
            })
            .catch(err => {
                if(err.response?.status === 404){
                    dispatch(setConfigModal({
                        title: 'Aviso',
                        description: 'No existe un horario para este local ¿Desea crear una configuración para el?',
                        type: 'warning',
                        modalOpen: true,
                        isCallback: () => {
                            
                            const newConfig = {
                                idLocal: id,
                                dayMonitoring: []
                            }
                            axiosStand.post(`https://${IP}/schedule`, newConfig)
                                .then(response => {
                                    if(response.status === 200){
                                        setConfigLocalDate({
                                            idLocal: id,
                                            dayMonitoring: []
                                        });
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                   
                                });
                        }
                    })) ;
                }
            });
    }, []);

    
    const validateAuthorization = useCallback(callback => {
        if(!user.admin){
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tienes autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else{
            callback();
        }
    }, [ dataSessionState ]);


    const openFormWindow =  paramsDay => {
        setOpenForm(true);
        dayRef.current = paramsDay;
    };



    const closeFormWindow = () => {
        setOpenForm(false);
        dayRef.current = null;
    };

    
    const openWindowClone = () => {
        dispatch(setConfigModal({
            title: 'Aviso',
            description: '¿Desea clonar un horario ya existente en otro?',
            type: 'warning',
            modalOpen: true,
            isCallback: () => {
                setOpenCloneWIndowBooleanState(true);
            }
        }))
    };


    const closeWindowClone = () => {
        setOpenCloneWIndowBooleanState(false);
    };


    const deleteHourForDay = keyDay => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title: 'Aviso',
                description: '¿Seguro de eliminar este rango?',
                type: 'warning',
                modalOpen: true,
                isCallback: () => {
                    const newArray = configLocalDate.dayMonitoring.filter(time => time.key !== keyDay);
                    const putObject = { ...configLocalDate, dayMonitoring: [ ...newArray ] };
                  
                    axiosStand.put(`https://${IP}/schedule/idLocal=${ id }`, putObject )
                        .then(response => {
                            console.log(response);
                            if(response.status === 200){
                                setConfigLocalDate(putObject);
                            }
                        })
                        .catch(err => {
                            if(err?.response?.status === 404) console.log(err);
                            console.log(err);
                        });
                }
            }));
        });
    };



    const pushDateDay = configDay => {
        validateAuthorization(() => {
            const putObject = { ...configLocalDate, dayMonitoring: [ ...configLocalDate.dayMonitoring, configDay ] };;
        
            axiosStand.put(`https://${ IP }/schedule/idLocal=${ id }`, putObject )
                .then(response => {
                    if(response.status === 200){
                        setConfigLocalDate({ ...configLocalDate, dayMonitoring: [ ...configLocalDate.dayMonitoring, configDay ] });;
                        console.log(configLocalDate);
                        closeFormWindow();
                    }
                })
                .catch(err => {
                    if(err?.response?.status === 404) console.log(err);
                    console.log(err);
                });
        });
    };

    

    const cloneScheduleOfEstablishment = idClone => {
        validateAuthorization(() => {
            axiosStand.get(`https://${IP}/schedule/idLocal=${idClone}`)
                .then(response => {
                
                    const cloneObject = { ...configLocalDate, dayMonitoring: response.data[0].dayMonitoring };
                
                    axiosStand.put(`https://${ IP }/schedule/idLocal=${ id }`, cloneObject )
                        .then(res => {
                            console.log(res);
                            if(res.status === 200){
                                setConfigLocalDate(cloneObject);
                                closeFormWindow();
                                dispatch(setConfigModal({
                                    title: 'successful',
                                    description: 'El horarioha sido clonado ',
                                    type: 'successfull',
                                    modalOpen: true,
                                    isCallback: null
                                }));
                            }
                        })
                        .catch(err => {
                            if(err?.response?.status === 404) console.log(err);
                            console.log(err);
                        })
                        .finally(() => {
                            closeWindowClone();
                        });
                })
                .catch(err => {
                    if(err.response.status === 404){
                        closeWindowClone();
                        dispatch(setConfigModal({
                            title: 'Error',
                            description: 'No existe horario para clonar en  dicho establecimiento',
                            type: 'error',
                            modalOpen: true,
                            isCallback: null
                        }));
                    }
                    else{
                        console.log(err);
                    }
                });
        });
    };


    const resetDefault = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title: 'Aviso',
                description: '¿Seguro de resetear el horario?',
                type: 'warning',
                modalOpen: true,
                isCallback: () => {
                    const cloneObject = { ...configLocalDate, dayMonitoring: [] };
                
                    axiosStand.put(`https://${ IP }/schedule/idLocal=${ id }`, cloneObject )
                        .then(res => {
                            console.log(res);
                            if(res.status === 200){
                                setConfigLocalDate(cloneObject);
                                closeFormWindow();
                                dispatch(setConfigModal({
                                    title: 'successful',
                                    description: 'El horarioha sido reseteado',
                                    type: 'successfull',
                                    modalOpen: true,
                                    isCallback: null
                                }));
                            }
                        })
                        .catch(err => {
                            if(err?.response?.status === 404) console.log(err);
                            console.log(err);
                        })
                        .finally(() => {
                            closeWindowClone();
                        });
                }
            }));
        });
    };
    


    return(
        <>
            <BannerContain openClone={ openWindowClone } reset={ resetDefault } establishment={ selectEstablishment.filter(item => item._id === id)[0] } />

            {
                configLocalDate ? 
                    (
                        <ScheduleBox 
                            idLocal={ id } 
                            configLocalDate={ configLocalDate.dayMonitoring } 
                            openSetForm={ openFormWindow } 
                            deleteHour={ deleteHourForDay } 
                            addDataRequest={ data => { pushDateDay(data) }}
                        />
                    )
                    :
                    (
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>

                            <LoandingData title='Cargando horario'/>
                        </div>
                    )
            }
                
           

            {   
                openCloneWIndowBooleanState ?
                    <WindowFormLayaut close={ closeWindowClone } >
                        <form style={{ width: '50%', padding: '2rem 1rem' }} className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap'>
                            <h2>Listas de horarios segun locales</h2>
                            <InputBorderBlue 
                                textLabel='Seleciones un establecimiento'
                                type='select'
                                childSelect={ 
                                    selectEstablishment.map(item => {
                                        return { value: item._id, text: item.name }
                                    })
                                }
                                eventChengue={value => {
                                    cloneScheduleOfEstablishment(value);
                                }}
                            />
                        </form>

                    </WindowFormLayaut>
                :
                    null
            }
        </>
    );
}