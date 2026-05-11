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
import { useState, useEffect, useCallback } from 'react';
import { useDispatch }                       from 'react-redux';
import { useInView }                         from 'react-intersection-observer';
import { useRouter }                         from 'next/navigation';
import Image                                 from 'next/image';

import useAxios        from '@/hook/useAxios';
import useAuthOnServer from '@/hook/auth';
import { setTypeForm }   from '@/store/slices/typeForm';
import { setConfigModal } from '@/store/slices/globalModal';

import DataFormart from '@/libs/time/dateFormat.js';


export default function ClientBox({ data }) {

    /* ── Hooks ─────────────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const [client, setClient] = useState(null);
    const dispatch             = useDispatch();
    const { requestAction }    = useAxios();
    const router               = useRouter();

    /** Lazy-load: solo fetch cuando el card entra en viewport */
    const { ref, inView } = useInView({ triggerOnce: true });


    /* ── Fetch del establecimiento completo al entrar en viewport ──────────── */
    useEffect(() => {
        if (inView) {
            requestAction({ url: `/local/id=${data._id}`, action: 'GET' })
                .then(res => { if (res.status === 200) setClient(res.data); })
                .catch(err => console.error(err));
        }
    }, [inView]);


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


    /* ── Skeleton mientras carga ───────────────────────────────────────────── */
    if (!client) {
        return (
            <div ref={ref} id={`${data._id}-${data?.name}`} className='w-full'>
                <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse flex gap-4'>
                    <div className='w-[140px] h-[100px] bg-gray-200 rounded-lg shrink-0' />
                    <div className='flex-1 flex flex-col gap-2'>
                        <div className='h-4 bg-gray-200 rounded w-2/3' />
                        <div className='h-3 bg-gray-100 rounded w-1/3' />
                        <div className='h-3 bg-gray-100 rounded w-1/2' />
                    </div>
                </div>
            </div>
        );
    }


    /* ── Render completo ───────────────────────────────────────────────────── */
    return (
        <div ref={ref} id={`${data._id}-${data?.name}`} className='w-full'>
            <article className='
                bg-white rounded-xl border border-gray-100 shadow-sm
                hover:shadow-md hover:border-gray-200
                transition-all duration-200
                flex flex-col sm:flex-row overflow-hidden
            '>

                {/* ── COLUMNA IZQUIERDA: Logo + Info básica ────────────── */}
                <div className='sm:w-[200px] shrink-0 flex flex-col items-center p-4 bg-gray-50/50 border-b sm:border-b-0 sm:border-r border-gray-100'>

                    {/* Logo */}
                    <div className='w-[130px] h-[90px] rounded-lg overflow-hidden bg-white border border-gray-200 mb-3 flex items-center justify-center'>
                        {client?.image ? (
                            <img
                                src={client.image}
                                alt={`logo-${client.name}`}
                                className='w-full h-full object-contain'
                            />
                        ) : (
                            <div className='text-gray-300 text-xs text-center'>Sin logo</div>
                        )}
                    </div>

                    {/* Nombre */}
                    <h3 className='text-sm font-bold text-gray-800 text-center leading-tight mb-2'>
                        {client?.name}
                    </h3>

                    {/* Badge de estado */}
                    <span className={`
                        inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold mb-2
                        ${client?.status === 'activo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'}
                    `}>
                        <span className={`w-[5px] h-[5px] rounded-full ${client?.status === 'activo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {client?.status || 'sin estado'}
                    </span>

                    {/* Meta info */}
                    <div className='text-[11px] text-gray-400 text-center space-y-[2px] mb-3'>
                        <p>Idioma: <span className='text-gray-600 font-medium'>{client?.lang || '—'}</span></p>
                        <p>Creado: <span className='text-gray-600 font-medium'>{DataFormart.formatDateApp(client?.date)}</span></p>
                    </div>

                    {/* Botón editar */}
                    <button
                        onClick={handleEdit}
                        className='
                            flex items-center gap-1 px-3 py-[5px] rounded-lg
                            text-[11px] font-semibold
                            border border-blue-200 text-blue-600
                            hover:bg-blue-50 transition-colors
                        '
                    >
                        <Image src='/ico/edit/edit.svg' alt='editar' width={11} height={11} />
                        Editar parámetros
                    </button>
                </div>


                {/* ── COLUMNA DERECHA: Ficha informativa ───────────────── */}
                <div className='flex-1 p-4'>

                    {/* Título de sección */}
                    <div className='flex items-center gap-2 mb-4'>
                        <div className='w-1 h-4 bg-emerald-500 rounded-full' />
                        <h4 className='text-sm font-bold text-gray-700'>Ficha informativa</h4>
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
                            {client?.managers?.length > 0 ? (
                                <ManagerList ids={client.managers} />
                            ) : (
                                <p className='text-[11px] text-gray-400 italic'>Sin gerentes asignados</p>
                            )}
                        </InfoModule>


                        {/* ── Módulo: Horario monitoreo ────────────────── */}
                        <InfoModule
                            icon='/ico/clock/icons8-reloj-despertador-50.png'
                            title='Horario monitoreo'
                            color='amber'
                            configured={!!client?.schedules}
                        >
                            <div className='flex flex-col items-center gap-2 pt-1'>
                                <span className={`
                                    text-[10px] font-semibold px-2 py-[2px] rounded-full
                                    ${client?.schedules ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}
                                `}>
                                    {client?.schedules ? 'Configurado' : 'Sin configurar'}
                                </span>
                                <button
                                    onClick={() => router.push(`/clients&manasgement/time_monitoring?id=${data._id}`)}
                                    className='text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors'
                                >
                                    Gestionar →
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
                                <span className='text-[11px] text-gray-500'>
                                    {client?.dishes?.length > 0
                                        ? `${client.dishes.length} platos registrados`
                                        : 'Sin platos'}
                                </span>
                                <button
                                    onClick={() => router.push(`/clients&manasgement/diches?id=${data._id}`)}
                                    className='text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors'
                                >
                                    Editar →
                                </button>
                            </div>
                        </InfoModule>

                    </div>
                </div>

            </article>
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
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100',   text: 'text-blue-700'   },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100',  text: 'text-amber-700'  },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-700' },
    emerald:{ bg: 'bg-emerald-50',icon: 'bg-emerald-100',text: 'text-emerald-700'},
};

function InfoModule({ icon, title, count, color = 'blue', children }) {
    const c = moduleColors[color] ?? moduleColors.blue;

    return (
        <div className={`${c.bg} rounded-lg p-3 flex flex-col`}>
            {/* Header del módulo */}
            <div className='flex items-center gap-2 mb-2'>
                <div className={`w-6 h-6 ${c.icon} rounded-md flex items-center justify-center shrink-0`}>
                    <img src={icon} alt={title} className='w-[14px] h-[14px]' />
                </div>
                <span className={`text-[12px] font-semibold ${c.text}`}>{title}</span>
                {count !== undefined && (
                    <span className='ml-auto text-[10px] bg-white/80 px-[6px] py-[1px] rounded-full text-gray-500 font-medium'>
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
function ManagerList({ ids }) {
    return (
        <ul className='space-y-1'>
            {ids.map(id => (
                <ManagerItem key={id} id={id} />
            ))}
        </ul>
    );
}

function ManagerItem({ id }) {
    const [mgr, setMgr] = useState(null);
    const { requestAction } = useAxios();

    useEffect(() => {
        requestAction({ url: `/managerLocalAndImgById/id=${id}`, action: 'GET' })
            .then(res => { if (res.data?.[0]) setMgr(res.data[0]); })
            .catch(() => {});
    }, [id]);

    if (!mgr) {
        return <li className='h-3 w-20 bg-gray-200/50 rounded animate-pulse' />;
    }

    return (
        <li className='flex items-center gap-[6px]'>
            <span className='w-[4px] h-[4px] rounded-full bg-blue-400 shrink-0' />
            <p className='text-[11px] text-gray-700 truncate'>
                <span className='font-medium'>{mgr.burden}</span>
                {mgr.name && <span className='text-gray-400'> · {mgr.name}</span>}
            </p>
        </li>
    );
}
