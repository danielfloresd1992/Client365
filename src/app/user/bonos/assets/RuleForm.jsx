'use client';
import { useState, useMemo } from 'react';
import { bonusPerAlert, formatBonus, TURNOS } from './bonusRuleFormat';

/**
 * EL EDITOR DE UNA REGLA.
 *
 * Tres bloques, en el orden en que el reglamento los escribe: cuánto otorga,
 * dónde aplica, y las excepciones puntuales.
 *
 * Todo el formulario trabaja sobre una copia local y solo sube al servidor al
 * guardar. Una regla en uso decide lo que se le paga a decenas de alertas: que
 * cada tecleo saliera a la base convertiría un tanteo en un cambio real.
 */
export default function RuleForm({ valor, alcance, guardando, onGuardar, onCancelar, onBorrar }) {

    const [regla, setRegla] = useState(valor);

    const cambiar = (campos) => setRegla(previa => ({ ...previa, ...campos }));

    const numero = (v, minimo = 0) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= minimo ? n : minimo;
    };

    const nombreValido = regla.name.trim().length > 0;

    return (
        <div className='max-w-[900px] space-y-4'>

            {/* ── Qué regla es ──────────────────────────────────────── */}
            <Bloque titulo='Identificación'>
                <div className='grid gap-3 sm:grid-cols-[1fr_170px]'>
                    <Campo etiqueta='Nombre' ayuda='Con esto se la reconoce al elegirla en una alerta.'>
                        <input
                            type='text'
                            value={regla.name}
                            onChange={e => cambiar({ name: e.target.value })}
                            placeholder='Perimetrales — 3 por bono'
                            className={entrada}
                        />
                    </Campo>

                    <Campo etiqueta='Ítem del reglamento' ayuda='Para cotejar con el PDF.'>
                        <input
                            type='text'
                            value={regla.regulationCode}
                            onChange={e => cambiar({ regulationCode: e.target.value })}
                            placeholder='R2.6'
                            className={entrada}
                        />
                    </Campo>
                </div>

                <Campo etiqueta='Descripción' ayuda='Opcional. Por qué existe, o qué caso cubre.'>
                    <input
                        type='text'
                        value={regla.description}
                        onChange={e => cambiar({ description: e.target.value })}
                        className={entrada}
                    />
                </Campo>
            </Bloque>


            {/* ── Cuánto otorga ─────────────────────────────────────── */}
            <Bloque
                titulo='Cuánto otorga'
                ayuda='Cuántas alertas de este tipo hacen falta y cuántos bonos dan. Las que sobran de un grupo no se pierden: seis alertas de una regla de 4 por bono suman 1,5.'
            >
                <div className='grid gap-3 sm:grid-cols-3'>
                    <Campo etiqueta='Alertas necesarias'>
                        <input
                            type='number'
                            min='1'
                            step='1'
                            value={regla.alertsRequired}
                            onChange={e => cambiar({ alertsRequired: numero(e.target.value, 1) })}
                            className={entrada}
                        />
                    </Campo>

                    {TURNOS.map(turno => (
                        <Campo key={turno.key} etiqueta={`Bonos — turno ${turno.label.toLowerCase()}`}>
                            <input
                                type='number'
                                min='0'
                                step='0.25'
                                value={regla.bonusAwarded[turno.key]}
                                onChange={e => cambiar({
                                    bonusAwarded: { ...regla.bonusAwarded, [turno.key]: numero(e.target.value) },
                                })}
                                className={entrada}
                            />
                        </Campo>
                    ))}
                </div>

                <Resultado regla={regla} />
            </Bloque>


            {/* ── Dónde aplica ──────────────────────────────────────── */}
            <Bloque
                titulo='Dónde aplica'
                ayuda='Casi todo el reglamento lleva alcance: "solo Franciscas", "todos los Mister excepto Fort Lauderdale". Elegir por marca hace que un local nuevo quede cubierto sin que nadie lo agregue.'
            >
                <div className='flex flex-wrap gap-1.5'>
                    {[
                        { key: 'all', label: 'En todos' },
                        { key: 'only', label: 'Solo en…' },
                        { key: 'except', label: 'En todos menos…' },
                    ].map(modo => (
                        <button
                            key={modo.key}
                            type='button'
                            onClick={() => cambiar({ scope: { ...regla.scope, mode: modo.key } })}
                            aria-pressed={regla.scope.mode === modo.key}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors
                                ${regla.scope.mode === modo.key
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {modo.label}
                        </button>
                    ))}
                </div>

                {regla.scope.mode !== 'all' && (
                    <div className='grid gap-3 sm:grid-cols-2 mt-3'>
                        <Seleccion
                            titulo='Marcas'
                            opciones={alcance.franchises}
                            elegidas={regla.scope.franchises}
                            onCambiar={ids => cambiar({ scope: { ...regla.scope, franchises: ids } })}
                        />
                        <Seleccion
                            titulo='Establecimientos'
                            opciones={alcance.locals}
                            elegidas={regla.scope.locals}
                            onCambiar={ids => cambiar({ scope: { ...regla.scope, locals: ids } })}
                        />
                    </div>
                )}
            </Bloque>


            {/* ── Excepciones ───────────────────────────────────────── */}
            <Overrides
                regla={regla}
                alcance={alcance}
                onCambiar={overrides => cambiar({ overrides })}
            />


            {/* ── Estado y acciones ─────────────────────────────────── */}
            <Bloque titulo='Estado'>
                <label className='flex items-start gap-2.5 cursor-pointer'>
                    <input
                        type='checkbox'
                        checked={regla.active !== false}
                        onChange={e => cambiar({ active: e.target.checked })}
                        className='mt-0.5 w-4 h-4 rounded accent-[#29c50c]'
                    />
                    <span className='text-[12.5px] text-gray-700'>
                        <strong className='font-semibold'>Regla activa</strong>
                        <span className='block text-[11.5px] text-gray-500 mt-0.5 max-w-[65ch]'>
                            Al desactivarla deja de ofrecerse para alertas nuevas, pero las que ya la tienen no
                            cambian. Es lo que hay que hacer en lugar de borrarla cuando está en uso.
                        </span>
                    </span>
                </label>
            </Bloque>

            <div className='flex flex-wrap items-center gap-2 pb-2'>
                <button
                    type='button'
                    onClick={() => onGuardar(regla)}
                    disabled={!nombreValido || guardando}
                    className='h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08]
                               active:scale-[.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {guardando ? 'Guardando…' : regla._id ? 'Guardar cambios' : 'Crear regla'}
                </button>

                <button
                    type='button'
                    onClick={onCancelar}
                    className='h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'
                >
                    Cancelar
                </button>

                {regla._id && (
                    <button
                        type='button'
                        onClick={() => onBorrar(regla)}
                        disabled={guardando}
                        className='h-10 px-4 ml-auto rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-50
                                   transition-colors disabled:opacity-50'
                    >
                        Eliminar
                    </button>
                )}
            </div>

            {!nombreValido && (
                <p className='text-[11.5px] text-gray-500 -mt-2'>La regla necesita un nombre para poder guardarse.</p>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════
// PIEZAS
// ══════════════════════════════════════════════════════════════════════

const entrada = `h-10 w-full px-3 rounded-lg border border-gray-300 text-[13px] text-gray-800 tabular-nums
                 placeholder:text-gray-500
                 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]`;


function Bloque({ titulo, ayuda, children }) {
    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>
            <h3 className='text-[13.5px] font-bold text-gray-800'>{titulo}</h3>
            {ayuda && <p className='text-[11.5px] text-gray-500 mt-1 mb-3 max-w-[72ch]'>{ayuda}</p>}
            <div className={ayuda ? 'space-y-3' : 'space-y-3 mt-3'}>{children}</div>
        </section>
    );
}


function Campo({ etiqueta, ayuda, children }) {
    return (
        <label className='block'>
            <span className='block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1'>{etiqueta}</span>
            {children}
            {ayuda && <span className='block text-[11px] text-gray-500 mt-1'>{ayuda}</span>}
        </label>
    );
}


/**
 * Lo que va a valer cada alerta, calculado mientras se escribe.
 *
 * El número que se carga ("4 alertas, 1 bono") no es el que se paga ("0,25 por
 * alerta"). Mostrar la cuenta hecha es lo que evita cargar una regla creyendo
 * que dice otra cosa.
 */
function Resultado({ regla }) {
    return (
        <div className='rounded-lg bg-[#fdf6e7] border border-[#d9a441]/40 px-4 py-3'>
            <p className='text-[11px] font-bold uppercase tracking-wider text-[#8a5a2b]'>Cada alerta va a valer</p>
            <div className='flex flex-wrap gap-x-6 gap-y-1 mt-1.5'>
                {TURNOS.map(turno => (
                    <p key={turno.key} className='text-[14px] font-bold text-[#8a5a2b] tabular-nums'>
                        {formatBonus(bonusPerAlert(regla, turno.key))}
                        <span className='font-medium text-[12px] text-[#8a5a2b]/70'> bono · {turno.label.toLowerCase()}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}


/**
 * Una lista de marcas o establecimientos con casillas.
 *
 * Casillas y no un multi-select nativo: en un `<select multiple>` un clic sin
 * Ctrl borra todo lo elegido, y acá se eligen quince locales de una lista de
 * ochenta.
 */
function Seleccion({ titulo, opciones, elegidas, onCambiar }) {
    const [busqueda, setBusqueda] = useState('');

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return opciones;
        return opciones.filter(o => o.name.toLowerCase().includes(texto));
    }, [opciones, busqueda]);

    const alternar = (id) => {
        const yaEsta = elegidas.some(e => String(e) === String(id));
        onCambiar(yaEsta
            ? elegidas.filter(e => String(e) !== String(id))
            : [...elegidas, id]);
    };

    return (
        <div className='rounded-lg border border-gray-200'>
            <div className='px-3 pt-2.5 pb-2 border-b border-gray-100'>
                <div className='flex items-center justify-between gap-2'>
                    <span className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>{titulo}</span>
                    {elegidas.length > 0 && (
                        <span className='text-[11px] font-bold text-[#1f9a08] tabular-nums'>{elegidas.length}</span>
                    )}
                </div>

                {opciones.length > 8 && (
                    <input
                        type='search'
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder='Buscar…'
                        className='h-8 w-full mt-2 px-2.5 rounded-md border border-gray-300 text-[12px] text-gray-700
                                   placeholder:text-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                    />
                )}
            </div>

            <div className='max-h-[190px] overflow-y-auto p-1.5'>
                {opciones.length === 0 ? (
                    <p className='px-2 py-3 text-[11.5px] text-gray-500'>No se pudo cargar la lista.</p>
                ) : visibles.length === 0 ? (
                    <p className='px-2 py-3 text-[11.5px] text-gray-500'>Ninguno coincide.</p>
                ) : visibles.map(o => (
                    <label
                        key={o._id}
                        className='flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer'
                    >
                        <input
                            type='checkbox'
                            checked={elegidas.some(e => String(e) === String(o._id))}
                            onChange={() => alternar(o._id)}
                            className='w-3.5 h-3.5 rounded accent-[#29c50c]'
                        />
                        <span className='text-[12px] text-gray-700 truncate'>{o.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}


/**
 * LAS EXCEPCIONES.
 *
 * La misma alerta con otro valor en un lugar puntual: bonifica en todos lados
 * con 1, pero en un establecimiento vale 5.
 *
 * Cada excepción declara la marca o el establecimiento, no las dos. Gana la más
 * específica: si hay una para el local, la de su franquicia no se mira.
 */
function Overrides({ regla, alcance, onCambiar }) {

    const numero = (v, minimo = 0) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= minimo ? n : minimo;
    };

    const editar = (indice, campos) => onCambiar(
        regla.overrides.map((o, i) => (i === indice ? { ...o, ...campos } : o)),
    );

    const agregar = () => onCambiar([...regla.overrides, {
        franchise: null,
        local: null,
        alertsRequired: regla.alertsRequired,
        bonusAwarded: { ...regla.bonusAwarded },
        note: '',
    }]);

    return (
        <Bloque
            titulo='Excepciones'
            ayuda='Dónde esta regla vale otra cosa. La excepción del establecimiento gana sobre la de su marca.'
        >
            {regla.overrides.length === 0 ? (
                <p className='text-[12px] text-gray-500'>Ninguna. La regla vale igual en todo su alcance.</p>
            ) : (
                <ul className='space-y-3'>
                    {regla.overrides.map((o, i) => (
                        <li key={i} className='rounded-lg border border-gray-200 p-3'>
                            <div className='grid gap-3 sm:grid-cols-[1fr_repeat(3,90px)]'>
                                <Campo etiqueta='Dónde'>
                                    <select
                                        value={o.local ? `local:${o.local}` : o.franchise ? `franchise:${o.franchise}` : ''}
                                        onChange={e => {
                                            const [tipo, id] = e.target.value.split(':');
                                            editar(i, {
                                                franchise: tipo === 'franchise' ? id : null,
                                                local: tipo === 'local' ? id : null,
                                            });
                                        }}
                                        className={entrada}
                                    >
                                        <option value=''>Elegir…</option>
                                        <optgroup label='Marcas'>
                                            {alcance.franchises.map(f => (
                                                <option key={f._id} value={`franchise:${f._id}`}>{f.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label='Establecimientos'>
                                            {alcance.locals.map(l => (
                                                <option key={l._id} value={`local:${l._id}`}>{l.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </Campo>

                                <Campo etiqueta='Alertas'>
                                    <input
                                        type='number' min='1' step='1'
                                        value={o.alertsRequired}
                                        onChange={e => editar(i, { alertsRequired: numero(e.target.value, 1) })}
                                        className={entrada}
                                    />
                                </Campo>

                                {TURNOS.map(turno => (
                                    <Campo key={turno.key} etiqueta={turno.label}>
                                        <input
                                            type='number' min='0' step='0.25'
                                            value={o.bonusAwarded[turno.key]}
                                            onChange={e => editar(i, {
                                                bonusAwarded: { ...o.bonusAwarded, [turno.key]: numero(e.target.value) },
                                            })}
                                            className={entrada}
                                        />
                                    </Campo>
                                ))}
                            </div>

                            <div className='flex flex-wrap items-center gap-2 mt-2'>
                                <input
                                    type='text'
                                    value={o.note}
                                    onChange={e => editar(i, { note: e.target.value })}
                                    placeholder='Por qué acá es distinto — en seis meses nadie recuerda si fue decisión o error de carga'
                                    className='h-9 flex-1 min-w-[220px] px-3 rounded-lg border border-gray-300 text-[12px] text-gray-700
                                               placeholder:text-gray-500
                                               focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                                />
                                <button
                                    type='button'
                                    onClick={() => onCambiar(regla.overrides.filter((_, j) => j !== i))}
                                    className='h-9 px-3 rounded-lg text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors'
                                >
                                    Quitar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button
                type='button'
                onClick={agregar}
                className='h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'
            >
                Agregar excepción
            </button>
        </Bloque>
    );
}
