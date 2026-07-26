'use client';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';

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
 *   · en monitoreo ahora → punto verde pulsante + fondo esmeralda suave
 *   · por abrir          → "abre HH:MM · en X min" en gris
 *   · ya cerró           → fila atenuada, "cerró a las HH:MM"
 *   · señalado por silencio → fila roja con ⚠
 * Arriba, el resumen de cuántos hay en cada estado.
 * Recibe `groups` (scheduleGroups del padre).
 */

// En empate de alertas: primero los que están en monitoreo, luego por abrir
const STATE_RANK = { live: 0, upcoming: 1, done: 2 };

export default function LocalsOverview({ groups }) {

    const all = [...groups.live, ...groups.upcoming, ...groups.done]
        .sort((a, b) =>
            ((b.counts?.total ?? 0) - (a.counts?.total ?? 0))
            || (STATE_RANK[a.state] - STATE_RANK[b.state])
            || a.name.localeCompare(b.name, 'es')
        );
    const maxTotal = Math.max(1, ...all.map(l => l.counts?.total ?? 0));

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
                    <span className='leading-tight'>en monitoreo<br /><span className='text-[8.5px] font-bold uppercase tracking-wider text-emerald-500'>en vivo ahora</span></span>
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

                <span className='flex items-center gap-1 font-semibold text-gray-500 ml-auto'>
                    <span className='w-5 h-[7px] rounded-full bg-[#29c50c]/45 inline-block' /> total
                    <span className='w-5 h-[7px] rounded-full bg-[#1f9a08] inline-block ml-1.5' /> ➤ enviadas
                    <span className='text-gray-300'>· mayor → menor</span>
                </span>
            </div>

            {all.map(l => {
                const total = l.counts?.total ?? 0;
                const enviadas = l.counts?.enviadas ?? 0;
                // Fuera de monitoreo (por abrir o cerrado): toda la fila en
                // gris claro — el color queda reservado para los EN VIVO.
                const dim = l.state !== 'live' && !l.silent;
                return (
                    <div key={l.id}
                        className={`px-4 py-1.5 border-b border-gray-100 grid gap-x-3 gap-y-1 items-center grid-cols-1 md:grid-cols-[minmax(8.5rem,11.5rem)_minmax(10rem,14.5rem)_1fr_4.8rem]
                            ${l.silent ? 'bg-red-50 ring-1 ring-inset ring-red-300 animate-pulse' : l.state === 'live' ? 'bg-emerald-50/40' : 'bg-gray-50'}`}>

                        {/* Nombre + identificador de estado en vivo */}
                        <span className={`flex items-center gap-1.5 min-w-0 text-[11.5px] font-semibold ${l.silent ? 'text-red-600' : dim ? 'text-gray-400' : 'text-gray-700'}`}
                            title={l.silent ? `${l.name} — sin actualización de alerta en el grupo` : l.name}>
                            {l.state === 'live' ? (
                                <span className='relative flex h-[6px] w-[6px] shrink-0'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                                    <span className='relative inline-flex rounded-full h-[6px] w-[6px] bg-emerald-500'></span>
                                </span>
                            ) : (
                                <span className={`shrink-0 h-[6px] w-[6px] rounded-full ${l.state === 'upcoming' ? 'bg-gray-300' : 'bg-gray-200'}`} />
                            )}
                            {l.silent && <span aria-hidden='true'>⚠</span>}
                            <span className='truncate'>{l.name}</span>
                        </span>

                        {/* Horario del día: franjas + estado con contexto */}
                        <span className='flex items-center flex-wrap gap-1 min-w-0'>
                            {l.ranges.map((r, i) => (
                                <span key={i}
                                    className={`text-[9.5px] font-semibold tabular-nums px-1.5 py-[1px] rounded-full border whitespace-nowrap
                                        ${dim ? 'bg-gray-50 text-gray-400 border-gray-200'
                                            : r.type === 'perimeter'
                                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {r.label}
                                </span>
                            ))}
                            <span className={`text-[9.5px] font-bold whitespace-nowrap ${l.state === 'live' ? 'text-emerald-600' : l.state === 'upcoming' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {l.state === 'live' ? `● ${l.stateLabel}` : l.stateLabel}
                            </span>
                            {l.silent && (
                                <span className='text-[9.5px] font-bold text-red-600 whitespace-nowrap'>⚠ sin actualización de alerta en el grupo</span>
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
