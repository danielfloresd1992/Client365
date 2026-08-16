'use client';
import { useState, useMemo } from 'react';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories';
import { bonusPerAlert, formatBonus, mismoEnAmbosTurnos } from './bonusRuleFormat';

/**
 * QUÉ ALERTAS BONIFICAN Y CON CUÁL REGLA.
 *
 * Una fila por alerta del catálogo y un selector con las reglas activas. La
 * regla es una referencia: la misma sirve para decenas de alertas, y corregirla
 * las corrige a todas de una vez.
 *
 * El selector guarda al cambiar, sin botón. Son más de cien alertas y confirmar
 * cada una haría el trabajo interminable; si algo falla, la fila vuelve sola a
 * como estaba.
 *
 * `null` (No bonifica) es una respuesta VÁLIDA y se guarda igual que las otras:
 * marca la alerta como revisada. Es lo que separa "decidimos que no bonifica"
 * de "nadie la miró todavía", y sin esa diferencia no hay forma de saber cuánto
 * falta por configurar.
 */

const FILTROS = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendientes', label: 'Sin revisar' },
    { key: 'bonifican', label: 'Bonifican' },
    { key: 'no', label: 'No bonifican' },
];


export default function AlertRuleList({ alertas, reglas, puedeEditar, cargando, onAsignar }) {

    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todas');

    // Las inactivas no se ofrecen —darlas de baja es justo para dejar de
    // usarlas— pero sí se buscan por id: una alerta que ya tiene una inactiva
    // debe poder mostrar cuál es.
    const activas = useMemo(() => (reglas || []).filter(r => r.active !== false), [reglas]);
    const porId = useMemo(
        () => new Map((reglas || []).map(r => [String(r._id), r])),
        [reglas],
    );

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return (alertas || [])
            .filter(a => {
                if (filtro === 'pendientes' && a.bonusReviewed) return false;
                if (filtro === 'bonifican' && !a.bonusRule) return false;
                if (filtro === 'no' && a.bonusRule) return false;

                if (!texto) return true;
                return `${a.es || ''} ${a.en || ''} ${a.bonusCategory || ''}`.toLowerCase().includes(texto);
            })
            .sort((a, b) => (a.es || '').localeCompare(b.es || ''));
    }, [alertas, busqueda, filtro]);

    const revisadas = (alertas || []).filter(a => a.bonusReviewed).length;
    const total = (alertas || []).length;

    return (
        <section className='bg-white rounded-xl shadow-sm border flex flex-col max-h-[620px]'>

            {/* ── Cabecera: qué es esto y cuánto falta ─────────────────
                Fija: con trescientas y pico de alertas, el buscador y los
                filtros tienen que seguir a mano al bajar por la lista. */}
            <div className='shrink-0 px-5 pt-5 pb-4 border-b border-gray-100'>
                <div className='flex flex-wrap items-start gap-x-4 gap-y-2'>
                    <div className='min-w-0 flex-1'>
                        <h2 className='text-base font-bold text-gray-800 leading-tight'>Bonificación de las alertas</h2>
                        <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[70ch]'>
                            Con qué regla bonifica cada alerta. La regla decide cuántos bonos otorga y dónde;
                            cuánto vale un bono se configura arriba y es el mismo para todas.
                        </p>
                    </div>

                    {total > 0 && (
                        <span className='shrink-0 text-[11.5px] font-bold text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5 tabular-nums'>
                            {revisadas} de {total} revisadas
                        </span>
                    )}
                </div>

                <div className='flex flex-wrap items-center gap-2 mt-4'>
                    <input
                        type='search'
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder='Buscar alerta…'
                        className='h-9 flex-1 min-w-[200px] px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                                   placeholder:text-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                    />

                    <div className='flex items-center gap-1'>
                        {FILTROS.map(f => (
                            <button
                                key={f.key}
                                type='button'
                                onClick={() => setFiltro(f.key)}
                                aria-pressed={filtro === f.key}
                                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                    ${filtro === f.key
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Las filas ─────────────────────────────────────────── */}
            {cargando ? (
                <p className='px-5 py-8 text-[13px] text-gray-500'>Cargando alertas…</p>
            ) : activas.length === 0 ? (
                <div className='px-5 py-8'>
                    <p className='text-[13px] font-semibold text-gray-700'>Todavía no hay reglas creadas.</p>
                    <p className='text-[12px] text-gray-500 mt-1 max-w-[60ch]'>
                        Una regla dice cuántos bonos otorga una alerta y en qué establecimientos. Primero hay que crear
                        una en <strong className='font-semibold text-gray-700'>Reglas de bonificación</strong>; después,
                        desde acá se le asigna a cada alerta.
                    </p>
                </div>
            ) : visibles.length === 0 ? (
                <p className='px-5 py-8 text-[13px] text-gray-500'>Ninguna alerta coincide con la búsqueda.</p>
            ) : (
                <ul className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
                    {visibles.map(alerta => (
                        <AlertRow
                            key={alerta._id}
                            alerta={alerta}
                            regla={porId.get(String(alerta.bonusRule)) || null}
                            reglasActivas={activas}
                            puedeEditar={puedeEditar}
                            onAsignar={onAsignar}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}


/** Una alerta: qué es, con qué regla bonifica y cuánto queda valiendo. */
function AlertRow({ alerta, regla, reglasActivas, puedeEditar, onAsignar }) {

    const categoria = CATEGORIAS_OPERATIVAS[alerta.category];

    // La regla asignada puede estar dada de baja: no aparece en el selector, así
    // que se agrega a mano para que la fila no se vea vacía ni se pierda al
    // tocar cualquier otra cosa.
    const opciones = regla && regla.active === false ? [...reglasActivas, regla] : reglasActivas;

    return (
        <li className='px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 hover:bg-gray-50/70 transition-colors'>

            {/* Qué alerta es */}
            <div className='min-w-[170px] flex-1'>
                <div className='flex items-center gap-2'>
                    {!alerta.bonusReviewed && (
                        <span
                            title='Nadie decidió todavía si esta alerta bonifica'
                            className='shrink-0 w-1.5 h-1.5 rounded-full bg-[#d9a441]'
                        />
                    )}
                    <span className='text-[13.5px] font-semibold text-gray-800'>{alerta.es || alerta.en}</span>
                </div>

                <div className='flex flex-wrap items-center gap-1.5 mt-1'>
                    {categoria && (
                        <span
                            className='text-[10px] font-bold rounded px-1.5 py-0.5'
                            style={{ backgroundColor: categoria.bg, color: categoria.color }}
                        >
                            {categoria.es}
                        </span>
                    )}
                    {alerta.bonusCategory && (
                        <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#fdf6e7] text-[#8a5a2b]'>
                            {alerta.bonusCategory}
                        </span>
                    )}
                </div>
            </div>

            {/* Con qué regla */}
            <select
                value={alerta.bonusRule ? String(alerta.bonusRule) : ''}
                disabled={!puedeEditar}
                onChange={e => onAsignar(alerta._id, e.target.value || null)}
                aria-label={`Regla de bonificación de ${alerta.es || alerta.en}`}
                className='h-9 w-[190px] px-2 rounded-lg border border-gray-300 bg-white text-[12.5px] font-semibold text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
            >
                <option value=''>No bonifica</option>
                {opciones.map(r => (
                    <option key={r._id} value={String(r._id)}>
                        {r.name}{r.active === false ? ' (inactiva)' : ''}
                    </option>
                ))}
            </select>

            {/* Cuánto queda valiendo una alerta de éstas */}
            <div className='w-[86px] shrink-0 text-right'>
                {regla ? <ValorPorTurno regla={regla} /> : <span className='text-[12px] text-gray-400'>—</span>}
            </div>
        </li>
    );
}


/**
 * Lo que vale UNA alerta, por turno.
 *
 * Se muestran los dos números solo cuando difieren: repetir "0,25 · 0,25" en
 * cien filas esconde justo las que sí cambian entre diurno y nocturno.
 */
function ValorPorTurno({ regla }) {
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');

    if (mismoEnAmbosTurnos(regla)) {
        return (
            <span className='text-[13px] font-bold text-[#8a5a2b] tabular-nums whitespace-nowrap'>
                {formatBonus(dia)} <span className='font-medium text-gray-500'>bono</span>
            </span>
        );
    }

    // Apilados y no en una línea: esto vive en una columna de 86px.
    return (
        <span className='block text-[12px] font-bold text-[#8a5a2b] tabular-nums leading-snug whitespace-nowrap'>
            {formatBonus(dia)} <span className='font-medium text-gray-500'>día</span>
            <br />
            {formatBonus(noche)} <span className='font-medium text-gray-500'>noche</span>
        </span>
    );
}
