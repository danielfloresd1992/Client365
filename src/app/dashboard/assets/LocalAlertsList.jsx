'use client';

/**
 * LAS ALERTAS DEL DÍA DE UN ESTABLECIMIENTO, DESPLEGADAS BAJO SU FILA.
 *
 * Tres columnas y nada más: la hora, qué alerta fue, y cómo quedó la
 * validación. Es lo que se abre desde la lista, no la ficha de la novedad —
 * para eso está la pantalla de novedades.
 *
 * Va dentro de la misma fila de la rejilla, ocupando todas las columnas, así
 * que empuja hacia abajo en vez de flotar por encima. Un desplegable flotante
 * sobre una lista de cien filas tapa justo lo que se estaba comparando.
 */
export default function LocalAlertsList({ datos, cargando, error, onReintentar }) {

    if (cargando && !datos) {
        return <Marco><p className='text-[11px] text-gray-400'>Buscando las alertas del día…</p></Marco>;
    }

    if (error) {
        return (
            <Marco>
                <p className='text-[11px] text-red-600'>
                    {error}{' '}
                    <button type='button' onClick={onReintentar}
                        className='font-bold underline decoration-dotted hover:text-red-700'>
                        reintentar
                    </button>
                </p>
            </Marco>
        );
    }

    const alertas = datos?.alertas ?? [];

    if (!alertas.length) {
        return <Marco><p className='text-[11px] text-gray-400'>Sin alertas reportadas hoy.</p></Marco>;
    }

    return (
        <Marco>
            <div className='flex items-center gap-3 mb-1.5 text-[9.5px] font-bold uppercase tracking-wider'>
                <span className='text-gray-500'>{datos.resumen.total} del día</span>
                {datos.resumen.aprobadas > 0 && <span className='text-emerald-600'>{datos.resumen.aprobadas} aprobadas</span>}
                {datos.resumen.rechazadas > 0 && <span className='text-red-600'>{datos.resumen.rechazadas} rechazadas</span>}
                {datos.resumen.sinValidar > 0 && <span className='text-amber-600'>{datos.resumen.sinValidar} sin validar</span>}
            </div>

            <ul className='divide-y divide-gray-100'>
                {alertas.map(a => (
                    <li key={a.id} className='py-1 grid gap-x-2 md:gap-x-3 items-baseline grid-cols-[2.8rem_minmax(0,1fr)_auto] md:grid-cols-[3.2rem_1fr_auto]'>
                        <span className='text-[10.5px] font-semibold tabular-nums text-gray-500'>{hora(a.hora)}</span>
                        <span className='text-[11px] text-gray-700 truncate' title={a.title || ''}>
                            {a.title || <em className='text-gray-400'>sin título</em>}
                        </span>
                        <Validacion estado={a.validacion} detalle={a.detalle} />
                    </li>
                ))}
            </ul>
        </Marco>
    );
}


/** Ocupa TODAS las columnas de la fila —cuatro en escritorio, dos en la rejilla
 *  angosta de `LocalRow`— y se separa con una línea, no con aire. */
const Marco = ({ children }) => (
    <div className='col-span-2 md:col-span-4 mt-1 pt-1.5 pl-2 md:pl-4 border-t border-dashed border-gray-200'>{children}</div>
);


function Validacion({ estado, detalle }) {
    const pinta = {
        aprobada: 'bg-emerald-50 text-emerald-700',
        rechazada: 'bg-red-50 text-red-700',
        'sin validar': 'bg-amber-50 text-amber-700',
    }[estado] ?? 'bg-gray-100 text-gray-500';

    return (
        <span className={`text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-[1px] whitespace-nowrap ${pinta}`}
            // El motivo del rechazo, si lo hay: es lo primero que se pregunta
            // al ver una rechazada, y no justifica una columna propia.
            title={detalle || undefined}>
            {estado}
        </span>
    );
}


/** Solo la hora y el minuto: el día ya lo dice la fila. */
const hora = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });
};
