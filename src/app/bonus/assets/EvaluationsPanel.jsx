'use client';
import { useState, useMemo } from 'react';
import UserPicker from '@/components/inpust/UserPicker';
import { agruparParaSelector } from '@/libs/parser/estableshment';
import {
    TURNOS, ESTATUS, estatusDe, esObservacion, comoPorcentaje,
    formatearPorcentaje, contarLocalesPorOperador,
} from './evaluationRules';

/**
 * PANEL DE EVALUACIONES.
 *
 * Una evaluación es por LOCAL, TURNO y FECHA, y lleva el operador que lo
 * cubría. Es la misma forma que la hoja «Carga de evaluaciones»: se elige un
 * día y un turno, y se recorre la lista de establecimientos poniendo quién lo
 * cubrió y con cuánto salió.
 *
 * Lo que se escribe puede ser un NÚMERO o un TEXTO, y esa ambigüedad es del
 * negocio, no un descuido: la columna se llama «Porcentaje / Observación». Un
 * número se compara contra el umbral; un texto reprueba, salvo que hable de
 * planificación, que no cuenta.
 *
 *
 * EL UMBRAL NO SE ELIGE, SE DEDUCE
 *
 * Sale de cuántos locales cubrió esa persona en ese turno: uno solo exige 90%,
 * dos o más 75%, y quien está en entrenamiento 70%. Por eso la columna cambia
 * sola al asignar o quitar un local a alguien — no hay ningún campo de "rol"
 * que llenar, y no debería haberlo.
 *
 * Todo eso vive en evaluationRules.js, aparte, porque es la regla que decide
 * si alguien cobra o no y tiene que poder leerse sin abrir una pantalla.
 *
 * POR AHORA ES SOLO EL MAQUETADO: se edita en memoria y no se guarda. Falta el
 * modelo del lado del servidor.
 */
export default function EvaluationsPanel({ alcance, puedeEditar }) {

    const hoy = new Date().toISOString().slice(0, 10);
    const [fecha, setFecha] = useState(hoy);
    const [turno, setTurno] = useState('day');

    // La evaluación de cada local, por su id: { operador, valor }.
    const [cargadas, setCargadas] = useState({});

    const locales = useMemo(() => alcance?.locals ?? [], [alcance]);
    // Analíticos por marca y perimetrales al final, que es como se recorren
    // en la hoja: la línea de evaluación agrupa por marca y los perimetrales
    // van sueltos.
    const grupos = useMemo(() => {
        const { perimetrales, analiticos } = agruparParaSelector(locales);
        return [
            ...analiticos,
            ...(perimetrales.length ? [{ titulo: 'Perimetrales', locales: perimetrales }] : []),
        ];
    }, [locales]);

    // El COUNTIF de la hoja: cuántos locales cubre cada operador en ESTE turno.
    // Se recalcula en cada cambio porque asignarle un local a alguien puede
    // bajarle el umbral de 90% a 75% y aprobar una fila que estaba reprobada.
    const localesPorOperador = useMemo(
        () => contarLocalesPorOperador(Object.values(cargadas)),
        [cargadas],
    );

    const escribir = (idLocal, cambios) =>
        setCargadas(previo => ({ ...previo, [idLocal]: { ...previo[idLocal], ...cambios } }));

    const evaluarFila = (idLocal) => {
        const fila = cargadas[idLocal];
        const cubiertos = localesPorOperador.get(String(fila?.operador?._id)) || 0;
        return estatusDe(fila?.valor, cubiertos, false);
    };

    const totales = useMemo(() => {
        const cuenta = { aprobado: 0, reprobado: 0, 'n/a': 0, 'sin-cargar': 0 };
        for (const local of locales) {
            const { estatus } = evaluarFila(String(local._id));
            cuenta[estatus] = (cuenta[estatus] || 0) + 1;
        }
        return cuenta;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locales, cargadas, localesPorOperador]);

    return (
        <div className='space-y-4'>

            <section className='bg-white rounded-xl shadow-sm border p-5'>
                <div className='flex flex-wrap items-start gap-3'>
                    <span className='shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                        <IconoLista />
                    </span>
                    <div className='min-w-0 flex-1'>
                        <h2 className='text-base font-bold text-gray-800 leading-tight'>Evaluación de monitoreo</h2>
                        <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[72ch]'>
                            Un establecimiento por fila, con quién lo cubrió y con cuánto salió.
                            El umbral sale solo de cuántos locales tenga esa persona en el turno.
                        </p>
                    </div>
                </div>

                <div className='mt-4 flex flex-wrap items-end gap-3'>
                    <label className='min-w-[150px]'>
                        <span className='block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 mb-1'>Fecha</span>
                        <input type='date' value={fecha} onChange={e => setFecha(e.target.value)}
                            className='w-full h-9 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                                       focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
                    </label>

                    <div>
                        <span className='block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 mb-1'>Turno</span>
                        <div className='flex gap-1'>
                            {TURNOS.map(t => (
                                <button key={t.key} type='button' onClick={() => setTurno(t.key)}
                                    aria-pressed={turno === t.key}
                                    className={`h-9 px-4 rounded-lg text-[12px] font-bold transition-colors
                                        ${turno === t.key
                                            ? 'bg-[#29c50c] text-white'
                                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Marcador totales={totales} />
                </div>
            </section>

            {grupos.map(grupo => (
                <section key={grupo.titulo} className='bg-white rounded-xl shadow-sm border overflow-hidden'>
                    <h3 className='px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500'>
                        {grupo.titulo}
                    </h3>

                    <ul className='divide-y divide-gray-100'>
                        {grupo.locales.map(local => (
                            <Fila
                                key={local._id}
                                local={local}
                                fila={cargadas[String(local._id)]}
                                resultado={evaluarFila(String(local._id))}
                                cubiertos={localesPorOperador.get(String(cargadas[String(local._id)]?.operador?._id)) || 0}
                                puedeEditar={puedeEditar}
                                onCambiar={cambios => escribir(String(local._id), cambios)}
                            />
                        ))}
                    </ul>
                </section>
            ))}

            {!locales.length && (
                <section className='bg-white rounded-xl shadow-sm border p-5'>
                    <p className='text-[13px] text-gray-500'>No hay establecimientos cargados.</p>
                </section>
            )}
        </div>
    );
}


/** Una fila: el local, quién lo cubrió, con cuánto salió y cómo quedó. */
function Fila({ local, fila, resultado, cubiertos, puedeEditar, onCambiar }) {

    const valor = fila?.valor ?? '';
    const observacion = esObservacion(valor);

    return (
        <li className='px-5 py-3 grid gap-3 items-center
                       grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(180px,1fr)_minmax(130px,0.7fr)_auto]'>

            <span className='text-[13px] font-semibold text-gray-800 truncate'>{local.name}</span>

            <UserPicker
                valor={fila?.operador ?? null}
                onElegir={operador => onCambiar({ operador })}
                etiqueta=''
                textoTodos='Sin asignar'
                deshabilitado={!puedeEditar}
            />

            {/* Un solo campo para las dos cosas, como en la hoja: el texto de
                ayuda cambia según lo que se esté escribiendo, así se ve que un
                número y una observación no significan lo mismo. */}
            <label className='min-w-0'>
                <input
                    type='text'
                    inputMode='decimal'
                    value={valor}
                    disabled={!puedeEditar}
                    placeholder='90 o una nota'
                    onChange={e => onCambiar({ valor: e.target.value })}
                    className='w-full h-9 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700 tabular-nums
                               placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]
                               disabled:bg-gray-50 disabled:cursor-not-allowed'
                />
                {valor !== '' && (
                    <span className='block mt-0.5 text-[10px] text-gray-500 truncate'>
                        {observacion
                            ? 'observación'
                            : `${formatearPorcentaje(comoPorcentaje(valor))} · exige ${formatearPorcentaje(resultado.umbral?.minimo)}`}
                    </span>
                )}
            </label>

            <Estatus resultado={resultado} cubiertos={cubiertos} />
        </li>
    );
}


function Estatus({ resultado, cubiertos }) {
    const { estatus, umbral } = resultado;

    const pinta = {
        [ESTATUS.APROBADO]: 'bg-[#29c50c]/15 text-[#1f9a08]',
        [ESTATUS.REPROBADO]: 'bg-red-100 text-red-700',
        [ESTATUS.NO_APLICA]: 'bg-gray-100 text-gray-500',
        [ESTATUS.SIN_CARGAR]: 'bg-gray-50 text-gray-400',
    }[estatus];

    const texto = {
        [ESTATUS.APROBADO]: 'Aprobado',
        [ESTATUS.REPROBADO]: 'Reprobado',
        [ESTATUS.NO_APLICA]: 'N/A',
        [ESTATUS.SIN_CARGAR]: 'Sin cargar',
    }[estatus];

    return (
        <div className='flex items-center gap-2 justify-self-start sm:justify-self-end'>
            {/* De dónde salió el umbral. Sin esto, dos filas idénticas con
                distinto resultado parecen un error del sistema. */}
            {umbral && (
                <span className='text-[10px] text-gray-500 whitespace-nowrap' title={`Cubre ${cubiertos} local${cubiertos === 1 ? '' : 'es'} este turno`}>
                    {umbral.etiqueta}
                </span>
            )}
            <span className={`text-[10.5px] font-bold rounded-md px-2 py-1 whitespace-nowrap ${pinta}`}>
                {texto}
            </span>
        </div>
    );
}


function Marcador({ totales }) {
    const items = [
        { texto: 'Aprobados', valor: totales.aprobado, color: 'text-[#1f9a08]' },
        { texto: 'Reprobados', valor: totales.reprobado, color: 'text-red-600' },
        { texto: 'Sin cargar', valor: totales['sin-cargar'], color: 'text-gray-400' },
    ];

    return (
        <div className='ml-auto flex items-end gap-4'>
            {items.map(i => (
                <div key={i.texto}>
                    <span className='block text-[10px] font-bold uppercase tracking-wider text-gray-500'>{i.texto}</span>
                    <span className={`block text-[16px] font-black tabular-nums ${i.color}`}>{i.valor}</span>
                </div>
            ))}
        </div>
    );
}


function IconoLista() {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
            strokeLinecap='round' strokeLinejoin='round' className='w-5 h-5'>
            <path d='M9 6h11M9 12h11M9 18h11' />
            <path d='m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17' />
        </svg>
    );
}
