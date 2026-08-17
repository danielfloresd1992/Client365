'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories';
import { iconOf } from '@/libs/alerts/categoryIcons.js';
import { bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos } from './bonusRuleFormat';

/**
 * EL MAPA DE UNA REGLA.
 *
 *     alertas  ──→  regla  ──→  alcance
 *
 * Muestra UNA regla a la vez, con las alertas que la usan a la izquierda y a
 * dónde aplica a la derecha. Una sola porque el catálogo tiene más de trescientas
 * alertas: dibujarlas todas sería una maraña donde no se encuentra nada.
 *
 *
 * LOS CABLES SON EL FORMULARIO
 *
 * Tender un cable desde una alerta hasta la regla la asigna; arrastrar uno ya
 * tendido hasta otra regla la reasigna; soltarlo fuera de una caja la
 * desconecta. Cada gesto es una escritura, y son los mismos endpoints que ya
 * existen — el arrastre es la forma, no un mecanismo aparte.
 *
 * Mientras se arrastra, los destinos válidos se encienden. Las alertas que ya
 * tienen otra regla se marcan y no aceptan: una alerta en dos reglas haría que
 * el corte la cuente dos veces.
 */
export default function BonusMap({
    reglas, alertas, alcance, cargando, guardando, puedeEditar,
    onAsignarRegla, onCambiarAlcance, onEditarRegla, onNuevaRegla,
}) {

    const [activaId, setActivaId] = useState(null);
    const [eligiendo, setEligiendo] = useState(false);
    const lienzo = useRef(null);
    const [cables, setCables] = useState([]);
    const [tirando, setTirando] = useState(null);   // { origen, tipo, x, y }

    // La primera regla se abre sola: un mapa vacío no dice qué hacer.
    const activa = useMemo(
        () => reglas.find(r => String(r._id) === String(activaId)) || reglas[0] || null,
        [reglas, activaId],
    );

    const susAlertas = useMemo(
        () => (alertas || []).filter(a => String(a.bonusRule) === String(activa?._id)),
        [alertas, activa],
    );

    // ── Los cables se calculan sobre las posiciones REALES ────────────
    // Con las cajas medidas y no con coordenadas fijas, el trazo sigue bien
    // cuando un nombre envuelve en dos líneas o cambia el ancho de la ventana.
    const trazar = useCallback(() => {
        const base = lienzo.current?.getBoundingClientRect();
        if (!base || !activa) return setCables([]);

        const caja = (id) => {
            const n = lienzo.current.querySelector(`[data-nodo="${id}"]`);
            if (!n) return null;
            const r = n.getBoundingClientRect();
            return { x1: r.left - base.left, x2: r.right - base.left, y: r.top - base.top + r.height / 2 };
        };

        const curva = (de, a) => {
            if (!de || !a) return null;
            const dx = Math.max(30, (a.x1 - de.x2) / 2);
            return `M ${de.x2} ${de.y} C ${de.x2 + dx} ${de.y}, ${a.x1 - dx} ${a.y}, ${a.x1} ${a.y}`;
        };

        const dReg = caja(activa._id);
        const nuevos = susAlertas
            .map(a => ({ id: a._id, d: curva(caja(a._id), dReg) }))
            .filter(c => c.d);

        // Con alcance 'all' no sale cable: la caja ya dice "en todos", y un cable
        // hacia ella no agrega nada.
        if (activa.scope?.mode !== 'all') {
            const d = curva(dReg, caja('alcance'));
            if (d) nuevos.push({ id: '__alcance', d });
        }
        setCables(nuevos);
    }, [activa, susAlertas]);

    useEffect(() => { trazar(); }, [trazar]);
    useEffect(() => {
        const el = lienzo.current;
        if (!el) return;
        const ro = new ResizeObserver(() => requestAnimationFrame(trazar));
        ro.observe(el);
        addEventListener('resize', trazar);
        return () => { ro.disconnect(); removeEventListener('resize', trazar); };
    }, [trazar]);


    // ── Arrastre ──────────────────────────────────────────────────────
    const empezar = (e, origen, tipo) => {
        if (!puedeEditar) return;
        e.preventDefault();
        lienzo.current.setPointerCapture(e.pointerId);
        setTirando({ origen, tipo, x: e.clientX, y: e.clientY });
    };

    const soltar = async (e) => {
        if (!tirando) return;
        const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-tipo]');
        const { origen, tipo } = tirando;
        setTirando(null);

        // Soltar es escribir. Fuera de una caja válida, se desconecta.
        if (tipo === 'alerta') {
            const nueva = destino?.dataset.tipo === 'regla' ? destino.dataset.nodo : null;
            await onAsignarRegla(origen, nueva);
        }
    };


    if (cargando) return <Marco><p className='px-5 py-10 text-[13px] text-gray-500'>Cargando el mapa…</p></Marco>;

    if (!reglas.length) {
        return (
            <Marco>
                <div className='px-5 py-12 text-center'>
                    <p className='text-[14px] font-bold text-gray-800'>Todavía no hay ninguna regla</p>
                    <p className='text-[12.5px] text-gray-500 mt-1 max-w-[58ch] mx-auto'>
                        Una regla dice cuántos bonos otorga un tipo de alerta y dónde. Después se le tienden
                        cables desde las alertas que la usan.
                    </p>
                    {puedeEditar && (
                        <button type='button' onClick={onNuevaRegla}
                            className='mt-4 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                            Crear la primera regla
                        </button>
                    )}
                </div>
            </Marco>
        );
    }

    return (
        <>
            <Marco>
                {/* ── Qué regla se está mapeando ─────────────────────── */}
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1'>Regla</span>
                    {reglas.map(r => (
                        <button key={r._id} type='button' onClick={() => setActivaId(r._id)}
                            aria-pressed={String(r._id) === String(activa?._id)}
                            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                ${String(r._id) === String(activa?._id)
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}
                                ${r.active === false ? 'line-through opacity-60' : ''}`}>
                            {r.name}
                        </button>
                    ))}
                    {puedeEditar && (
                        <button type='button' onClick={onNuevaRegla}
                            className='ml-auto h-8 px-3 rounded-lg text-[11.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                            + Regla
                        </button>
                    )}
                </div>

                {/* ── El lienzo ──────────────────────────────────────── */}
                <div ref={lienzo} className='relative bg-gray-50 p-5 overflow-x-auto select-none'
                    onPointerMove={e => tirando && setTirando(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                    onPointerUp={soltar}
                    onPointerCancel={() => setTirando(null)}>

                    <Cables cables={cables} tirando={tirando} lienzo={lienzo} />

                    <div className='relative z-[1] grid gap-y-3 gap-x-16 items-start min-w-[860px]
                                    grid-cols-[minmax(210px,1fr)_minmax(230px,1fr)_minmax(210px,1fr)]'>

                        {/* Alertas */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Alertas · Menu.model</Rotulo>
                            {susAlertas.map(a => (
                                <NodoAlerta key={a._id} alerta={a} puedeEditar={puedeEditar}
                                    tirandoEsta={tirando?.origen === a._id}
                                    onTirar={e => empezar(e, a._id, 'alerta')} />
                            ))}
                            {puedeEditar && (
                                <button type='button' onClick={() => setEligiendo(true)} className={fantasma}>
                                    + Sumar alerta
                                </button>
                            )}
                            {!susAlertas.length && (
                                <p className='text-[11.5px] text-gray-500'>Esta regla todavía no la usa ninguna alerta.</p>
                            )}
                        </div>

                        {/* Regla */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Regla de bonificación</Rotulo>
                            <NodoRegla regla={activa} usos={susAlertas.length} puedeEditar={puedeEditar}
                                onEditar={() => onEditarRegla(activa)} />
                        </div>

                        {/* Alcance */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Dónde aplica</Rotulo>
                            <NodoAlcance regla={activa} catalogo={alcance} puedeEditar={puedeEditar}
                                guardando={guardando} onCambiar={scope => onCambiarAlcance(activa._id, scope)} />
                        </div>
                    </div>
                </div>
            </Marco>

            {eligiendo && (
                <ElegirAlerta alertas={alertas} reglas={reglas} regla={activa}
                    onCerrar={() => setEligiendo(false)}
                    onElegir={async id => { await onAsignarRegla(id, activa._id); setEligiendo(false); }} />
            )}
        </>
    );
}


// ══════════════════════════════════════════════════════════════════════

const fantasma = `w-full rounded-xl border-[1.5px] border-dashed border-gray-300 py-3 text-[12px] font-bold
                  text-gray-500 hover:border-[#29c50c] hover:text-[#1f9a08] transition-colors`;

const Marco = ({ children }) => (
    <section className='bg-white rounded-xl shadow-sm border overflow-hidden'>{children}</section>
);

const Rotulo = ({ children }) => (
    <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>{children}</span>
);


/** La capa de cables. Va debajo de las cajas y no intercepta el puntero. */
function Cables({ cables, tirando, lienzo }) {
    const base = lienzo.current?.getBoundingClientRect();

    let goma = null;
    if (tirando && base) {
        const n = lienzo.current.querySelector(`[data-nodo="${tirando.origen}"]`);
        if (n) {
            const r = n.getBoundingClientRect();
            const x1 = r.right - base.left, y1 = r.top - base.top + r.height / 2;
            const x2 = tirando.x - base.left, y2 = tirando.y - base.top;
            const dx = Math.max(30, (x2 - x1) / 2);
            goma = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        }
    }

    return (
        <svg className='absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible' aria-hidden='true'>
            <defs>
                <marker id='punta-bono' viewBox='0 0 10 10' refX='9' refY='5'
                    markerWidth='6.5' markerHeight='6.5' orient='auto-start-reverse'>
                    <path d='M0,0 L10,5 L0,10 z' fill='#9aa6b5' />
                </marker>
            </defs>
            {cables.map(c => (
                <path key={c.id} d={c.d} fill='none' stroke='#9aa6b5' strokeWidth='2.5' markerEnd='url(#punta-bono)' />
            ))}
            {goma && <path d={goma} fill='none' stroke='#29c50c' strokeWidth='2.5' strokeDasharray='6 5' />}
        </svg>
    );
}


/** Una alerta. El punto del borde es de donde sale el cable. */
function NodoAlerta({ alerta, puedeEditar, tirandoEsta, onTirar }) {
    const categoria = CATEGORIAS_OPERATIVAS[alerta.category];

    return (
        <div data-nodo={alerta._id} data-tipo='alerta'
            className={`relative bg-white border-[1.5px] rounded-xl px-3 py-2.5 transition-shadow
                        ${tirandoEsta ? 'border-[#29c50c] shadow-md' : 'border-gray-300'}`}>
            <span className='block text-[13px] font-semibold text-gray-800 leading-tight'>{alerta.es || alerta.en}</span>
            {categoria && (
                <span className='inline-block mt-1.5 text-[10px] font-bold rounded px-1.5 py-0.5'
                    style={{ backgroundColor: categoria.bg, color: categoria.color }}>
                    {categoria.es}
                </span>
            )}

            {puedeEditar && (
                <span role='button' tabIndex={0} onPointerDown={onTirar}
                    title='Arrastrá hasta otra regla, o afuera para desconectar'
                    className='absolute -right-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full
                               bg-white border-2 border-gray-400 cursor-grab active:cursor-grabbing z-[3]
                               grid place-items-center hover:border-[#29c50c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                    <span className='w-1.5 h-1.5 rounded-full bg-gray-400' />
                </span>
            )}
        </div>
    );
}


/** La regla, con sus números resueltos. */
function NodoRegla({ regla, usos, puedeEditar, onEditar }) {
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');

    return (
        <div data-nodo={regla._id} data-tipo='regla'
            className='bg-[#fdf6e7] border-2 border-[#d9a441] rounded-xl p-4'>
            <div className='flex items-start gap-2'>
                <span className='flex-1 text-[14px] font-black text-slate-900 leading-tight'>{regla.name}</span>
                {puedeEditar && (
                    <button type='button' onClick={onEditar}
                        className='shrink-0 text-[11.5px] font-bold text-[#8a5a2b] hover:underline'>
                        Editar
                    </button>
                )}
            </div>

            <div className='flex flex-wrap gap-1.5 mt-2'>
                {regla.regulationCode && (
                    <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-white text-gray-600'>{regla.regulationCode}</span>
                )}
                <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-white text-[#8a5a2b] border border-[#d9a441]/50'>
                    {usos} alerta{usos === 1 ? '' : 's'}
                </span>
                {regla.active === false && (
                    <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-red-100 text-red-700'>No bonifica</span>
                )}
            </div>

            <div className='mt-3 pt-3 border-t border-[#d9a441]/35'>
                <span className='block text-[10px] font-bold uppercase tracking-wider text-[#8a5a2b]/80'>
                    {formulaLabel(regla)}
                </span>
                <span className='text-[16px] font-black text-[#8a5a2b] tabular-nums'>
                    {mismoEnAmbosTurnos(regla)
                        ? <>{formatBonus(dia)} <span className='text-[11px] font-bold opacity-70'>bono</span></>
                        : <>{formatBonus(dia)} <span className='text-[11px] font-bold opacity-70'>día</span>
                            {'  '}{formatBonus(noche)} <span className='text-[11px] font-bold opacity-70'>noche</span></>}
                </span>
            </div>
        </div>
    );
}


/**
 * EL ALCANCE.
 *
 * Una caja con la lista: todos, o los que se tilden. Se guarda al tocar, con el
 * PATCH que solo escribe este campo — el PUT completo reemplazaría la regla
 * entera y dejaría los valores en su defecto sin avisar.
 */
function NodoAlcance({ regla, catalogo, puedeEditar, guardando, onCambiar }) {
    const scope = regla.scope || { mode: 'all', franchises: [], locals: [] };

    const alternar = (clave, id) => {
        const actual = (scope[clave] || []).map(String);
        const siguiente = actual.includes(String(id))
            ? actual.filter(x => x !== String(id))
            : [...actual, String(id)];
        onCambiar({ ...scope, [clave]: siguiente });
    };

    const tildado = (clave, id) => (scope[clave] || []).some(x => String(x) === String(id));

    return (
        <div data-nodo='alcance' data-tipo='alcance'
            className='bg-white border-[1.5px] border-[#29c50c] rounded-xl overflow-hidden'>

            <div className='px-3 py-2.5 border-b border-gray-100 flex flex-wrap gap-1'>
                {[
                    { key: 'all', label: 'Todos' },
                    { key: 'only', label: 'Solo estos' },
                    { key: 'except', label: 'Todos menos' },
                ].map(m => (
                    <button key={m.key} type='button' disabled={!puedeEditar || guardando}
                        onClick={() => onCambiar({ ...scope, mode: m.key })}
                        aria-pressed={scope.mode === m.key}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50
                            ${scope.mode === m.key ? 'bg-[#29c50c] text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                        {m.label}
                    </button>
                ))}
            </div>

            {scope.mode === 'all' ? (
                <p className='px-3 py-4 text-[12px] text-gray-600'>
                    La regla vale en todos los establecimientos. Un local que abra mañana queda cubierto solo.
                </p>
            ) : (
                <div className='max-h-[260px] overflow-y-auto p-2'>
                    <Grupo titulo='Marcas' items={catalogo.franchises} clave='franchises'
                        tildado={tildado} alternar={alternar} puedeEditar={puedeEditar} />
                    <Grupo titulo='Establecimientos' items={catalogo.locals} clave='locals'
                        tildado={tildado} alternar={alternar} puedeEditar={puedeEditar} />

                    {!catalogo.franchises.length && !catalogo.locals.length && (
                        <p className='px-2 py-3 text-[11.5px] text-gray-500'>No se pudo cargar la lista.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function Grupo({ titulo, items, clave, tildado, alternar, puedeEditar }) {
    if (!items?.length) return null;
    return (
        <>
            <p className='px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500'>{titulo}</p>
            {items.map(o => (
                <label key={o._id} className='flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer'>
                    <input type='checkbox' checked={tildado(clave, o._id)} disabled={!puedeEditar}
                        onChange={() => alternar(clave, o._id)} className='w-3.5 h-3.5 rounded accent-[#29c50c]' />
                    <span className='text-[12px] text-gray-700 truncate'>{o.name}</span>
                </label>
            ))}
        </>
    );
}


/**
 * Elegir qué alerta sumar.
 *
 * Las que ya tienen otra regla salen deshabilitadas y diciendo cuál: una alerta
 * en dos reglas haría que el corte la cuente dos veces. Para moverla hay que
 * arrastrar su cable en el mapa de la otra regla, que deja claro de dónde sale.
 */
function ElegirAlerta({ alertas, reglas, regla, onCerrar, onElegir }) {
    const [busqueda, setBusqueda] = useState('');

    const nombreDeRegla = useMemo(
        () => new Map(reglas.map(r => [String(r._id), r.name])), [reglas]);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (alertas || [])
            .filter(a => String(a.bonusRule) !== String(regla?._id))
            .filter(a => !texto || `${a.es || ''} ${a.en || ''}`.toLowerCase().includes(texto))
            .sort((a, b) => (a.es || '').localeCompare(b.es || ''));
    }, [alertas, busqueda, regla]);

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[80vh] flex flex-col'
                onClick={e => e.stopPropagation()}>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>Sumar una alerta a «{regla?.name}»</h3>
                    <p className='text-[11.5px] text-gray-500 mt-0.5'>
                        Las que ya tienen otra regla no se pueden elegir: para moverlas, arrastrá su cable.
                    </p>
                    <input type='search' value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder='Buscar alerta…'
                        className='h-9 w-full mt-3 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                                   placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
                </div>

                <ul className='flex-1 min-h-0 overflow-y-auto p-2'>
                    {visibles.map(a => {
                        const otra = a.bonusRule ? nombreDeRegla.get(String(a.bonusRule)) : null;
                        return (
                            <li key={a._id}>
                                <button type='button' disabled={Boolean(otra)} onClick={() => onElegir(a._id)}
                                    className='w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg
                                               hover:bg-[#29c50c]/10 disabled:opacity-50 disabled:hover:bg-transparent
                                               disabled:cursor-not-allowed transition-colors'>
                                    <span className='flex-1 text-[12.5px] text-gray-800'>{a.es || a.en}</span>
                                    <span className='text-[10.5px] text-gray-500 text-right'>
                                        {otra ? `usa: ${otra}` : (CATEGORIAS_OPERATIVAS[a.category]?.es || '')}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {!visibles.length && <li className='px-3 py-6 text-[12.5px] text-gray-500'>Ninguna coincide.</li>}
                </ul>

                <div className='px-5 py-3 border-t border-gray-100 flex justify-end'>
                    <button type='button' onClick={onCerrar}
                        className='h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
