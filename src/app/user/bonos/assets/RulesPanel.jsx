'use client';
import { bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos, scopeLabel, reglaNueva, reglaParaFormulario } from './bonusRuleFormat';

/**
 * LAS REGLAS DE BONIFICACIÓN — la lista.
 *
 * Cuántos bonos otorga una alerta, dónde y cuántas hacen falta. Una regla la
 * comparten muchas alertas: el reglamento repite las mismas condiciones decenas
 * de veces, así que se define una vez y se reutiliza — y corregirla corrige
 * todas sus alertas de golpe.
 *
 * Solo lista. Abrir el editor se avisa hacia arriba en lugar de resolverse acá
 * porque el formulario es ancho —alcance, excepciones— y este panel vive en una
 * columna angosta al lado de las alertas: el editor tiene que poder ocupar todo
 * el ancho, y para eso lo tiene que montar quien manda en el layout.
 *
 * Alto acotado y scroll propio, igual que la lista de alertas de al lado: es lo
 * que las mantiene como dos paneles de un mismo tablero en vez de dos bloques
 * que se empujan.
 */
export default function RulesPanel({ reglas, alcance, cargando, puedeEditar, onEditar }) {

    return (
        <section className='bg-white rounded-xl shadow-sm border flex flex-col max-h-[620px]'>

            <div className='shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 flex flex-wrap items-start gap-x-4 gap-y-2'>
                <div className='min-w-0 flex-1'>
                    <h2 className='text-base font-bold text-gray-800 leading-tight'>Reglas de bonificación</h2>
                    <p className='text-[11.5px] text-gray-500 mt-0.5'>
                        Cuántos bonos otorga una alerta y en qué establecimientos. Una misma regla sirve para muchas.
                    </p>
                </div>

                {puedeEditar && (
                    <button
                        type='button'
                        onClick={() => onEditar(reglaNueva())}
                        className='shrink-0 h-9 px-4 rounded-xl text-[12.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08]
                                   active:scale-[.98] transition-colors'
                    >
                        Nueva regla
                    </button>
                )}
            </div>

            {cargando ? (
                <p className='px-5 py-8 text-[13px] text-gray-500'>Cargando reglas…</p>
            ) : reglas.length === 0 ? (
                <div className='px-5 py-8'>
                    <p className='text-[13px] font-semibold text-gray-700'>Todavía no hay ninguna regla.</p>
                    <p className='text-[12px] text-gray-500 mt-1'>
                        Conviene empezar por las que el reglamento repite más: la de una alerta = un bono, y las de
                        varias alertas por bono. Después se le asigna una a cada alerta.
                    </p>
                </div>
            ) : (
                <ul className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
                    {reglas.map(regla => (
                        <RuleRow
                            key={regla._id}
                            regla={regla}
                            alcance={alcance}
                            puedeEditar={puedeEditar}
                            onAbrir={() => onEditar(reglaParaFormulario(regla))}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}


/** Una regla: qué otorga, dónde, y cuántas alertas la usan. */
function RuleRow({ regla, alcance, puedeEditar, onAbrir }) {

    const inactiva = regla.active === false;

    return (
        <li>
            <button
                type='button'
                onClick={onAbrir}
                disabled={!puedeEditar}
                className='w-full text-left px-5 py-3.5 flex items-start gap-3
                           hover:bg-gray-50/70 transition-colors disabled:cursor-default disabled:hover:bg-transparent'
            >
                {/* El nombre y las etiquetas mandan; lo demás se acomoda. En una
                    columna angosta, tres bloques de ancho fijo se apilaban de a
                    uno y la fila crecía a tres renglones por regla. */}
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                        <span className={`text-[13.5px] font-bold ${inactiva ? 'text-gray-400' : 'text-gray-800'}`}>
                            {regla.name}
                        </span>

                        {regla.regulationCode && (
                            <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-gray-100 text-gray-600'>
                                {regla.regulationCode}
                            </span>
                        )}

                        {inactiva && (
                            <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-gray-100 text-gray-500'>
                                Inactiva
                            </span>
                        )}
                    </div>

                    <p className='text-[11.5px] text-gray-500 mt-1'>
                        {formulaLabel(regla)}
                        <span className='text-gray-300 mx-1.5'>·</span>
                        {scopeLabel(regla, alcance)}
                    </p>

                    <p className='text-[11px] text-gray-500 mt-0.5 tabular-nums'>
                        {regla.inUse > 0
                            ? `${regla.inUse} alerta${regla.inUse === 1 ? '' : 's'}`
                            : 'Sin usar'}
                        {regla.overrides?.length > 0 && (
                            <>
                                <span className='text-gray-300 mx-1.5'>·</span>
                                {regla.overrides.length} excepci{regla.overrides.length === 1 ? 'ón' : 'ones'}
                            </>
                        )}
                    </p>
                </div>

                <div className='shrink-0 text-right pt-0.5'>
                    <ValorPorTurno regla={regla} apagado={inactiva} />
                </div>
            </button>
        </li>
    );
}


/**
 * Lo que vale UNA alerta de esta regla.
 *
 * Los dos turnos aparecen solo cuando difieren: repetir el mismo número dos
 * veces en cada fila esconde justo las reglas que sí cambian entre diurno y
 * nocturno, que son las que hay que mirar. Y apilados, no en una línea: esto
 * vive en una columna angosta al lado de las alertas.
 */
function ValorPorTurno({ regla, apagado }) {
    const color = apagado ? 'text-gray-400' : 'text-[#8a5a2b]';

    if (mismoEnAmbosTurnos(regla)) {
        return (
            <span className={`text-[13px] font-bold tabular-nums whitespace-nowrap ${color}`}>
                {formatBonus(bonusPerAlert(regla, 'day'))}
                <span className='font-medium text-gray-500'> bono</span>
            </span>
        );
    }

    return (
        <span className={`block text-[12px] font-bold tabular-nums leading-snug whitespace-nowrap ${color}`}>
            {formatBonus(bonusPerAlert(regla, 'day'))} <span className='font-medium text-gray-500'>día</span>
            <br />
            {formatBonus(bonusPerAlert(regla, 'night'))} <span className='font-medium text-gray-500'>noche</span>
        </span>
    );
}
