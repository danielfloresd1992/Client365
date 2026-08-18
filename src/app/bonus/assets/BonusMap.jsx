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
    reglas, alertas, alcance, cargando, guardando, puedeEditar,
    onEscribirAsignaciones, onEditarRegla, onNuevaRegla,
}) {

    const [activaId, setActivaId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [tirando, setTirando] = useState(null);   // { indice, x, y }  índice de la asignación arrastrada
    const [editandoAlcance, setEditandoAlcance] = useState(null);   // índice de la asignación cuyo alcance se edita
    const lienzo = useRef(null);
    const [cables, setCables] = useState([]);

    const porId = useMemo(() => new Map((reglas || []).map(r => [String(r._id), r])), [reglas]);

    // El catálogo de categorías, para pintar ícono y color en cada regla y en
    // el cable que le llega. Con las inactivas: una regla cuya categoría se dio
    // de baja tiene que seguir mostrándola, no quedar en blanco.
    const { categorias } = useBonusCategories(true);
    const categoriaDe = useMemo(() => new Map(categorias.map(c => [c.value, c])), [categorias]);

    // La primera alerta con asignaciones se abre sola: un mapa vacío no dice
    // qué hacer. Si ninguna tiene, la primera del catálogo.
    const activa = useMemo(() => {
        const lista = alertas || [];
        return lista.find(a => String(a._id) === String(activaId))
            || lista.find(a => a.bonusRules?.length)
            || lista[0]
            || null;
    }, [alertas, activaId]);

    // Memoizado: `|| []` crearía un array nuevo en cada render y dispararía
    // el recálculo de cables sin que nada haya cambiado.
    const asignaciones = useMemo(() => activa?.bonusRules || [], [activa]);


    // ── Los cables se calculan sobre las posiciones REALES ────────────
    // Con las cajas medidas y no con coordenadas fijas, el trazo sigue bien
    // cuando un nombre envuelve en dos líneas o cambia el ancho de la ventana.
    const trazar = useCallback(() => {
        const base = lienzo.current?.getBoundingClientRect();
        if (!base || !activa) return setCables([]);

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

        const dAlerta = caja('[data-nodo="alerta"]');
        const nuevos = [];

        asignaciones.forEach((asig, i) => {
            const dAlc = caja(`[data-nodo="alcance-${i}"]`);
            const d1 = curva(dAlerta, dAlc);
            if (d1) nuevos.push({ id: `a-${i}`, d: d1, color: COLOR_ALCANCE });

            // El cable que se está arrastrando no se dibuja fijo: lo dibuja la goma.
            if (tirando?.indice === i) return;
            const d2 = curva(dAlc, caja(`[data-nodo="regla-${asig.rule}"]`));
            if (d2) {
                // El color de la categoría de la regla a la que apunta. Sin
                // categoría, el gris neutro: un color inventado mentiría.
                const regla = porId.get(String(asig.rule));
                const cat = regla ? categoriaDe.get(regla.bonusCategory) : null;
                nuevos.push({ id: `r-${i}`, d: d2, color: cat?.color || COLOR_NEUTRO });
            }
        });
        setCables(nuevos);
    }, [activa, asignaciones, tirando?.indice, porId, categoriaDe]);

    useEffect(() => { trazar(); }, [trazar]);
    useEffect(() => {
        const el = lienzo.current;
        if (!el) return;
        const ro = new ResizeObserver(() => requestAnimationFrame(trazar));
        ro.observe(el);
        addEventListener('resize', trazar);
        return () => { ro.disconnect(); removeEventListener('resize', trazar); };
    }, [trazar]);


    // ── Escritura: cada gesto arma la lista siguiente y la manda entera ──
    const escribir = (siguientes) => onEscribirAsignaciones(activa._id, siguientes);

    /** Cambia con qué regla va la asignación `i`. */
    const reapuntar = (i, ruleId) => escribir(asignaciones.map((a, j) => (j === i ? { ...a, rule: ruleId } : a)));

    /** Borra la asignación `i`. */
    const quitar = (i) => escribir(asignaciones.filter((_, j) => j !== i));

    /** Cambia el alcance de la asignación `i`. */
    const cambiarAlcance = (i, scope) => escribir(asignaciones.map((a, j) => (j === i ? { ...a, scope } : a)));

    /**
     * Suma una asignación con esa regla. El alcance se pregunta después, salvo
     * que sea la primera: la primera es general por defecto —es lo normal— y
     * así una alerta simple queda lista con un solo gesto.
     */
    const sumar = async (ruleId) => {
        const yaHayGeneral = asignaciones.some(a => a.scope?.mode === 'all');
        const nueva = { rule: ruleId, scope: { mode: yaHayGeneral ? 'only' : 'all', franchises: [], locals: [] } };

        if (!yaHayGeneral) return escribir([...asignaciones, nueva]);

        // Con una general ya puesta, la nueva tiene que ser por local o marca —
        // y no se manda hasta que se elija dónde. Se abre el editor de alcance
        // sobre una asignación PROVISORIA, en memoria.
        setEditandoAlcance({ provisoria: nueva });
    };


    // ── Arrastre ──────────────────────────────────────────────────────
    const empezar = (e, indice) => {
        if (!puedeEditar) return;
        e.preventDefault();
        lienzo.current.setPointerCapture(e.pointerId);
        setTirando({ indice, x: e.clientX, y: e.clientY });
    };

    const soltar = async (e) => {
        if (!tirando) return;
        const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-tipo="regla"]');
        const { indice } = tirando;
        setTirando(null);

        // Sobre una regla, la asignación pasa a apuntar ahí. Fuera, se borra.
        if (destino) await reapuntar(indice, destino.dataset.regla);
        else await quitar(indice);
    };


    if (cargando) return <Marco><p className='px-5 py-10 text-[13px] text-gray-500'>Cargando el mapa…</p></Marco>;

    if (!(alertas || []).length) {
        return <Marco><p className='px-5 py-10 text-[13px] text-gray-500'>No hay alertas en el catálogo.</p></Marco>;
    }

    const activasReglas = (reglas || []).filter(r => r.active !== false);

    return (
        <>
            <Marco>
                {/* ── Qué alerta se está mapeando ────────────────────── */}
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1'>Alerta</span>
                    <SelectorDeAlerta alertas={alertas} activa={activa} busqueda={busqueda}
                        onBuscar={setBusqueda} onElegir={id => { setActivaId(id); setBusqueda(''); }} />
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

                        {/* Alerta */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Alerta · Menu.model</Rotulo>
                            <NodoAlerta alerta={activa} />
                        </div>

                        {/* Alcances: uno por asignación */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Dónde aplica</Rotulo>
                            {asignaciones.map((asig, i) => (
                                <NodoAlcance key={i} indice={i} asignacion={asig} catalogo={alcance}
                                    puedeEditar={puedeEditar} tirandoEsta={tirando?.indice === i}
                                    onTirar={e => empezar(e, i)}
                                    onEditar={() => setEditandoAlcance({ indice: i })} />
                            ))}
                            {puedeEditar && activasReglas.length > 0 && (
                                <ElegirRegla reglas={activasReglas} onElegir={sumar}
                                    etiqueta={asignaciones.length ? '+ Otra regla en otro lugar' : '+ Asignar una regla'} />
                            )}
                            {!asignaciones.length && (
                                <p className='text-[11.5px] text-gray-500'>
                                    {activa?.bonusReviewed ? 'Se decidió que no bonifica.' : 'Sin asignar todavía.'}
                                </p>
                            )}
                        </div>

                        {/* Reglas */}
                        <div className='flex flex-col gap-3'>
                            <Rotulo>Reglas de bonificación</Rotulo>
                            {(reglas || []).map(r => (
                                <NodoRegla key={r._id} regla={r} puedeEditar={puedeEditar}
                                    categoria={categoriaDe.get(r.bonusCategory) || null}
                                    conectada={asignaciones.some(a => String(a.rule) === String(r._id))}
                                    onEditar={() => onEditarRegla(r)} />
                            ))}
                            {!(reglas || []).length && (
                                <p className='text-[11.5px] text-gray-500'>Todavía no hay reglas. Creá la primera con «+ Regla».</p>
                            )}
                        </div>
                    </div>
                </div>
            </Marco>

            {editandoAlcance && (
                <EditorDeAlcance
                    catalogo={alcance}
                    inicial={editandoAlcance.provisoria?.scope ?? asignaciones[editandoAlcance.indice]?.scope}
                    yaHayGeneral={asignaciones.some((a, j) => a.scope?.mode === 'all' && j !== editandoAlcance.indice)}
                    guardando={guardando}
                    onCerrar={() => setEditandoAlcance(null)}
                    onGuardar={async (scope) => {
                        if (editandoAlcance.provisoria) {
                            await escribir([...asignaciones, { ...editandoAlcance.provisoria, scope }]);
                        } else {
                            await cambiarAlcance(editandoAlcance.indice, scope);
                        }
                        setEditandoAlcance(null);
                    }}
                />
            )}
        </>
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
        const n = lienzo.current.querySelector(`[data-nodo="alcance-${tirando.indice}"]`);
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


/** Buscar y elegir la alerta que se mapea. */
function SelectorDeAlerta({ alertas, activa, busqueda, onBuscar, onElegir }) {
    const [abierto, setAbierto] = useState(false);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (alertas || [])
            .filter(a => !texto || `${a.es || ''} ${a.en || ''}`.toLowerCase().includes(texto))
            .sort((a, b) => (a.es || '').localeCompare(b.es || ''))
            .slice(0, 40);
    }, [alertas, busqueda]);

    return (
        <div className='relative flex-1 min-w-[240px] max-w-[460px]'>
            <input type='search' value={abierto ? busqueda : (activa?.es || activa?.en || '')}
                onFocus={() => setAbierto(true)}
                onBlur={() => setTimeout(() => setAbierto(false), 150)}
                onChange={e => onBuscar(e.target.value)}
                placeholder='Buscar alerta…'
                className='h-9 w-full px-3 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-800
                           placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
            {abierto && (
                <ul className='absolute z-20 mt-1 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-1'>
                    {visibles.map(a => (
                        <li key={a._id}>
                            <button type='button' onMouseDown={() => onElegir(a._id)}
                                className='w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#29c50c]/10 transition-colors'>
                                {!a.bonusReviewed && <span className='w-1.5 h-1.5 rounded-full bg-[#d9a441]' title='Sin revisar' />}
                                <span className='flex-1 text-[12.5px] text-gray-800'>{a.es || a.en}</span>
                                <span className='text-[10.5px] text-gray-500'>
                                    {a.bonusRules?.length ? `${a.bonusRules.length} regla${a.bonusRules.length === 1 ? '' : 's'}` : ''}
                                </span>
                            </button>
                        </li>
                    ))}
                    {!visibles.length && <li className='px-3 py-4 text-[12px] text-gray-500'>Ninguna coincide.</li>}
                </ul>
            )}
        </div>
    );
}


/** La alerta que se está mapeando. */
function NodoAlerta({ alerta }) {
    const categoria = CATEGORIAS_OPERATIVAS[alerta?.category];
    return (
        <div data-nodo='alerta' className={`${CAJA} bg-white border-[1.5px] border-gray-300 rounded-xl px-4 py-3.5`}>
            <span className='block text-[13.5px] font-bold text-gray-800 leading-tight'>{alerta?.es || alerta?.en}</span>
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
        </div>
    );
}


/**
 * Una asignación: DÓNDE aplica. El punto del borde derecho es el cable a la
 * regla — se arrastra para reapuntarla, o afuera para borrarla.
 */
function NodoAlcance({ indice, asignacion, catalogo, puedeEditar, tirandoEsta, onTirar, onEditar }) {
    const s = asignacion.scope || { mode: 'all' };
    const nombre = (lista, id) => lista.find(x => String(x._id) === String(id))?.name || '…';
    const nombres = [
        ...(s.franchises || []).map(id => nombre(catalogo.franchises, id)),
        ...(s.locals || []).map(id => nombre(catalogo.locals, id)),
    ];

    const titulo = s.mode === 'all' ? 'Todos los establecimientos'
        : s.mode === 'only' ? 'Solo en' : 'Todos menos';

    return (
        <div data-nodo={`alcance-${indice}`}
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
function EditorDeAlcance({ catalogo, inicial, yaHayGeneral, guardando, onCerrar, onGuardar }) {
    const [scope, setScope] = useState(inicial || { mode: 'all', franchises: [], locals: [] });

    const alternar = (clave, id) => setScope(s => {
        const actual = (s[clave] || []).map(String);
        return { ...s, [clave]: actual.includes(String(id)) ? actual.filter(x => x !== String(id)) : [...actual, String(id)] };
    });
    const tildado = (clave, id) => (scope[clave] || []).some(x => String(x) === String(id));

    const incompleto = scope.mode === 'only' && !scope.franchises?.length && !scope.locals?.length;
    // Una segunda asignación general sería ambigua: el servidor la rechaza.
    const generalDuplicada = scope.mode === 'all' && yaHayGeneral;
    const puedeGuardar = !incompleto && !generalDuplicada && !guardando;

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
                        {guardando ? 'Guardando…' : 'Guardar'}
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
