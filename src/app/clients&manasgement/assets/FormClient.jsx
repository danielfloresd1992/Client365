'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addClient } from '@/store/slices/Client';
import { addNewEstablishment } from '@/store/slices/newEstablishment'
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import useAxios from '@/hook/useAxios';


import clientDefault from './objectDefault/objectDefaultClient';
import useAuthOnServer from '@/hook/auth';
import moment from 'moment-timezone';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';





export default function FormClient({ id = null, action }) {


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const dataFranchise = useSingleFetch({ resource: '/franchise', method: 'get' }, true);
    const listFranchiseState = dataFranchise?.data ?? [];

    const { data: upDateClient, error, fetchData, resetDataFetch, setChangeData } = useSingleFetch({ resource: '/establishment', method: 'get' }, false);
    const [franchiseSelect, setFranchiseSelect] = useState(null);



    const dispatch = useDispatch();
    const { requestAction } = useAxios();
    const listZoneTime = moment.tz.names().map(item => { return { value: item, text: item } });




    useEffect(() => {
        if (id && upDateClient) {
            if (!upDateClient?.DST) {
                setChangeData({
                    ...upDateClient, DST: {
                        isActive: false,
                        TimeZone: 'America/Caracas'
                    }
                });
            }
            const selected = listFranchiseState.filter(item => item._id === upDateClient.idLocal);
            setFranchiseSelect(selected);
        }
        else if (!id && !upDateClient) {
            setChangeData(clientDefault)
        }
    }, [upDateClient]);


    useEffect(() => {

    }, []);


    useEffect(() => {
        if (id && listFranchiseState.length > 1) fetchData({ url: `/local/id=${id}`, autoGetData: true, method: 'get' })
        return () => {
            resetDataFetch();
        }
    }, [listFranchiseState]);




    const onSubmitubmit = useCallback(e => {
        e.preventDefault();

        const clientEditBy = {
            timestamps: {

            }
        };

        const userSubmit = {
            time: new Date(),
            by_user: {
                name: `${user.name} ${user.surName}`,
                id: user._id
            }
        };

        if (!id) {
            clientEditBy.timestamps.createdAt = userSubmit;
        }
        else {
            clientEditBy.timestamps.createdAt = upDateClient.timestamps.createdAt;

            Array.isArray(upDateClient?.timestamps.updatedAt) ?
                clientEditBy.timestamps.updatedAt = [
                    ...upDateClient?.timestamps.updatedAt,
                    userSubmit
                ]
                :
                clientEditBy.timestamps.updatedAt = [userSubmit];
        }
        const bodyRequest = { ...upDateClient, ...clientEditBy };
        delete bodyRequest.img;
        handlerRequest(bodyRequest)
    }, [upDateClient]);




    const handlerRequest = useCallback(async body => {
        try {
            if (!upDateClient._id) {
                const res = await requestAction({ url: `/local`, action: 'post', body: body });

                dispatch(addNewEstablishment(res.data));
                dispatch(addClient(res.data));
                dispatch(
                    setConfigModal({
                        modalOpen: true,
                        title: 'Exito',
                        description: 'Cliente añadido con con exito',
                        isCallback: null,
                        type: 'successfull'
                    })
                );
            }
            else {
                delete body._id;
                const res = await requestAction({ url: `/local/${upDateClient._id}`, action: 'put', body: body });
                resetDataFetch();

                dispatch(addClient(res.data));
                dispatch(
                    setConfigModal({
                        modalOpen: true,
                        title: 'Exito',
                        description: 'Cliente actualizado con exito',
                        isCallback: null,
                        type: 'successfull'
                    })
                );
            }

            dispatch(setTypeForm(null));
        }
        catch (error) {
            console.log(error);
            dispatch(
                setConfigModal({
                    modalOpen: true,
                    title: 'Error',
                    description: 'A ocurrido un error al enviar los datos',
                    isCallback: null,
                    type: 'error'
                })
            );
        }

    }, [upDateClient]);




    const handdlerChangeInputFile = e => {
        console.log(e);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('img', file)
        fetchData({ url: '/multimedia', method: 'post', autoGetData: false, callback: changeImageCallback, body: formData })
    };



    const changeImageCallback = useCallback((response) => {
        setChangeData({
            ...upDateClient,
            image: response.data.url
        });
    }, [upDateClient])



    if (!upDateClient) {
        return <div>Cargando...</div>; // Se muestra mientras los datos se están cargando
    }




    return (
        <form className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap' onSubmit={onSubmitubmit}>
            <h2 className='text_center'>{id ? 'Actualizar datos del cliente' : 'Formulario para el nuevo cliente'}</h2>

            <div className='contentDoubleLabelFlex'>
                <InputBorderBlue
                    textLabel='Franquicia al que pertenece el cliente'
                    type='select'
                    value={upDateClient.idLocal}
                    name='nameFranchise'
                    important={true}
                    childSelect={listFranchiseState.length > 0 ? listFranchiseState.map(data => { return { value: data._id, text: data.name } }) : null}
                    eventChengue={value => {
                        const selected = listFranchiseState.filter(item => item._id === value)[0];
                        setFranchiseSelect(selected[0]);
                        const objectValue = {
                            ...upDateClient,
                            franchiseReference: {
                                name_franchise: selected.name,
                                franchise: selected._id
                            },
                            idLocal: selected._id
                        }
                        selected.name === 'Nacionales' ? objectValue.location = 'confidential' : '';
                        setChangeData(objectValue);
                    }
                    }
                />

                <InputBorderBlue
                    textLabel='Nombre del local'
                    name='nameLocal'
                    value={upDateClient.name}
                    eventChengue={text => setChangeData({ ...upDateClient, name: text })}
                />
            </div>

            <InputBorderBlue
                textLabel='Tipo de monitoreo'
                type='select'
                value={upDateClient.typeMonitoring}
                name='typeMonitoring'
                childSelect={[
                    { value: 'analytical', text: 'Analítico' },
                    { value: 'perimeter', text: 'Perimetral' },
                    { value: 'analytical and perimeter', text: 'Analítico y Perimetral' }
                ]}
                eventChengue={text => setChangeData({ ...upDateClient, typeMonitoring: text })}
            />

            <div
                className='contentDoubleLabelFlex '
            >
                <InputBorderBlue
                    textLabel='Orden de aplilamiento'
                    type='number'
                    value={String(upDateClient.order)}
                    name='order'
                    eventChengue={text => setChangeData({ ...upDateClient, order: Number(text) })}
                />

                <InputBorderBlue
                    textLabel='Selecione un idioma'
                    type='select'
                    value={upDateClient.lang}
                    name='lang'
                    childSelect={[
                        { value: 'es', text: 'Castellano' },
                        { value: 'en', text: 'Ingles' },
                    ]}
                    eventChengue={text => setChangeData({ ...upDateClient, lang: text })}
                />
            </div>

            <InputBorderBlue
                textLabel='Ubicación del establecimiento'
                name='location'
                important={false}
                value={upDateClient.franchiseReference?.name_franchise === 'Nacionales' ? 'Confidencial' : upDateClient.location}
                disable={upDateClient.franchiseReference?.name_franchise === 'Nacionales' ? true : false}
                eventChengue={text => setChangeData({ ...upDateClient, location: text })}
            />

            <hr />
            <h3>Configuración de managers por defecto</h3>

            <div className='contentDoubleLabelFlex'>
                <InputBorderBlue
                    textLabel='Cantidad de gerentes en el local'
                    name='totalManager'
                    value={upDateClient ? String(upDateClient?.touchs?.totalManager) : null}
                    type='number'
                    eventChengue={text => {
                        setChangeData({
                            ...upDateClient,
                            touchs: {
                                ...upDateClient.touchs,
                                totalManager: Number(text)
                            }
                        })
                    }}
                />
                <InputBorderBlue
                    textLabel='Cantidad de asistentes en el local'
                    name='totalAttendee'
                    value={upDateClient ? String(upDateClient.touchs?.totalAttendee) : null}
                    type='number'
                    eventChengue={text => {
                        setChangeData({
                            ...upDateClient,
                            touchs: {
                                ...upDateClient.touchs,
                                totalAttendee: Number(text)
                            }
                        })
                    }}
                />
            </div>

            <InputBorderBlue
                textLabel='Tipo de evaluación'
                name='typeEvaluationTouch'
                value={upDateClient ? upDateClient?.touchs?.typeEvaluationTouch : null}
                type='select'
                childSelect={[
                    { value: 'completo', text: 'completo' },
                    { value: 'simple', text: 'simple' },
                ]}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        touchs: {
                            ...upDateClient.touchs,
                            typeEvaluationTouch: Boolean(text)
                        }
                    })
                }}
            />


            <InputBorderBlue
                textLabel='¿Evaluación de toques?'
                name='isRequiredeEvaluation'
                value={upDateClient ? upDateClient.touchs.isRequiredeEvaluation : null}
                type='checkbox'
                important={false}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        touchs: {
                            ...upDateClient.touchs,
                            isRequiredeEvaluation: Boolean(text)
                        }
                    });
                }}
            />

            <InputBorderBlue
                textLabel='¿Grupal a la franquicia o individual?'
                name='isEvaluationGroup'
                value={upDateClient ? upDateClient.touchs.isEvaluationGroup : null}
                type='checkbox'
                important={false}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        touchs: {
                            ...upDateClient.touchs,
                            isEvaluationGroup: Boolean(text)
                        }
                    });
                }}
            />

            <hr />
            <h3>Definas los platillo por defecto</h3>

            <div className='contentDoubleLabelFlex'>
                <InputBorderBlue
                    textLabel='Nombre del platillo de entrada'
                    name='appetizer'
                    value={upDateClient ? upDateClient.dishMenu.appetizer : null}
                    important={true}
                    eventChengue={text => {
                        setChangeData({
                            ...upDateClient,
                            dishMenu: {
                                ...upDateClient.dishMenu,
                                appetizer: text
                            }
                        })
                    }}
                />
                <InputBorderBlue
                    textLabel='Nombre del platillo de plato fuerte'
                    name='mainDish'
                    value={upDateClient ? upDateClient.dishMenu.mainDish : null}
                    important={true}
                    eventChengue={text => {
                        setChangeData({
                            ...upDateClient,
                            dishMenu: {
                                ...upDateClient.dishMenu,
                                mainDish: text
                            }
                        });
                    }}
                />
            </div>

            <InputBorderBlue
                textLabel='Nombre del platillo de postre'
                name='dessert'
                value={upDateClient ? upDateClient.dishMenu.dessert : null}
                important={true}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        dishMenu: {
                            ...upDateClient.dishMenu,
                            dessert: text
                        }
                    });
                }}
            />

            <InputBorderBlue
                textLabel='Tipo de evaluación de procesos'
                name='typeEvaluationDish'
                value={upDateClient ? upDateClient.dishMenu.dishEvaluation : null}
                type='select'
                childSelect={[
                    { value: 'completo', text: 'completo' },
                    { value: 'simple', text: 'simple' },
                ]}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        dishMenu: {
                            ...upDateClient.dishMenu,
                            dishEvaluation: Boolean(text)
                        }
                    });
                }}
            />


            <InputBorderBlue
                textLabel='¿Requiere evaluación?'
                name='isRequiredeEvaluationDish'
                value={upDateClient ? upDateClient.dishMenu.isRequiredeEvaluation : null}
                type='checkbox'
                important={false}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        dishMenu: {
                            ...upDateClient.dishMenu,
                            isRequiredeEvaluation: Boolean(text)
                        }
                    });
                }}
            />
            <InputBorderBlue
                textLabel='¿Grupal a la franquicia o individual?'
                name='isEvaluationGroupDish'
                value={upDateClient ? upDateClient.dishMenu.isEvaluationGroup : null}
                type='checkbox'
                important={false}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        dishMenu: {
                            ...upDateClient.dishMenu,
                            isEvaluationGroup: Boolean(text)
                        }
                    });
                }}
            />



            <InputBorderBlue
                textLabel='Estatus del monitoreo'
                name='status'
                value={upDateClient ? upDateClient.status : null}
                type='select'
                childSelect={[
                    { value: 'activo', text: 'activo' },
                    { value: 'inactivo', text: 'inactivo' },
                ]}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        status: text
                    });
                }}
            />
            <hr />

            <InputBorderBlue
                textLabel='Zona horaria'
                type='select'
                value={upDateClient ? upDateClient.DST?.TimeZone : 'America/Caracas'}
                childSelect={listZoneTime}
                eventChengue={text => {
                    setChangeData({
                        ...upDateClient,
                        DST: {
                            ...upDateClient.DST,
                            TimeZone: text
                        }
                    });
                }}
            />

            <InputBorderBlue
                textLabel='¿Requiere activación de horario de invierno?'

                type='checkbox'
                important={false}
                eventChengue={value => {
                    setChangeData({
                        ...upDateClient,
                        DST: {
                            ...upDateClient.DST,
                            isActive: value
                        }
                    });
                }}
            />
            {
                upDateClient.DST ?
                    <div className='w-full flex justify-center items-center '>
                        <p>Zona horaria: <span className='text-red-500'>{moment().tz(upDateClient.DST.TimeZone).format('YYYY-MM-DD HH:mm:ss')}</span></p>
                    </div>
                    :
                    null
            }
            <br />

            <InputBorderBlue
                textLabel='Longitud para el menú de la alerta en vivo para el cliente'
                type='select'
                value={upDateClient.alertLength}
                childSelect={[
                    { value: 'simplified', text: 'menú simplificado' },
                    { value: 'extended', text: 'menú extendido' }
                ]}
                eventChengue={text => {
                    setChangeData({ ...upDateClient, alertLength: text });
                }}
            />

            <div className='w-full flex justify-center items-center flex flex-col'>
                {
                    upDateClient.image === 'https://72.68.60.201:3006/local/image=default.jpg'
                        || upDateClient.image === 'https://72.68.60.119:443/local/image=default.jpg'
                        || upDateClient.image === 'https://72.68.60.120:443/local/image=default.jpg' ?
                        null
                        :
                        <div className='w-[400ox]'>
                            <img className='w-[400px] h-[400px]' src={upDateClient.image ?? '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'} alt='ico-logo' />
                        </div>
                }

                <input
                    onChange={handdlerChangeInputFile}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                />
            </div>

            <br />
            <button
                className='btn-item'
                disabled={id && !upDateClient}
            >
                {upDateClient ? 'Actualizar' : 'Guardar'}
            </button>
        </form>
    );
}