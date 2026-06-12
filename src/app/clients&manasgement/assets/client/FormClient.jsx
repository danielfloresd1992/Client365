'use client';
/**
 * FormClient.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario de creación y edición de establecimientos (locales).
 *
 * Props:
 *   id      {string|null}  – _id del local a editar. null = modo creación.
 *   action  {function}     – Callback para cerrar el formulario (opcional).
 *
 * Endpoints:
 *   POST /local           → Crea un nuevo establecimiento.
 *   PUT  /local/:id       → Actualiza un establecimiento existente.
 *   POST /multimedia      → Sube la imagen del logo.
 *   GET  /franchise       → Lista de franquicias para el select.
 *   GET  /local/id=:id    → Datos del local al editar.
 *
 * Secciones del formulario:
 *   1. Datos generales     (franquicia, nombre, monitoreo, idioma, orden, ubicación)
 *   2. Managers por defecto (cantidad gerentes/asistentes, evaluación de toques)
 *   3. Platillos por defecto(entrada, fuerte, postre, evaluación de procesos)
 *   4. Configuración avanzada (status, zona horaria, DST, largo del menú de alerta)
 *   5. Logo / imagen
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useDispatch }                       from 'react-redux';
import { addClient }                         from '@/store/slices/Client';
import { addNewEstablishment }               from '@/store/slices/newEstablishment';
import { setConfigModal }                    from '@/store/slices/globalModal';
import { setTypeForm }                       from '@/store/slices/typeForm';
import InputBorderBlue                       from '@/components/inpust/InputBorderBlue';
import useAxios                              from '@/hook/useAxios';
import useAuthOnServer                       from '@/hook/auth';
import moment                                from 'moment-timezone';
import { useSingleFetch }                    from '@/hook/ajax_hook/useFetch';

import clientDefault from '../objectDefault/objectDefaultClient';



export default function FormClient({ id = null, action }) { 

    /* ── Auth ──────────────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    /* ── Data fetching ─────────────────────────────────────────────────────── */
    const dataFranchise      = useSingleFetch({ resource: '/franchise', method: 'get' }, true);
    const listFranchiseState = dataFranchise?.data ?? [];

    const {
        data: upDateClient,
        fetchData,
        resetDataFetch,
        setChangeData,
    } = useSingleFetch({ resource: '/establishment', method: 'get' }, false);


    const [franchiseSelect, setFranchiseSelect] = useState(null);

    /* ── Helpers ───────────────────────────────────────────────────────────── */
    const dispatch          = useDispatch();
    const { requestAction } = useAxios();
    const listZoneTime      = moment.tz.names().map(item => ({ value: item, text: item }));
    const isEdit            = !!id;


    /* ── Efectos: cargar datos del local a editar ──────────────────────────── */
    useEffect(() => {
        if (id && upDateClient) {
            if (!upDateClient?.DST) {
                setChangeData({
                    ...upDateClient,
                    DST: { isActive: false, TimeZone: 'America/Caracas' },
                });
            }
            const selected = listFranchiseState.filter(item => item._id === upDateClient.idLocal);
            setFranchiseSelect(selected);
        } else if (!id && !upDateClient) {
            setChangeData(clientDefault);
        }
    }, [upDateClient]);




    useEffect(() => {
        if (id && listFranchiseState.length > 1) {
            fetchData({ url: `/local/id=${id}`, autoGetData: true, method: 'get' });
        }
        return () => resetDataFetch();
    }, [listFranchiseState]);





    /* ── Submit ────────────────────────────────────────────────────────────── */
    const onSubmit = useCallback(e => {
        e.preventDefault();

        const userSubmit = {
            time:    new Date(),
            by_user: { name: `${user.name} ${user.surName}`, id: user._id },
        };

        const clientEditBy = { timestamps: {} };

        if (!id) {
            clientEditBy.timestamps.createdAt = userSubmit;
        } else {
            clientEditBy.timestamps.createdAt = upDateClient.timestamps.createdAt;
            clientEditBy.timestamps.updatedAt = Array.isArray(upDateClient?.timestamps.updatedAt)
                ? [...upDateClient.timestamps.updatedAt, userSubmit]
                : [userSubmit];
        }

        const bodyRequest = { ...upDateClient, ...clientEditBy };
        delete bodyRequest.img;
        handleRequest(bodyRequest);
    }, [upDateClient]);




    /* ── Petición HTTP (crear / actualizar) ────────────────────────────────── */
    const handleRequest = useCallback(async body => {
        try {
            if (!upDateClient._id) {
                const res = await requestAction({ url: '/local', action: 'post', body });
                dispatch(addNewEstablishment(res.data));
                dispatch(addClient(res.data));
                dispatch(setConfigModal({
                    modalOpen: true, title: 'Creado',
                    description: 'Establecimiento añadido con éxito',
                    isCallback: null, type: 'successfull',
                }));
            } else {
                delete body._id;
                const res = await requestAction({ url: `/local/${upDateClient._id}`, action: 'put', body });
                resetDataFetch();
                dispatch(addClient(res.data));
                dispatch(setConfigModal({
                    modalOpen: true, title: 'Actualizado',
                    description: 'Establecimiento actualizado con éxito',
                    isCallback: null, type: 'successfull',
                }));
            }
            dispatch(setTypeForm(null));
        } catch (error) {
            console.error(error);
            dispatch(setConfigModal({
                modalOpen: true, title: 'Error',
                description: 'Ocurrió un error al enviar los datos',
                isCallback: null, type: 'error',
            }));
        }
    }, [upDateClient]);



    /* ── Upload de imagen ──────────────────────────────────────────────────── */
    const handleImageChange = e => {
        const file     = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('img', file);
        fetchData({
            url: '/multimedia', method: 'post', autoGetData: false,
            callback: onImageUploaded, body: formData,
        });
    };

    const onImageUploaded = useCallback(response => {
        setChangeData({ ...upDateClient, image: response.data.url });
    }, [upDateClient]);




    /* ── Loading ───────────────────────────────────────────────────────────── */
    if (!upDateClient) {
        return (
            <div className='bg-white rounded-2xl shadow-xl p-12 flex items-center justify-center'>
                <div className='flex items-center gap-3 text-slate-400 text-sm'>
                    <span className='w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin' />
                    Cargando datos del establecimiento…
                </div>
            </div>
        );
    }


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden'>

            {/* ── HEADER ────────────────────────────────────────────────── */}
            <div className='bg-[#8f8f8f] px-6 py-5'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                        <img
                            src='/ico/icons8-tienda-30.png'
                            alt='local'
                            className='w-5 h-5'
                            style={{ filter: 'brightness(10)' }}
                        />
                    </div>
                    <div>
                        <h2 className='text-white font-bold text-base'>
                            {isEdit ? 'Editar establecimiento' : 'Nuevo establecimiento'}
                        </h2>
                        <p className='text-slate-100 text-xs'>
                            {isEdit ? `Editando: ${upDateClient.name || ''}` : 'Registra un nuevo local o cliente'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── FORM ──────────────────────────────────────────────────── */}
            <form onSubmit={onSubmit} className='p-6 flex flex-col gap-2 max-h-[70vh] overflow-y-auto'>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 1: DATOS GENERALES                             */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='🏢' title='Datos generales' />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2'>
                    <InputBorderBlue
                        textLabel='Franquicia'
                        type='select'
                        value={upDateClient.idLocal}
                        name='nameFranchise'
                        important={true}
                        childSelect={
                            listFranchiseState.length > 0
                                ? listFranchiseState.map(d => ({ value: d._id, text: d.name }))
                                : null
                        }
                        eventChengue={value => {
                            const selected = listFranchiseState.filter(i => i._id === value)[0];
                            setFranchiseSelect(selected);
                            const obj = {
                                ...upDateClient,
                                franchiseReference: { name_franchise: selected.name, franchise: selected._id },
                                idLocal: selected._id,
                            };
                            if (selected.name === 'Nacionales') obj.location = 'confidential';
                            setChangeData(obj);
                        }}
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
                        { value: 'analytical',               text: 'Analítico'               },
                        { value: 'perimeter',                text: 'Perimetral'               },
                        { value: 'analytical and perimeter',  text: 'Analítico y Perimetral'   },
                    ]}
                    eventChengue={text => setChangeData({ ...upDateClient, typeMonitoring: text })}
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <InputBorderBlue
                        textLabel='Orden de apilamiento'
                        type='number'
                        value={String(upDateClient.order)}
                        name='order'
                        eventChengue={text => setChangeData({ ...upDateClient, order: Number(text) })}
                    />
                    <InputBorderBlue
                        textLabel='Idioma'
                        type='select'
                        value={upDateClient.lang}
                        name='lang'
                        childSelect={[
                            { value: 'es', text: 'Castellano' },
                            { value: 'en', text: 'Inglés'     },
                        ]}
                        eventChengue={text => setChangeData({ ...upDateClient, lang: text })}
                    />
                </div>

                <InputBorderBlue
                    textLabel='Ubicación del establecimiento'
                    name='location'
                    important={false}
                    value={
                        upDateClient.franchiseReference?.name_franchise === 'Nacionales'
                            ? 'Confidencial'
                            : upDateClient.location
                    }
                    disable={upDateClient.franchiseReference?.name_franchise === 'Nacionales'}
                    eventChengue={text => setChangeData({ ...upDateClient, location: text })}
                />


                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 2: CONFIGURACIÓN DE MANAGERS                    */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='👥' title='Configuración de managers' />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <InputBorderBlue
                        textLabel='Cantidad de gerentes'
                        name='totalManager'
                        value={upDateClient ? String(upDateClient?.touchs?.totalManager) : null}
                        type='number'
                        eventChengue={text => setChangeData({
                            ...upDateClient,
                            touchs: { ...upDateClient.touchs, totalManager: Number(text) },
                        })}
                    />
                    <InputBorderBlue
                        textLabel='Cantidad de asistentes'
                        name='totalAttendee'
                        value={upDateClient ? String(upDateClient.touchs?.totalAttendee) : null}
                        type='number'
                        eventChengue={text => setChangeData({
                            ...upDateClient,
                            touchs: { ...upDateClient.touchs, totalAttendee: Number(text) },
                        })}
                    />
                </div>

                <InputBorderBlue
                    textLabel='Tipo de evaluación'
                    name='typeEvaluationTouch'
                    value={upDateClient ? upDateClient?.touchs?.typeEvaluationTouch : null}
                    type='select'
                    childSelect={[
                        { value: 'completo', text: 'Completo' },
                        { value: 'simple',   text: 'Simple'   },
                    ]}
                    eventChengue={text => setChangeData({
                        ...upDateClient,
                        touchs: { ...upDateClient.touchs, typeEvaluationTouch: Boolean(text) },
                    })}
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <InputBorderBlue
                        textLabel='¿Evaluación de toques?'
                        name='isRequiredeEvaluation'
                        value={upDateClient ? upDateClient.touchs.isRequiredeEvaluation : null}
                        type='checkbox'
                        important={false}
                        eventChengue={text => setChangeData({
                            ...upDateClient,
                            touchs: { ...upDateClient.touchs, isRequiredeEvaluation: Boolean(text) },
                        })}
                    />
                    <InputBorderBlue
                        textLabel='¿Grupal o individual?'
                        name='isEvaluationGroup'
                        value={upDateClient ? upDateClient.touchs.isEvaluationGroup : null}
                        type='checkbox'
                        important={false}
                        eventChengue={text => setChangeData({
                            ...upDateClient,
                            touchs: { ...upDateClient.touchs, isEvaluationGroup: Boolean(text) },
                        })}
                    />
                </div>


                


                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 4: CONFIGURACIÓN AVANZADA                      */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='⚙️' title='Configuración avanzada' />

                <InputBorderBlue
                    textLabel='Estatus del monitoreo'
                    name='status'
                    value={upDateClient ? upDateClient.status : null}
                    type='select'
                    childSelect={[
                        { value: 'activo',   text: 'Activo'   },
                        { value: 'inactivo', text: 'Inactivo' },
                    ]}
                    eventChengue={text => setChangeData({ ...upDateClient, status: text })}
                />

                <InputBorderBlue
                    textLabel='Zona horaria'
                    type='select'
                    value={upDateClient ? upDateClient.DST?.TimeZone : 'America/Caracas'}
                    childSelect={listZoneTime}
                    eventChengue={text => setChangeData({
                        ...upDateClient,
                        DST: { ...upDateClient.DST, TimeZone: text },
                    })}
                />

                <InputBorderBlue
                    textLabel='¿Horario de invierno (DST)?'
                    type='checkbox'
                    important={false}
                    eventChengue={value => setChangeData({
                        ...upDateClient,
                        DST: { ...upDateClient.DST, isActive: value },
                    })}
                />

                {upDateClient.DST && (
                    <div className='bg-slate-50 rounded-lg p-3 flex items-center gap-2'>
                        <span className='text-xs text-slate-500'>Hora actual en esta zona:</span>
                        <span className='text-sm font-mono font-semibold text-emerald-600'>
                            {moment().tz(upDateClient.DST.TimeZone).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                    </div>
                )}

                <InputBorderBlue
                    textLabel='Longitud del menú de alerta en vivo'
                    type='select'
                    value={upDateClient.alertLength}
                    childSelect={[
                        { value: 'simplified', text: 'Menú simplificado' },
                        { value: 'extended',   text: 'Menú extendido'   },
                    ]}
                    eventChengue={text => setChangeData({ ...upDateClient, alertLength: text })}
                />


                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 5: LOGO / IMAGEN                                */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='🖼️' title='Logo del establecimiento' />

                <div className='flex flex-col items-center gap-4 bg-slate-50 rounded-xl p-5'>
                    {/* Preview del logo */}
                    {upDateClient.image &&
                     !upDateClient.image.includes('default.jpg') && (
                        <div className='w-[180px] h-[180px] rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-white flex items-center justify-center'>
                            <img
                                className='w-full h-full object-contain p-2'
                                src={upDateClient.image}
                                alt='logo-preview'
                            />
                        </div>
                    )}

                    {/* Input de archivo */}
                    <label className='
                        flex flex-col items-center gap-2 cursor-pointer
                        border-2 border-dashed border-emerald-300 rounded-xl
                        p-4 w-full hover:border-emerald-400 hover:bg-emerald-50/50
                        transition-colors
                    '>
                        <svg className='w-8 h-8 text-emerald-400' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
                        </svg>
                        <span className='text-sm text-emerald-600 font-medium'>
                            Seleccionar imagen
                        </span>
                        <span className='text-[11px] text-slate-400'>
                            JPG, PNG o WebP
                        </span>
                        <input
                            onChange={handleImageChange}
                            type='file'
                            accept='image/jpeg,image/png,image/webp'
                            className='hidden'
                        />
                    </label>
                </div>


                {/* ── SUBMIT ────────────────────────────────────────────── */}
                <button
                    type='submit'
                    disabled={isEdit && !upDateClient}
                    className='
                        w-full py-3 rounded-xl mt-4
                        bg-emerald-600 text-white font-semibold text-sm
                        hover:bg-emerald-700 active:scale-[0.99]
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                    '
                >
                    {isEdit ? 'Actualizar establecimiento' : 'Crear establecimiento'}
                </button>

            </form>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * SectionHeader — Separador visual de sección dentro del formulario.
 * Muestra un icono + título + línea divisora.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function SectionHeader({ icon, title }) {
    return (
        <div className='flex items-center gap-2 pt-4 pb-2 mt-2 border-t border-slate-100 first:border-t-0 first:mt-0 first:pt-0'>
            <span className='text-base'>{icon}</span>
            <h3 className='text-sm font-semibold text-slate-700 tracking-tight'>{title}</h3>
            <div className='flex-1 border-t border-slate-200 ml-2' />
        </div>
    );
}
