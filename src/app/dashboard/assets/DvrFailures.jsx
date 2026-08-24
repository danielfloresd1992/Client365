'use client';
import { useCallback, useMemo, useState } from 'react';
import { ActivityGreen } from '@/components/ui/mono-activity-green';
import useDvrFailures from '@/hook/useDvrFailures';
import { efectividadDe } from '@/libs/dvr/efectividad';
import SelectorOscuro from './SelectorOscuro';

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


/**
 * Qué dice el mapa al pasar por encima de un día.
 *
 * Además del conteo, LOS NOMBRES: "3 establecimientos" obliga a irse al
 * historial a averiguar cuáles, que es justo lo que el mapa debería ahorrar.
 *
 * Se listan hasta ocho. Un día malo puede llevarse quince locales por delante y
 * un globo de quince renglones tapa media pantalla; a partir de ahí se resume,
 * que para el detalle completo está el historial.
 *
 * Va en un `title` nativo, así que son saltos de línea de texto plano — sin
 * viñetas ni sangrías, que en un tooltip del sistema no se ven.
 */
const MAX_NOMBRES = 8;

const textoDelDia = (dia) => {
    if (dia.valor === 0) return 'sin caídas';

    const datos = dia.datos ?? {};
    const cuantos = datos.locals ?? 0;
    const nombres = datos.localNames ?? [];

    const resumen = [
        `${dia.valor} ${dia.valor === 1 ? 'caída' : 'caídas'}`,
        `${cuantos} ${cuantos === 1 ? 'establecimiento' : 'establecimientos'}`,
        `${formatDowntime(datos.downtimeMinutes)} sin cámaras`,
    ].join(' · ');

    if (nombres.length === 0) return resumen;

    const visibles = nombres.slice(0, MAX_NOMBRES).map(n => `· ${n}`);
    const restantes = nombres.length - visibles.length;
    if (restantes > 0) visibles.push(`· y ${restantes} más`);

    return `${resumen}\n${visibles.join('\n')}`;
};


/**
 * Horas de monitoreo del horario contra horas perdidas por caídas.
 *
 * La cuenta vive en libs/dvr/efectividad y su detalle importa: lo que se
 * compara contra lo programado es el tiempo caído DENTRO de las ventanas de
 * monitoreo — un local que se cae de madrugada sin monitoreo nocturno no
 * perdió nada. El total de reloj corrido se muestra aparte, como contexto.
 */
function Efectividad({ nombre, datos, etiqueta }) {

    const horas = (min) => formatDowntime(min) || '0 min';

    if (datos.sinHorario) {
        return (
            <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
                <header className='px-4 py-2 border-b border-gray-100 flex items-baseline gap-2'>
                    <h3 className='text-[12px] font-black tracking-tight text-gray-700'>Efectividad</h3>
                    <span className='text-[9.5px] text-gray-400 truncate'>{nombre}</span>
                </header>
                <div className='px-4 py-6 text-center'>
                    <p className='text-[11px] text-gray-500'>
                        Este establecimiento no tiene horario de monitoreo cargado, así que no hay
                        contra qué comparar las caídas.
                    </p>
                    {datos.perdidosTotales > 0 && (
                        <p className='text-[10.5px] text-gray-400 mt-2'>
                            En el período estuvo <b className='text-gray-600'>{horas(datos.perdidosTotales)}</b> sin
                            cámaras, en {datos.episodios} episodio{datos.episodios === 1 ? '' : 's'}.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const porcentaje = Math.round(datos.efectividad * 1000) / 10;
    const color = porcentaje >= 99 ? 'text-emerald-600'
        : porcentaje >= 95 ? 'text-amber-600' : 'text-red-600';
    const barra = porcentaje >= 99 ? 'bg-emerald-500'
        : porcentaje >= 95 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
            <header className='px-4 py-2 border-b border-gray-100 flex items-baseline gap-2'>
                <h3 className='text-[12px] font-black tracking-tight text-gray-700'>Efectividad</h3>
                <span className='text-[9.5px] text-gray-400 truncate'>{nombre} · {etiqueta}</span>
            </header>

            <div className='px-4 py-3 flex items-center gap-4'>
                <span className={`text-[30px] font-black tabular-nums leading-none ${color}`}>
                    {porcentaje}%
                </span>

                <div className='flex-1 min-w-0'>
                    <span className='relative block h-[9px] rounded-full bg-gray-100 overflow-hidden'>
                        <span className={`absolute inset-y-0 left-0 rounded-full ${barra}`}
                            style={{ width: `${porcentaje}%` }} />
                    </span>
                    <span className='block mt-1 text-[9.5px] text-gray-400'>
                        del tiempo de monitoreo programado, con cámaras
                    </span>
                </div>
            </div>

            <dl className='px-4 pb-3 space-y-1'>
                <Renglon etiqueta='Monitoreo programado (estimado)' valor={horas(datos.programados)} />
                <Renglon etiqueta='Perdido por caídas, dentro del horario' valor={horas(datos.perdidosEnVentana)}
                    resaltado={datos.perdidosEnVentana > 0} />
                <Renglon etiqueta='Sin cámaras en total (reloj corrido)' valor={horas(datos.perdidosTotales)} />
                <Renglon etiqueta='Episodios' valor={String(datos.episodios)} />
            </dl>

            <p className='px-4 pb-3 text-[9px] leading-relaxed text-gray-400'>
                Estimado con el horario vigente aplicado a todo el período. Solo cuenta como perdido
                lo caído dentro de las ventanas de monitoreo: una caída de madrugada sin monitoreo
                nocturno no resta.
            </p>
        </div>
    );
}


function Renglon({ etiqueta, valor, resaltado }) {
    return (
        <div className='flex items-baseline justify-between gap-3'>
            <dt className='text-[10.5px] text-gray-500'>{etiqueta}</dt>
            <dd className={`text-[11px] font-bold tabular-nums ${resaltado ? 'text-red-600' : 'text-gray-700'}`}>
                {valor}
            </dd>
        </div>
    );
}


export default function DvrFailures({ locales = [], schedules = [], isWinter = false }) {

    // '' = todos. Con un local elegido, la estadística y el historial vienen
    // acotados a él desde el servidor; lo caído AHORA sigue siendo global.
    const [localSel, setLocalSel] = useState('');

    const { active, stats, history, loading, days } = useDvrFailures({ local: localSel || null });

    const nombreSel = locales.find(l => l.id === localSel)?.name ?? null;

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
    //
    // Los nombres se ordenan acá: el servidor los devuelve como vienen de un
    // `$addToSet`, que no garantiza orden, y una lista que se reordena sola
    // entre dos consultas del mismo día se lee como si hubiera cambiado.
    const datosDelMapa = useMemo(
        () => (stats?.byDay ?? []).map(d => ({
            ...d,
            date: d.date,
            value: d.failures,
            localNames: [...(d.localNames ?? [])].sort((a, b) => a.localeCompare(b, 'es')),
        })),
        [stats],
    );

    const hayCaidos = caidos.length > 0;

    // La comparación horario ↔ caídas del local elegido. Los episodios ya
    // vienen filtrados por el hook; el horario sale de lo que la página ya
    // tenía cargado, así que no cuesta ninguna consulta nueva.
    // Depende de `history` y no de `episodios`: el `?? []` de arriba fabrica un
    // arreglo nuevo en cada render y el memo no memorizaría nada.
    const efectividad = useMemo(() => {
        if (!localSel) return null;
        return efectividadDe({
            episodios: history?.failures ?? [],
            schedule: schedules.find(s => String(s.idLocal) === localSel) ?? null,
            isWinter,
            dias: days,
        });
    }, [localSel, history, schedules, isWinter, days]);

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


            {/* ── La consulta: global o de un establecimiento ──────────
                Con un local elegido, el mapa y las tarjetas de abajo hablan
                SOLO de él, y el ranking se reemplaza por su efectividad. El
                bloque de arriba no cambia: lo caído ahora se mira entero. */}
            <div className='rounded-xl border border-gray-200 bg-[#0d1117] px-4 py-2.5 flex items-center gap-3 flex-wrap'>
                <span className='text-[9.5px] font-bold uppercase tracking-wider text-gray-500'>
                    Consulta
                </span>

                {/* Propio y no un <select>: la lista desplegada de un select la
                    dibuja el sistema operativo —blanca, con el resaltado azul de
                    Windows— y sobre este panel negro se veía rota. Además con
                    sesenta establecimientos hace falta buscador, no rueda. */}
                <SelectorOscuro
                    valor={localSel}
                    opciones={locales}
                    textoTodos='Todos los establecimientos'
                    onElegir={setLocalSel}
                />

                {localSel && (
                    <button type='button' onClick={() => setLocalSel('')}
                        className='text-[10.5px] font-bold text-gray-400 hover:text-white transition-colors'>
                        ✕ volver a todos
                    </button>
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
                    title={`Caídas de DVR${nombreSel ? ` · ${nombreSel}` : ''} · ${diasEnElMapa ? `últimos ${diasEnElMapa} días` : 'último mes'}`}
                    unitLabel='caídas'
                    tooltip={textoDelDia}
                />
            </div>


            {/* ── 3. Quién se cae más — o la efectividad del elegido ───── */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>

                {efectividad ? (
                    <Efectividad nombre={nombreSel} datos={efectividad} etiqueta={etiquetaDelRango} />
                ) : (
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
                )}


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
