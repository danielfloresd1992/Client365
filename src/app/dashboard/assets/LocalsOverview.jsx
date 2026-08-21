'use client';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import { formatSince } from '@/libs/time/operationalDay';

/*
 * Panorama "Horario + alertas" del panel analítico: LA VISTA UNIFICADA.
 *
 * UNA sola lista ordenada por ALERTAS DEL DÍA (de mayor a menor) donde cada
 * local es una fila que junta las dos lecturas:
 *   · su barra comparativa en ESCALA COMÚN (claro = total del día,
 *     oscuro = enviadas al grupo) — alineadas, se leen como gráfica, y
 *   · su horario de hoy (chips de franjas + estado con contexto).
 *
 * El estado de monitoreo se identifica POR FILA sin romper el orden:
 *   · en monitoreo ahora → punto pulsante POR TIPO (verde=analítico,
 *     azul=perimetral; ambos si los dos están en ventana) + fondo suave
 *     esmeralda (analítico) o celeste (solo perimetral)
 *   · por abrir          → "abre HH:MM · en X min" en gris
 *   · ya cerró           → fila atenuada, "cerró a las HH:MM"
 *   · señalado por silencio → fila roja con ⚠
 *   · SIN CONEXIÓN CON EL DVR → fila con BORDE NEGRO y la etiqueta
 *     "Falla de conexión con DVR" + la hora en que se cayó
 * Arriba, el resumen de cuántos hay en cada estado con el desglose
 * analítico/perimetral. Recibe `groups` (scheduleGroups del padre; cada
 * entrada trae liveTypes con los tipos en ventana AHORA).
 *
 *
 * POR QUÉ EL DVR SE PINTA EN NEGRO Y NO EN ROJO
 *
 * El rojo ya es del silencio, y las dos cosas se leen distinto: el silencio
 * dice "el operador no está mandando", la falla de conexión dice "no hay nada
 * que mirar". El negro no compite con ningún estado de la lista —verde,
 * celeste, ámbar, rojo, gris— y es el único borde sólido oscuro, así que la
 * fila se encuentra de un vistazo entre cien.
 *
 * Y va ARRIBA DE TODO, fuera del orden por alertas: un local sin cámaras
 * siempre tiene 0 alertas, así que ordenado por conteo caería al fondo de la
 * lista, que es justo donde nadie lo vería.
 */

// En empate de alertas: primero los que están en monitoreo, luego por abrir
const STATE_RANK = { live: 0, upcoming: 1, done: 2 };

// Punto de estado en vivo, coloreado por tipo de monitoreo
function LiveDot({ ping, bg }) {
    return (
        <span className='relative flex h-[6px] w-[6px] shrink-0'>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ping} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-[6px] w-[6px] ${bg}`}></span>
        </span>
    );
}

/** "3 h 25 min" a partir de minutos. Para el tiempo sin cámaras. */
function formatDowntime(minutes) {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const horas = Math.floor(minutes / 60);
    const resto = minutes % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

export default function LocalsOverview({ groups, now }) {

    const all = [...groups.live, ...groups.upcoming, ...groups.done]
        .sort((a, b) =>
            // Los que están sin cámaras van primero, siempre. Ordenados por
            // alertas caerían al fondo —tienen 0 porque no pueden reportar—,
            // que es exactamente donde no hay que ponerlos.
            (Number(Boolean(b.dvr?.down)) - Number(Boolean(a.dvr?.down)))
            || ((b.counts?.total ?? 0) - (a.counts?.total ?? 0))
            || (STATE_RANK[a.state] - STATE_RANK[b.state])
            || a.name.localeCompare(b.name, 'es')
        );
    const maxTotal = Math.max(1, ...all.map(l => l.counts?.total ?? 0));

    const sinConexion = all.filter(l => l.dvr?.down).length;

    // Desglose de los EN VIVO por tipo (un local puede estar en ambos)
    const liveAnalytical = groups.live.filter(l => (l.liveTypes ?? []).includes('analytical')).length;
    const livePerimeter = groups.live.filter(l => (l.liveTypes ?? []).includes('perimeter')).length;

    return (
        <section className='flex flex-col' aria-label='Horario y alertas de los locales de hoy'>

            {/* Resumen por estado + leyenda de la vista */}
            <div className='shrink-0 px-4 pt-2 pb-1 flex items-center gap-2.5 flex-wrap text-[10px] font-bold'>
                {/* Resúmenes por estado — mismo estilo contorno, número resaltado */}
                <span className='flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg bg-white border-2 border-emerald-500 text-emerald-700'>
                    <span className='relative flex h-[7px] w-[7px]'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-500'></span>
                    </span>
                    <b className='text-[16px] font-black tabular-nums leading-none'>{groups.live.length}</b>
                    <span className='leading-tight'>en monitoreo<br />
                        {(liveAnalytical > 0 || livePerimeter > 0) ? (
                            <span className='text-[8.5px] font-bold uppercase tracking-wider tabular-nums'>
                                {liveAnalytical > 0 && <span className='text-emerald-500'>● {liveAnalytical} analítico</span>}
                                {liveAnalytical > 0 && livePerimeter > 0 && <span className='text-gray-300'> · </span>}
                                {livePerimeter > 0 && <span className='text-sky-500'>● {livePerimeter} perimetral</span>}
                            </span>
                        ) : (
                            <span className='text-[8.5px] font-bold uppercase tracking-wider text-emerald-500'>en vivo ahora</span>
                        )}
                    </span>
                </span>
                <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border-2 border-amber-400 text-amber-700'>
                    <span aria-hidden='true'>⏳</span>
                    <b className='text-[16px] font-black tabular-nums leading-none'>{groups.upcoming.length}</b>
                    <span>por abrir</span>
                </span>
                <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border-2 border-slate-300 text-slate-500'>
                    <span aria-hidden='true'>✔</span>
                    <b className='text-[16px] font-black tabular-nums leading-none'>{groups.done.length}</b>
                    <span>cerraron</span>
                </span>

                {/* Sin cámaras. Solo aparece cuando hay alguno: un contador en 0
                    permanente enseña a no mirarlo, y este es el que hay que ver. */}
                {sinConexion > 0 && (
                    <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border-2 border-black text-black'>
                        <span aria-hidden='true'>⛔</span>
                        <b className='text-[16px] font-black tabular-nums leading-none'>{sinConexion}</b>
                        <span className='leading-tight'>sin conexión<br />
                            <span className='text-[8.5px] font-bold uppercase tracking-wider text-gray-500'>no cuentan como sin reportar</span>
                        </span>
                    </span>
                )}

                <span className='flex items-center gap-1 font-semibold text-gray-500 ml-auto'>
                    <span className='w-5 h-[7px] rounded-full bg-[#29c50c]/45 inline-block' /> total
                    <span className='w-5 h-[7px] rounded-full bg-[#1f9a08] inline-block ml-1.5' /> ➤ enviadas
                    <span className='text-gray-300'>· mayor → menor</span>
                </span>
            </div>

            {all.map(l => {
                const total = l.counts?.total ?? 0;
                const enviadas = l.counts?.enviadas ?? 0;
                // Sin cámaras: manda sobre cualquier otro estado de la fila.
                const sinDvr = Boolean(l.dvr?.down);
                // Fuera de monitoreo (por abrir o cerrado): toda la fila en
                // gris claro — el color queda reservado para los EN VIVO.
                const dim = l.state !== 'live' && !l.silent && !sinDvr;
                // Tipo(s) en ventana AHORA: definen el color del punto y del fondo
                const liveA = l.state === 'live' && (l.liveTypes ?? []).includes('analytical');
                const liveP = l.state === 'live' && (l.liveTypes ?? []).includes('perimeter');
                return (
                    <div key={l.id}
                        className={`px-4 py-1.5 border-b border-gray-100 grid gap-x-3 gap-y-1 items-center grid-cols-1 md:grid-cols-[minmax(8.5rem,11.5rem)_minmax(10rem,14.5rem)_1fr_4.8rem]
                            ${sinDvr ? 'bg-white ring-2 ring-inset ring-black'
                                : l.silent ? 'bg-red-50 ring-1 ring-inset ring-red-300 animate-pulse'
                                    : l.state === 'live'
                                        ? (liveP && !liveA ? 'bg-sky-50/40' : 'bg-emerald-50/40')
                                        : 'bg-gray-50'}`}>

                        {/* Nombre + identificador de estado en vivo (un punto POR TIPO:
                            verde=analítico, azul=perimetral; ambos si coinciden) */}
                        <span className={`flex items-center gap-1.5 min-w-0 text-[11.5px] font-semibold ${sinDvr ? 'text-black font-black' : l.silent ? 'text-red-600' : dim ? 'text-gray-400' : 'text-gray-700'}`}
                            title={sinDvr ? `${l.name} — falla de conexión con DVR desde las ${l.dvr.failedAtLabel ?? '—'}${l.dvr.reportedByName ? ` · lo pasó ${l.dvr.reportedByName}` : ''}`
                                : l.silent ? `${l.name} — sin actualización de alerta en el grupo`
                                    : l.state === 'live' ? `${l.name} — en monitoreo ${[liveA && 'analítico', liveP && 'perimetral'].filter(Boolean).join(' + ')}`
                                        : l.name}>
                            {sinDvr ? (
                                <span className='shrink-0 h-[6px] w-[6px] rounded-full bg-black' />
                            ) : l.state === 'live' ? (
                                <>
                                    {(liveA || !liveP) && <LiveDot ping='bg-emerald-400' bg='bg-emerald-500' />}
                                    {liveP && <LiveDot ping='bg-sky-400' bg='bg-sky-500' />}
                                </>
                            ) : (
                                <span className={`shrink-0 h-[6px] w-[6px] rounded-full ${l.state === 'upcoming' ? 'bg-gray-300' : 'bg-gray-200'}`} />
                            )}
                            {l.silent && !sinDvr && <span aria-hidden='true'>⚠</span>}
                            <span className='truncate'>{l.name}</span>
                        </span>

                        {/* Horario del día: franjas + estado con contexto */}
                        <span className='flex items-center flex-wrap gap-1 min-w-0'>
                            {l.ranges.map((r, i) => (
                                <span key={i}
                                    title={r.type === 'perimeter' ? 'Franja perimetral' : 'Franja analítica'}
                                    className={`text-[9.5px] font-semibold tabular-nums px-1.5 py-[1px] rounded-full border whitespace-nowrap
                                        ${dim ? 'bg-gray-50 text-gray-400 border-gray-200'
                                            : r.type === 'perimeter'
                                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {r.label}
                                </span>
                            ))}
                            <span className={`text-[9.5px] font-bold whitespace-nowrap ${l.state === 'live' ? (liveP && !liveA ? 'text-sky-600' : 'text-emerald-600') : l.state === 'upcoming' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {l.state === 'live'
                                    ? `● ${[liveA && 'analítico', liveP && 'perimetral'].filter(Boolean).join(' + ') || 'en vivo'} · ${l.stateLabel}`
                                    : l.stateLabel}
                            </span>

                            {/* ── Falla de conexión con el DVR ──────────────
                                La hora es lo que se pregunta primero: "¿desde
                                cuándo?". Va en la etiqueta y no en un tooltip,
                                porque nadie pasa el ratón por una lista de cien
                                filas buscando cuál está caída. */}
                            {sinDvr && (
                                <span className='text-[9.5px] font-black text-black whitespace-nowrap px-1.5 py-[1px] rounded border border-black bg-white'>
                                    ⛔ Falla de conexión con DVR{l.dvr.failedAtLabel ? ` · ${l.dvr.failedAtLabel}` : ''}
                                </span>
                            )}

                            {/* Ya volvió, pero estuvo ciego parte de la jornada.
                                Explica un conteo bajo sin señalar al operador. */}
                            {!sinDvr && (l.dvr?.episodes ?? 0) > 0 && (
                                <span className='text-[9.5px] font-semibold text-gray-500 whitespace-nowrap'
                                    title={`Recuperó la conexión${l.dvr.restoredAtLabel ? ` a las ${l.dvr.restoredAtLabel}` : ''}`}>
                                    sin DVR {formatDowntime(l.dvr.downtimeMinutes)} hoy
                                </span>
                            )}

                            {l.silent && !sinDvr && (
                                <span className='text-[9.5px] font-bold text-red-600 whitespace-nowrap'>
                                    ⚠ sin actualización al grupo{l.silentSince ? ` · ${formatSince(l.silentSince, now)}` : ' · sin envíos hoy'}
                                </span>
                            )}
                        </span>

                        {/* Barra comparativa (escala común entre TODOS los locales) */}
                        <span className='relative h-[9px] rounded-full bg-gray-100 overflow-hidden min-w-[70px]'>
                            <span className={`absolute inset-y-0 left-0 rounded-full ${dim ? 'bg-gray-300/60' : 'bg-[#29c50c]/45'}`} style={{ width: `${(total / maxTotal) * 100}%` }} />
                            <span className={`absolute inset-y-0 left-0 rounded-full ${dim ? 'bg-gray-400' : 'bg-[#1f9a08]'}`} style={{ width: `${(enviadas / maxTotal) * 100}%` }} />
                        </span>

                        {/* Números del día — visores analógicos (panel oscuro,
                            dígitos que ruedan cuando el conteo cambia en vivo) */}
                        <span className='flex items-center justify-end gap-1.5 text-[11.5px] whitespace-nowrap'>
                            <AnalogCounter value={total} fontSize='11px' weight={600} color={dim ? '#94a3b8' : '#f1f5f9'} />
                            <span className={dim ? 'text-gray-400' : 'text-amber-500'}>➤</span>
                            <AnalogCounter value={enviadas} fontSize='11px' weight={600} color={dim ? '#94a3b8' : '#fbbf24'} />
                        </span>
                    </div>
                );
            })}

            {all.length === 0 && (
                <p className='px-4 py-8 text-center text-xs text-gray-400'>Sin locales con horario de monitoreo hoy.</p>
            )}
        </section>
    );
}
