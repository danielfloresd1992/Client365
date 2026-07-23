'use client';
/**
 * FormSchedule.jsx — Horario de monitoreo de un establecimiento, en MODAL.
 *
 * Misma lógica que la antigua subruta /time_monitoring (cargar / añadir /
 * eliminar / clonar / resetear rangos), pero renderizada como componente dentro
 * de /clients&manasgement (igual que el formulario de gerentes), recibiendo el
 * `idLocal` por prop en vez de leerlo de la URL.
 *
 * Zona horaria USA: un switch marca el local como `usesUsTimezone`; al activarlo
 * aparecen las pestañas Normal / Invierno, que editan `dayMonitoring` o
 * `dayMonitoringWinter` respectivamente. Todas las escrituras persisten el doc
 * completo con PUT /schedule/idLocal.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaRedo, FaClone, FaClock, FaTimes, FaSnowflake } from 'react-icons/fa';

import { setConfigModal } from '@/store/slices/globalModal';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import LoandingData from '@/components/loandingComponent/loanding';
import { ScheduleBox } from '@/components/box/ScheduleBox';
import useAuthOnServer from '@/hook/auth';


export default function FormSchedule({ idLocal, establishment, onSaved = () => {} }) {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const dispatch = useDispatch();
    const selectEstablishment = useSelector(state => state.clients);

    const [configLocalDate, setConfigLocalDate] = useState(null);
    const [showClone,       setShowClone]       = useState(false);
    const [activeSchedule,  setActiveSchedule]  = useState('normal');   // 'normal' | 'winter'
    const dayRef = useRef(null);

    // ¿Qué array se está editando según la pestaña activa?
    const usesUsTimezone = Boolean(configLocalDate?.usesUsTimezone);
    const field          = activeSchedule === 'winter' ? 'dayMonitoringWinter' : 'dayMonitoring';
    const activeRanges   = configLocalDate?.[field] ?? [];


    /* ── Carga del horario al montar (crea uno vacío si no existe) ─────────── */
    useEffect(() => {
        axiosStand.get(`/schedule/idLocal=${idLocal}`)
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
                        const newConfig = { idLocal, dayMonitoring: [] };
                        axiosStand.post(`/schedule`, newConfig)
                            .then(response => {
                                if (response.status === 200) {
                                    setConfigLocalDate({ idLocal, dayMonitoring: [], dayMonitoringWinter: [], usesUsTimezone: false });
                                    onSaved();
                                }
                            })
                            .catch(err => console.error(err));
                    },
                }));
            });
    }, []);


    /* ── Autorización: solo admins ejecutan acciones de escritura ──────────── */
    const validateAuthorization = useCallback(callback => {
        if (!user?.admin) {
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
    }, [user]);


    /* ── Persistencia: PUT del doc completo + estado local ─────────────────── */
    const persist = (putObject, successMsg) =>
        axiosStand.put(`/schedule/idLocal=${idLocal}`, putObject)
            .then(res => {
                if (res.status !== 200) return false;
                setConfigLocalDate(putObject);
                onSaved();
                if (successMsg) {
                    dispatch(setConfigModal({ modalOpen: true, title: 'Éxito', description: successMsg, isCallback: null, type: 'successfull' }));
                }
                return true;
            });


    /* ── Rango horario (ScheduleBox gestiona su propio formulario) ─────────── */
    const openFormWindow  = paramsDay => { dayRef.current = paramsDay; };
    const closeFormWindow = () => { dayRef.current = null; };


    /* ── Añadir un rango al horario ACTIVO ─────────────────────────────────── */
    const pushDateDay = configDay => {
        validateAuthorization(() => {
            const putObject = { ...configLocalDate, [field]: [...activeRanges, configDay] };
            persist(putObject).then(ok => { if (ok) closeFormWindow(); }).catch(err => console.error(err));
        });
    };


    /* ── Eliminar un rango del horario ACTIVO ──────────────────────────────── */
    const deleteHourForDay = keyDay => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title:      'Aviso',
                description:'¿Seguro de eliminar este rango?',
                type:       'warning',
                modalOpen:  true,
                isCallback: () => {
                    const putObject = { ...configLocalDate, [field]: activeRanges.filter(time => time.key !== keyDay) };
                    persist(putObject).catch(err => console.error(err));
                },
            }));
        });
    };


    /* ── Clonar el horario de otro establecimiento (a la pestaña ACTIVA) ───── */
    const cloneScheduleOfEstablishment = idClone => {
        validateAuthorization(() => {
            axiosStand.get(`/schedule/idLocal=${idClone}`)
                .then(response => {
                    const source = response.data[0]?.[field] ?? response.data[0]?.dayMonitoring ?? [];
                    const putObject = { ...configLocalDate, [field]: source };
                    persist(putObject, 'El horario ha sido clonado')
                        .catch(err => console.error(err))
                        .finally(() => setShowClone(false));
                })
                .catch(err => {
                    if (err.response?.status === 404) {
                        setShowClone(false);
                        dispatch(setConfigModal({
                            title:      'Error',
                            description:'No existe horario para clonar en dicho establecimiento',
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


    /* ── Resetear el horario ACTIVO ────────────────────────────────────────── */
    const resetDefault = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                title:      'Aviso',
                description: activeSchedule === 'winter'
                    ? '¿Seguro de resetear el horario de invierno?'
                    : '¿Seguro de resetear el horario normal?',
                type:       'warning',
                modalOpen:  true,
                isCallback: () => {
                    const putObject = { ...configLocalDate, [field]: [] };
                    persist(putObject, 'El horario ha sido reseteado').catch(err => console.error(err));
                },
            }));
        });
    };


    /* ── Marcar / desmarcar el local como zona horaria USA ─────────────────── */
    const toggleUsa = () => {
        validateAuthorization(() => {
            const next = !usesUsTimezone;
            const putObject = { ...configLocalDate, usesUsTimezone: next };
            persist(putObject)
                .then(ok => { if (ok && !next) setActiveSchedule('normal'); })   // al apagar, vuelve a normal
                .catch(err => console.error(err));
        });
    };


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <div
            className='bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden'
            style={{ width: 'min(1100px, 92vw)', maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
        >
            {/* Cabecera + acciones */}
            <div className='flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/70'>
                <span className='w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0'>
                    <FaClock size={16} />
                </span>
                <div className='min-w-0'>
                    <h2 className='text-base font-bold text-slate-800 leading-tight'>Horario de monitoreo</h2>
                    <p className='text-xs text-slate-500 truncate'>{establishment?.name ?? 'Establecimiento'}</p>
                </div>

                <div className='ml-auto flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setShowClone(v => !v)}
                        className='inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50/60 rounded-lg px-3 py-2 hover:bg-blue-100/70 transition-colors'
                    >
                        <FaClone size={12} /> Clonar
                    </button>
                    <button
                        type='button'
                        onClick={resetDefault}
                        className='inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors'
                    >
                        <FaRedo size={11} /> Resetear
                    </button>
                </div>
            </div>

            {/* Zona horaria USA: switch + pestañas Normal / Invierno */}
            <div className='px-5 py-3 border-b border-slate-200 flex items-center gap-4 flex-wrap'>
                <div className='inline-flex items-center gap-2.5'>
                    <button
                        type='button'
                        role='switch'
                        aria-checked={usesUsTimezone}
                        onClick={toggleUsa}
                        disabled={!configLocalDate}
                        className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${usesUsTimezone ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${usesUsTimezone ? 'translate-x-4' : ''}`} />
                    </button>
                    <span className='text-xs font-semibold text-slate-700'>Este local usa horario USA</span>
                </div>

                {usesUsTimezone && (
                    <div className='ml-auto inline-flex rounded-lg border border-slate-200 overflow-hidden'>
                        <button
                            type='button'
                            onClick={() => setActiveSchedule('normal')}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${activeSchedule === 'normal' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            Normal
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveSchedule('winter')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border-l border-slate-200 ${activeSchedule === 'winter' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <FaSnowflake size={10} /> Invierno
                        </button>
                    </div>
                )}
            </div>

            {/* Panel de clonado (inline, en vez de un modal anidado) */}
            {showClone && (
                <div className='px-5 py-3 border-b border-slate-200 bg-blue-50/40 flex items-end gap-3'>
                    <div className='flex-1 min-w-0'>
                        <InputBorderBlue
                            textLabel={`Clonar hacia el horario ${activeSchedule === 'winter' ? 'de invierno' : 'normal'}`}
                            type='select'
                            childSelect={selectEstablishment
                                .filter(item => item._id !== idLocal)
                                .map(item => ({ value: item._id, text: item.name }))}
                            eventChengue={value => cloneScheduleOfEstablishment(value)}
                        />
                    </div>
                    <button
                        type='button'
                        onClick={() => setShowClone(false)}
                        className='text-slate-400 hover:text-slate-600 pb-2'
                        title='Cerrar'
                    >
                        <FaTimes size={14} />
                    </button>
                </div>
            )}

            {/* Grilla del horario ACTIVO (scroll horizontal en pantallas chicas) */}
            <div className='flex-1 min-h-0 overflow-auto p-4'>
                {configLocalDate ? (
                    <>
                        {usesUsTimezone && activeSchedule === 'winter' && (
                            <p className='mb-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5'>
                                <FaSnowflake size={11} /> Editando el horario de invierno (se usa cuando el cambio USA está activo)
                            </p>
                        )}
                        <ScheduleBox
                            idLocal={idLocal}
                            configLocalDate={activeRanges}
                            openSetForm={openFormWindow}
                            deleteHour={deleteHourForDay}
                            addDataRequest={data => pushDateDay(data)}
                        />
                    </>
                ) : (
                    <div style={{ width: '100%', height: '260px', position: 'relative' }}>
                        <LoandingData title='Cargando horario' />
                    </div>
                )}
            </div>
        </div>
    );
}