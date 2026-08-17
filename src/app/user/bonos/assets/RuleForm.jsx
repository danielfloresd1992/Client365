'use client';
import { useState } from 'react';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { iconOf } from '@/libs/alerts/categoryIcons.js';
import { bonusPerAlert, formatBonus, TURNOS } from './bonusRuleFormat';

/**
 * EL EDITOR DE UNA REGLA.
 *
 * Qué es, cuánto otorga y sus excepciones.
 *
 * Lo que NO está acá es el ALCANCE: vive en el mapa, en su propia caja. Ahí se
 * ve de un vistazo a qué establecimientos apunta la regla, en vez de quedar
 * escondido dentro de un formulario que hay que abrir para saberlo.
 *
 * Todo trabaja sobre una copia local y solo sube al servidor al guardar. Una
 * regla en uso decide lo que se le paga a decenas de alertas: que cada tecleo
 * saliera a la base convertiría un tanteo en un cambio real.
 */
export default function RuleForm({ valor, guardando, onGuardar, onCancelar, onBorrar, onGestionarCategorias }) {

    const [regla, setRegla] = useState(valor);
    const { categorias } = useBonusCategories(false);

    const cambiar = (campos) => setRegla(previa => ({ ...previa, ...campos }));

    const numero = (v, minimo = 0) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= minimo ? n : minimo;
    };

    // Las mismas reglas que valida el servidor, repetidas acá no para
    // reemplazarlo —él sigue siendo el que manda— sino para que el aviso llegue
    // mientras se arma la regla y no después de mandarla.
    const problemas = [];
    if (!regla.name.trim()) problemas.push('La regla necesita un nombre.');

    const incompletas = regla.overrides.filter(o => Boolean(o.franchise) === Boolean(o.local)).length;
    if (incompletas > 0) {
        problemas.push(incompletas === 1
            ? 'Hay una excepción sin establecimiento elegido.'
            : `Hay ${incompletas} excepciones sin establecimiento elegido.`);
    }

    const puedeGuardar = problemas.length === 0;

    // La categoría guardada puede estar desactivada: se agrega a mano para que
    // el selector no salga vacío y guardar por otro motivo no se la lleve.
    const opciones = regla.bonusCategory && !categorias.some(c => c.value === regla.bonusCategory)
        ? [...categorias, { value: regla.bonusCategory, es: `${regla.bonusCategory} (desactivada)`, icon: 'star' }]
        : categorias;

    return (
        <div className='space-y-5'>

            {/* ── Qué regla es ──────────────────────────────────────── */}
            <Bloque titulo='Identificación'>
                <div className='grid gap-3 sm:grid-cols-[1fr_150px]'>
                    <Campo etiqueta='Nombre' ayuda='Con esto se la reconoce en el mapa.'>
                        <input type='text' value={regla.name} placeholder='Perimetrales — 3 por bono'
                            onChange={e => cambiar({ name: e.target.value })} className={entrada} />
                    </Campo>

                    <Campo etiqueta='Ítem del reglamento' ayuda='Para cotejar con el PDF.'>
                        <input type='text' value={regla.regulationCode} placeholder='R2.6'
                            onChange={e => cambiar({ regulationCode: e.target.value })} className={entrada} />
                    </Campo>
                </div>

                <Campo etiqueta='Categoría de bonificación' ayuda='Con qué criterio agrupa en los cortes. Opcional.'>
                    <div className='flex gap-2'>
                        <select value={regla.bonusCategory || ''} className={entrada}
                            onChange={e => cambiar({ bonusCategory: e.target.value || null })}>
                            <option value=''>Sin categoría</option>
                            {opciones.map(c => <option key={c.value} value={c.value}>{c.es}</option>)}
                        </select>
                        {onGestionarCategorias && (
                            <button type='button' onClick={onGestionarCategorias}
                                className='shrink-0 h-10 px-3 rounded-lg text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'>
                                Gestionar
                            </button>
                        )}
                    </div>
                </Campo>

                {regla.bonusCategory && <VistaCategoria categorias={opciones} value={regla.bonusCategory} />}
            </Bloque>


            {/* ── Cuánto otorga ─────────────────────────────────────── */}
            <Bloque titulo='Cuánto otorga'
                ayuda='Cuántas alertas hacen falta y cuántos bonos dan. Las que sobran de un grupo no se pierden: seis alertas de una regla de 4 por bono suman 1,5.'>
                <div className='grid gap-3 sm:grid-cols-3'>
                    <Campo etiqueta='Alertas necesarias'>
                        <input type='number' min='1' step='1' value={regla.alertsRequired} className={entrada}
                            onChange={e => cambiar({ alertsRequired: numero(e.target.value, 1) })} />
                    </Campo>
                    {TURNOS.map(turno => (
                        <Campo key={turno.key} etiqueta={`Bonos — turno ${turno.label.toLowerCase()}`}>
                            <input type='number' min='0' step='0.25' value={regla.bonusAwarded[turno.key]} className={entrada}
                                onChange={e => cambiar({ bonusAwarded: { ...regla.bonusAwarded, [turno.key]: numero(e.target.value) } })} />
                        </Campo>
                    ))}
                </div>

                {/* El número que se carga no es el que se paga. Mostrar la cuenta
                    hecha evita cargar una regla creyendo que dice otra cosa. */}
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
            </Bloque>


            {/* ── Estado ────────────────────────────────────────────── */}
            <Bloque titulo='Estado'>
                <label className='flex items-start gap-2.5 cursor-pointer'>
                    <input type='checkbox' checked={regla.active !== false}
                        onChange={e => cambiar({ active: e.target.checked })}
                        className='mt-0.5 w-4 h-4 rounded accent-[#29c50c]' />
                    <span className='text-[12.5px] text-gray-700'>
                        <strong className='font-semibold'>Regla activa</strong>
                        <span className='block text-[11.5px] text-gray-500 mt-0.5 max-w-[65ch]'>
                            Desactivarla hace que sus alertas dejen de bonificar. Es lo que corresponde en lugar de
                            borrarla cuando está en uso — pero ojo: deja de pagar, y eso no salta por ningún lado.
                        </span>
                    </span>
                </label>
            </Bloque>


            <div className='flex flex-wrap items-center gap-2'>
                <button type='button' onClick={() => onGuardar(regla)} disabled={!puedeGuardar || guardando}
                    className='h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08]
                               active:scale-[.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                    {guardando ? 'Guardando…' : regla._id ? 'Guardar cambios' : 'Crear regla'}
                </button>

                <button type='button' onClick={onCancelar}
                    className='h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'>
                    Cancelar
                </button>

                {regla._id && onBorrar && (
                    <button type='button' onClick={() => onBorrar(regla)} disabled={guardando}
                        className='h-10 px-4 ml-auto rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50'>
                        Eliminar
                    </button>
                )}
            </div>

            {!puedeGuardar && (
                <ul className='space-y-1'>
                    {problemas.map(p => <li key={p} className='text-[11.5px] text-gray-600'>{p}</li>)}
                </ul>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════

const entrada = `h-10 w-full px-3 rounded-lg border border-gray-300 text-[13px] text-gray-800 tabular-nums
                 placeholder:text-gray-500
                 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]`;

function Bloque({ titulo, ayuda, children }) {
    return (
        <section>
            <h3 className='text-[13.5px] font-bold text-gray-800'>{titulo}</h3>
            {ayuda && <p className='text-[11.5px] text-gray-500 mt-1 max-w-[72ch]'>{ayuda}</p>}
            <div className='space-y-3 mt-3'>{children}</div>
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

/** Cómo va a verse la categoría en el mapa. El ícono y el color son del catálogo. */
function VistaCategoria({ categorias, value }) {
    const c = categorias.find(x => x.value === value);
    if (!c) return null;
    const Icono = iconOf(c.icon);

    return (
        <div className='flex items-center gap-2'>
            <span className='grid place-items-center w-7 h-7 rounded-lg'
                style={{ background: c.bg || '#fdf6e7', color: c.color || '#8a5a2b' }}>
                <Icono size={13} />
            </span>
            <span className='text-[11.5px] text-gray-500'>Así se va a ver en el mapa</span>
        </div>
    );
}
