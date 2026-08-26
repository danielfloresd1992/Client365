'use client';
import { useMemo } from 'react';

/**
 * RESUMEN GENERAL DE LO BONIFICADO EN EL PERÍODO.
 *
 * Es la pestaña «Resumen» de la hoja de cálculo, con las dos cosas que allá
 * están separadas puestas una al lado de la otra: la tabla por operador y la
 * comparación de los que más bonos netos hicieron.
 *
 *
 * DOS NÚMEROS POR OPERADOR, Y NO SON LO MISMO
 *
 *   alertas   cuántas novedades reportó
 *   bonos     cuánto suman esas novedades una vez aplicada su regla
 *
 * No son proporcionales: una regla «4 alertas por 1 bono» deja 0,25 por alerta
 * y otra puede otorgar 5. Por eso la gráfica los muestra juntos — es donde se
 * ve quién reporta mucho de lo que paga poco, que mirando una sola columna no
 * se nota.
 *
 *
 * Y UN TERCERO QUE DICE SI EL NÚMERO ES CONFIABLE
 *
 * `selladas` son las novedades que ya pasaron por la evaluación de bono. Las
 * que no —anteriores al sistema, o sin validar todavía— no valen cero: valen
 * «no se sabe». Una fila con cien alertas y diez selladas está incompleta, y
 * sin decirlo se leería como un operador flojo.
 */
export default function ResumenGeneral({ datos, ajustes, cargando, error }) {

    const filas = useMemo(() => {
        const lista = [...(datos?.filas ?? [])];
        return lista.sort((a, b) => (b.bonos ?? 0) - (a.bonos ?? 0));
    }, [datos]);

    const totales = datos?.totales ?? null;
    const pointValue = typeof ajustes?.pointValue === 'number' ? ajustes.pointValue : null;
    const exchangeRate = typeof ajustes?.exchangeRate === 'number' ? ajustes.exchangeRate : null;

    // El período completo, para saber si lo que se muestra está cerrado.
    const incompleto = totales && totales.novedades > 0 && totales.selladas < totales.novedades;

    if (cargando) return <Marco><p className='text-[13px] text-gray-500'>Sumando el período…</p></Marco>;

    if (error) {
        return (
            <Marco>
                <h2 className='text-base font-bold text-gray-800'>Resumen general</h2>
                {/* El mensaje del servidor tal cual: los dos errores que tira
                    —rango muy largo, demasiadas novedades— vienen en español y
                    dicen exactamente qué achicar. Inventar uno propio perdería
                    el número que hace falta para corregir. */}
                <p className='mt-2 text-[12.5px] text-red-600'>{error}</p>
            </Marco>
        );
    }

    if (!datos || !filas.length) {
        return (
            <Marco>
                <h2 className='text-base font-bold text-gray-800'>Resumen general</h2>
                <p className='mt-2 text-[12.5px] text-gray-500'>
                    No hay novedades cargadas en este período.
                </p>
            </Marco>
        );
    }

    // `items-start` y no el estirado por defecto: con el top corto y el
    // resumen largo, estirar dejaría media tarjeta en blanco. Cada una mide lo
    // suyo, y las dos topan en el mismo alto.
    return (
        <div className='grid gap-4 items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>

            {/* ── El resumen ─────────────────────────────────────────── */}
            <Marco className={ALTO}>

                {/* Lo que NO scrollea. Las cifras del período y el aviso de
                    incompleto son el encabezado de lectura de la tabla: si se
                    fueran de vista al bajar, las filas quedarían sin contra
                    qué compararse, que es justo cuando hacen falta. */}
                <div className='shrink-0 flex items-baseline justify-between gap-3 flex-wrap'>
                    <h2 className='text-base font-bold text-gray-800 leading-tight'>Resumen general</h2>
                    <span className='text-[11px] text-gray-500'>
                        {filas.length} operador{filas.length === 1 ? '' : 'es'}
                        {datos.rango?.dias ? ` · ${datos.rango.dias} días` : ''}
                    </span>
                </div>

                <div className='shrink-0 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    <Cifra etiqueta='Alertas' valor={entero(totales?.novedades)} />
                    <Cifra etiqueta='Bonos' valor={decimal(totales?.bonos)} destacado />
                    <Cifra etiqueta='En dólares'
                        valor={pointValue !== null ? enDolares(totales.bonos * pointValue) : '—'}
                        atenuado={pointValue === null} />
                    <Cifra etiqueta='En bolívares'
                        valor={pointValue !== null && exchangeRate !== null
                            ? enBolivares(totales.bonos * pointValue * exchangeRate)
                            : '—'}
                        atenuado={pointValue === null || exchangeRate === null} />
                </div>

                {incompleto && (
                    <p className='shrink-0 mt-3 text-[11px] text-[#8a5a2b] bg-[#fdf6e7] rounded-lg px-3 py-2'>
                        {entero(totales.novedades - totales.selladas)} de {entero(totales.novedades)} alertas
                        todavía no tienen el bono evaluado. Lo de abajo es lo que ya está sellado, no el total del período.
                    </p>
                )}

                {/* EL ÚNICO QUE SCROLLEA.
                    `min-h-0` no es decorativo: un hijo de flex arranca con
                    `min-height:auto`, así que sin esto se niega a achicarse por
                    debajo de su contenido y el `overflow` nunca llega a actuar
                    — la tarjeta crecería y el max-h no serviría de nada. */}
                <div className='flex-1 min-h-0 mt-4 -mx-1 px-1 overflow-auto'>
                    <table className='w-full min-w-[420px] border-collapse'>
                        <thead>
                            <tr>
                                <Th>Operador</Th>
                                <Th derecha>Alertas</Th>
                                <Th derecha>Bonos</Th>
                                <Th derecha>Selladas</Th>
                                {pointValue !== null && <Th derecha>Monto</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f, i) => (
                                <tr key={`${f.operador ?? f.nombre}-${i}`}
                                    className='border-b border-gray-50 hover:bg-gray-50/60 transition-colors'>
                                    <Td>
                                        <span className='font-semibold text-gray-800'>{f.nombre}</span>
                                    </Td>
                                    <Td derecha atenuado>{entero(f.alertas)}</Td>
                                    <Td derecha fuerte>{decimal(f.bonos)}</Td>
                                    <Td derecha atenuado={f.selladas === f.alertas}>
                                        {f.selladas === f.alertas
                                            ? entero(f.selladas)
                                            : <span className='text-[#8a5a2b] font-bold'
                                                title={`${f.alertas - f.selladas} sin evaluar`}>
                                                {entero(f.selladas)} de {entero(f.alertas)}
                                            </span>}
                                    </Td>
                                    {pointValue !== null && (
                                        <Td derecha>{enDolares((f.bonos ?? 0) * pointValue)}</Td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pointValue !== null && (
                    <p className='shrink-0 mt-3 pt-3 border-t border-gray-100 text-[10.5px] text-gray-400 leading-relaxed'>
                        El monto se calcula con el valor de bono VIGENTE ({enDolares(pointValue)}). Cada novedad
                        guarda además el valor que tenía al sellarse, que es el que manda al liquidar un
                        período viejo.
                    </p>
                )}
            </Marco>

            {/* ── La comparación ─────────────────────────────────────── */}
            <ComparativaDeBonos filas={filas} />
        </div>
    );
}


/**
 * LOS QUE MÁS BONOS NETOS HICIERON, CON SUS ALERTAS AL LADO.
 *
 * Dos barras por persona sobre la MISMA escala —la de las alertas, que siempre
 * es el número mayor— para que la diferencia entre una y otra se lea como lo
 * que es: cuánto de lo que reportó terminó pagando.
 *
 * Diez y no todos: es un ranking, y una lista de sesenta barras deja de serlo.
 */
function ComparativaDeBonos({ filas }) {

    const top = filas.slice(0, 10);
    const escala = Math.max(1, ...top.map(f => Math.max(f.alertas ?? 0, f.bonos ?? 0)));

    return (
        <Marco className={ALTO}>
            <div className='shrink-0 flex items-baseline justify-between gap-3 flex-wrap'>
                <h2 className='text-base font-bold text-gray-800 leading-tight'>Top {top.length} · más bonos</h2>
                <div className='flex items-center gap-3 text-[10.5px] font-semibold'>
                    <span className='flex items-center gap-1.5 text-gray-500'>
                        <span className='h-[9px] w-[9px] rounded-sm bg-gray-300' />Alertas
                    </span>
                    <span className='flex items-center gap-1.5 text-[#1f9a08]'>
                        <span className='h-[9px] w-[9px] rounded-sm bg-[#29c50c]' />Bonos
                    </span>
                </div>
            </div>

            <p className='shrink-0 text-[11.5px] text-gray-500 mt-0.5'>
                Cuánto de lo reportado terminó pagando.
            </p>

            {/* El `pr-1` deja aire entre las barras y la barra de scroll: sin
                eso la de la derecha queda pegada y parece cortada. */}
            <ul className='flex-1 min-h-0 mt-4 pr-1 overflow-y-auto space-y-3'>
                {top.map((f, i) => {
                    const alertas = f.alertas ?? 0;
                    const bonos = f.bonos ?? 0;
                    // Qué proporción de sus alertas se volvió bono. Es la
                    // lectura que la gráfica hace visible de un vistazo.
                    const rendimiento = alertas > 0 ? bonos / alertas : 0;

                    return (
                        <li key={`${f.operador ?? f.nombre}-${i}`}>
                            <div className='flex items-baseline justify-between gap-2 mb-1'>
                                <span className='text-[12px] font-semibold text-gray-700 truncate min-w-0'>
                                    <span className='text-gray-400 tabular-nums mr-1.5'>{i + 1}</span>
                                    {f.nombre}
                                </span>
                                <span className='shrink-0 text-[11px] tabular-nums text-gray-500'>
                                    <b className='text-[#1f9a08] text-[12.5px]'>{decimal(bonos)}</b>
                                    {' de '}{entero(alertas)}
                                    <span className='ml-1.5 text-gray-400'>({porciento(rendimiento)})</span>
                                </span>
                            </div>

                            <div className='space-y-[3px]'>
                                <Barra ancho={alertas / escala} clase='bg-gray-200' />
                                <Barra ancho={bonos / escala} clase='bg-[#29c50c]' />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Marco>
    );
}


function Barra({ ancho, clase }) {
    return (
        <span className='block h-[7px] rounded-full bg-gray-50 overflow-hidden'>
            <span className={`block h-full rounded-full transition-[width] duration-500 ${clase}`}
                style={{ width: `${Math.max(0, Math.min(1, ancho)) * 100}%` }} />
        </span>
    );
}


// ══════════════════════════════════════════════════════════════════════

/**
 * EL TOPE DE ALTO DE LAS DOS TARJETAS.
 *
 * Una consulta de un mes trae sesenta operadores, y sesenta filas empujan la
 * página hacia abajo hasta dejar los filtros fuera de pantalla: para cambiar
 * el rango habría que volver a subir. Acotadas, el panel entra de una y cada
 * tarjeta se recorre por dentro.
 *
 * Va en las DOS con el mismo valor para que topen parejas cuando están una al
 * lado de la otra.
 */
const ALTO = 'max-h-[68vh] flex flex-col';

const Marco = ({ children, className = '' }) => (
    <section className={`bg-white rounded-xl shadow-sm border p-5 ${className}`}>{children}</section>
);

/**
 * El encabezado se queda arriba mientras las filas pasan por debajo. Sin eso,
 * a la fila cuarenta ya no se sabe cuál columna es cuál.
 *
 * La línea de abajo va como SOMBRA y no como borde: con `border-collapse` el
 * borde de una celda fija se queda en su sitio original al scrollear, y la
 * tabla aparece con una raya suelta en el medio. Una sombra interior viaja
 * con la celda.
 */
const Th = ({ children, derecha }) => (
    <th className={`sticky top-0 z-[1] bg-white pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500
                    shadow-[inset_0_-1px_0_#e5e7eb] ${derecha ? 'text-right' : 'text-left'}`}>
        {children}
    </th>
);

const Td = ({ children, derecha, fuerte, atenuado }) => (
    <td className={`py-1.5 text-[12px] tabular-nums
                    ${derecha ? 'text-right' : 'text-left'}
                    ${fuerte ? 'font-black text-[#1f9a08] text-[12.5px]' : atenuado ? 'text-gray-400' : 'text-gray-700'}`}>
        {children}
    </td>
);

function Cifra({ etiqueta, valor, destacado, atenuado }) {
    return (
        <div>
            <span className='block text-[10px] font-bold uppercase tracking-wider text-gray-500'>{etiqueta}</span>
            <span className={`block mt-0.5 text-[17px] font-black tabular-nums leading-none
                              ${atenuado ? 'text-gray-300' : destacado ? 'text-[#1f9a08]' : 'text-gray-800'}`}>
                {valor}
            </span>
        </div>
    );
}


const entero = (n) => Number(n ?? 0).toLocaleString('es-VE', { maximumFractionDigits: 0 });

/** Los bonos son fraccionarios —una regla 4x1 deja 0,25— pero 1,00 se lee peor que 1. */
const decimal = (n) => Number(n ?? 0).toLocaleString('es-VE', { maximumFractionDigits: 2 });

const enDolares = (n) => `${Number(n ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

const enBolivares = (n) => `${Number(n ?? 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs`;

const porciento = (n) => `${Math.round(n * 100)}%`;
