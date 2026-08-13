'use client';

/**
 * Resultado de la consulta: el resumen arriba y el detalle debajo.
 *
 * El resumen manda porque es lo que decide la bonificación; el listado está
 * para poder revisar caso por caso cuando un número no cuadra.
 */

const fechaHora = (valor) => {
    if (!valor) return '';
    try {
        return new Date(valor).toLocaleString('es-VE', {
            timeZone: 'America/Caracas',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        }).replace(/[  ]/g, ' ').replace(/\ba\.\s*m\./i, 'am').replace(/\bp\.\s*m\./i, 'pm');
    } catch { return ''; }
};

const TURNOS = { day: 'Diurno', night: 'Nocturno' };

/**
 * Estado de validación de una novedad.
 *
 * `isApproved` puede venir true, false o sin definir, y los tres significan
 * cosas distintas: aprobada, rechazada y todavía sin revisar. Tratar la
 * ausencia como rechazo restaría bonos que sí corresponden.
 */
const estadoDe = (n) => {
    const v = n?.validationResult;
    if (v?.isApproved === true) return { texto: 'Aprobada', clase: 'bg-[#29c50c]/12 text-[#1f9a08] ring-1 ring-[#29c50c]/30' };
    if (v?.isApproved === false) return { texto: 'Rechazada', clase: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' };
    return { texto: 'Sin validar', clase: 'bg-gray-100 text-gray-600 ring-1 ring-gray-300' };
};


function Tarjeta({ etiqueta, valor, tono }) {
    return (
        <div className={`flex-1 min-w-[110px] rounded-xl border p-3 ${tono}`}>
            <p className='text-[10px] font-bold uppercase tracking-wider opacity-70'>{etiqueta}</p>
            <p className='text-2xl font-black leading-none mt-1 tabular-nums'>{valor}</p>
        </div>
    );
}


export default function NoveltiesResult({ datos, empleado }) {
    const { resumen, novelties = [] } = datos || {};
    if (!resumen) return null;

    return (
        <div className='flex flex-col gap-4 min-h-0'>
            {/* Resumen */}
            <div className='flex flex-wrap gap-2'>
                <Tarjeta etiqueta='Reportadas' valor={resumen.total} tono='bg-white border-gray-200 text-gray-800' />
                <Tarjeta etiqueta='Aprobadas' valor={resumen.aprobadas} tono='bg-[#29c50c]/[0.06] border-[#29c50c]/30 text-[#1f9a08]' />
                <Tarjeta etiqueta='Rechazadas' valor={resumen.rechazadas} tono='bg-rose-50 border-rose-200 text-rose-700' />
                <Tarjeta etiqueta='Sin validar' valor={resumen.sinValidar} tono='bg-gray-50 border-gray-200 text-gray-600' />
            </div>

            {resumen.total === 0 ? (
                <div className='bg-white rounded-xl border p-8 text-center'>
                    <p className='text-sm font-semibold text-gray-600'>
                        {empleado ? `${empleado.name} ${empleado.surName}` : 'El empleado'} no reportó novedades en ese rango
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                        Probá con otras fechas, o revisá que sea el empleado correcto.
                    </p>
                </div>
            ) : (
                <div className='bg-white rounded-xl border overflow-hidden flex-1 min-h-0 flex flex-col'>
                    <div className='shrink-0 px-4 py-2.5 border-b bg-gray-50'>
                        <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                            Detalle · {novelties.length} {novelties.length === 1 ? 'novedad' : 'novedades'}
                        </p>
                    </div>

                    <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
                        {novelties.map(n => {
                            const estado = estadoDe(n);
                            const validador = n?.validationResult?.validatedByUser?.user;

                            return (
                                <div key={n._id} className='px-4 py-3 hover:bg-gray-50 transition-colors'>
                                    <div className='flex items-start gap-3'>
                                        <div className='min-w-0 flex-1'>
                                            <p className='text-[13px] font-bold text-gray-800 truncate'>
                                                {n.title || 'Sin título'}
                                            </p>

                                            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-gray-500'>
                                                <span className='tabular-nums'>{fechaHora(n.createdAt)}</span>
                                                {n.establishment?.name && (
                                                    <span className='truncate'>· {n.establishment.name}</span>
                                                )}
                                                {n.shift && <span>· {TURNOS[n.shift] || n.shift}</span>}
                                            </div>

                                            {/* Quién validó y qué dijo: es lo que sostiene o
                                                tumba el bono de esa novedad. */}
                                            {validador?.nameUser && (
                                                <p className='text-[11px] text-gray-400 mt-1 truncate'>
                                                    Validó {validador.nameUser}
                                                    {n.validationResult?.updatedAt && ` · ${fechaHora(n.validationResult.updatedAt)}`}
                                                </p>
                                            )}
                                            {n.validationResult?.detail && (
                                                <p className='text-[11px] text-gray-500 mt-1 italic line-clamp-2'>
                                                    “{n.validationResult.detail}”
                                                </p>
                                            )}
                                        </div>

                                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${estado.clase}`}>
                                            {estado.texto}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
