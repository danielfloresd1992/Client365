'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories';
import { iconOf } from '@/libs/alerts/categoryIcons.js';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { agruparParaSelector } from '@/libs/parser/estableshment';
import { bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos } from './bonusRuleFormat';

/**
 * EL MAPA DE UNA ALERTA.
 *
 *     alerta  ──→  ¿dónde?  ──→  regla
 *                  (todos)  ──→  Perimetrales 3x1
 *                  (Miami)  ──→  Miami reforzada
 *
 * Muestra UNA alerta a la vez, con sus asignaciones: cada una es un alcance
 * —una caja del medio— con un cable hacia la regla que aplica ahí. La misma
 * alerta puede ir con reglas distintas según el establecimiento, y esta forma
 * lo muestra tal cual: tantas cajas del medio como asignaciones tenga.
 *
 * Con una sola asignación general, el mapa se ve como una línea recta:
 * alerta → todos → regla. Solo cuando la alerta necesita reglas distintas por
 * local aparecen más cajas.
 *
 *
 * LOS CABLES SON EL FORMULARIO
 *
 * Arrastrar el cable de un alcance hasta otra regla cambia con qué regla va ese
 * alcance. Soltarlo fuera de una regla borra la asignación. Cada gesto arma la
 * lista siguiente de asignaciones y la manda entera al servidor, que la valida
 * junta — el arrastre es la forma, no un mecanismo aparte.
 *
 * Al soltar en una regla, la caja del medio pregunta dónde aplica. Es lo que
 * evita el 400 de "alcance a medias": no se manda nada hasta que esté completo.
 */
export default function BonusMap({
    reglas, alertas, alcance, cargando, puedeEditar,
    onEscribirAsignaciones, onEditarRegla, onNuevaRegla,
}) {

    // Qué alertas están puestas en el lienzo. Es estado de PANTALLA, no de
    // datos: agregar una la trae al mapa, quitarla la saca de la vista y no
    // toca su configuración.
    const [enLienzo, setEnLienzo] = useState(null);
    const [eligiendo, setEligiendo] = useState(false);
    const [tirando, setTirando] = useState(null);        // { menuId, indice, x, y }
    const [editandoAlcance, setEditandoAlcance] = useState(null);
    const lienzo = useRef(null);
    const [cables, setCables] = useState([]);

    const porId = useMemo(() => new Map((reglas || []).map(r => [String(r._id), r])), [reglas]);

    // El catálogo de categorías, para pintar ícono y color en cada regla y en
    // el cable que le llega. Con las inactivas: una regla cuya categoría se dio
    // de baja tiene que seguir mostrándola, no quedar en blanco.
    const { categorias } = useBonusCategories(true);
    const categoriaDe = useMemo(() => new Map(categorias.map(c => [c.value, c])), [categorias]);

    // Al abrir, el lienzo trae lo que ya está configurado. Después manda lo que
    // el usuario agregue: no se recalcula sola, o agregar una alerta nueva
    // reordenaría el mapa bajo el cursor.
    useEffect(() => {
        if (enLienzo !== null || !alertas) return;
        setEnLienzo((alertas.filter(a => a.bonusRules?.length || a.bonifies === true).map(a => String(a._id))));
    }, [alertas, enLienzo]);

    const puestas = useMemo(
        () => (enLienzo || []).map(id => (alertas || []).find(a => String(a._id) === id)).filter(Boolean),
        [enLienzo, alertas],
    );


    // ── Los cables, sobre las posiciones reales de las cajas ──────────
    const trazar = useCallback(() => {
        const base = lienzo.current?.getBoundingClientRect();
        if (!base) return setCables([]);

        const caja = (sel) => {
            const n = lienzo.current.querySelector(sel);
            if (!n) return null;
            const r = n.getBoundingClientRect();
            return { x1: r.left - base.left, x2: r.right - base.left, y: r.top - base.top + r.height / 2 };
        };
        const curva = (de, a) => {
            if (!de || !a) return null;
            const dx = Math.max(30, (a.x1 - de.x2) / 2);
            return `M ${de.x2} ${de.y} C ${de.x2 + dx} ${de.y}, ${a.x1 - dx} ${a.y}, ${a.x1} ${a.y}`;
        };

        const nuevos = [];
        puestas.forEach(alerta => {
            const mid = String(alerta._id);
            const dAlerta = caja(`[data-nodo="alerta-${mid}"]`);

            (alerta.bonusRules || []).forEach((asig, i) => {
                const dAlc = caja(`[data-nodo="alcance-${mid}-${i}"]`);
                const d1 = curva(dAlerta, dAlc);
                if (d1) nuevos.push({ id: `a-${mid}-${i}`, d: d1, color: COLOR_ALCANCE });

                // El que se arrastra no se dibuja fijo: lo dibuja la goma.
                if (tirando?.menuId === mid && tirando?.indice === i) return;
                const d2 = curva(dAlc, caja(`[data-nodo="regla-${asig.rule}"]`));
                if (d2) {
                    const regla = porId.get(String(asig.rule));
                    const cat = regla ? categoriaDe.get(regla.bonusCategory) : null;
                    nuevos.push({ id: `r-${mid}-${i}`, d: d2, color: cat?.color || COLOR_NEUTRO });
                }
            });
        });
        setCables(nuevos);
    }, [puestas, tirando, porId, categoriaDe]);

    useEffect(() => { trazar(); }, [trazar]);
    useEffect(() => {
        const el = lienzo.current;
        if (!el) return;
        const ro = new ResizeObserver(() => requestAnimationFrame(trazar));
        ro.observe(el);
        addEventListener('resize', trazar);
        return () => { ro.disconnect(); removeEventListener('resize', trazar); };
    }, [trazar]);


    // ── Escritura ─────────────────────────────────────────────────────
    // Cada gesto arma el estado siguiente de ESA alerta y lo manda. Las demás
    // no se tocan: el mapa es una vista de relaciones, no un formulario único.
    const escribir = (alerta, bonusRules, bonifies = true) =>
        onEscribirAsignaciones(alerta._id, { bonifies, bonusRules });

    const reapuntar = (alerta, i, ruleId) =>
        escribir(alerta, (alerta.bonusRules || []).map((a, j) => (j === i ? { ...a, rule: ruleId } : a)));

    const quitar = (alerta, i) =>
        escribir(alerta, (alerta.bonusRules || []).filter((_, j) => j !== i));

    const cambiarAlcance = (alerta, i, scope) =>
        escribir(alerta, (alerta.bonusRules || []).map((a, j) => (j === i ? { ...a, scope } : a)));

    /** El interruptor. Apagarlo deja las asignaciones donde están: es reversible. */
    const alternarBonifica = (alerta) =>
        onEscribirAsignaciones(alerta._id, {
            bonifies: !(alerta.bonifies === true),
            bonusRules: alerta.bonusRules || [],
        });

    /**
     * Suma una asignación. La primera es general —es lo normal, y así una
     * alerta simple queda lista de un gesto—; las siguientes preguntan dónde
     * antes de mandarse, porque una segunda general sería ambigua.
     */
    const sumar = (alerta, ruleId) => {
        const actuales = alerta.bonusRules || [];
        const hayGeneral = actuales.some(a => a.scope?.mode === 'all');
        const nueva = { rule: ruleId, scope: { mode: hayGeneral ? 'only' : 'all', franchises: [], locals: [] } };

        if (!hayGeneral) return escribir(alerta, [...actuales, nueva]);
        setEditandoAlcance({ alerta, provisoria: nueva });
    };


    // ── Arrastre ──────────────────────────────────────────────────────
    const empezar = (e, menuId, indice) => {
        if (!puedeEditar) return;
        e.preventDefault();
        lienzo.current.setPointerCapture(e.pointerId);
        setTirando({ menuId, indice, x: e.clientX, y: e.clientY });
    };

    const soltar = async (e) => {
        if (!tirando) return;
        const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-tipo="regla"]');
        const { menuId, indice } = tirando;
        setTirando(null);

        const alerta = puestas.find(a => String(a._id) === menuId);
        if (!alerta) return;

        if (destino) await reapuntar(alerta, indice, destino.dataset.regla);
        else await quitar(alerta, indice);
    };


    if (cargando) return <Marco><p className='px-5 py-10 text-[13px] text-gray-500'>Cargando el mapa…</p></Marco>;

    const activasReglas = (reglas || []).filter(r => r.active !== false);

    return (
        <>
            <Marco>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <div className='min-w-0'>
                        <h2 className='text-[15px] font-bold text-gray-800 leading-tight'>Mapa de bonificación</h2>
                        <p className='text-[11.5px] text-gray-500'>
                            {puestas.length} alerta{puestas.length === 1 ? '' : 's'} en el mapa · {(reglas || []).length} regla{(reglas || []).length === 1 ? '' : 's'}
                        </p>
                    </div>
                    {puedeEditar && (
                        <div className='ml-auto flex gap-2'>
                            <button type='button' onClick={() => setEligiendo(true)}
                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'>
                                + Alerta
                            </button>
                            <button type='button' onClick={onNuevaRegla}
                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                + Regla
                            </button>
                        </div>
                    )}
                </div>

                <div ref={lienzo} className='relative bg-gray-50 p-5 overflow-x-auto select-none'
                    onPointerMove={e => tirando && setTirando(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                    onPointerUp={soltar}
                    onPointerCancel={() => setTirando(null)}>

                    <Cables cables={cables} tirando={tirando} lienzo={lienzo} />

                    {/* Las alertas con sus alcances a la izquierda, las reglas
                        en una columna compartida a la derecha: una regla que
                        usan tres alertas se ve una vez, con tres cables. */}
                    <div className='relative z-[1] grid gap-x-16 items-start min-w-[900px] grid-cols-[minmax(0,2.1fr)_minmax(220px,1fr)]'>

                        <div className='flex flex-col gap-5'>
                            <Rotulo>Alertas · Menu.model  →  dónde aplica</Rotulo>

                            {puestas.map(alerta => (
                                <FilaDeAlerta
                                    key={alerta._id}
                                    alerta={alerta}
                                    catalogo={alcance}
                                    reglas={activasReglas}
                                    puedeEditar={puedeEditar}
                                    tirando={tirando}
                                    onTirar={(e, i) => empezar(e, String(alerta._id), i)}
                                    onEditarAlcance={i => setEditandoAlcance({ alerta, indice: i })}
                                    onSumar={ruleId => sumar(alerta, ruleId)}
                                    onAlternar={() => alternarBonifica(alerta)}
                                    onSacar={() => setEnLienzo(l => l.filter(x => x !== String(alerta._id)))}
                                />
                            ))}

                            {!puestas.length && (
                                <p className='text-[12.5px] text-gray-500 py-6'>
                                    El mapa está vacío. Tocá «+ Alerta» para traer una y empezar a conectarla.
                                </p>
                            )}
                        </div>

                        <div className='flex flex-col gap-3'>
                            <Rotulo>Reglas de bonificación</Rotulo>
                            {(reglas || []).map(r => (
                                <NodoRegla key={r._id} regla={r} puedeEditar={puedeEditar}
                                    categoria={categoriaDe.get(r.bonusCategory) || null}
                                    conectada={puestas.some(a => (a.bonusRules || []).some(x => String(x.rule) === String(r._id)))}
                                    onEditar={() => onEditarRegla(r)} />
                            ))}
                            {!(reglas || []).length && (
                                <p className='text-[11.5px] text-gray-500'>Todavía no hay reglas. Creá la primera con «+ Regla».</p>
                            )}
                        </div>
                    </div>
                </div>
            </Marco>

            {eligiendo && (
                <ElegirAlerta alertas={alertas} enLienzo={enLienzo || []}
                    onCerrar={() => setEligiendo(false)}
                    onElegir={id => { setEnLienzo(l => [...l, String(id)]); setEligiendo(false); }} />
            )}

            {editandoAlcance && (
                <EditorDeAlcance
                    catalogo={alcance}
                    inicial={editandoAlcance.provisoria?.scope
                        ?? (editandoAlcance.alerta.bonusRules || [])[editandoAlcance.indice]?.scope}
                    yaHayGeneral={(editandoAlcance.alerta.bonusRules || [])
                        .some((a, j) => a.scope?.mode === 'all' && j !== editandoAlcance.indice)}
                    onCerrar={() => setEditandoAlcance(null)}
                    onGuardar={async (scope) => {
                        const { alerta, provisoria, indice } = editandoAlcance;
                        if (provisoria) await escribir(alerta, [...(alerta.bonusRules || []), { ...provisoria, scope }]);
                        else await cambiarAlcance(alerta, indice, scope);
                        setEditandoAlcance(null);
                    }}
                />
            )}
        </>
    );
}


/**
 * Una alerta con sus alcances, en una fila.
 *
 * La caja de la alerta a la izquierda y sus asignaciones a la derecha, alineadas
 * arriba. Cada fila es independiente: agregar o tocar una alerta no mueve nada
 * de las demás — el mapa es una vista de relaciones, no un formulario único.
 */
function FilaDeAlerta({
    alerta, catalogo, reglas, puedeEditar, tirando,
    onTirar, onEditarAlcance, onSumar, onAlternar, onSacar,
}) {
    const asignaciones = alerta.bonusRules || [];
    const mid = String(alerta._id);

    return (
        <div className='grid gap-x-16 items-start grid-cols-[minmax(210px,1fr)_minmax(230px,1.1fr)]'>
            <NodoAlerta alerta={alerta} puedeEditar={puedeEditar} onAlternar={onAlternar} onSacar={onSacar} />

            <div className='flex flex-col gap-3'>
                {asignaciones.map((asig, i) => (
                    <NodoAlcance key={i} alerta={mid} indice={i} asignacion={asig} catalogo={catalogo}
                        puedeEditar={puedeEditar}
                        tirandoEsta={tirando?.menuId === mid && tirando?.indice === i}
                        onTirar={e => onTirar(e, i)}
                        onEditar={() => onEditarAlcance(i)} />
                ))}

                {puedeEditar && reglas.length > 0 && (
                    <ElegirRegla reglas={reglas} onElegir={onSumar}
                        etiqueta={asignaciones.length ? '+ Otro lugar' : '+ Asignar una regla'} />
                )}
            </div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════

/**
 * El alto mínimo de las tres cajas del mapa, cerca del ancho de su columna para
 * que se lean como cuadrados y no como renglones. Es UNA constante para las
 * tres a propósito: si crecieran distinto, los cables entrarían y saldrían a
 * alturas distintas y el mapa dejaría de leerse como una fila.
 */
const CAJA = 'min-h-[190px] flex flex-col';

/**
 * Los colores de los cables. Cada cable toma el de la caja a la que APUNTA: el
 * que llega al alcance va en su verde, el que llega a la regla va en el color
 * de la categoría de esa regla — así se lee de un vistazo a qué categoría va
 * cada asignación sin leer la caja.
 */
const COLOR_ALCANCE = '#29c50c';
const COLOR_NEUTRO = '#9aa6b5';

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
        const n = lienzo.current.querySelector(`[data-nodo="alcance-${tirando.menuId}-${tirando.indice}"]`);
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
                {/* Un marcador por color en juego. Sería más limpio uno solo con
                    `fill='context-stroke'`, pero Chrome lo trae desde la 110 y
                    Safari desde la 17.4: en un navegador viejo la punta saldría
                    negra. Con un marcador por color funciona en todos. */}
                {[...new Set(cables.map(c => c.color))].map(color => (
                    <marker key={color} id={`punta-${color.replace('#', '')}`} viewBox='0 0 10 10' refX='9' refY='5'
                        markerWidth='6.5' markerHeight='6.5' orient='auto-start-reverse'>
                        <path d='M0,0 L10,5 L0,10 z' fill={color} />
                    </marker>
                ))}
            </defs>
            {cables.map(c => (
                <path key={c.id} d={c.d} fill='none' stroke={c.color} strokeWidth='2.5'
                    markerEnd={`url(#punta-${c.color.replace('#', '')})`} />
            ))}
            {goma && <path d={goma} fill='none' stroke='#29c50c' strokeWidth='2.5' strokeDasharray='6 5' />}
        </svg>
    );
}


/**
 * Traer una alerta al lienzo.
 *
 * Las que ya están puestas salen deshabilitadas: sumarlas de nuevo duplicaría
 * su fila y el mapa mostraría dos veces la misma relación.
 */
function ElegirAlerta({ alertas, enLienzo, onCerrar, onElegir }) {
    const [busqueda, setBusqueda] = useState('');
    const puestas = useMemo(() => new Set(enLienzo.map(String)), [enLienzo]);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (alertas || [])
            .filter(a => !texto || `${a.es || ''} ${a.en || ''}`.toLowerCase().includes(texto))
            .sort((a, b) => (a.es || '').localeCompare(b.es || ''))
            .slice(0, 60);
    }, [alertas, busqueda]);

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[80vh] flex flex-col'
                onClick={e => e.stopPropagation()}>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>Traer una alerta al mapa</h3>
                    <p className='text-[11.5px] text-gray-500 mt-0.5'>
                        Se suma al lienzo sin tocar las que ya están.
                    </p>
                    <input type='search' value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder='Buscar alerta…' autoFocus
                        className='h-9 w-full mt-3 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                                   placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
                </div>

                <ul className='flex-1 min-h-0 overflow-y-auto p-2'>
                    {visibles.map(a => {
                        const yaEsta = puestas.has(String(a._id));
                        return (
                            <li key={a._id}>
                                <button type='button' disabled={yaEsta} onClick={() => onElegir(a._id)}
                                    className='w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg
                                               hover:bg-[#29c50c]/10 disabled:opacity-45 disabled:hover:bg-transparent
                                               disabled:cursor-not-allowed transition-colors'>
                                    {!a.bonusReviewed && <span className='w-1.5 h-1.5 rounded-full bg-[#d9a441]' title='Sin revisar' />}
                                    <span className='flex-1 text-[12.5px] text-gray-800'>{a.es || a.en}</span>
                                    <span className='text-[10.5px] text-gray-500'>
                                        {yaEsta ? 'ya está en el mapa'
                                            : a.bonusRules?.length ? `${a.bonusRules.length} regla${a.bonusRules.length === 1 ? '' : 's'}`
                                            : ''}
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


/** La alerta que se está mapeando. */
function NodoAlerta({ alerta, puedeEditar, onAlternar, onSacar }) {
    const categoria = CATEGORIAS_OPERATIVAS[alerta?.category];
    const bonifica = alerta?.bonifies === true;

    return (
        <div data-nodo={`alerta-${alerta._id}`}
            className={`${CAJA} bg-white border-[1.5px] rounded-xl px-4 py-3.5 transition-colors
                        ${bonifica ? 'border-[#29c50c]' : 'border-gray-300'}`}>
            <div className='flex items-start gap-2'>
                <span className='flex-1 text-[13.5px] font-bold text-gray-800 leading-tight'>{alerta?.es || alerta?.en}</span>
                {puedeEditar && (
                    <button type='button' onClick={onSacar} title='Sacar del mapa — no toca su configuración'
                        className='shrink-0 text-[11px] font-bold text-gray-400 hover:text-gray-700 transition-colors'>✕</button>
                )}
            </div>
            {/* El nombre en inglés, más chico: es como está en los JSON de
                Jarvis-express y como lo ve el operador en la app. Solo si es
                distinto del español — repetirlo no dice nada. */}
            {alerta?.en && alerta.en !== alerta.es && (
                <span className='block text-[11px] text-gray-500 leading-tight mt-0.5'>{alerta.en}</span>
            )}
            <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
                {categoria && (
                    <span className='text-[10px] font-bold rounded px-1.5 py-0.5'
                        style={{ backgroundColor: categoria.bg, color: categoria.color }}>{categoria.es}</span>
                )}
                {!alerta?.bonusReviewed && (
                    <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#fdf6e7] text-[#8a5a2b]'>Sin revisar</span>
                )}
            </div>

            {/* El interruptor. Separa "se decidió que no bonifica" de "todavía
                no se configuró": sin él, una alerta a medio armar se ve igual
                que una descartada. */}
            <div className='mt-auto pt-3'>
                {puedeEditar ? (
                    <button type='button' onClick={onAlternar}
                        className={`w-full h-8 rounded-lg text-[11.5px] font-bold transition-colors
                            ${bonifica
                                ? 'bg-[#29c50c] text-white hover:bg-[#1f9a08]'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {bonifica ? 'Bonifica' : alerta?.bonifies === false ? 'No bonifica' : 'Sin decidir'}
                    </button>
                ) : (
                    <span className='text-[11px] font-bold text-gray-500'>
                        {bonifica ? 'Bonifica' : alerta?.bonifies === false ? 'No bonifica' : 'Sin decidir'}
                    </span>
                )}
            </div>
        </div>
    );
}


/**
 * Una asignación: DÓNDE aplica. El punto del borde derecho es el cable a la
 * regla — se arrastra para reapuntarla, o afuera para borrarla.
 */
function NodoAlcance({ alerta, indice, asignacion, catalogo, puedeEditar, tirandoEsta, onTirar, onEditar }) {
    const s = asignacion.scope || { mode: 'all' };
    const nombre = (lista, id) => lista.find(x => String(x._id) === String(id))?.name || '…';
    const nombres = [
        ...(s.franchises || []).map(id => nombre(catalogo.franchises, id)),
        ...(s.locals || []).map(id => nombre(catalogo.locals, id)),
    ];

    const titulo = s.mode === 'all' ? 'Todos los establecimientos'
        : s.mode === 'only' ? 'Solo en' : 'Todos menos';

    return (
        <div data-nodo={`alcance-${alerta}-${indice}`}
            className={`${CAJA} relative bg-white border-[1.5px] rounded-xl px-4 py-3.5 transition-shadow
                        ${tirandoEsta ? 'border-[#29c50c] shadow-md' : 'border-[#29c50c]/60'}`}>
            <div className='flex items-start gap-2'>
                <span className='flex-1 text-[12.5px] font-bold text-gray-800 leading-tight'>{titulo}</span>
                {puedeEditar && (
                    <button type='button' onClick={onEditar}
                        className='shrink-0 text-[11px] font-bold text-[#1f9a08] hover:underline'>Cambiar</button>
                )}
            </div>
            {s.mode !== 'all' && (
                <ul className='mt-1.5 flex flex-wrap gap-1'>
                    {nombres.map((n, i) => (
                        <li key={i} className='text-[10.5px] font-semibold rounded px-1.5 py-0.5 bg-gray-100 text-gray-700'>{n}</li>
                    ))}
                </ul>
            )}

            {puedeEditar && (
                <span role='button' tabIndex={0} onPointerDown={onTirar}
                    title='Arrastrá hasta otra regla, o afuera para quitar'
                    className='absolute -right-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full
                               bg-white border-2 border-gray-400 cursor-grab active:cursor-grabbing z-[3]
                               grid place-items-center hover:border-[#29c50c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                    <span className='w-1.5 h-1.5 rounded-full bg-gray-400' />
                </span>
            )}
        </div>
    );
}


/** Una regla: destino de cables. Se ilumina si esta alerta la usa. */
function NodoRegla({ regla, categoria, conectada, puedeEditar, onEditar }) {
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');
    const inactiva = regla.active === false;

    return (
        <div data-nodo={`regla-${regla._id}`} data-tipo='regla' data-regla={String(regla._id)}
            className={`${CAJA} border-2 rounded-xl px-4 py-3.5 transition-colors
                        ${conectada ? 'bg-[#fdf6e7] border-[#d9a441]' : 'bg-white border-gray-200'}
                        ${inactiva ? 'opacity-60' : ''}`}>
            <div className='flex items-start gap-2'>
                <span className='flex-1 text-[13px] font-black text-slate-900 leading-tight'>{regla.name}</span>
                {puedeEditar && (
                    <button type='button' onClick={onEditar}
                        className='shrink-0 text-[11px] font-bold text-[#8a5a2b] hover:underline'>Editar</button>
                )}
            </div>
            {/* La categoría de bonificación, con su ícono y su color del catálogo.
                Va antes de la fórmula porque es lo que agrupa en el corte: se
                lee "esta regla es de Higiene" antes que "es 3x1". */}
            {categoria && <ChipCategoria categoria={categoria} />}

            <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>{formulaLabel(regla)}</span>
                {inactiva && <span className='text-[10px] font-bold rounded px-1.5 py-0.5 bg-red-100 text-red-700'>Inactiva</span>}
            </div>
            <span className='block mt-1 text-[14px] font-black text-[#8a5a2b] tabular-nums'>
                {mismoEnAmbosTurnos(regla)
                    ? <>{formatBonus(dia)} <span className='text-[10.5px] font-bold opacity-70'>bono</span></>
                    : <>{formatBonus(dia)} <span className='text-[10.5px] font-bold opacity-70'>día</span>
                        {'  '}{formatBonus(noche)} <span className='text-[10.5px] font-bold opacity-70'>noche</span></>}
            </span>
        </div>
    );
}


/** La categoría de una regla: ícono y color tal como los guarda el catálogo. */
function ChipCategoria({ categoria }) {
    const Icono = iconOf(categoria.icon);
    return (
        <span className='inline-flex items-center gap-1.5 mt-2 rounded-md px-2 py-1 text-[10.5px] font-bold'
            style={{ background: categoria.bg || '#fdf6e7', color: categoria.color || '#8a5a2b' }}>
            <Icono size={12} />
            {categoria.es}
            {categoria.active === false && <span className='opacity-70'>· inactiva</span>}
        </span>
    );
}


/** Sumar una asignación: elegir con qué regla. */
function ElegirRegla({ reglas, etiqueta, onElegir }) {
    const [abierto, setAbierto] = useState(false);
    return (
        <div className='relative'>
            <button type='button' onClick={() => setAbierto(v => !v)}
                className='w-full rounded-xl border-[1.5px] border-dashed border-gray-300 py-3 text-[12px] font-bold
                           text-gray-500 hover:border-[#29c50c] hover:text-[#1f9a08] transition-colors'>
                {etiqueta}
            </button>
            {abierto && (
                <ul className='absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-1'>
                    {reglas.map(r => (
                        <li key={r._id}>
                            <button type='button' onClick={() => { setAbierto(false); onElegir(String(r._id)); }}
                                className='w-full text-left px-3 py-2 rounded-md text-[12.5px] text-gray-800 hover:bg-[#29c50c]/10 transition-colors'>
                                {r.name} <span className='text-[10.5px] text-gray-500'>· {formulaLabel(r)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}


/**
 * Editar el alcance de una asignación. Modal, porque el alcance puede ser una
 * lista larga de locales y en la caja del mapa no entra.
 *
 * No deja guardar un alcance a medias —'only' sin ningún elegido—: es lo que
 * el servidor rechaza, y con razón, porque no aplicaría en ningún lado.
 */
function EditorDeAlcance({ catalogo, inicial, yaHayGeneral, onCerrar, onGuardar }) {
    const [scope, setScope] = useState(inicial || { mode: 'all', franchises: [], locals: [] });

    const alternar = (clave, id) => setScope(s => {
        const actual = (s[clave] || []).map(String);
        return { ...s, [clave]: actual.includes(String(id)) ? actual.filter(x => x !== String(id)) : [...actual, String(id)] };
    });
    const tildado = (clave, id) => (scope[clave] || []).some(x => String(x) === String(id));

    const incompleto = scope.mode === 'only' && !scope.franchises?.length && !scope.locals?.length;
    // Una segunda asignación general sería ambigua: el servidor la rechaza.
    const generalDuplicada = scope.mode === 'all' && yaHayGeneral;
    const puedeGuardar = !incompleto && !generalDuplicada;

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[82vh] flex flex-col' onClick={e => e.stopPropagation()}>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>Dónde aplica esta asignación</h3>
                    <div className='flex flex-wrap gap-1 mt-3'>
                        {[{ key: 'all', label: 'Todos' }, { key: 'only', label: 'Solo estos' }, { key: 'except', label: 'Todos menos' }].map(m => (
                            <button key={m.key} type='button' onClick={() => setScope(s => ({ ...s, mode: m.key }))}
                                aria-pressed={scope.mode === m.key}
                                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-colors
                                    ${scope.mode === m.key ? 'bg-[#29c50c] text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='flex-1 min-h-0 overflow-y-auto p-3'>
                    {scope.mode === 'all' ? (
                        <p className='px-2 py-3 text-[12.5px] text-gray-600'>
                            {generalDuplicada
                                ? 'Esta alerta ya tiene una asignación general. Elegí «Solo estos» o «Todos menos» para esta.'
                                : 'En todos los establecimientos. Un local que abra mañana queda cubierto solo.'}
                        </p>
                    ) : (
                        <>
                            <Grupo titulo='Marcas' items={catalogo.franchises} clave='franchises' tildado={tildado} alternar={alternar} />
                            <Establecimientos catalogo={catalogo} tildado={tildado} alternar={alternar} />
                        </>
                    )}
                </div>

                <div className='px-5 py-3 border-t border-gray-100 flex items-center gap-2'>
                    {incompleto && <span className='text-[11px] text-[#8a5a2b]'>Elegí al menos una marca o un establecimiento.</span>}
                    <button type='button' onClick={onCerrar}
                        className='ml-auto h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'>Cancelar</button>
                    <button type='button' disabled={!puedeGuardar} onClick={() => onGuardar(scope)}
                        className='h-9 px-4 rounded-lg text-[12.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] disabled:opacity-50 transition-colors'>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Los establecimientos como se piensan: los PERIMETRALES en un grupo propio y
 * los ANALÍTICOS por marca. Es la división que hace el reglamento —son tarifas
 * distintas—, y con setenta locales en una lista plana había que buscar uno
 * por uno.
 *
 * El armado vive en libs/parser/estableshment.js, junto al agrupador por
 * franquicia que ya usa el resto de la app.
 */
function Establecimientos({ catalogo, tildado, alternar }) {
    const grupos = useMemo(() => agruparParaSelector(catalogo.locals), [catalogo.locals]);

    return (
        <>
            {grupos.perimetrales.length > 0 && (
                <Grupo titulo='Perimetrales' items={grupos.perimetrales} clave='locals' tildado={tildado} alternar={alternar} />
            )}
            {grupos.analiticos.map(g => (
                <Grupo key={g.titulo} titulo={`Analíticos · ${g.titulo}`} items={g.locales} clave='locals' tildado={tildado} alternar={alternar} />
            ))}
        </>
    );
}

function Grupo({ titulo, items, clave, tildado, alternar }) {
    if (!items?.length) return null;
    return (
        <>
            <p className='px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500'>{titulo}</p>
            {items.map(o => (
                <label key={o._id} className='flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer'>
                    <input type='checkbox' checked={tildado(clave, o._id)} onChange={() => alternar(clave, o._id)}
                        className='w-3.5 h-3.5 rounded accent-[#29c50c]' />
                    <span className='text-[12px] text-gray-700 truncate'>{o.name}</span>
                </label>
            ))}
        </>
    );
}
