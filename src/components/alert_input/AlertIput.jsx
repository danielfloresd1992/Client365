'use client';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import socket from '@/libs/socket/socketIo';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';




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

    // Monitoreo EN VIVO por local: { idLocal → ['analytical'|'perimeter', …] }.
    // Se siembra desde /monitoring/status (estado durable del watcher) y se
    // actualiza con los eventos 'monitoring-start' / 'monitoring-end'.
    const [liveByLocal, setLiveByLocal] = useState({});
    // Último inicio/fin recibido (se muestra en la barra superior)
    const [lastEvent, setLastEvent] = useState(null);
    // Locales señalados por el corte de silencio: { idLocal → true }.
    // Se siembra desde /monitoring/status (noveltyCheck.flagged) y se REEMPLAZA
    // completo con cada evento 'monitoring-silence' (una lista por corte).
    const [silentByLocal, setSilentByLocal] = useState({});

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

        // Siembra del estado en vivo (qué locales están dentro de su ventana ahora)
        axiosStand.get('/monitoring/status')
            .then(response => {
                const map = {};
                const silent = {};
                (response.data ?? []).forEach(doc => {
                    map[doc.idLocal] = doc.activeTypes ?? [];
                    if (doc.noveltyCheck?.flagged) silent[doc.idLocal] = true;
                });
                setLiveByLocal(map);
                setSilentByLocal(silent);
            })
            .catch(err => console.error('Estado de monitoreo:', err?.message ?? err));

        const scheduleRefresh = () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(loadDayCounts, 2000);
        };

        // Inicio/fin de monitoreo por local (watcher de jarvis_api)
        const handleMonitoringStart = (msm) => {
            setLiveByLocal(prev => {
                const types = new Set(prev[msm.idLocal] ?? []);
                types.add(msm.type);
                return { ...prev, [msm.idLocal]: [...types] };
            });
            setLastEvent({ kind: 'start', name: msm.name, typeLabel: msm.typeLabel ?? msm.type, at: msm.at });
        };

        const handleMonitoringEnd = (msm) => {
            setLiveByLocal(prev => {
                const types = (prev[msm.idLocal] ?? []).filter(t => t !== msm.type);
                return { ...prev, [msm.idLocal]: types };
            });
            setLastEvent({ kind: 'end', name: msm.name, typeLabel: msm.typeLabel ?? msm.type, at: msm.at });
        };

        // Corte de silencio (cada hora): la lista REEMPLAZA a la anterior,
        // así una lista vacía limpia los parpadeos del corte previo.
        const handleMonitoringSilence = (msm) => {
            const silent = {};
            (msm?.flagged ?? []).forEach(f => { silent[f.idLocal] = true; });
            setSilentByLocal(silent);
        };

        // El local señalado envió al grupo (novedad validada + enviada): el
        // backend lo emite en el momento y el aviso rojo se apaga sin esperar
        // al próximo corte.
        const handleSilenceClear = (msm) => {
            setSilentByLocal(prev => {
                if (!msm?.idLocal || !prev[msm.idLocal]) return prev;
                const next = { ...prev };
                delete next[msm.idLocal];
                return next;
            });
        };

        socket.on('created_Alert', scheduleRefresh);
        socket.on('document_updated', scheduleRefresh);
        socket.on('monitoring-start', handleMonitoringStart);
        socket.on('monitoring-end', handleMonitoringEnd);
        socket.on('monitoring-silence', handleMonitoringSilence);
        socket.on('monitoring-silence-clear', handleSilenceClear);

        return () => {
            socket.off('created_Alert', scheduleRefresh);
            socket.off('document_updated', scheduleRefresh);
            socket.off('monitoring-start', handleMonitoringStart);
            socket.off('monitoring-end', handleMonitoringEnd);
            socket.off('monitoring-silence', handleMonitoringSilence);
            socket.off('monitoring-silence-clear', handleSilenceClear);
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
                                    const isSilent = Boolean(silentByLocal[restaurant._id]);
                                    return (
                                        <div key={restaurant._id} className={`w-full flex items-center justify-between rounded-[6px] px-[.25rem] py-[.15rem] ${isSilent ? 'bg-red-50 ring-1 ring-red-300 animate-pulse' : ''}`}>
                                            <div className='flex justify-center items-center gap-[.5rem] min-w-0'>
                                                <div className='w-[30px] h-[30px] overflow-hidden bg-[#dddddd] flex justify-center items-center'>
                                                    <img src={restaurant?.image ?? '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'} alt='ico-restaurastnr' />
                                                </div>
                                                <div className='flex flex-col min-w-0 leading-tight'>
                                                    <label className={`text-[0.8rem] font-normal cursor-pointer truncate ${isSilent ? 'text-red-600 font-semibold' : 'text-[rgb(51_48_48)]'}`} htmlFor={`input-${restaurant.name}-alert`} >{restaurant.name}</label>
                                                    {isSilent && (
                                                        <span className='text-[0.6rem] text-red-600 font-bold'>⚠ Local sin actualización de alerta en el grupo</span>
                                                    )}
                                                </div>
                                                <LiveDot types={liveByLocal[restaurant._id]} />
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
 * Punto pulsante cuando el local está DENTRO de su ventana de monitoreo.
 * El tooltip indica el/los tipos activos (analítico / perimetral).
 */
function LiveDot({ types }) {
    if (!Array.isArray(types) || types.length === 0) return null;
    const label = types.map(t => (t === 'perimeter' ? 'perimetral' : 'analítico')).join(' + ');
    return (
        <span title={`Monitoreo activo: ${label}`} className='relative flex h-[8px] w-[8px] shrink-0'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-[8px] w-[8px] bg-emerald-500'></span>
        </span>
    );
}
