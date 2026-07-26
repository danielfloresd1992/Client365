'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import AlertsChart from './assets/AlertsChart';
import LocalsOverview from './assets/LocalsOverview';
import OperationsToday from './assets/OperationsToday';
import { TickerStat } from './assets/Ticker';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import useDayCounts from '@/hook/useDayCounts';
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

    // Estado vivo (los sockets viven dentro de cada hook)
    const dayCounts = useDayCounts();
    const { liveByLocal, silentByLocal, lastEvent } = useMonitoringLive();
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
        () => buildScheduleGroups({ schedules, clients, isWinter, opDate, minuteNowAxis, liveByLocal, silentByLocal, dayCounts }),
        [schedules, clients, isWinter, opDate, minuteNowAxis, liveByLocal, silentByLocal, dayCounts],
    );

    // Formato analógico 12 h sin espacio: "00:09AM" (la hora 00 = medianoche/
    // mediodía, tal cual el visor mecánico)
    const clockLabel = now
        ? `${String(now.getHours() % 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}${now.getHours() < 12 ? 'AM' : 'PM'}`
        : '00:00AM';
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
                    <div className='leading-snug min-w-0 pr-2'>
                        <h1 className='text-[11px] font-black uppercase tracking-[0.18em] text-gray-800 whitespace-nowrap'>Sala de control</h1>
                        <p className='text-[11px] text-gray-500 capitalize truncate mt-0.5'>{dayLabel} · día operativo 08:00 → 07:00</p>
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
                            ].map(t => (
                                <button
                                    key={t.key}
                                    type='button'
                                    onClick={() => setCentralTab(t.key)}
                                    aria-pressed={centralTab === t.key}
                                    className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                        ${centralTab === t.key
                                            ? 'bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08]'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className='flex-1 min-h-0 overflow-y-auto'>

                        {/* Gráfica: composición del día por local (assets/AlertsChart) */}
                        {centralTab === 'grafica' && (
                        <AlertsChart dayCounts={dayCounts} clients={clients} />
                        )}

                        {/* Panorama unificado: horario + barra comparativa
                            de alertas por local (assets/LocalsOverview) */}
                        {centralTab === 'panorama' && (
                        <LocalsOverview groups={scheduleGroups} />
                        )}
                        </div>
                </div>

                {/* ── Riel derecho: personal que viene hoy, altura completa ── */}
                <aside className='shrink-0 lg:w-[280px] lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col min-h-[220px] lg:min-h-0'>
                    <OperationsToday now={now} />
                </aside>
        </main>
    );
}
