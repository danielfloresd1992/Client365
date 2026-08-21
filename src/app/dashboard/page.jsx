'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import AlertsChart from './assets/AlertsChart';
import LocalsOverview from './assets/LocalsOverview';
import DvrFailures from './assets/DvrFailures';
import OperationsToday from './assets/OperationsToday';
import ConnectedUsers from './assets/ConnectedUsers';
import { TickerStat } from './assets/Ticker';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import useDayCounts from '@/hook/useDayCounts';
import useBonusCategories from '@/hook/useBonusCategories';
import { listaDeCategorias } from '@/libs/alerts/categories';
import useMonitoringLive from '@/hook/useMonitoringLive';
import useLiveClock from '@/hook/useLiveClock';
import { getAllMonitoringSchedules } from '@/libs/ajaxClient/schedule.fecth';
import { getUsWinterActive } from '@/libs/ajaxClient/time.fecth';
import { operationalDateOf, minuteOnAxis } from '@/libs/time/operationalDay';
import { buildScheduleGroups } from '@/libs/parser/monitoringToday';

/*
 * Panel analítico — SALA DE CONTROL del día operativo (08:00 → 07:00).
 *
 * Esta página solo ORQUESTA: el trabajo vive en sus piezas.
 *   · Fetching por recurso:  libs/ajaxClient/{noveltyReport,monitoring,
 *     schedule,time}.fecth.js
 *   · Sockets + estado vivo: hook/useDayCounts (conteos con refetch),
 *     hook/useMonitoringLive (en vivo + silencio), hook/useLiveClock (reloj)
 *   · Lógica pura del horario: libs/time/operationalDay (eje del día) y
 *     libs/parser/monitoringToday (buildScheduleGroups)
 *   · UI: assets/Ticker (odómetros), assets/AlertsChart (ApexCharts),
 *     assets/LocalsOverview (panorama), assets/OperationsToday (personal)
 *
 * Disposición:
 *   ┌──────────────────────────────────────────────┬──────────────┐
 *   │ CINTA: contadores vivos · reloj · evento     │              │
 *   ├──────────────────────────────────────────────┤  VIENEN HOY  │
 *   │ [🔗 Horario + alertas] [📊 Gráfica detallada]│  (riel       │
 *   ├──────────────────────────────────────────────┤  derecho a   │
 *   │ Pestaña activa a todo el alto                │  toda altura)│
 *   └──────────────────────────────────────────────┴──────────────┘
 */

export default function Dashboard() {

    const clients = useSelector(store => store.clients);

    /*
     * Filtros por categoría. Son DOS cosas distintas y por eso van separados:
     *
     *   · La OPERATIVA ('delay', 'food'…) dice de qué se trata la alerta.
     *   · La de BONIFICACIÓN dice con qué criterio cuenta para el bono.
     *
     * Se combinan: elegir las dos muestra solo lo que cumple ambas.
     *
     * El filtrado ocurre en el SERVIDOR y no acá: el endpoint devuelve totales
     * ya agregados por local, no la lista de novedades, así que no hay nada que
     * recontar del lado del cliente. Cambiar un filtro vuelve a pedir el conteo.
     */
    const [categoryFilter, setCategoryFilter] = useState('');
    const [bonusFilter, setBonusFilter] = useState('');

    const categoriasOperativas = useMemo(() => listaDeCategorias(), []);
    const { categorias: categoriasDeBono, sinCatalogo: sinCatalogoDeBono } = useBonusCategories(false);

    // Estado vivo (los sockets viven dentro de cada hook)
    const dayCounts = useDayCounts({ category: categoryFilter, bonusCategory: bonusFilter });
    const { liveByLocal, silentByLocal, exemptByLocal, lastEvent } = useMonitoringLive();
    const now = useLiveClock();

    // Horarios de monitoreo + flag de invierno (una vez por montaje)
    const [schedules, setSchedules] = useState([]);
    const [isWinter, setIsWinter] = useState(false);
    // Pestaña activa de la zona central: 'panorama' (horario + alertas) | 'grafica'
    const [centralTab, setCentralTab] = useState('panorama');

    useEffect(() => {
        getAllMonitoringSchedules()
            .then(setSchedules)
            .catch(err => console.error('Horarios de monitoreo:', err?.message ?? err));
        getUsWinterActive()
            .then(setIsWinter)
            .catch(() => {});
    }, []);

    // Derivados del reloj + grupos del horario (lógica pura en libs)
    const opDate = useMemo(() => operationalDateOf(now), [now]);
    const minuteNowAxis = useMemo(() => minuteOnAxis(now), [now]);

    const scheduleGroups = useMemo(
        () => buildScheduleGroups({ schedules, clients, isWinter, opDate, minuteNowAxis, liveByLocal, silentByLocal, exemptByLocal, dayCounts }),
        [schedules, clients, isWinter, opDate, minuteNowAxis, liveByLocal, silentByLocal, exemptByLocal, dayCounts],
    );

    // Formato analógico 12 h con segundos, sin espacio: "00:09:23AM" (la hora
    // 00 = medianoche/mediodía, tal cual el visor mecánico)
    const clockLabel = now
        ? `${String(now.getHours() % 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}${now.getHours() < 12 ? 'AM' : 'PM'}`
        : '00:00:00AM';
    const dayLabel = opDate
        ? opDate.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';

    // Un solo instrumento continuo: columna central (cinta + pestañas) y el
    // riel de Operaciones a la derecha. El dock de navegación lo aporta
    // AppShell (layout raíz), común a toda la app.
    return (
        <main className='w-full h-full bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col lg:flex-row overflow-hidden'>

                <div className='flex-1 min-w-0 min-h-0 flex flex-col'>

                {/* ── Cinta superior: contadores vivos, reloj y último evento ── */}
                <header className='shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-x-6 gap-y-2 flex-wrap'>
                    <div className='flex items-center gap-2.5 min-w-0 pr-2'>
                        {/* Emblema de sala de control: medidor en placa clara */}
                        <span className='shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'>
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-[18px] h-[18px]'>
                                <path d='m12 14 4-4' />
                                <path d='M3.34 19a10 10 0 1 1 17.32 0' />
                            </svg>
                        </span>
                        <div className='leading-tight min-w-0'>
                            <h1 className='flex items-center gap-1.5 text-[15px] font-black tracking-tight text-slate-900 whitespace-nowrap'>
                                Sala de control
                                <span className='text-[8.5px] font-black uppercase tracking-[0.14em] text-emerald-600 border border-emerald-300 rounded px-1 py-[1px]'>Live</span>
                            </h1>
                            <p className='text-[10.5px] text-gray-500 capitalize truncate'>{dayLabel} · día operativo 08:00 → 07:00</p>
                        </div>
                    </div>

                    <div className='flex items-center gap-x-5 gap-y-2 ml-auto flex-wrap justify-end'>
                        {lastEvent && (
                            <span className={`text-[10.5px] font-semibold truncate max-w-[220px] ${lastEvent.kind === 'start' ? 'text-emerald-600' : 'text-red-500'}`}
                                title={`${lastEvent.kind === 'start' ? 'Inicio' : 'Fin'} de monitoreo ${lastEvent.typeLabel} — ${lastEvent.name}`}>
                                {lastEvent.kind === 'start' ? '▶' : '■'} {lastEvent.typeLabel} — {lastEvent.name}
                            </span>
                        )}
                        <TickerStat label='Hoy' value={dayCounts?.totals?.total ?? 0} className='text-slate-800' />
                        <TickerStat label='✓ Aprob.' value={dayCounts?.totals?.positivas ?? 0} className='text-emerald-600' />
                        <TickerStat label='◌ Ignor.' value={dayCounts?.totals?.ignoradas ?? 0} className='text-slate-400' />
                        <TickerStat label='➤ Enviadas' value={dayCounts?.totals?.enviadas ?? 0} className='text-amber-600' />

                        <div className='flex flex-col items-end gap-[3px] leading-none border-l border-gray-200 pl-4'>
                            <AnalogCounter value={clockLabel} fontSize='1.05rem' weight={500} color='#fbbf24' />
                            <span className='flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600'>
                                <span className='relative flex h-[6px] w-[6px]'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                                    <span className='relative inline-flex rounded-full h-[6px] w-[6px] bg-emerald-500'></span>
                                </span>
                                En vivo
                            </span>
                        </div>
                    </div>
                </header>

                        {/* Pestañas: gráfica y horario comparten la zona central;
                            cada vista usa TODO el alto con su propio scroll */}
                        <div className='shrink-0 px-3 py-1.5 border-b border-gray-100 flex items-center gap-1.5'>
                            {[
                                { key: 'panorama', label: '🔗 Horario + alertas' },
                                { key: 'grafica', label: '📊 Gráfica detallada' },
                                { key: 'dvr', label: '⛔ Falla con DVR' },
                            ].map(t => (
                                <button
                                    key={t.key}
                                    type='button'
                                    onClick={() => setCentralTab(t.key)}
                                    aria-pressed={centralTab === t.key}
                                    className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                        ${centralTab === t.key
                                            ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                >
                                    {t.label}
                                </button>
                            ))}

                            {/* ── Filtros por categoría ──────────────────────────
                                Afectan a TODO el conteo del día: la cinta de
                                arriba, la gráfica y el panorama beben del mismo
                                `dayCounts`. Por eso, con un filtro puesto se
                                marca "filtrado": si no, los totales se leerían
                                como si fueran los del día completo. */}
                            <div className='ml-auto flex items-center gap-1.5'>

                                {(categoryFilter || bonusFilter) && (
                                    <button
                                        type='button'
                                        onClick={() => { setCategoryFilter(''); setBonusFilter(''); }}
                                        title='Quitar los filtros y volver al día completo'
                                        className='px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                   text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors'
                                    >
                                        Filtrado ✕
                                    </button>
                                )}

                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    title='Filtrar por categoría de la alerta'
                                    className='px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-600
                                               bg-white border border-gray-200 hover:border-gray-300
                                               focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
                                >
                                    <option value=''>Todas las categorías</option>
                                    {categoriasOperativas.map(c => (
                                        <option key={c.value} value={c.value}>{c.es}</option>
                                    ))}
                                </select>

                                <select
                                    value={bonusFilter}
                                    onChange={e => setBonusFilter(e.target.value)}
                                    disabled={sinCatalogoDeBono}
                                    title={sinCatalogoDeBono
                                        ? 'El catálogo de bonificación todavía no está disponible en el servidor'
                                        : 'Filtrar por categoría de bonificación'}
                                    className='px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-600
                                               bg-white border border-gray-200 hover:border-gray-300
                                               focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors
                                               disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    <option value=''>
                                        {sinCatalogoDeBono ? 'Bonificación no disponible' : 'Toda bonificación'}
                                    </option>
                                    {categoriasDeBono.map(c => (
                                        <option key={c.value} value={c.value}>{c.es}</option>
                                    ))}
                                </select>

                            </div>
                        </div>

                        <div className='flex-1 min-h-0 overflow-y-auto'>

                        {/* Gráfica: composición del día por local (assets/AlertsChart) */}
                        {centralTab === 'grafica' && (
                        <AlertsChart dayCounts={dayCounts} clients={clients} liveByLocal={liveByLocal} silentByLocal={silentByLocal} />
                        )}

                        {/* Panorama unificado: horario + barra comparativa
                            de alertas por local (assets/LocalsOverview) */}
                        {centralTab === 'panorama' && (
                        <LocalsOverview groups={scheduleGroups} now={now} />
                        )}

                        {/* Fallas de conexión con el DVR: lo caído ahora en
                            vivo, el mapa de calor del último mes y quién se cae
                            más (assets/DvrFailures).

                            No recibe `dayCounts`: bebe del recurso dvr-failure,
                            que es el que guarda los episodios. El reporte del
                            día solo sabe quién está caído AHORA — para el
                            historial hace falta la colección. */}
                        {centralTab === 'dvr' && (
                        <DvrFailures />
                        )}
                        </div>
                </div>

                {/* ── Riel derecho: personal (70%) + conectados App Manager (30%).
                    Responsivo: en lg va al lado a toda altura con el split 70/30;
                    en móvil baja debajo y cada sección apila con su alto mínimo. ── */}
                <aside className='shrink-0 lg:w-[280px] lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col'>
                    <div className='flex flex-col overflow-hidden min-h-[280px] lg:min-h-0 lg:h-[70%]'>
                        <OperationsToday now={now} />
                    </div>
                    <div className='flex flex-col overflow-hidden min-h-[170px] lg:min-h-0 lg:h-[30%] border-t border-gray-200'>
                        <ConnectedUsers />
                    </div>
                </aside>
        </main>
    );
}
