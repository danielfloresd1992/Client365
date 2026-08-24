'use client';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';
import useMonitoringLive from '@/hook/useMonitoringLive';
import useDayCounts from '@/hook/useDayCounts';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import { formatSince } from '@/libs/time/operationalDay';




export default function AlertInputLive({ openAside }) {


    const clients = useSelector(store => store.clients);
    const filterAlert = useSelector(state => state.filterClientList);

    /**
     * Conteo del día operativo 08:00→07:00, EN VIVO.
     *
     * Antes esta pantalla pedía `/noveltyReport/today` por su cuenta y se
     * suscribía a los sockets a mano. Era la misma carga que hace el panel de
     * control, escrita dos veces — y le faltaba lo único que no se podía
     * deducir del conteo: QUÉ ESTABLECIMIENTO SE QUEDÓ SIN CÁMARAS.
     *
     * `useDayCounts` trae las dos cosas y, sobre todo, trae el trato distinto
     * que necesita cada una: las novedades entran a goteo y su refresco se
     * agrupa dos segundos, pero un DVR que se cae parchea la fila EN EL ACTO,
     * porque es justo el momento en que alguien mira esta lista para saber
     * quién dejó de ver.
     *
     *   { byId: { idLocal → { total, positivas, …, dvr, status } },
     *     totals, status, dvr: { downNow, affectedToday } }
     */
    const dayCounts = useDayCounts();

    // openAside en un ref: el efecto no captura una versión vieja
    const openAsideRef = useRef(openAside);
    openAsideRef.current = openAside;
    // Último total de "enviadas al grupo": el aside solo se abre cuando SUBE
    const prevEnviadasRef = useRef(null);

    /**
     * Abrir el aside únicamente cuando SUBE el total de enviadas al grupo.
     *
     * La primera lectura no cuenta —no hay con qué comparar—, y por eso el ref
     * arranca en null y no en cero: con cero, abrir la pantalla con una
     * novedad ya enviada dispararía el aside solo.
     */
    useEffect(() => {
        const enviadas = dayCounts?.totals?.enviadas;
        if (typeof enviadas !== 'number') return;

        if (prevEnviadasRef.current !== null && enviadas > prevEnviadasRef.current) {
            if (typeof openAsideRef.current === 'function') openAsideRef.current();
        }
        prevEnviadasRef.current = enviadas;
    }, [dayCounts?.totals?.enviadas]);

    // Monitoreo EN VIVO + avisos de silencio + último inicio/fin: hook
    // compartido con el dashboard. La verdad sale del HORARIO
    // (Schedules/MonitoringRange vía /monitoring/status, re-sembrado cada
    // minuto) y se mantiene con los eventos 'monitoring-*' del watcher: un
    // local fuera de su rango (start–end) de hoy nunca queda señalado.
    const { liveByLocal, silentByLocal, lastEvent } = useMonitoringLive();

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

                            {/* Sin cámaras AHORA. Aparece solo cuando hay
                                alguno: un contador en cero permanente enseña a
                                no mirarlo, y este es el que hay que ver. */}
                            {(dayCounts?.dvr?.downNow ?? 0) > 0 && (
                                <span className='text-black font-black flex items-center gap-[.25rem]'
                                    title='Establecimientos sin cámaras en este momento'>
                                    ⛔ Sin cámaras <Odometer value={dayCounts.dvr.downNow} className='font-bold' color='#fff' background='#000' />
                                </span>
                            )}

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
                    Object.entries(groupByFranchiseComprehensive(clients.filter(c => c?.isActive !== false))).map(([franchiseName, franchiseRestaurants]) => {

                    // Cuántos de esta franquicia están sin cámaras ahora. La
                    // franja de abajo existía con un cero fijo esperando este
                    // dato desde que se escribió.
                    const caidosAqui = franchiseRestaurants.filter(
                        r => dayCounts?.byId?.[r._id]?.dvr?.down,
                    ).length;

                    return (
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

                                    // Cámaras. MANDA SOBRE TODO LO DEMÁS: un
                                    // local sin DVR no puede reportar, así que
                                    // señalarlo por callado sería reclamarle
                                    // algo que no puede hacer.
                                    //
                                    // `volvio` es el otro lado del mismo dato:
                                    // ya está en línea, pero hoy estuvo ciego.
                                    // Sin eso, un conteo bajo se lee como
                                    // desidia del operador.
                                    const dvr = dayCounts?.byId?.[restaurant._id]?.dvr;
                                    const sinCamaras = Boolean(dvr?.down);
                                    const volvio = !sinCamaras && (dvr?.episodes ?? 0) > 0;
                                    return (
                                        <div key={restaurant._id} className={`w-full flex items-center justify-between rounded-[6px] px-[.25rem] py-[.15rem] transition-colors ${sinCamaras ? 'bg-black/[0.06] ring-1 ring-black' : isSilent ? 'bg-red-50 ring-1 ring-red-300 animate-pulse' : inAnalytical ? 'bg-emerald-50/60' : inPerimeter ? 'bg-sky-50/60' : ''}`}>
                                            <div className='flex justify-center items-center gap-[.5rem] min-w-0'>
                                                <div className='w-[30px] h-[30px] overflow-hidden bg-[#dddddd] flex justify-center items-center'>
                                                    <img src={restaurant?.image ?? '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'} alt='ico-restaurastnr' />
                                                </div>
                                                <div className='flex flex-col min-w-0 leading-tight'>
                                                    <label className={`text-[0.8rem] cursor-pointer truncate ${sinCamaras ? 'text-black font-black' : isSilent ? 'text-red-600 font-semibold' : inWindow ? 'text-slate-800 font-medium' : 'text-slate-500 font-normal'}`} htmlFor={`input-${restaurant.name}-alert`} >{restaurant.name}</label>

                                                    {sinCamaras && (
                                                        <span className='text-[0.6rem] text-black font-black'
                                                            title={`Falla de conexión con DVR${dvr.failedAtLabel ? ` desde las ${dvr.failedAtLabel}` : ''}${dvr.reportedByName ? ` · lo pasó ${dvr.reportedByName}` : ''}`}>
                                                            ⛔ Falla de conexión con DVR{dvr.failedAtLabel ? ` · desde ${dvr.failedAtLabel}` : ''}
                                                        </span>
                                                    )}

                                                    {/* Ya volvió, pero hoy estuvo ciego. Explica
                                                        un conteo bajo sin señalar al operador. */}
                                                    {volvio && (
                                                        <span className='text-[0.6rem] text-slate-500 font-semibold'
                                                            title={`Recuperó la conexión${dvr.restoredAtLabel ? ` a las ${dvr.restoredAtLabel}` : ''}`}>
                                                            ✓ Conexión restablecida{dvr.restoredAtLabel ? ` · ${dvr.restoredAtLabel}` : ''}
                                                            {dvr.episodes > 1 ? ` · ${dvr.episodes} caídas hoy` : ''}
                                                        </span>
                                                    )}

                                                    {isSilent && !sinCamaras && (
                                                        <span className='text-[0.6rem] text-red-600 font-bold'>⚠ Sin actualización al grupo{silentInfo?.lastSentAt ? ` · ${formatSince(silentInfo.lastSentAt)}` : ' · sin envíos hoy'}</span>
                                                    )}
                                                </div>

                                                {/* Sin cámaras el punto es negro y no pulsa: el
                                                    monitoreo puede seguir en ventana, pero no hay
                                                    imagen que mirar. */}
                                                {sinCamaras
                                                    ? <span title='Sin cámaras' className='shrink-0 h-[9px] w-[9px] rounded-full bg-black' />
                                                    : <MonitoringBadge types={monitorTypes} />}
                                            </div>

                                            <LocalDayCounts counts={dayCounts?.byId?.[restaurant._id]} loaded={Boolean(dayCounts)} />
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='w-full flex items-center justify-between gap-[.5rem]'>
                                <p className={`text-sm ${caidosAqui ? 'font-bold text-black' : 'font-medium text-slate-500'}`}>
                                    Locales caídos:
                                </p>
                                <span className={`w-[50px] text-center text-sm font-bold tabular-nums rounded py-[.1rem]
                                                  ${caidosAqui ? 'bg-black text-white' : 'text-slate-400 border border-slate-200'}`}
                                    title={caidosAqui
                                        ? `${caidosAqui} sin cámaras en ${franchiseName}`
                                        : `Ninguno sin cámaras en ${franchiseName}`}>
                                    {caidosAqui}
                                </span>
                            </div>
                            <hr style={{ color: '#000' }} />
                        </div>
                    );
                    })
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
            <span className='flex items-center gap-[.25rem] text-black'><span className='h-[7px] w-[7px] rounded-full bg-black'></span>Sin cámaras</span>
        </div>
    );
}
