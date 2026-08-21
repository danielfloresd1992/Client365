'use client';
import { useCallback, useMemo, useState } from 'react';
import { ActivityGreen } from '@/components/ui/mono-activity-green';
import useDvrFailures from '@/hook/useDvrFailures';

/*
 * PESTAÑA "FALLA CON DVR" del panel analítico.
 *
 * Tres bloques, en el orden en que se preguntan:
 *
 *   1. QUÉ HAY CAÍDO AHORA — en vivo, con la hora y cuánto lleva.
 *   2. EL ÚLTIMO MES — mapa de calor por día operativo.
 *   3. QUIÉN SE CAE MÁS — ranking por establecimiento, y el detalle de cada
 *      episodio del mes.
 *
 * Todo sale del recurso `dvr-failure` de api_jarvis365. El estado vivo lo
 * mantiene useDvrFailures (sockets adentro).
 *
 *
 * POR QUÉ LO DE AHORA VA EN OSCURO Y EL RESTO EN CLARO
 *
 * El resto de la sala de control es claro. Este bloque es el único oscuro a
 * propósito: es el que hay que ver desde el otro lado del escritorio, y en una
 * pantalla de monitoreo un panel negro con una lista corta se encuentra sin
 * buscarlo. Cuando no hay nada caído se vuelve claro y discreto — un panel
 * negro permanente enseña a no mirarlo.
 */

/** "3 h 25 min" a partir de minutos. */
const formatDowntime = (minutes) => {
    if (!minutes && minutes !== 0) return '—';
    if (minutes < 1) return 'menos de 1 min';
    if (minutes < 60) return `${minutes} min`;
    const horas = Math.floor(minutes / 60);
    const resto = minutes % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
};

const horaDe = (fecha) => (fecha
    ? new Date(fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—');

const fechaDe = (fecha) => (fecha
    ? new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
    : '—');


export default function DvrFailures() {

    const { active, stats, history, loading, days } = useDvrFailures();

    // Cuántos días acabó mostrando el mapa. No se sabe hasta medir el panel: la
    // rejilla estira el rango hacia atrás hasta llenar el ancho, así que en una
    // pantalla ancha son bastantes más de treinta. El rótulo lo dice para que
    // nadie lea el mapa creyendo que son otros.
    const [diasEnElMapa, setDiasEnElMapa] = useState(null);
    const alCambiarElRango = useCallback(({ days: mostrados }) => setDiasEnElMapa(mostrados), []);

    const caidos = active?.failures ?? [];
    const porLocal = stats?.byLocal ?? [];
    const episodios = history?.failures ?? [];

    // El mapa cuenta CAÍDAS por día. Se podría pintar por minutos ciegos, pero
    // entonces un solo local caído toda la noche teñiría el día más oscuro que
    // una jornada con seis cortes en seis establecimientos — y lo que se busca
    // acá es cuántas veces pasó, no cuánto duró.
    //
    // El `?? []` va ADENTRO: afuera crea un arreglo nuevo en cada render y el
    // useMemo no memoriza nada.
    const datosDelMapa = useMemo(
        () => (stats?.byDay ?? []).map(d => ({ ...d, date: d.date, value: d.failures })),
        [stats],
    );

    const hayCaidos = caidos.length > 0;

    // "6 meses" se lee mejor que "182 días" cuando el rango es largo.
    const etiquetaDelRango = days >= 60
        ? `últimos ${Math.round(days / 30)} meses`
        : `últimos ${days} días`;

    return (
        <section className='flex flex-col gap-4 p-4' aria-label='Fallas de conexión con DVR'>

            {/* ── 1. Lo que está caído AHORA ───────────────────────────── */}
            <div className={`rounded-xl border-2 overflow-hidden transition-colors
                ${hayCaidos ? 'border-black bg-[#0d1117]' : 'border-gray-200 bg-white'}`}>

                <header className={`px-4 py-2.5 flex items-center gap-2.5 flex-wrap
                    ${hayCaidos ? 'border-b border-[#2b3138]' : 'border-b border-gray-100'}`}>
                    <span aria-hidden='true' className='text-[15px]'>{hayCaidos ? '⛔' : '✔'}</span>
                    <h3 className={`text-[13px] font-black tracking-tight ${hayCaidos ? 'text-white' : 'text-gray-700'}`}>
                        Falla de conexión con DVR
                    </h3>

                    {hayCaidos ? (
                        <span className='flex items-center gap-1.5 px-2 py-[2px] rounded-full bg-red-500/15 border border-red-500/40'>
                            <span className='relative flex h-[6px] w-[6px]'>
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75' />
                                <span className='relative inline-flex rounded-full h-[6px] w-[6px] bg-red-500' />
                            </span>
                            <b className='text-[11px] font-black tabular-nums text-red-300'>{caidos.length}</b>
                            <span className='text-[9.5px] font-bold uppercase tracking-wider text-red-300'>sin cámaras</span>
                        </span>
                    ) : (
                        <span className='text-[10.5px] font-semibold text-emerald-600'>
                            {loading ? 'Consultando…' : 'Todos los establecimientos con conexión'}
                        </span>
                    )}

                    <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider ${hayCaidos ? 'text-gray-500' : 'text-gray-400'}`}>
                        en vivo
                    </span>
                </header>

                {hayCaidos && (
                    <ul className='divide-y divide-[#1b1f23]'>
                        {caidos.map(f => (
                            <li key={f._id ?? f.local} className='px-4 py-2 flex items-center gap-3 flex-wrap'>
                                <span className='shrink-0 h-[7px] w-[7px] rounded-full bg-red-500' />

                                <span className='text-[12px] font-bold text-white min-w-0 truncate max-w-[16rem]'>
                                    {f.localName || f.local?.name || 'Sin nombre'}
                                </span>

                                <span className='text-[10.5px] font-black tabular-nums px-2 py-[2px] rounded border border-white/25 text-white'>
                                    desde {horaDe(f.failedAt)}
                                </span>

                                <span className='text-[10.5px] font-bold tabular-nums text-amber-400'>
                                    {formatDowntime(f.elapsedMinutes)} sin cámaras
                                </span>

                                {f.reportedByName && (
                                    <span className='ml-auto text-[9.5px] text-gray-500 truncate'>
                                        lo pasó {f.reportedByName}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>


            {/* ── 2. El último mes ─────────────────────────────────────── */}
            <div className='rounded-xl border border-gray-200 bg-[#0d1117] p-4'>
                <ActivityGreen
                    theme='dark'
                    data={datosDelMapa}
                    minDays={30}
                    /* El tope va atado a lo que se pidió: pintar más semanas de
                       las que se trajeron dejaría meses en cero por falta de
                       datos y no por falta de caídas. */
                    maxDays={days}
                    onRangeChange={alCambiarElRango}
                    title={`Caídas de DVR · ${diasEnElMapa ? `últimos ${diasEnElMapa} días` : 'último mes'}`}
                    unitLabel='caídas'
                    tooltip={(dia) => (dia.valor === 0
                        ? 'sin caídas'
                        : `${dia.valor} ${dia.valor === 1 ? 'caída' : 'caídas'} · ${dia.datos?.locals ?? 0} ${dia.datos?.locals === 1 ? 'establecimiento' : 'establecimientos'} · ${formatDowntime(dia.datos?.downtimeMinutes)} sin cámaras`
                    )}
                />
            </div>


            {/* ── 3. Quién se cae más ──────────────────────────────────── */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>

                <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
                    <header className='px-4 py-2 border-b border-gray-100 flex items-baseline gap-2'>
                        <h3 className='text-[12px] font-black tracking-tight text-gray-700'>Se caen más</h3>
                        <span className='text-[9.5px] text-gray-400'>{etiquetaDelRango}</span>
                        {stats?.totals && (
                            <span className='ml-auto text-[10px] font-bold tabular-nums text-gray-500'>
                                {stats.totals.failures} caídas · {formatDowntime(stats.totals.downtimeMinutes)}
                            </span>
                        )}
                    </header>

                    {porLocal.length === 0 ? (
                        <p className='px-4 py-6 text-center text-[11px] text-gray-400'>
                            {loading ? 'Consultando…' : 'Sin caídas registradas en el período.'}
                        </p>
                    ) : (
                        <ul className='max-h-[260px] overflow-y-auto'>
                            {porLocal.map((fila, i) => {
                                const peor = porLocal[0]?.failures || 1;
                                return (
                                    <li key={String(fila._id)} className='px-4 py-1.5 border-b border-gray-50 flex items-center gap-2.5'>
                                        <span className='w-4 shrink-0 text-[9.5px] font-black tabular-nums text-gray-300'>{i + 1}</span>
                                        <span className='text-[11.5px] font-semibold text-gray-700 truncate flex-1 min-w-0'>
                                            {fila.localName || 'Sin nombre'}
                                        </span>

                                        <span className='relative h-[7px] w-20 shrink-0 rounded-full bg-gray-100 overflow-hidden'>
                                            <span className='absolute inset-y-0 left-0 rounded-full bg-[#29c50c]'
                                                style={{ width: `${(fila.failures / peor) * 100}%` }} />
                                        </span>

                                        <span className='w-7 shrink-0 text-right text-[11px] font-black tabular-nums text-gray-700'>
                                            {fila.failures}
                                        </span>
                                        <span className='w-16 shrink-0 text-right text-[9.5px] tabular-nums text-gray-400'>
                                            {formatDowntime(fila.downtimeMinutes)}
                                        </span>

                                        {fila.stillDown > 0 && (
                                            <span className='shrink-0 text-[8.5px] font-black uppercase px-1 py-[1px] rounded bg-black text-white'>
                                                caído
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>


                <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
                    <header className='px-4 py-2 border-b border-gray-100 flex items-baseline gap-2'>
                        <h3 className='text-[12px] font-black tracking-tight text-gray-700'>Historial</h3>
                        <span className='text-[9.5px] text-gray-400'>
                            {history?.total ? `${history.total} episodios · ${etiquetaDelRango}` : etiquetaDelRango}
                        </span>
                    </header>

                    {episodios.length === 0 ? (
                        <p className='px-4 py-6 text-center text-[11px] text-gray-400'>
                            {loading ? 'Consultando…' : 'Sin caídas registradas en el período.'}
                        </p>
                    ) : (
                        <ul className='max-h-[260px] overflow-y-auto'>
                            {episodios.map(ep => (
                                <li key={ep._id} className='px-4 py-1.5 border-b border-gray-50 flex items-center gap-2 flex-wrap'>
                                    <span className='text-[9.5px] font-bold tabular-nums text-gray-400 w-11 shrink-0'>
                                        {fechaDe(ep.failedAt)}
                                    </span>
                                    <span className='text-[11px] font-semibold text-gray-700 truncate flex-1 min-w-0'>
                                        {ep.localName || ep.local?.name || 'Sin nombre'}
                                    </span>
                                    <span className='text-[9.5px] tabular-nums text-gray-500 shrink-0'>
                                        {horaDe(ep.failedAt)} → {ep.restoredAt ? horaDe(ep.restoredAt) : '…'}
                                    </span>
                                    <span className={`text-[9.5px] font-bold tabular-nums shrink-0 w-[5.5rem] text-right
                                        ${ep.active ? 'text-red-600' : 'text-gray-600'}`}>
                                        {ep.active ? 'sin resolver' : formatDowntime(ep.downtimeMinutes)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
