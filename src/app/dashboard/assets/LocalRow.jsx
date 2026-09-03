'use client';
import { useState } from 'react';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';
import { formatSince } from '@/libs/time/operationalDay';
import useLocalAlerts, { precargarAlertas } from '@/hook/useLocalAlerts';
import LiveDot from './LiveDot';
import ExemptToggle from './ExemptToggle';
import LocalAlertsList from './LocalAlertsList';

/**
 * UNA FILA DE LA LISTA: UN ESTABLECIMIENTO.
 *
 * Junta las dos lecturas que antes había que buscar por separado —su horario de
 * hoy y cuántas alertas lleva— y el estado que manda sobre las dos: en
 * monitoreo, por abrir, cerrado, señalado por silencio, o sin cámaras.
 *
 *
 * `maxTotal` NO ES UN DETALLE DE LA FILA
 *
 * Es el mayor conteo de TODA la lista, y por eso lo pasa quien la arma. Las
 * barras se leen como gráfica porque todas dividen por el mismo número: el que
 * tiene 25 llena la barra entera y el que tiene 2 llena un pedacito. Si cada
 * fila calculara su propia escala, todas se llenarían al 100% y la barra
 * dejaría de comparar nada.
 *
 * La rejilla, en cambio, se declara acá adentro y se alinea sola entre filas:
 * todas usan las mismas columnas dentro del mismo ancho. La última mide
 * `6.4rem` y no menos porque tiene que entrar el par de contadores MÁS el
 * botón de desplegar: apretada, el botón empuja los números fuera de su
 * columna y las filas dejan de alinearse entre sí.
 *
 * Debajo de `md` esas cuatro columnas no entran, y apilarlas de a una deja
 * cuatro renglones por local —en una lista de cincuenta, cuatro pantallas de
 * dedo—. Ahí la fila se rearma en tres renglones con posición explícita
 * (`col-start`/`row-start`, que `md:col-auto md:row-auto` devuelve al flujo):
 * arriba el nombre con los números a la derecha, que es la lectura que se
 * busca; debajo el horario; y al pie la barra, a todo el ancho, que es donde
 * mejor compara.
 *
 *
 * SE DESPLIEGA, Y EMPIEZA A CARGAR ANTES DE QUE LA ABRAN
 *
 * El botón de la derecha abre las alertas del día. Al pasar el mouse por la
 * fila la consulta ya sale, así que para cuando alguien hace clic el dato
 * suele estar y no hay pantalla de carga: entre apuntar y pulsar pasan dos o
 * tres décimas, y eso alcanza.
 *
 * Es barato porque `precargarAlertas` deduplica: pasar cinco veces por la
 * misma fila pide una sola vez, y abrirla después no vuelve a pedir.
 *
 *
 * POR QUÉ EL DVR SE PINTA EN NEGRO Y NO EN ROJO
 *
 * El rojo ya es del silencio, y las dos cosas se leen distinto: el silencio
 * dice "el operador no está mandando", la falla de conexión dice "no hay nada
 * que mirar". El negro no compite con ningún otro estado de la lista —verde,
 * celeste, ámbar, rojo, gris— y es el único borde sólido oscuro, así que la
 * fila se encuentra de un vistazo entre cien.
 */
export default function LocalRow({ local, maxTotal, isAdmin, now }) {

    const total = local.counts?.total ?? 0;
    const enviadas = local.counts?.enviadas ?? 0;
    // Sin cámaras: manda sobre cualquier otro estado de la fila.
    const sinDvr = Boolean(local.dvr?.down);
    // Fuera de monitoreo (por abrir o cerrado): toda la fila en
    // gris claro — el color queda reservado para los EN VIVO.
    const dim = local.state !== 'live' && !local.silent && !sinDvr;
    // Tipo(s) en ventana AHORA: definen el color del punto y del fondo
    const liveA = local.state === 'live' && (local.liveTypes ?? []).includes('analytical');
    const liveP = local.state === 'live' && (local.liveTypes ?? []).includes('perimeter');

    const [abierta, setAbierta] = useState(false);
    const alertas = useLocalAlerts(local.id);

    const alternar = () => {
        const siguiente = !abierta;
        setAbierta(siguiente);
        if (siguiente) alertas.pedir();
    };

    return (
        <div
            // El hover adelanta la consulta. No abre nada ni cambia nada de lo
            // que se ve: si el clic no llega, lo único que pasó fue una
            // petición liviana de más.
            onMouseEnter={() => precargarAlertas(local.id)}
            onFocus={() => precargarAlertas(local.id)}
            className={`px-3 md:px-4 py-1.5 max-md:py-2.5 border-b border-gray-100 grid gap-x-2 md:gap-x-3 gap-y-1 items-center grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(8.5rem,11.5rem)_minmax(10rem,14.5rem)_1fr_6.4rem]
                ${sinDvr ? 'bg-white ring-2 ring-inset ring-black'
                    : local.silent ? 'bg-red-50 ring-1 ring-inset ring-red-300 animate-pulse'
                        : local.state === 'live'
                            ? (liveP && !liveA ? 'bg-sky-50/40' : 'bg-emerald-50/40')
                            : 'bg-gray-50'}`}>

            {/* Nombre + identificador de estado en vivo (un punto POR TIPO:
                verde=analítico, azul=perimetral; ambos si coinciden) */}
            <span className={`col-start-1 row-start-1 md:col-auto md:row-auto flex items-center gap-1.5 min-w-0 text-[11.5px] font-semibold ${sinDvr ? 'text-black font-black' : local.silent ? 'text-red-600' : dim ? 'text-gray-400' : 'text-gray-700'}`}
                title={sinDvr ? `${local.name} — falla de conexión con DVR desde las ${local.dvr.failedAtLabel ?? '—'}${local.dvr.reportedByName ? ` · lo pasó ${local.dvr.reportedByName}` : ''}`
                    : local.silent ? `${local.name} — sin actualización de alerta en el grupo`
                        : local.state === 'live' ? `${local.name} — en monitoreo ${[liveA && 'analítico', liveP && 'perimetral'].filter(Boolean).join(' + ')}`
                            : local.name}>
                {sinDvr ? (
                    <span className='shrink-0 h-[6px] w-[6px] rounded-full bg-black' />
                ) : local.state === 'live' ? (
                    <>
                        {(liveA || !liveP) && <LiveDot ping='bg-emerald-400' bg='bg-emerald-500' />}
                        {liveP && <LiveDot ping='bg-sky-400' bg='bg-sky-500' />}
                    </>
                ) : (
                    <span className={`shrink-0 h-[6px] w-[6px] rounded-full ${local.state === 'upcoming' ? 'bg-gray-300' : 'bg-gray-200'}`} />
                )}
                {local.silent && !sinDvr && <span aria-hidden='true'>⚠</span>}
                <span className='truncate max-md:whitespace-normal max-md:line-clamp-2 max-md:break-words'>{local.name}</span>

                {/* El interruptor, pegado al nombre: es una decisión
                    SOBRE ESTE local y ahí es donde se lo busca. */}
                {isAdmin && <ExemptToggle local={local} />}
            </span>

            {/* Horario del día: franjas + estado con contexto */}
            <span className='col-span-2 row-start-2 md:col-auto md:row-auto flex items-center flex-wrap gap-1 max-md:gap-y-1.5 min-w-0'>
                {local.ranges.map((r, i) => (
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
                <span className={`text-[9.5px] font-bold whitespace-nowrap max-md:whitespace-normal ${local.state === 'live' ? (liveP && !liveA ? 'text-sky-600' : 'text-emerald-600') : local.state === 'upcoming' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {local.state === 'live'
                        ? `● ${[liveA && 'analítico', liveP && 'perimetral'].filter(Boolean).join(' + ') || 'en vivo'} · ${local.stateLabel}`
                        : local.stateLabel}
                </span>

                {/* ── Falla de conexión con el DVR ──────────────
                    La hora es lo que se pregunta primero: "¿desde
                    cuándo?". Va en la etiqueta y no en un tooltip,
                    porque nadie pasa el ratón por una lista de cien
                    filas buscando cuál está caída. */}
                {sinDvr && (
                    <span className='text-[9.5px] font-black text-black whitespace-nowrap px-1.5 py-[1px] rounded border border-black bg-white'>
                        {'⛔ '}
                        {/* En un teléfono el chip largo se come el renglón entero.
                            La hora —que es lo que se pregunta— y el ⛔ se quedan;
                            la frase completa vuelve desde md. `text-inherit` es
                            obligatorio: styles.css pinta `span` con var(--app-text). */}
                        <span className='text-inherit max-md:hidden'>Falla de conexión con DVR</span>
                        <span className='text-inherit hidden max-md:inline'>Falla DVR</span>
                        {local.dvr.failedAtLabel ? ` · ${local.dvr.failedAtLabel}` : ''}
                    </span>
                )}

                {/* Ya volvió, pero estuvo ciego parte de la jornada.
                    Explica un conteo bajo sin señalar al operador. */}
                {!sinDvr && (local.dvr?.episodes ?? 0) > 0 && (
                    <span className='text-[9.5px] font-semibold text-gray-500 whitespace-nowrap max-md:whitespace-normal'
                        title={`Recuperó la conexión${local.dvr.restoredAtLabel ? ` a las ${local.dvr.restoredAtLabel}` : ''}`}>
                        sin DVR {formatDowntime(local.dvr.downtimeMinutes)} hoy
                    </span>
                )}

                {local.silent && !sinDvr && (
                    <span className='text-[9.5px] font-bold text-red-600 whitespace-nowrap max-md:whitespace-normal'>
                        ⚠ sin actualización al grupo{local.silentSince ? ` · ${formatSince(local.silentSince, now)}` : ' · sin envíos hoy'}
                    </span>
                )}

                {/* Fuera de la lista "sin reportar al grupo". Se
                    muestra a TODOS y no solo a los administradores:
                    quien vea la sala tiene que poder entender por
                    qué este local nunca sale en el corte, aunque no
                    pueda cambiarlo. */}
                {local.exempt && (
                    <span className='text-[9.5px] font-semibold text-slate-500 whitespace-nowrap max-md:whitespace-normal'
                        title={`No entra en la lista "sin reportar al grupo"${local.exempt.byName ? ` · lo quitó ${local.exempt.byName}` : ''}${local.exempt.reason ? ` · ${local.exempt.reason}` : ''}`}>
                        🔕 fuera de la lista de sin reportar
                    </span>
                )}
            </span>

            {/* Barra comparativa (escala común entre TODOS los locales) */}
            <span className='col-span-2 row-start-3 md:col-auto md:row-auto relative h-[9px] max-md:mt-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[70px]'>
                <span className={`absolute inset-y-0 left-0 rounded-full ${dim ? 'bg-gray-300/60' : 'bg-[#29c50c]/45'}`} style={{ width: `${(total / maxTotal) * 100}%` }} />
                <span className={`absolute inset-y-0 left-0 rounded-full ${dim ? 'bg-gray-400' : 'bg-[#1f9a08]'}`} style={{ width: `${(enviadas / maxTotal) * 100}%` }} />
            </span>

            {/* Números del día — visores analógicos (panel oscuro,
                dígitos que ruedan cuando el conteo cambia en vivo) */}
            <span className='col-start-2 row-start-1 md:col-auto md:row-auto flex items-center justify-end gap-1.5 text-[11.5px] whitespace-nowrap'>
                <AnalogCounter value={total} fontSize='11px' weight={600} color={dim ? '#94a3b8' : '#f1f5f9'} />
                <span className={dim ? 'text-gray-400' : 'text-amber-500'}>➤</span>
                <AnalogCounter value={enviadas} fontSize='11px' weight={600} color={dim ? '#94a3b8' : '#fbbf24'} />

                {/* Desplegar. Va al final de la fila, después de los números,
                    porque es lo que uno mira y sobre lo que quiere el detalle.

                    Relleno oscuro con la flecha en blanco, en los dos estados:
                    en blanco sobre una fila que ya es casi blanca no se veía.
                    Lo que dice si está abierto es la flecha dada vuelta, no el
                    color — así el botón se encuentra igual estando cerrado. */}
                <button type='button' onClick={alternar}
                    aria-expanded={abierta}
                    title={abierta ? 'Cerrar las alertas del día' : 'Ver las alertas del día'}
                    className={`shrink-0 grid place-items-center w-5 h-5 rounded-full text-white transition-all
                        max-lg:relative max-lg:after:absolute max-lg:after:-inset-2 max-lg:after:content-['']
                        ${abierta
                            ? 'bg-slate-800 rotate-180'
                            : 'bg-slate-600 hover:bg-slate-800'}`}>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'
                        strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                        <path d='m6 9 6 6 6-6' />
                    </svg>
                </button>
            </span>

            {abierta && (
                <LocalAlertsList
                    datos={alertas.datos}
                    cargando={alertas.cargando}
                    error={alertas.error}
                    onReintentar={alertas.pedir}
                />
            )}
        </div>
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
