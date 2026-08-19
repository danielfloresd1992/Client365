'use client';
import { useState, useEffect } from 'react';

/**
 * LAS DOS VARIABLES GLOBALES DEL SISTEMA, EN UNA SOLA PIEZA.
 *
 *   Valor de un bono   cuánto vale UNO, en dólares
 *   Tasa del BCV       a qué cambio se paga en bolívares
 *
 * Van juntas y no en dos tarjetas porque ninguna significa nada sola: el número
 * que de verdad importa —cuánto cobra alguien por un bono— sale de
 * multiplicarlas. Separadas, esa cuenta la tenía que hacer de memoria el que
 * mira la pantalla.
 *
 * Por eso se leen como una ecuación, con el resultado calculado sobre lo que se
 * está escribiendo y no sobre lo guardado: es la única forma de ver a cuánto va
 * a quedar el bono ANTES de confirmar el cambio.
 *
 * Un solo botón para las dos. El servidor acepta cambios parciales, así que se
 * manda únicamente lo que se tocó: cambiar la tasa —que es lo habitual, cambia
 * mucho más seguido— no reescribe el valor del bono.
 */

// ── Las alturas de la ecuación ────────────────────────────────────────
// Fijas, y ahí está todo el asunto de la alineación: ver `Termino`.
const ALTO_ROTULO = 'h-4 leading-4';
const ALTO_CAMPO = 'h-10';


const CAMPOS = [
    {
        key: 'pointValue',
        etiqueta: 'Valor de un bono',
        unidad: 'Dólares',
        paso: '0.01',
    },
    {
        key: 'exchangeRate',
        etiqueta: 'Tasa de cambio del BCV',
        unidad: 'Bolívares por dólar',
        paso: '0.01',
    },
];


/** El texto de un campo como número usable, o null si no lo es. */
const comoNumero = (texto) => {
    if (String(texto).trim() === '') return null;
    const n = Number(texto);
    return Number.isFinite(n) && n >= 0 ? n : null;
};


export default function ReferenceValues({ ajustes, cargando, guardando, puedeEditar, onGuardar }) {

    // Se trabaja con texto y no con números: un input controlado por un número
    // no se puede dejar vacío para reescribirlo, y borra el último dígito solo.
    const [borrador, setBorrador] = useState({ pointValue: '', exchangeRate: '' });

    // Se sincroniza con lo guardado cuando llega o cuando cambia tras guardar,
    // no en cada render: si se escribiera encima mientras alguien tipea, el
    // campo se le reiniciaría solo.
    useEffect(() => {
        // `typeof number` y no un `??`: el cero es un valor legítimo —la tasa
        // arranca en cero hasta que alguien la carga— y con un `||` o un `??`
        // mal puesto se volvería campo vacío.
        const texto = (v) => (typeof v === 'number' ? String(v) : '');

        setBorrador({
            pointValue: texto(ajustes?.pointValue),
            exchangeRate: texto(ajustes?.exchangeRate),
        });
    }, [ajustes?.pointValue, ajustes?.exchangeRate]);

    const valores = {
        pointValue: comoNumero(borrador.pointValue),
        exchangeRate: comoNumero(borrador.exchangeRate),
    };

    const hayInvalido = CAMPOS.some(c => valores[c.key] === null);

    // Solo lo que se tocó. Mandar los dos siempre dejaría en el historial un
    // cambio del valor del bono cada vez que se actualiza la tasa.
    const cambios = Object.fromEntries(
        CAMPOS
            .filter(c => valores[c.key] !== null && valores[c.key] !== ajustes?.[c.key])
            .map(c => [c.key, valores[c.key]]),
    );
    const hayCambios = Object.keys(cambios).length > 0;

    const guardar = () => { if (hayCambios && !hayInvalido) onGuardar(cambios); };

    // Los mensajes son pasajeros y solo aparecen cuando hay algo que decir.
    const hayMensaje = (hayCambios && !hayInvalido)
        || (hayInvalido && !cargando && !ajustes?.unreachable);

    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>

            <div className='flex flex-wrap items-start gap-3'>
                <span className='shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#d9a441]/15 text-[#8a5a2b]'>
                    <IconoEstrella />
                </span>
                <div className='min-w-0 flex-1'>
                    <h2 className='text-base font-bold text-gray-800 leading-tight'>Valores de referencia</h2>
                    <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[72ch]'>
                        Cuánto vale un bono y a qué cambio se paga. Son globales: valen igual para todas las alertas.
                        Lo que cambia por alerta es la <strong className='font-semibold text-gray-600'>cantidad</strong> de
                        bonos que otorga, y eso lo deciden las reglas.
                    </p>
                </div>

                {/* Guardar al ras del título. La tarjeta ya es alta por la
                    ecuación, y una fila propia solo para el botón sumaba
                    sesenta píxeles de aire al pie. Va a la altura del ícono,
                    que mide lo mismo. */}
                {puedeEditar && (
                    <button
                        type='button'
                        onClick={guardar}
                        disabled={!hayCambios || hayInvalido || guardando || cargando}
                        className='shrink-0 h-10 px-5 rounded-xl text-[12.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08]
                                   active:scale-[.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                )}
            </div>

            {/* ── La ecuación ────────────────────────────────────────────
                En una fila con los operadores a la vista, para que se lea
                como lo que es: una multiplicación cuyo resultado es lo que
                cobra alguien. Apilada en pantallas angostas, donde los
                signos sueltos entre bloques estorban más de lo que ayudan.

                Ocupa todo el ancho de la tarjeta. Los dos factores llevan
                menos peso que el resultado: son números de tres dígitos y lo
                que se consulta de reojo es el total en bolívares, así que el
                espacio de más va donde se mira. */}
            <div className='mt-5 grid gap-x-3 gap-y-4
                            sm:grid-cols-[minmax(120px,1fr)_auto_minmax(120px,1fr)_auto_minmax(160px,1.4fr)]'>

                {CAMPOS.map((campo, i) => (
                    <Termino
                        key={campo.key}
                        operadorPrevio={i > 0 ? '×' : null}
                        etiqueta={campo.etiqueta}
                        unidad={campo.unidad}
                    >
                        <input
                            type='number'
                            step={campo.paso}
                            min='0'
                            value={cargando ? '' : borrador[campo.key]}
                            disabled={!puedeEditar || cargando}
                            onChange={e => setBorrador(previo => ({ ...previo, [campo.key]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') guardar(); }}
                            aria-label={campo.etiqueta}
                            className={`${ALTO_CAMPO} w-full px-3 rounded-xl border border-gray-300 text-[13.5px] font-semibold text-gray-800 tabular-nums
                                        focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]
                                        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        />
                    </Termino>
                ))}

                <Termino operadorPrevio='=' etiqueta='Un bono hoy' unidad='Al cambio de hoy'>
                    <div className={`${ALTO_CAMPO} flex items-center px-3 rounded-xl bg-[#fdf6e7] border border-[#d9a441]/40`}>
                        <Resultado
                            pointValue={valores.pointValue}
                            exchangeRate={valores.exchangeRate}
                            cargando={cargando}
                        />
                    </div>
                </Termino>
            </div>

            {/* ── Lo que va a pasar ──────────────────────────────────
                Sin nada que decir no se dibuja: una fila vacía deja un hueco
                que se lee como si faltara algo. */}
            {hayMensaje && (
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-4'>
                    {/* Qué se va a mandar, dicho antes de mandarlo: el botón es
                        uno solo para dos campos y sin esto no se ve cuál se tocó. */}
                    {hayCambios && !hayInvalido && (
                        <p className='text-[11.5px] font-semibold text-[#1f9a08]'>
                            Se va a actualizar {Object.keys(cambios).length === 2
                                ? 'el valor del bono y la tasa'
                                : cambios.pointValue !== undefined ? 'el valor del bono' : 'la tasa'}.
                        </p>
                    )}

                    {/* No cuando el servidor no respondió: ahí los campos están
                        vacíos por eso y no por lo que haya escrito nadie. */}
                    {hayInvalido && !cargando && !ajustes?.unreachable && (
                        <p className='text-[11.5px] font-semibold text-red-600'>
                            Los dos valores tienen que ser números mayores o iguales a cero.
                        </p>
                    )}
                </div>
            )}

            {/* ── Contexto de fondo ──────────────────────────────────
                La nota y la última actualización comparten renglón: las dos se
                leen de reojo y en filas separadas gastaban dos renglones para
                decir algo secundario. En pantallas angostas la fecha baja sola,
                pegada a la derecha. */}
            <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-3'>
                <p className='text-[11px] text-gray-500 max-w-[80ch]'>
                    {!puedeEditar
                        ? 'Solo un administrador puede cambiar estos valores.'
                        : 'La tasa se carga a mano con la publicada por el Banco Central. Ningún cambio recalcula lo ya pagado: cada novedad conserva el valor con el que se selló.'}
                </p>

                {ajustes?.updatedAt && (
                    <p className='text-[11px] text-gray-400 ml-auto shrink-0'>
                        Última actualización: {new Date(ajustes.updatedAt).toLocaleString('es-VE')}
                        {ajustes.updatedBy?.nameUser ? ` · por ${ajustes.updatedBy.nameUser}` : ''}
                    </p>
                )}
            </div>

            {ajustes?.unreachable && (
                <p className='text-[11px] text-[#8a5a2b] bg-[#fdf6e7] border border-[#d9a441]/40 rounded-lg px-3 py-2 mt-3'>
                    No se pudieron leer los valores guardados. El servidor no respondió; hasta que responda, lo que se
                    escriba acá no se va a poder guardar.
                </p>
            )}
        </section>
    );
}


/**
 * Un término de la ecuación: rótulo arriba, campo, y unidad abajo.
 *
 * LAS TRES FILAS TIENEN ALTURA FIJA, y eso es lo único que mantiene los campos
 * alineados. Alinear las columnas por su borde —`items-end` o `items-start`—
 * parece que funciona hasta que un rótulo ocupa dos líneas o una unidad es más
 * larga que otra: ahí cada campo arranca a distinta altura y la fila deja de
 * leerse como una cuenta. Con las filas fijas, el largo de los textos no puede
 * mover nada.
 *
 * Por lo mismo el operador se dibuja con la MISMA estructura, con el rótulo y
 * la unidad vacíos: es un término más de la grilla, así que cae solo a la
 * altura del campo sin ningún margen calculado a mano.
 */
function Termino({ operadorPrevio, etiqueta, unidad, children }) {
    return (
        <>
            {/* Se oculta al apilarse: un "×" suelto entre dos bloques, uno
                debajo del otro, no significa nada. */}
            {operadorPrevio && (
                <div aria-hidden='true' className='hidden sm:block'>
                    <span className={`block ${ALTO_ROTULO}`} />
                    <span className={`mt-1 grid place-items-center ${ALTO_CAMPO} text-[16px] font-light text-gray-300 select-none`}>
                        {operadorPrevio}
                    </span>
                    <span className={`block mt-1 ${ALTO_ROTULO}`} />
                </div>
            )}

            <div>
                <span className={`block ${ALTO_ROTULO} text-[10.5px] font-bold uppercase tracking-wider text-gray-500 truncate`}>
                    {etiqueta}
                </span>

                <div className='mt-1'>{children}</div>

                <span className={`block mt-1 ${ALTO_ROTULO} text-[10.5px] text-gray-500 truncate`}>
                    {unidad}
                </span>
            </div>
        </>
    );
}


/** Lo que cobra alguien por un bono, con lo que hay escrito en este momento. */
function Resultado({ pointValue, exchangeRate, cargando }) {

    if (cargando) return <span className='text-[15.5px] font-black text-[#8a5a2b]/30 tabular-nums'>—</span>;

    const enBolivares = pointValue !== null && exchangeRate !== null ? pointValue * exchangeRate : null;

    // El cero se explica, no se muestra como "0,00 Bs": es el estado inicial
    // —la tasa arranca sin cargar— y un cero suelto parece un error de cálculo.
    if (!enBolivares) {
        const motivo = pointValue === null || exchangeRate === null ? 'Falta un valor'
            : exchangeRate === 0 ? 'Sin tasa cargada'
            : 'El bono vale cero';

        return <span className='text-[11.5px] font-semibold text-[#8a5a2b]/60 truncate'>{motivo}</span>;
    }

    return (
        <span className='text-[15.5px] font-black text-[#8a5a2b] tabular-nums truncate'>
            {enBolivares.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className='text-[11px] font-bold text-[#8a5a2b]/70'> Bs</span>
        </span>
    );
}


function IconoEstrella() {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-5 h-5'>
            <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
        </svg>
    );
}
