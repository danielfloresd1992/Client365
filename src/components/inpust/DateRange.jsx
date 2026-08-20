'use client';

/**
 * UN RANGO DE FECHAS: DESDE Y HASTA.
 *
 * Dos campos que se validan entre sí. Existe porque este par estaba copiado a
 * mano en tres pantallas —novedades del establecimiento, asistencia y
 * asignación de días— cada una con sus propios estilos y ninguna con el `min`
 * y el `max` cruzados, que es lo único que evita que alguien pida un rango al
 * revés.
 *
 *     const [rango, setRango] = useState({ desde: '', hasta: '' });
 *     <DateRange valor={rango} onCambiar={setRango} maximoDias={92} />
 *
 * Trabaja con texto 'AAAA-MM-DD', que es lo que da y espera `input[type=date]`
 * y lo que viaja en la URL. Convertir a `Date` es asunto de quien consulta.
 *
 * @param {{ desde: string, hasta: string }} valor
 * @param {(r: { desde: string, hasta: string }) => void} onCambiar
 * @param {number} [maximoDias]  Si se pasa, avisa cuando el rango lo excede.
 */
export default function DateRange({
    valor,
    onCambiar,
    maximoDias = null,
    deshabilitado = false,
    className = '',
    etiquetaDesde = 'Desde',
    etiquetaHasta = 'Hasta',
}) {

    const { desde = '', hasta = '' } = valor || {};
    const cambiar = (campo, v) => onCambiar({ ...valor, [campo]: v });

    const dias = contarDias(desde, hasta);
    const excedido = maximoDias && dias > maximoDias;

    return (
        <div className={className}>
            <div className='flex flex-col sm:flex-row gap-2'>
                <Campo etiqueta={etiquetaDesde} valor={desde} deshabilitado={deshabilitado}
                    // El `max` cruzado es lo que impide elegir un desde posterior
                    // al hasta. Validar después y avisar con un error es pedirle
                    // al usuario que arregle algo que se podía no dejar hacer.
                    max={hasta || undefined}
                    onCambiar={v => cambiar('desde', v)} />

                <Campo etiqueta={etiquetaHasta} valor={hasta} deshabilitado={deshabilitado}
                    min={desde || undefined}
                    onCambiar={v => cambiar('hasta', v)} />
            </div>

            {dias > 0 && (
                <p className={`mt-1.5 text-[11px] ${excedido ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                    {dias} día{dias === 1 ? '' : 's'}
                    {excedido && ` · el máximo es ${maximoDias}`}
                </p>
            )}
        </div>
    );
}


function Campo({ etiqueta, valor, min, max, deshabilitado, onCambiar }) {
    return (
        <label className='flex-1 min-w-0'>
            <span className='block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 mb-1'>
                {etiqueta}
            </span>
            <input
                type='date'
                value={valor}
                min={min}
                max={max}
                disabled={deshabilitado}
                onChange={e => onCambiar(e.target.value)}
                className='w-full h-9 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
            />
        </label>
    );
}


/** Cuántos días abarca el rango, contando los dos extremos. 0 si está incompleto. */
export const contarDias = (desde, hasta) => {
    if (!desde || !hasta) return 0;
    const a = new Date(`${desde}T00:00:00`);
    const b = new Date(`${hasta}T00:00:00`);
    if (isNaN(a) || isNaN(b) || b < a) return 0;
    return Math.round((b - a) / 86400000) + 1;
};
