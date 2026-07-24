'use client';
/**
 * clientBox.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tarjeta de establecimiento con ficha informativa integrada.
 *
 * Layout (desktop):
 *   ┌──────────────┬────────────────────────────────────────────────┐
 *   │  Logo +      │  Ficha informativa                             │
 *   │  Nombre +    │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
 *   │  Status +    │  │ Gerentes │ │ Horarios │ │  Menú    │      │
 *   │  Edit btn    │  └──────────┘ └──────────┘ └──────────┘      │
 *   └──────────────┴────────────────────────────────────────────────┘
 *
 * Carga lazy: solo pide al servidor cuando el elemento entra en viewport
 * gracias a react-intersection-observer (triggerOnce).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import useAxios from '@/hook/useAxios';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import useAuthOnServer from '@/hook/auth';
import { setTypeForm } from '@/store/slices/typeForm';
import { setConfigModal } from '@/store/slices/globalModal';

import WindowFormLayaut from '@/layaut/windowForForm';
import FormManager from '@/app/clients&manasgement/assets/managers/FormManager';
import FormSchedule from '@/app/clients&manasgement/assets/schedule/FormSchedule';
import ManagerItem from '../managers/manager';
import DataFormart from '@/libs/time/dateFormat.js';



export default function ClientBox({ data }) {

    /* ── Hooks ─────────────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const [client, setClient] = useState(null);
    const dispatch = useDispatch();
    const { requestAction } = useAxios();
    const router = useRouter();

    const [showManagerForm, setShowManagerForm] = useState(false);
    const [editManager, setEditManager] = useState(null);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    // Horario de HOY: undefined = cargando · null = sin configurar · {ranges,…} = ok
    const [todaySchedule, setTodaySchedule] = useState(undefined);


    const { ref, inView } = useInView({ triggerOnce: true });




    const fetchData = async () => {
        try {
            const response = await requestAction({ url: `/local/id=${data._id}?populate=managers timeServices`, action: 'GET' });
            if (response.status === 200) setClient(response.data);
        }
        catch (error) {
            console.error('Error fetching client data:', error);
            dispatch(setConfigModal({
                title: 'Error al cargar datos', description: 'No se han podido cargar los datos del establecimiento. Inténtalo de nuevo más tarde.',
                type: 'error', modalOpen: true, isCallback: null,
            }));
        }
    };



    /* ── Horario de monitoreo de HOY (para la tarjeta) ─────────────────────── */
    const loadTodaySchedule = () => {
        axiosStand.get(`/schedule/today/idLocal=${data._id}`)
            .then(res => setTodaySchedule(res.data))
            .catch(err => setTodaySchedule(err.response?.status === 404 ? null : null));
    };


    /* ── Fetch del establecimiento completo al entrar en viewport ──────────── */
    useEffect(() => {
        if (inView) {
            fetchData();
            loadTodaySchedule();
        }
    }, [inView, data]);





    /* ── Autorización (solo admins editan) ─────────────────────────────────── */
    const validateAuth = useCallback(callback => {
        if (!user?.admin) {
            dispatch(setConfigModal({
                title: 'Sin autorización', description: 'No tienes permisos para esta acción',
                type: 'error', modalOpen: true, isCallback: null,
            }));
        } else { callback(); }
    }, [user]);




    /** Abre el formulario de edición del establecimiento */
    const handleEdit = () => {
        validateAuth(() => dispatch(setTypeForm({ type: 'create-client', idData: data._id })));
    };


    /* ── Gerentes: abrir / cerrar / guardar ────────────────────────────────── */

    /** Abre el formulario en modo creación (local pre-seleccionado) */
    const openCreateManager = () => {
        validateAuth(() => {
            setEditManager(null);
            setShowManagerForm(true);
        });
    };


    /** Abre el formulario en modo edición con el gerente seleccionado */
    const openEditManager = manager => {
        validateAuth(() => {
            // Garantiza un local de referencia para el select del formulario
            setEditManager({
                ...manager,
                localName: manager.localName || manager.local?._id || data._id,
            });
            setShowManagerForm(true);
        });
    };

    /** Cierra el modal y limpia el gerente en edición */
    const closeManagerForm = () => {
        setEditManager(null);
        setShowManagerForm(false);
    };



    const handleManagerSave = (managerUpdate, dataEdit) => {
        setClient(state => {

            if (dataEdit) {
                const indexManagerEdit = state.managers.findIndex(manager => manager._id === managerUpdate._id);

                const cloneList = [...state.managers]
                cloneList[indexManagerEdit] = managerUpdate;
                state.managers = cloneList;
                return state;
            }
            else {
                state.managers = [...client.manager, managerUpdate];
                return state
            }

        });
        closeManagerForm();
    };





    const handleManagerReorder = newOrder => {
        if (!user?.admin) return;

        const prevOrder = client?.managers ?? [];
        // Si el orden no cambió, no hacemos nada
        if (newOrder.join() === prevOrder.join()) return;

        setClient(prev => prev ? { ...prev, managers: newOrder } : prev); // optimista

        const bodyForRequest = { ...client, managers: newOrder }
        if (bodyForRequest?.img) {
            delete bodyForRequest.img;
        }

        requestAction({ url: `/local/${data._id}`, body: bodyForRequest, action: 'PUT' })
            .then(res => {
                if (res.status !== 200) {
                    setClient(prev => prev ? { ...prev, managers: prevOrder } : prev);
                }
            })
            .catch(err => {
                console.error('Error al reordenar gerentes:', err);
                setClient(prev => prev ? { ...prev, managers: prevOrder } : prev);
            });

    };



    /* ── Skeleton mientras carga ───────────────────────────────────────────── */
    if (!client) {
        return (
            <div ref={ref} id={`${data._id}-${data?.name}`} className='w-full'>
                <div className='bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 animate-pulse flex gap-4'>
                    <div className='w-[140px] h-[100px] bg-slate-200 rounded-xl shrink-0' />
                    <div className='flex-1 flex flex-col gap-2'>
                        <div className='h-4 bg-slate-200 rounded w-2/3' />
                        <div className='h-3 bg-slate-100 rounded w-1/3' />
                        <div className='h-3 bg-slate-100 rounded w-1/2' />
                    </div>
                </div>
            </div>
        );
    }


    const TimeCreated = client?.date ? client?.date : client?.timestamps?.createdAt?.time;


    /* ── Render completo ───────────────────────────────────────────────────── */
    return (
        <div ref={ref} id={`${data._id}-${data?.name}`} className='w-full'>
            <article className='
                bg-white rounded-2xl border border-slate-200/70 shadow-sm
                hover:shadow-md hover:border-slate-300/70
                transition-all duration-200
                flex flex-col sm:flex-row overflow-hidden
            '>

                {/* ── COLUMNA IZQUIERDA: Logo + Info básica ────────────── */}
                <div className='sm:w-[210px] shrink-0 flex flex-col items-center p-5 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200/70'>

                    {/* Logo */}
                    <div className='w-[140px] h-[95px] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm mb-3 flex items-center justify-center'>
                        {client?.image ? (
                            <img
                                src={client.image}
                                alt={`logo-${client.name}`}
                                className='w-full h-full object-contain p-1'
                            />
                        ) : (
                            <div className='text-slate-300 text-xs text-center'>Sin logo</div>
                        )}
                    </div>

                    {/* Nombre */}
                    <h3 className='text-[15px] font-semibold text-slate-800 text-center leading-tight mb-2 tracking-tight'>
                        {client?.name}
                    </h3>

                    {/* Badge de estado */}
                    <span className={`${client?.isActive ? 'tag-green' : 'tag-amber'} gap-[5px] px-2.5 py-1 mb-3`}>
                        <span className={client?.isActive ? 'dot-green' : 'dot-amber'} />
                        {client?.isActive ? 'Activo' : 'Inactivo'}
                    </span>

                    {/* Meta info */}
                    <div className='text-xs text-slate-400 text-center space-y-[3px] mb-4'>
                        <p>Idioma: <span className='text-slate-600 font-medium'>{client?.lang || '—'}</span></p>
                        <p>Creado: <span className='text-slate-600 font-medium'>{DataFormart.formatDateApp(TimeCreated)}</span></p>
                    </div>

                    {/* Botón editar */}
                    <button
                        onClick={handleEdit}
                        className='
                            flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg
                            text-xs font-semibold
                            border border-emerald-200 text-emerald-700 bg-emerald-50/50
                            hover:bg-emerald-50 hover:border-emerald-300 transition-colors
                        '
                    >
                        <Image src='/ico/edit/edit.svg' alt='editar' width={12} height={12} />
                        Editar parámetros
                    </button>
                </div>


                {/* ── COLUMNA DERECHA: Ficha informativa ───────────────── */}
                <div className='flex-1 p-5'>

                    {/* Título de sección */}
                    <div className='flex items-center gap-2 mb-4'>
                        <div className='w-1 h-4 bg-emerald-500 rounded-full' />
                        <h4 className='text-sm font-semibold text-slate-700 tracking-tight'>Ficha informativa</h4>
                    </div>


                    {/* Grid de módulos */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>

                        {/* ── Módulo: Gerentes ──────────────────────────── */}
                        <InfoModule
                            icon='/ico/userList/patient_list.svg'
                            title='Gerentes'
                            count={client?.managers?.length ?? 0}
                            color='blue'
                        >


                            <div className='flex flex-col gap-2 h-full'>
                                {
                                    client?.managers?.length > 0 ?

                                        <ManagerList
                                            ids={client.managers}
                                            onEdit={openEditManager}
                                            onReorder={handleManagerReorder}
                                            canReorder={!!user?.admin}
                                        />
                                        :
                                        <p className='text-xs text-slate-400 italic'>Sin gerentes asignados</p>
                                }


                                {/* Botón añadir gerente */}
                                <button
                                    onClick={openCreateManager}
                                    className='
                                        mt-auto flex items-center justify-center gap-1
                                        text-xs font-semibold text-blue-600
                                        border border-blue-200 bg-blue-50/40 rounded-lg py-[7px]
                                        hover:bg-blue-100/70 hover:border-blue-300 transition-colors
                                    '
                                >
                                    <span className='text-sm leading-none'>+</span>
                                    Añadir gerente
                                </button>
                            </div>
                        </InfoModule>





                        {/* ── Módulo: Horario monitoreo ────────────────── */}
                        {/* Establecimiento inactivo → todo el segmento en gris + tag */}
                        <InfoModule
                            icon='/ico/monitoring/monitoring.svg'
                            title='Horario monitoreo'
                            color={client?.isActive === false ? 'gray' : 'amber'}
                        >
                            <div className={`flex flex-col h-full pt-1 gap-3 ${client?.isActive === false ? 'grayscale opacity-70' : ''}`}>
                                {client?.isActive === false && (
                                    <span className='self-center inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-600 bg-slate-200/80 ring-1 ring-slate-300 rounded-full px-2 py-[2px]'>
                                        <span className='w-[5px] h-[5px] rounded-full bg-slate-500' />
                                        Inactivo
                                    </span>
                                )}
                                <ScheduleTodaySummary today={todaySchedule} />
                                <button
                                    type='button'
                                    onClick={() => validateAuth(() => setShowScheduleForm(true))}
                                    className='mt-auto flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50/50 rounded-lg py-[7px] hover:bg-emerald-100/70 hover:border-emerald-300 transition-colors'
                                >
                                    Gestionar horario →
                                </button>
                            </div>
                        </InfoModule>


                        {/* ── Módulo: Menú / Platos ────────────────────── */}
                        <InfoModule
                            icon='/ico/icons8-menú-50.png'
                            title='Menú de platos'
                            count={client?.dishes?.length ?? 0}
                            color='purple'
                        >
                            <div className='flex flex-col items-center gap-2 pt-1'>
                                <span className='text-xs text-slate-500'>
                                    {client?.dishes?.length > 0
                                        ? `${client.dishes.length} platos registrados`
                                        : 'Sin platos'}
                                </span>
                                <button
                                    onClick={() => router.push(`/clients&manasgement/diches?id=${data._id}`)}
                                    className='text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors'
                                >
                                    Editar →
                                </button>
                            </div>
                        </InfoModule>

                    </div>
                </div>

            </article>

            {/* ── MODAL: CREAR / EDITAR GERENTE ─────────────────────────────── */}
            {showManagerForm && (
                <WindowFormLayaut close={closeManagerForm}>
                    <FormManager
                        editData={editManager}
                        defaultLocalId={data._id}
                        onSave={handleManagerSave}
                        establishmentId={client._id}
                        close={closeManagerForm}
                    />
                </WindowFormLayaut>
            )}

            {/* ── MODAL: HORARIO DE MONITOREO ───────────────────────────────── */}
            {showScheduleForm && (
                <WindowFormLayaut close={() => setShowScheduleForm(false)}>
                    <FormSchedule
                        idLocal={data._id}
                        establishment={client}
                        onSaved={() => {
                            setClient(prev => prev ? { ...prev, schedules: true } : prev);
                            loadTodaySchedule();
                        }}
                    />
                </WindowFormLayaut>
            )}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * InfoModule — Módulo de la ficha informativa
 *
 * Tarjeta interna con icono, título, badge de conteo y contenido libre.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const moduleColors = {
    blue: { bg: 'bg-blue-50/60 ring-blue-100', icon: 'bg-blue-100', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50/60 ring-amber-100', icon: 'bg-amber-100', text: 'text-amber-700' },
    purple: { bg: 'bg-violet-50/60 ring-violet-100', icon: 'bg-violet-100', text: 'text-violet-700' },
    emerald: { bg: 'bg-emerald-50/60 ring-emerald-100', icon: 'bg-emerald-100', text: 'text-emerald-700' },
    gray: { bg: 'bg-slate-100/60 ring-slate-200', icon: 'bg-slate-200', text: 'text-slate-500' },
};



/* ─────────────────────────────────────────────────────────────────────────────
 * ScheduleTodaySummary — Estado del horario de monitoreo de HOY en la tarjeta.
 *   undefined → cargando · null → sin configurar · { ranges } → hoy / libre
 * ─────────────────────────────────────────────────────────────────────────────
 */
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SCH_TYPE_META = {
    analytical: { label: 'Analítico',  badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    perimeter:  { label: 'Perimetral', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
};
const hhmm = t => String(t ?? '').slice(0, 5);
const durH = (s, e) => { const a = Number(String(s).split(':')[0]) || 0, b = Number(String(e).split(':')[0]) || 0; return b > a ? b - a : (24 - a) + b; };

function ScheduleTodaySummary({ today }) {
    // Cargando
    if (today === undefined) {
        return (
            <div className='flex justify-center py-5'>
                <span className='w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin' />
            </div>
        );
    }

    // Sin configurar
    if (today === null) {
        return (
            <div className='rounded-lg border border-dashed border-slate-300/70 px-3 py-4 text-center'>
                <p className='text-xs font-semibold text-slate-500'>Sin configurar</p>
                <p className='text-[10px] text-slate-400 mt-0.5'>Aún no tiene horario de monitoreo</p>
            </div>
        );
    }

    const ranges  = Array.isArray(today.ranges) ? today.ranges : [];
    const dayName = DAY_NAMES[today.day] ?? 'Hoy';

    // Libre hoy
    if (ranges.length === 0) {
        return (
            <div className='rounded-lg bg-white/70 ring-1 ring-slate-200/70 px-3 py-4 text-center'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>{dayName}</p>
                <p className='text-sm font-bold text-sky-600 mt-0.5'>Libre hoy</p>
                <p className='text-[10px] text-slate-400'>Sin monitoreo programado</p>
            </div>
        );
    }

    // Con horario hoy
    const sorted = [...ranges].sort((a, b) => hhmm(a.hours?.start).localeCompare(hhmm(b.hours?.start)));
    const total  = sorted.reduce((sum, r) => sum + durH(r.hours?.start, r.hours?.end), 0);
    const shown  = sorted.slice(0, 3);
    const extra  = sorted.length - shown.length;

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
                <span className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Hoy · {dayName}</span>
                <div className='flex items-center gap-1.5'>
                    {today.usingWinter && (
                        <span className='inline-flex items-center text-[9px] font-bold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200 rounded-full px-1.5 py-[1px]'>Invierno</span>
                    )}
                    <span className='text-[10px] font-semibold text-slate-500 tabular-nums'>{total} h</span>
                </div>
            </div>

            <div className='flex flex-col gap-1.5'>
                {shown.map((r, i) => {
                    const meta = SCH_TYPE_META[r.type] ?? SCH_TYPE_META.analytical;
                    const overnight = hhmm(r.hours?.end) <= hhmm(r.hours?.start);
                    return (
                        <div key={i} className='flex items-center justify-between gap-2 rounded-md bg-white ring-1 ring-slate-200/70 px-2 py-1'>
                            <span className='text-[11px] font-bold text-slate-700 tabular-nums'>
                                {hhmm(r.hours?.start)}<span className='text-slate-300 font-normal'>–</span>{hhmm(r.hours?.end)}
                                {overnight && <span className='text-[9px] font-normal text-slate-400 ml-1'>+1d</span>}
                            </span>
                            <span className={`text-[9px] font-bold rounded-full ring-1 px-1.5 py-[1px] ${meta.badge}`}>{meta.label}</span>
                        </div>
                    );
                })}
                {extra > 0 && <span className='text-[10px] text-slate-400 text-center'>+{extra} ventana{extra > 1 ? 's' : ''} más</span>}
            </div>
        </div>
    );
}


function InfoModule({ icon, title, count, color = 'blue', children }) {


    const c = moduleColors[color] ?? moduleColors.blue;

    return (
        <div className={`${c.bg} ring-1 rounded-xl p-3.5 flex flex-col`}>
            {/* Header del módulo */}
            <div className='flex items-center gap-2 mb-2.5'>
                <div className={`w-7 h-7 ${c.icon} rounded-lg flex items-center justify-center shrink-0`}>
                    <img src={icon} alt={title} className='w-[15px] h-[15px]' />
                </div>
                <span className={`text-[13px] font-semibold ${c.text} tracking-tight`}>{title}</span>
                {count !== undefined && (
                    <span className='ml-auto text-[11px] bg-white px-2 py-[2px] rounded-full text-slate-500 font-semibold ring-1 ring-slate-200/70'>
                        {count}
                    </span>
                )}
            </div>

            {/* Contenido */}
            <div className='flex-1'>
                {children}
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * ManagerList — Lista de gerentes cargada por IDs
 *
 * Cada ID se fetcha individualmente con /managerLocalAndImgById.
 * Se muestra cargo + nombre en una lista compacta.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function ManagerList({ ids, onEdit, onReorder, canReorder = false }) {

    // Orden local (optimista). Se re-sincroniza con los IDs del establecimiento.
    const [order, setOrder] = useState(ids);
    const dragIndex = useRef(null);   // índice del elemento que se arrastra
    const [overIndex, setOver] = useState(null); // índice sobre el que se está soltando



    useEffect(() => { setOrder(ids); }, [ids]);



    /** Reordena el array al soltar y persiste el nuevo orden */
    const handleDrop = dropIndex => {
        const from = dragIndex.current;
        dragIndex.current = null;
        setOver(null);
        if (from === null || from === dropIndex) return;

        const newOrder = [...order];
        const [moved] = newOrder.splice(from, 1);
        newOrder.splice(dropIndex, 0, moved);

        setOrder(newOrder);        // feedback inmediato
        onReorder?.(newOrder);     // persiste en el servidor
    };



    return (
        <ul className='space-y-1'>
            {order.map((id, idx) => (
                <ManagerItem
                    key={id._id}
                    id={id}
                    onEdit={onEdit}
                    draggable={canReorder}
                    isOver={overIndex === idx}
                    onDragStart={() => { dragIndex.current = idx; }}
                    onDragOver={e => { e.preventDefault(); if (overIndex !== idx) setOver(idx); }}
                    onDragLeave={() => setOver(prev => (prev === idx ? null : prev))}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={() => { dragIndex.current = null; setOver(null); }}
                />
            ))}
        </ul>
    );
}



