'use client';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import socket from '@/libs/socket/socketIo';
import useMonitoringLive from '@/hook/useMonitoringLive';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import { formatSince } from '@/libs/time/operationalDay';




export default function AlertInputLive({ openAside }) {


    const clients = useSelector(store => store.clients);
    const filterAlert = useSelector(state => state.filterClientList);

    // Conteo de novedades del día operativo 08:00→07:00 (GET /noveltyReport/today):
    // { byId: { idLocal → {total, positivas, negativas, ignoradas, enviadas} }, totals }
    const [dayCounts, setDayCounts] = useState(null);
    const refreshTimerRef = useRef(null);
    // openAside en un ref: el efecto de montaje no captura una versión vieja
    const openAsideRef = useRef(openAside);
    openAsideRef.current = openAside;
    // Último total de "enviadas al grupo": el aside solo se abre cuando SUBE
    const prevEnviadasRef = useRef(null);

    // Monitoreo EN VIVO + avisos de silencio + último inicio/fin: hook
    // compartido con el dashboard. La verdad sale del HORARIO
    // (Schedules/MonitoringRange vía /monitoring/status, re-sembrado cada
    // minuto) y se mantiene con los eventos 'monitoring-*' del watcher: un
    // local fuera de su rango (start–end) de hoy nunca queda señalado.
    const { liveByLocal, silentByLocal, lastEvent } = useMonitoringLive();

    const loadDayCounts = () => {
        axiosStand.get('/noveltyReport/today')
            .then(response => {
                const byId = {};
                (response.data?.franchises ?? []).forEach(franchise => {
                    (franchise.locals ?? []).forEach(local => {
                        if (local.idLocal) byId[local.idLocal] = local;
                    });
                });
                setDayCounts({ byId, totals: response.data?.totals ?? null });

                // Abrir el aside únicamente cuando cambia la propiedad de envío
                // al grupo: el total de "enviadas" superó al del refresco anterior.
                // La carga inicial (sin valor previo) no lo dispara.
                const enviadas = response.data?.totals?.enviadas ?? 0;
                if (prevEnviadasRef.current !== null && enviadas > prevEnviadasRef.current) {
                    if (typeof openAsideRef.current === 'function') openAsideRef.current();
                }
                prevEnviadasRef.current = enviadas;
            })
            .catch(err => {
                // Endpoint no disponible (p. ej. API sin desplegar): '—' en vez de
                // dejar el indicador de carga para siempre.
                console.error('Conteo de novedades del día:', err?.message ?? err);
                setDayCounts({ byId: {}, totals: null });
            });
    };

    // Carga inicial + tiempo real: crear / validar / enviar una novedad emite
    // 'created_Alert' / 'document_updated' por socket → refetch DEBOUNCED (2s)
    // que agrupa ráfagas y mantiene los buckets siempre consistentes.
    useEffect(() => {
        loadDayCounts();

        const scheduleRefresh = () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(loadDayCounts, 2000);
        };

        socket.on('created_Alert', scheduleRefresh);
        socket.on('document_updated', scheduleRefresh);

        return () => {
            socket.off('created_Alert', scheduleRefresh);
            socket.off('document_updated', scheduleRefresh);
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);







    return (
        <div className='w-full h-full flex flex-col'>
            <header className='w-full h-[44px] bg-[rgb(237_237_237)] p-[.5rem] flex items-center'>
                <h2 className='text-black'>Reporte de alertas</h2>
            </header>

            <div className='w-full h-[calc(100%_-_44px)] overflow-y-scroll'>
                {/* Totales del día operativo (08:00→07:00), en vivo por socket */}
                {dayCounts?.totals && (
                    <div className='sticky top-0 z-[1] bg-white/95 backdrop-blur-sm border-b border-slate-200'>
                        {/* Totales del día con su etiqueta en palabra (enseñan qué significa cada símbolo) */}
                        <div className='px-[.5rem] pt-[.45rem] pb-[.3rem] flex items-center gap-[.8rem] text-[0.78rem] tabular-nums flex-wrap'>
                            <span className='font-bold text-slate-700 flex items-center gap-[.25rem]'>Hoy: <Odometer value={dayCounts.totals.total} className='text-[0.95rem]' /></span>
                            <span className='text-emerald-600 font-semibold flex items-center gap-[.25rem]'>✓ Aprobadas <Odometer value={dayCounts.totals.positivas} className='font-bold' /></span>
                            <span className='text-slate-400 font-semibold flex items-center gap-[.25rem]'>◌ Ignoradas <Odometer value={dayCounts.totals.ignoradas} className='font-bold' /></span>
                            <span className='text-amber-600 font-semibold flex items-center gap-[.25rem]'>➤ Enviadas <Odometer value={dayCounts.totals.enviadas} className='font-bold' /></span>
                            {lastEvent && (
                                <span className={`ml-auto text-[0.68rem] font-semibold truncate max-w-[48%] ${lastEvent.kind === 'start' ? 'text-emerald-600' : 'text-red-500'}`}
                                    title={`${lastEvent.kind === 'start' ? 'Inicio' : 'Fin'} de monitoreo ${lastEvent.typeLabel} en ${lastEvent.name}`}>
                                    {lastEvent.kind === 'start' ? '▶ Inicio' : '■ Fin'} {lastEvent.typeLabel} — {lastEvent.name}
                                </span>
                            )}
                        </div>
                        <MonitoringLegend />
                        {/* Encabezados de columna: misma grilla fija que los contadores de
                            cada fila, así cada etiqueta queda EXACTAMENTE sobre su columna */}
                        <div className='px-[.5rem] pb-[.35rem] flex justify-end'>
                            <span className={`${COUNTS_COLS} text-[0.55rem] uppercase font-bold whitespace-nowrap`}>
                                <span className='justify-self-end text-slate-500'>Total</span>
                                <span className='justify-self-end text-emerald-600'>✓Apr.</span>
                                <span className='justify-self-end text-slate-400'>◌Ign.</span>
                                <span className='justify-self-end text-amber-600'>➤Env.</span>
                            </span>
                        </div>
                    </div>
                )}
                {
                    Object.entries(groupByFranchiseComprehensive(clients.filter(c => c?.isActive !== false))).map(([franchiseName, franchiseRestaurants]) => (
                        <div key={franchiseName} className='p-[.5rem] flex flex-col gap-[1rem]'>
                            <div className='w-full flex items-center justify-between mb-[.5rem]'>
                                <h3 className='font-medium text-sm text-justify'>{franchiseName}</h3>
                                <div className='flex items-center gap-[.5rem]'>
                                    <p className='text-sm text-justify tabular-nums flex items-center gap-[.3rem]'>
                                        Total: <Odometer value={franchiseRestaurants.reduce((sum, r) => sum + (dayCounts?.byId?.[r._id]?.total ?? 0), 0)} className='font-bold' />
                                    </p>
                                </div>

                            </div>

                            <div className="grid gap-[.5rem] grid-cols-1">
                                {franchiseRestaurants.map(restaurant => {
                                    if (filterAlert.isActivated && filterAlert?.clientList?.length > 0 && filterAlert?.clientList.indexOf(restaurant._id) < 0) return null;
                                    // Monitoreo EN VIVO del local (verdad del horario): tipos activos
                                    // ahora mismo. Diferencia analítico/perimetral y dentro/fuera de rango.
                                    const monitorTypes = liveByLocal[restaurant._id] ?? [];
                                    const inAnalytical = monitorTypes.includes('analytical');
                                    const inPerimeter = monitorTypes.includes('perimeter');
                                    const inWindow = inAnalytical || inPerimeter;
                                    // Aviso de silencio SOLO con el monitoreo analítico en ventana:
                                    // fuera de su rango del día no hay nada que reclamarle al local.
                                    const silentInfo = silentByLocal[restaurant._id];
                                    const isSilent = Boolean(silentInfo) && inAnalytical;
                                    return (
                                        <div key={restaurant._id} className={`w-full flex items-center justify-between rounded-[6px] px-[.25rem] py-[.15rem] transition-colors ${isSilent ? 'bg-red-50 ring-1 ring-red-300 animate-pulse' : inAnalytical ? 'bg-emerald-50/60' : inPerimeter ? 'bg-sky-50/60' : ''}`}>
                                            <div className='flex justify-center items-center gap-[.5rem] min-w-0'>
                                                <div className='w-[30px] h-[30px] overflow-hidden bg-[#dddddd] flex justify-center items-center'>
                                                    <img src={restaurant?.image ?? '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'} alt='ico-restaurastnr' />
                                                </div>
                                                <div className='flex flex-col min-w-0 leading-tight'>
                                                    <label className={`text-[0.8rem] cursor-pointer truncate ${isSilent ? 'text-red-600 font-semibold' : inWindow ? 'text-slate-800 font-medium' : 'text-slate-500 font-normal'}`} htmlFor={`input-${restaurant.name}-alert`} >{restaurant.name}</label>
                                                    {isSilent && (
                                                        <span className='text-[0.6rem] text-red-600 font-bold'>⚠ Sin actualización al grupo{silentInfo?.lastSentAt ? ` · ${formatSince(silentInfo.lastSentAt)}` : ' · sin envíos hoy'}</span>
                                                    )}
                                                </div>
                                                <MonitoringBadge types={monitorTypes} />
                                            </div>

                                            <LocalDayCounts counts={dayCounts?.byId?.[restaurant._id]} loaded={Boolean(dayCounts)} />
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='w-full flex items-center gap-[.5rem] flex justify-between'>
                                <p className='font-medium text-sm text-justify text-black'>Locales caidos:</p>
                                <input className='w-[50px] p-[0_1rem_0_0] text-center' type='text' value={0} readOnly />
                            </div>
                            <hr style={{ color: '#000' }} />
                        </div>
                    ))
                }
            </div>
        </div>
    );
}


/**
 * Conteo del día operativo para un local:
 * total · ✓ aprobadas · ◌ ignoradas · ➤ enviadas al grupo.
 * Sin datos para el local (fuera del horario de hoy) muestra un guion.
 */
// Anchos FIJOS por columna: así los contadores de cada fila quedan alineados
// verticalmente con los de arriba y abajo, y con los ENCABEZADOS de columna
// (misma grilla en ambos → cada etiqueta cae exactamente sobre su número).
const COUNTS_COLS = 'grid grid-cols-[2.6rem_3rem_3rem_3rem] items-center';
const COUNTS_GRID = `${COUNTS_COLS} text-[0.78rem] tabular-nums leading-none shrink-0`;

function LocalDayCounts({ counts, loaded }) {
    // Los placeholders ocupan el MISMO ancho que la grilla para no descuadrar
    if (!loaded) return <span className={`${COUNTS_GRID} text-slate-300`}><span className='justify-self-end col-span-4'>…</span></span>;
    if (!counts) return <span className={`${COUNTS_GRID} text-slate-300`} title='Sin horario de monitoreo hoy'><span className='justify-self-end col-span-4'>—</span></span>;

    return (
        <span className={COUNTS_GRID}>
            <span className='justify-self-end font-bold text-slate-800 text-[0.88rem]' title='Total del día'><Odometer value={counts.total} /></span>
            <span className='justify-self-end text-emerald-600 font-semibold flex items-center gap-[.1rem]' title='Aprobadas'>✓<Odometer value={counts.positivas} /></span>
            <span className='justify-self-end text-slate-400 font-semibold flex items-center gap-[.1rem]' title='Ignoradas (sin validar)'>◌<Odometer value={counts.ignoradas} /></span>
            <span className='justify-self-end text-amber-600 font-semibold flex items-center gap-[.1rem]' title='Enviadas al grupo'>➤<Odometer value={counts.enviadas} /></span>
        </span>
    );
}


/**
 * Odómetro: envoltorio del AnalogCounter compartido (visor analógico con
 * animación mecánica al cambiar). Panel oscuro opaco con dígitos claros; el
 * color se puede afinar por prop. Relleno compacto para caber en la grilla.
 */
function Odometer({ value, className = '', color = '#f1f5f9', background = '#4b5563' }) {
    return (
        <AnalogCounter
            value={Math.max(0, Number(value) || 0)}
            color={color}
            background={background}
            fontSize='1em'
            pad='0.1em 0.2em'
            className={`tabular-nums ${className}`}
        />
    );
}


/**
 * Metadatos por tipo de monitoreo. El color diferencia de un vistazo:
 *   · Analítico  → verde (IA vigilando/analizando cámaras)
 *   · Perimetral → azul  (vigilancia de perímetro)
 * Se explican una sola vez en la leyenda del encabezado (MonitoringLegend).
 */
const MONITOR_TYPES = {
    analytical: { label: 'Analítico', dot: 'bg-emerald-500', ping: 'bg-emerald-400' },
    perimeter:  { label: 'Perimetral', dot: 'bg-sky-500', ping: 'bg-sky-400' },
};
const MONITOR_ORDER = ['analytical', 'perimeter'];

/**
 * Indicador de monitoreo EN VIVO del local:
 *   · Dentro de ventana → un punto PULSANTE por tipo activo, con su color
 *     (verde analítico / azul perimetral); el tooltip da el nombre.
 *   · Fuera de ventana → un punto HUECO apagado ("Fuera de horario").
 */
function MonitoringBadge({ types }) {
    const active = MONITOR_ORDER.filter(t => Array.isArray(types) && types.includes(t));
    if (active.length === 0) {
        return <span title='Fuera de horario de monitoreo' className='shrink-0 h-[9px] w-[9px] rounded-full border border-slate-300' />;
    }
    return (
        <span className='shrink-0 flex items-center gap-[.25rem]'>
            {active.map(t => {
                const m = MONITOR_TYPES[t];
                return (
                    <span key={t} title={`Monitoreo ${m.label.toLowerCase()} activo`} className='relative flex h-[8px] w-[8px]'>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${m.ping} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-[8px] w-[8px] ${m.dot}`}></span>
                    </span>
                );
            })}
        </span>
    );
}

/**
 * Leyenda compacta de los indicadores de monitoreo (una sola vez, en el
 * encabezado sticky): explica el color de cada punto para que las filas
 * puedan quedarse en una sola línea sin etiquetas de texto.
 */
function MonitoringLegend() {
    return (
        <div className='px-[.5rem] pb-[.35rem] flex flex-wrap items-center gap-x-[.7rem] gap-y-[.15rem] text-[0.58rem] font-semibold'>
            <span className='text-slate-400 uppercase tracking-wide'>Monitoreo</span>
            <span className='flex items-center gap-[.25rem] text-emerald-600'><span className='h-[7px] w-[7px] rounded-full bg-emerald-500'></span>Analítico</span>
            <span className='flex items-center gap-[.25rem] text-sky-600'><span className='h-[7px] w-[7px] rounded-full bg-sky-500'></span>Perimetral</span>
            <span className='flex items-center gap-[.25rem] text-slate-400'><span className='h-[7px] w-[7px] rounded-full border border-slate-300'></span>Fuera de horario</span>
        </div>
    );
}
