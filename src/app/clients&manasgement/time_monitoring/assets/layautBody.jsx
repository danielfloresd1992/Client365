'use client';
/**
 * layautBody.jsx — /clients&manasgement/time_monitoring
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestión del horario de monitoreo de un establecimiento.
 *
 *   <BannerContain>  → aside con acciones (resetear / clonar)
 *   <ScheduleBox>    → rangos horarios por día (agregar / eliminar)
 *   <WindowFormLayaut> → modal para clonar el horario de otro establecimiento
 *
 * El horario (`configLocalDate`) se carga al montar; si no existe (404) se
 * ofrece crear una configuración vacía.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector }                 from 'react-redux';
import { useSearchParams }                          from 'next/navigation';

import { setConfigModal } from '@/store/slices/globalModal';
import axiosStand         from '@/libs/ajaxClient/axios.fetch';
import WindowFormLayaut   from '@/layaut/windowForForm';
import InputBorderBlue    from '@/components/inpust/InputBorderBlue';
import LoandingData       from '@/components/loandingComponent/loanding';
import { ScheduleBox }    from '@/components/box/ScheduleBox';
import useAuthOnServer    from '@/hook/auth';
import BannerContain      from './BannerConaint';


export default function Layautbody() {

    /* ── Auth y helpers ────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user                 = dataSessionState?.dataSession;

    const dispatch          = useDispatch();
    const searchParams      = useSearchParams();
    const id                = searchParams.get('id');
    const selectEstablishment = useSelector(state => state.clients);

    /* ── Estado ────────────────────────────────────────────────────────────── */
    const [configLocalDate, setConfigLocalDate] = useState(null);
    const [showForm,        setShowForm]        = useState(false);
    const [showCloneWindow, setShowCloneWindow] = useState(false);
    const dayRef = useRef(null);


    /* ── Carga del horario al montar (crea uno vacío si no existe) ─────────── */
    useEffect(() => {
        axiosStand.get(`/schedule/idLocal=${id}`)
            .then(response => {
                if (response.status === 200) setConfigLocalDate(response.data[0]);
            })
            .catch(err => {
                if (err.response?.status !== 404) return;
                dispatch(setConfigModal({
                    title:      'Aviso',
                    description:'No existe un horario para este local ¿Desea crear una configuración para el?',
                    type:       'warning',
                    modalOpen:  true,
                    isCallback: () => {
                        const newConfig = { idLocal: id, dayMonitoring: [] };
                        axiosStand.post(`/schedule`, newConfig)
                            .then(response => {
                                if (response.status === 200) {
                                    setConfigLocalDate({ idLocal: id, dayMonitoring: [] });
                                }
                            })
                            .catch(err => console.error(err));
                    },
                }));
            });
    }, []);


    /* ── Autorización: solo admins ejecutan acciones de escritura ──────────── */
    const validateAuthorization = useCallback(callback => {
        if (!user.admin) {
            dispatch(setConfigModal({
                title:      'Error',
                description:'No tienes autorización para ejecutar esta función',
                type:       'error',
                modalOpen:  true,
                isCallback: null,
            }));
        } else {
            callback();
        }
    }, [dataSessionState]);


    /* ── Modal de rango horario (lo gestiona ScheduleBox) ──────────────────── */
    const openFormWindow = paramsDay => {
        setShowForm(true);
        dayRef.current = paramsDay;
    };

    const closeFormWindow = () => {
        setShowForm(false);
        dayRef.current = null;
    };


    /* ── Modal de clonado de horario ───────────────────────────────────────── */
    const openWindowClone = () => {
        dispatch(setConfigModal({
            title:      'Aviso',
            description:'¿Desea clonar un horario ya existente en otro?',
            type:       'warning',
            modalOpen:  true,
            isCallback: () => setShowCloneWindow(true),
        }));
    };

    const closeWindowClone = () => setShowCloneWindow(false);


    /* ── Eliminar un rango horario de un día ───────────────────────────────── */
    const deleteHourForDay = keyDay => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title:      'Aviso',
                description:'¿Seguro de eliminar este rango?',
                type:       'warning',
                modalOpen:  true,
                isCallback: () => {
                    const dayMonitoring = configLocalDate.dayMonitoring.filter(time => time.key !== keyDay);
                    const putObject     = { ...configLocalDate, dayMonitoring };

                    axiosStand.put(`/schedule/idLocal=${id}`, putObject)
                        .then(response => { if (response.status === 200) setConfigLocalDate(putObject); })
                        .catch(err => console.error(err));
                },
            }));
        });
    };


    /* ── Añadir un rango horario ───────────────────────────────────────────── */
    const pushDateDay = configDay => {
        validateAuthorization(() => {
            const putObject = { ...configLocalDate, dayMonitoring: [...configLocalDate.dayMonitoring, configDay] };

            axiosStand.put(`/schedule/idLocal=${id}`, putObject)
                .then(response => {
                    if (response.status === 200) {
                        setConfigLocalDate(putObject);
                        closeFormWindow();
                    }
                })
                .catch(err => console.error(err));
        });
    };


    /* ── Clonar el horario de otro establecimiento ─────────────────────────── */
    const cloneScheduleOfEstablishment = idClone => {
        validateAuthorization(() => {
            axiosStand.get(`/schedule/idLocal=${idClone}`)
                .then(response => {
                    const cloneObject = { ...configLocalDate, dayMonitoring: response.data[0].dayMonitoring };

                    axiosStand.put(`/schedule/idLocal=${id}`, cloneObject)
                        .then(res => {
                            if (res.status === 200) {
                                setConfigLocalDate(cloneObject);
                                closeFormWindow();
                                dispatch(setConfigModal({
                                    title:      'successful',
                                    description:'El horarioha sido clonado ',
                                    type:       'successfull',
                                    modalOpen:  true,
                                    isCallback: null,
                                }));
                            }
                        })
                        .catch(err => console.error(err))
                        .finally(() => closeWindowClone());
                })
                .catch(err => {
                    if (err.response.status === 404) {
                        closeWindowClone();
                        dispatch(setConfigModal({
                            title:      'Error',
                            description:'No existe horario para clonar en  dicho establecimiento',
                            type:       'error',
                            modalOpen:  true,
                            isCallback: null,
                        }));
                    } else {
                        console.error(err);
                    }
                });
        });
    };


    /* ── Resetear el horario ───────────────────────────────────────────────── */
    const resetDefault = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title:      'Aviso',
                description:'¿Seguro de resetear el horario?',
                type:       'warning',
                modalOpen:  true,
                isCallback: () => {
                    const cloneObject = { ...configLocalDate, dayMonitoring: [] };

                    axiosStand.put(`/schedule/idLocal=${id}`, cloneObject)
                        .then(res => {
                            if (res.status === 200) {
                                setConfigLocalDate(cloneObject);
                                closeFormWindow();
                                dispatch(setConfigModal({
                                    title:      'successful',
                                    description:'El horarioha sido reseteado',
                                    type:       'successfull',
                                    modalOpen:  true,
                                    isCallback: null,
                                }));
                            }
                        })
                        .catch(err => console.error(err))
                        .finally(() => closeWindowClone());
                },
            }));
        });
    };


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <>
            <BannerContain
                openClone={openWindowClone}
                reset={resetDefault}
                establishment={selectEstablishment.filter(item => item._id === id)[0]}
            />

            {configLocalDate ? (
                <main className='flex-1 h-full overflow-y-auto p-4 sm:p-6'>
                    <ScheduleBox
                        idLocal={id}
                        configLocalDate={configLocalDate.dayMonitoring}
                        openSetForm={openFormWindow}
                        deleteHour={deleteHourForDay}
                        addDataRequest={data => pushDateDay(data)}
                    />
                </main>
            ) : (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <LoandingData title='Cargando horario' />
                </div>
            )}

            {showCloneWindow && (
                <WindowFormLayaut close={closeWindowClone}>
                    <form
                        style={{ width: '50%', padding: '2rem 1rem' }}
                        className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap'
                    >
                        <h2>Listas de horarios segun locales</h2>
                        <InputBorderBlue
                            textLabel='Seleciones un establecimiento'
                            type='select'
                            childSelect={selectEstablishment.map(item => ({ value: item._id, text: item.name }))}
                            eventChengue={value => cloneScheduleOfEstablishment(value)}
                        />
                    </form>
                </WindowFormLayaut>
            )}
        </>
    );
}
