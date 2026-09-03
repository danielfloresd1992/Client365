'use client';
import LocalRow from './LocalRow';
import useAuthOnServer from '@/hook/auth';

/*
 * Panorama "Horario + alertas" del panel analítico: LA VISTA UNIFICADA.
 *
 * UNA sola lista donde cada local es una fila que junta su horario de hoy con
 * cuántas alertas lleva. Cómo se dibuja cada fila está en `LocalRow`; acá se
 * decide el ORDEN, el resumen de arriba y la ESCALA que comparten las barras.
 *
 *
 * EL ORDEN, QUE ES LA DECISIÓN DE ESTA PANTALLA
 *
 *   1. los que están SIN CÁMARAS, siempre primero
 *   2. después por alertas del día, de mayor a menor
 *   3. en empate, primero los que están en monitoreo
 *   4. y al final, por nombre
 *
 * El punto 1 va fuera del orden por alertas a propósito: un local sin cámaras
 * no puede reportar, así que siempre tiene 0 y ordenado por conteo caería al
 * fondo de la lista — justo donde nadie lo vería.
 *
 *
 * LA ESCALA COMÚN
 *
 * `maxTotal` se calcula acá, sobre TODA la lista, y se le pasa a cada fila. Es
 * lo que hace que las barras se lean como gráfica: todas dividen por el mismo
 * número, así que sus largos son comparables entre sí. Si cada fila usara su
 * propio máximo, todas se llenarían al 100%.
 *
 * Recibe `groups` (los scheduleGroups del padre; cada entrada trae `liveTypes`
 * con los tipos en ventana AHORA).
 */

// En empate de alertas: primero los que están en monitoreo, luego por abrir
const STATE_RANK = { live: 0, upcoming: 1, done: 2 };

export default function LocalsOverview({ groups, now }) {

    // El interruptor de "no lo cuentes" solo existe para administradores
    // (`admin: true`). El backend lo exige igual en el PUT.
    const { dataSessionState } = useAuthOnServer();
    const isAdmin = Boolean(dataSessionState?.dataSession?.admin);

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
            <div className='shrink-0 px-3 lg:px-4 pt-2 pb-1 flex items-center gap-2 lg:gap-2.5 flex-wrap text-[10px] font-bold'>
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

                <span className='flex items-center flex-wrap gap-1 font-semibold text-gray-500 max-lg:w-full lg:ml-auto'>
                    <span className='w-5 h-[7px] rounded-full bg-[#29c50c]/45 inline-block' /> total
                    <span className='w-5 h-[7px] rounded-full bg-[#1f9a08] inline-block ml-1.5' /> ➤ enviadas
                    <span className='text-gray-300'>· mayor → menor</span>
                </span>
            </div>

            {all.map(l => (
                <LocalRow
                    key={l.id}
                    local={l}
                    maxTotal={maxTotal}
                    isAdmin={isAdmin}
                    now={now}
                />
            ))}

            {all.length === 0 && (
                <p className='px-4 py-8 text-center text-xs text-gray-400'>Sin locales con horario de monitoreo hoy.</p>
            )}
        </section>
    );
}
