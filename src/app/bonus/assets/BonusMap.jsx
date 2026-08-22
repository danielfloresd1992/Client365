'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories';
import { iconOf } from '@/libs/alerts/categoryIcons.js';
import useBonusCategories from '@/hook/useBonusCategories.js';
import useZoom from '@/hook/useZoom.js';
import useConfirm from '@/hook/useConfirm.js';
import ControlesDeZoom from '@/components/ZoomControls.jsx';
import { agruparParaSelector } from '@/libs/parser/estableshment';
import {
    bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos,
    nombresDelAlcance, describirAlcance,
} from './bonusRuleFormat';

/**
 * EL MAPA DE UNA ALERTA.
 *
 *     alerta  ──→  ¿dónde?  ──→  regla
 *                  (todos)  ──→  Perimetrales 3x1
 *                  (Miami)  ──→  Miami reforzada
 *
 * Cada alerta es una fila con sus asignaciones: cada una es un alcance —una
 * caja del medio— con un cable hacia la regla que aplica ahí. La misma alerta
 * puede ir con reglas distintas según el establecimiento, y esta forma lo
 * muestra tal cual: tantas cajas del medio como asignaciones tenga.
 *
 * Las reglas van en una columna aparte, COMPARTIDA por todas las filas: una
 * regla que usan tres alertas se dibuja una vez y le llegan tres cables. Por
 * eso «+ Asignar una regla» vive arriba de esa columna y pregunta a qué alerta
 * —el botón no puede saberlo, la columna no es de nadie en particular—.
 *
 * Con una sola asignación general, el mapa se ve como una línea recta:
 * alerta → todos → regla. Solo cuando la alerta necesita reglas distintas por
 * local aparecen más cajas.
 *
 *
 * EL INTERRUPTOR DE LA ALERTA
 *
 * `Menu.bonifies` decide dos cosas a la vez, y por eso es un solo control:
 * si la alerta bonifica, y si está en el mapa.
 *
 *     true    bonifica. Está en el mapa, en color.
 *     false   apagada. SIGUE en el mapa, en grises, con su cableado intacto —
 *             desaparecer una alerta con reglas armadas escondería trabajo
 *             hecho y haría imposible volver a encenderla desde acá.
 *     null    nunca se decidió. No está en el mapa salvo que tenga reglas de
 *             antes; es el valor de todo lo cargado antes de este campo.
 *
 * Apagar NO borra nada: las asignaciones quedan donde están y encender vuelve
 * a dejarlas en uso. Es lo que hace que el interruptor sea seguro de tocar.
 *
 * Solo los administradores lo ven como control; el resto lee el estado.
 *
 *
 * LOS CABLES SON EL FORMULARIO
 *
 * Cada caja tiene un puerto —el punto de su borde derecho— y de ahí nace su
 * cable. El gesto es el mismo en las dos, cambia lo que significa:
 *
 *   puerto de la ALERTA   ¿dónde bonifica? Soltarlo en una regla la asigna de
 *                         un gesto; soltarlo al aire pregunta dónde aplica y
 *                         deja la caja armada esperando su regla.
 *   puerto del ALCANCE    ¿con qué regla? Soltarlo en otra regla reapunta la
 *                         asignación; afuera, la borra —y eso pregunta antes,
 *                         porque soltar el cable a un centímetro de la caja es
 *                         un accidente fácil y borra una referencia guardada.
 *
 * Y del lado IZQUIERDO del alcance, donde LLEGA el cable, hay una cruz que lo
 * corta. Arrastrar afuera alcanza cuando hay una sola asignación, pero con dos
 * o más arrastrar es el gesto para reapuntar y no quedaba ninguno para quitar
 * la del medio.
 *
 * Así se arma una alerta de punta a punta sin salir del mapa: se tira el cable,
 * se define dónde, se lleva hasta la regla. Nada se manda a medias — una
 * asignación sin regla no existe para el servidor, así que la caja intermedia
 * vive solo en pantalla hasta que su cable llega a destino. Es lo que evita el
 * 400 de "alcance a medias".
 *
 * Cada gesto arma la lista siguiente de asignaciones de ESA alerta y la manda
 * entera; las demás filas no se tocan.
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
    const [asignando, setAsignando] = useState(false);
    const [tirando, setTirando] = useState(null);        // { desde, menuId, indice, x, y }
    const [editandoAlcance, setEditandoAlcance] = useState(null);

    // La asignación a medio armar: ya sabe DÓNDE, le falta la regla. Vive solo
    // acá porque sin regla el servidor la rechaza — recién al soltar su cable
    // en una regla se vuelve una asignación de verdad y se guarda.
    const [armando, setArmando] = useState(null);   // { menuId, scope }
    const lienzo = useRef(null);
    const [cables, setCables] = useState([]);

    // Cuánto se corre cada regla para quedar frente a los cables que le llegan.
    // Va en estado para pintar y en un ref para poder RESTARLO al medir: sin
    // eso, la medición de la vuelta siguiente incluiría el desplazamiento ya
    // aplicado y la caja se iría corriendo sola en cada pasada.
    const [correr, setCorrer] = useState(new Map());
    const correrRef = useRef(new Map());

    // El zoom del lienzo. Un mapa con muchas alertas no entra en pantalla, y
    // alejarlo para ver el conjunto es distinto de acercarlo para cablear fino.
    const zoom = useZoom({ nombre: 'mapa-de-bonificacion', min: 0.5, max: 1.5, paso: 0.1 });
    const confirmar = useConfirm();
    const escala = zoom.escala;

    // El mismo nodo es el que se escala y el que sirve de origen para medir las
    // cajas. Un ref de función los conecta a los dos sin envolver nada de más.
    const montarLienzo = useCallback((nodo) => {
        lienzo.current = nodo;
        zoom.ref.current = nodo;
    }, [zoom.ref]);

    const porId = useMemo(() => new Map((reglas || []).map(r => [String(r._id), r])), [reglas]);

    // El catálogo de categorías, para pintar ícono y color en cada regla y en
    // el cable que le llega. Con las inactivas: una regla cuya categoría se dio
    // de baja tiene que seguir mostrándola, no quedar en blanco.
    const { categorias } = useBonusCategories(true);
    const categoriaDe = useMemo(() => new Map(categorias.map(c => [c.value, c])), [categorias]);

    // Qué alertas trae el mapa al abrir:
    //     bonifies true    encendida — es lo que el interruptor declara
    //     con asignaciones aunque esté apagada o sin decidir, porque hay
    //                      cableado armado y esconderlo sería esconder trabajo
    //
    // Después no se recalcula: manda lo que el usuario agregue o saque. Si se
    // recalculara, encender una alerta reordenaría el mapa bajo el cursor.
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

        // Los rects llegan en píxeles de pantalla, ya multiplicados por el
        // zoom; el SVG dibuja en coordenadas de layout. Sin dividir, al 150%
        // los cables saldrían medio ancho más lejos que las cajas que unen.
        const caja = (sel, quitar = 0) => {
            const n = lienzo.current.querySelector(sel);
            if (!n) return null;
            const r = n.getBoundingClientRect();
            return {
                x1: (r.left - base.left) / escala,
                x2: (r.right - base.left) / escala,
                y: (r.top - base.top + r.height / 2) / escala - quitar,
                alto: r.height / escala,
            };
        };

        /** Una regla, medida SIN el desplazamiento que ya tiene puesto. */
        const cajaDeRegla = (idRegla) =>
            caja(`[data-nodo="regla-${idRegla}"]`, correrRef.current.get(String(idRegla)) || 0);
        const curva = (de, a) => {
            if (!de || !a) return null;
            const dx = Math.max(30, (a.x1 - de.x2) / 2);
            return `M ${de.x2} ${de.y} C ${de.x2 + dx} ${de.y}, ${a.x1 - dx} ${a.y}, ${a.x1} ${a.y}`;
        };

        const nuevos = [];
        const llegadas = new Map();     // idRegla → alturas de los alcances que la usan

        puestas.forEach(alerta => {
            const mid = String(alerta._id);
            const dAlerta = caja(`[data-nodo="alerta-${mid}"]`);

            // Apagada, todo su cableado va en gris: el color en este mapa
            // significa "esto está pagando", y una alerta apagada no paga.
            const apagada = alerta.bonifies !== true;

            (alerta.bonusRules || []).forEach((asig, i) => {
                const dAlc = caja(`[data-nodo="alcance-${mid}-${i}"]`);

                // De dónde le llegan los cables a cada regla. Es lo que decide
                // a qué altura se para: enfrente del promedio de los que la
                // usan, no arriba de todo con el hueco debajo.
                if (dAlc && asig.rule) {
                    const clave = String(asig.rule);
                    if (!llegadas.has(clave)) llegadas.set(clave, []);
                    llegadas.get(clave).push(dAlc.y);
                }
                const d1 = curva(dAlerta, dAlc);
                if (d1) nuevos.push({ id: `a-${mid}-${i}`, d: d1, color: apagada ? COLOR_APAGADO : COLOR_ALCANCE });

                // El que se arrastra no se dibuja fijo: lo dibuja la goma.
                if (tirando?.desde === 'alcance' && tirando?.menuId === mid && tirando?.indice === i) return;
                // A la regla el cable llega a donde SE VE, o sea con su
                // desplazamiento puesto.
                const dRegla = caja(`[data-nodo="regla-${asig.rule}"]`);
                const d2 = curva(dAlc, dRegla);
                if (d2) {
                    const regla = porId.get(String(asig.rule));
                    const cat = regla ? categoriaDe.get(regla.bonusCategory) : null;
                    const color = apagada ? COLOR_APAGADO : (cat?.color || COLOR_NEUTRO);
                    nuevos.push({ id: `r-${mid}-${i}`, d: d2, color });
                }
            });

            // La que se está armando ya tiene su cable a la alerta; el de la
            // derecha todavía no existe, y esa punta suelta es justo lo que se
            // ve que falta.
            if (armando?.menuId === mid) {
                const d = curva(dAlerta, caja(`[data-nodo="alcance-${mid}-nueva"]`));
                if (d) nuevos.push({ id: `a-${mid}-nueva`, d, color: COLOR_ALCANCE });
            }
        });
        setCables(nuevos);
        acomodarReglas(llegadas, cajaDeRegla);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puestas, tirando, armando, porId, categoriaDe, escala, reglas]);


    /**
     * Pone cada regla frente a los cables que le llegan.
     *
     * La columna de reglas se apila desde arriba, así que una regla que usan
     * tres alertas del medio de la lista queda arriba de todo con un hueco
     * debajo, y sus tres cables cruzan la pantalla en diagonal. Corrida al
     * promedio de sus llegadas, los cables salen casi rectos y se ve de un
     * vistazo qué alertas la usan.
     *
     * SE MUEVE CON `transform`, NO CON MARGEN. Un margen cambiaría el alto de
     * la columna, y eso vuelve a disparar la medición: la caja se correría de
     * nuevo en cada pasada, sin parar. `transform` no toca el layout.
     *
     * Las que no reciben ningún cable se quedan donde estén: correrlas no
     * apuntaría a nada y solo movería la lista.
     */
    const acomodarReglas = (llegadas, cajaDeRegla) => {
        const SEPARACION = 12;

        // Cada regla con cables, en su posición base y con su altura deseada.
        const objetivos = [];
        for (const regla of reglas || []) {
            const idRegla = String(regla._id);
            const alturas = llegadas.get(idRegla);
            const c = cajaDeRegla(idRegla);
            if (!c) continue;

            objetivos.push({
                idRegla,
                base: c.y,
                alto: c.alto,
                deseada: alturas?.length
                    ? alturas.reduce((s, y) => s + y, 0) / alturas.length
                    : c.y,
            });
        }

        // De arriba abajo, respetando el orden en que están en la columna: una
        // no puede subir por encima de la anterior ni pisarla.
        objetivos.sort((a, b) => a.base - b.base);

        let piso = -Infinity;
        const siguiente = new Map();

        for (const o of objetivos) {
            const centro = Math.max(o.deseada, piso + o.alto / 2);
            piso = centro + o.alto / 2 + SEPARACION;

            const desplazamiento = Math.round(centro - o.base);
            if (desplazamiento) siguiente.set(o.idRegla, desplazamiento);
        }

        // Solo se vuelve a pintar si de verdad cambió: sin esta comparación,
        // cada medición dispararía un render y el render otra medición.
        if (!mismoMapa(siguiente, correrRef.current)) {
            correrRef.current = siguiente;
            setCorrer(siguiente);
        }
    };

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
    // Cablear no enciende ni apaga: `bonifies` se conserva tal cual. Si no,
    // tocar el cableado de una alerta apagada la volvería a encender sola, y
    // el único que decide eso es el interruptor.
    const escribir = (alerta, bonusRules, bonifies = alerta.bonifies ?? null) =>
        onEscribirAsignaciones(alerta._id, { bonifies, bonusRules });

    const reapuntar = (alerta, i, ruleId) =>
        escribir(alerta, (alerta.bonusRules || []).map((a, j) => (j === i ? { ...a, rule: ruleId } : a)));

    const quitar = (alerta, i) =>
        escribir(alerta, (alerta.bonusRules || []).filter((_, j) => j !== i));

    /**
     * Quitar preguntando.
     *
     * Soltar el cable a un centímetro de la caja borra una referencia
     * guardada, y desde el mapa no se ve qué se perdió: la caja del medio
     * desaparece con su alcance adentro. El mensaje nombra las dos cosas que
     * el gesto toca —la alerta y dónde dejaba de aplicar— y aclara lo que NO
     * toca, que es la regla.
     */
    const quitarPreguntando = (alerta, i) => {
        const asignacion = (alerta.bonusRules || [])[i];
        if (!asignacion) return;

        const regla = porId.get(String(asignacion.rule));
        confirmar({
            titulo: '¿Quitar esta asignación?',
            descripcion: `«${alerta.es || alerta.en}» va a dejar de bonificar en `
                + `${describirAlcance(asignacion.scope, alcance)}. `
                + `La regla${regla ? ` «${regla.name}»` : ''} no se borra: sigue disponible para otras alertas.`,
            alAceptar: () => quitar(alerta, i),
        });
    };

    const cambiarAlcance = (alerta, i, scope) =>
        escribir(alerta, (alerta.bonusRules || []).map((a, j) => (j === i ? { ...a, scope } : a)));

    /** El interruptor. Apagar deja las asignaciones donde están: es reversible. */
    const alternarBonifica = (alerta) =>
        onEscribirAsignaciones(alerta._id, {
            bonifies: !(alerta.bonifies === true),
            bonusRules: alerta.bonusRules || [],
        });

    /**
     * Traer una alerta al mapa la enciende. Es la misma decisión dicha de otra
     * forma —«esta alerta va a bonificar»—, y así sigue ahí al recargar en vez
     * de depender de que alguien se acuerde de prender el interruptor.
     *
     * Encendida y sin asignaciones no paga nada: la resolución corta en
     * 'sin-regla'. El estado es "bonifica, falta cablearla", que es justo lo
     * que el mapa tiene que dejar ver.
     */
    const traer = (alerta) => {
        setEnLienzo(l => [...l, String(alerta._id)]);
        if (alerta.bonifies !== true) escribir(alerta, alerta.bonusRules || [], true);
    };

    /**
     * Sacarla del mapa la deja sin decidir. Solo se ofrece si no tiene
     * asignaciones: con cableado armado volvería sola al recargar, y el gesto
     * para dejar de pagar sin perder el trabajo es apagar, no sacar.
     */
    const sacar = (alerta) => {
        setEnLienzo(l => l.filter(x => x !== String(alerta._id)));
        setArmando(p => (p?.menuId === String(alerta._id) ? null : p));
        escribir(alerta, [], null);
    };

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
    const empezar = (e, desde, menuId, indice = null) => {
        if (!puedeEditar) return;
        e.preventDefault();
        lienzo.current.setPointerCapture(e.pointerId);
        setTirando({ desde, menuId, indice, x: e.clientX, y: e.clientY });
    };

    /** Dónde cayó el cable decide qué significó el gesto. */
    const soltar = async (e) => {
        if (!tirando) return;
        const { desde, menuId, indice } = tirando;
        setTirando(null);

        const alerta = puestas.find(a => String(a._id) === menuId);
        if (!alerta) return;
        const regla = document.elementFromPoint(e.clientX, e.clientY)
            ?.closest('[data-tipo="regla"]')?.dataset.regla || null;

        // Desde la alerta el cable nace sin destino: en una regla queda la
        // asignación armada de un gesto; al aire, pregunta dónde aplica.
        if (desde === 'alerta') {
            if (regla) return sumar(alerta, regla);
            return setEditandoAlcance({ alerta, sinRegla: true });
        }

        // La que se está armando solo se guarda si llegó a una regla; soltarla
        // afuera la descarta, igual que soltar cualquier otro cable al aire.
        if (indice === 'nueva') {
            setArmando(null);
            if (regla) await escribir(alerta, [...(alerta.bonusRules || []), { rule: regla, scope: armando.scope }]);
            return;
        }

        if (regla) await reapuntar(alerta, indice, regla);
        else quitarPreguntando(alerta, indice);
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
                    <div className='ml-auto flex items-center gap-2'>
                        <ControlesDeZoom zoom={zoom} />

                        {puedeEditar && (
                            <>
                                <button type='button' onClick={() => setEligiendo(true)}
                                    className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'>
                                    + Alerta
                                </button>
                                <button type='button' onClick={onNuevaRegla}
                                    className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                    + Regla
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Dos capas y cada una hace una cosa: la de afuera desplaza,
                    la de adentro escala. Si el zoom fuera sobre la que
                    desplaza, se escalaría también su propio ancho y la tarjeta
                    entera crecería en vez de aparecer una barra. */}
                <div className='lienzo-punteado p-5 overflow-auto select-none'
                    onPointerMove={e => tirando && setTirando(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                    onPointerUp={soltar}
                    onPointerCancel={() => setTirando(null)}>

                    <div ref={montarLienzo} className='relative'>

                        <Cables cables={cables} tirando={tirando} lienzo={lienzo} escala={escala} />

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
                                        puedeEditar={puedeEditar}
                                        tirando={tirando}
                                        armando={armando?.menuId === String(alerta._id) ? armando : null}
                                        onTirarAlerta={e => empezar(e, 'alerta', String(alerta._id))}
                                        onTirar={(e, i) => empezar(e, 'alcance', String(alerta._id), i)}
                                        onEditarAlcance={i => setEditandoAlcance(
                                            i === 'nueva' ? { alerta, sinRegla: true } : { alerta, indice: i })}
                                        onQuitarAlcance={i => quitarPreguntando(alerta, i)}
                                        onAlternar={() => alternarBonifica(alerta)}
                                        onSacar={() => sacar(alerta)}
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

                                {/* Asignar se hace desde acá, que es donde están
                                    las reglas. Como esta columna la comparten
                                    TODAS las alertas —una regla usada por tres se
                                    dibuja una vez—, el botón pregunta a cuál. */}
                                {puedeEditar && activasReglas.length > 0 && puestas.length > 0 && (
                                    <button type='button' onClick={() => setAsignando(true)}
                                        className='w-full rounded-xl border-[1.5px] border-dashed border-gray-300 py-3
                                                   text-[12px] font-bold text-gray-500 transition-colors
                                                   hover:border-[#29c50c] hover:text-[#1f9a08]'>
                                        + Asignar una regla
                                    </button>
                                )}

                                {(reglas || []).map(r => (
                                    <NodoRegla key={r._id} regla={r} puedeEditar={puedeEditar}
                                        correr={correr.get(String(r._id)) || 0}
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
                </div>
            </Marco>

            {eligiendo && (
                <ElegirAlerta alertas={alertas} enLienzo={enLienzo || []}
                    onCerrar={() => setEligiendo(false)}
                    onElegir={id => {
                const a = (alertas || []).find(x => String(x._id) === String(id));
                if (a) traer(a);
                setEligiendo(false);
            }} />
            )}

            {asignando && (
                <AsignarRegla
                    alertas={puestas}
                    reglas={activasReglas}
                    categoriaDe={categoriaDe}
                    onCerrar={() => setAsignando(false)}
                    onAsignar={(alerta, ruleId) => { setAsignando(false); sumar(alerta, ruleId); }}
                />
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
                        const { alerta, provisoria, sinRegla, indice } = editandoAlcance;
                        setEditandoAlcance(null);
                        // Sin regla todavía: la caja queda en pantalla, cableada
                        // a la alerta, hasta que su puerto llegue a una regla.
                        if (sinRegla) return setArmando({ menuId: String(alerta._id), scope });
                        if (provisoria) return escribir(alerta, [...(alerta.bonusRules || []), { ...provisoria, scope }]);
                        await cambiarAlcance(alerta, indice, scope);
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
    alerta, catalogo, puedeEditar, tirando, armando,
    onTirarAlerta, onTirar, onEditarAlcance, onQuitarAlcance, onAlternar, onSacar,
}) {
    const asignaciones = alerta.bonusRules || [];
    const mid = String(alerta._id);
    const apagada = alerta.bonifies !== true;
    const tirandoDe = (indice) => tirando?.desde === 'alcance' && tirando?.menuId === mid && tirando?.indice === indice;

    return (
        <div className='grid gap-x-16 items-start grid-cols-[minmax(210px,1fr)_minmax(230px,1.1fr)]'>
            <NodoAlerta alerta={alerta} puedeEditar={puedeEditar} apagada={apagada}
                sinCablear={!asignaciones.length}
                tirandoDeEsta={tirando?.desde === 'alerta' && tirando?.menuId === mid}
                onTirar={onTirarAlerta} onAlternar={onAlternar} onSacar={onSacar} />

            <div className='flex flex-col gap-3'>
                {asignaciones.map((asig, i) => (
                    <NodoAlcance key={i} alerta={mid} indice={i} asignacion={asig} catalogo={catalogo}
                        puedeEditar={puedeEditar} apagada={apagada} tirandoEsta={tirandoDe(i)}
                        onTirar={e => onTirar(e, i)}
                        onEditar={() => onEditarAlcance(i)}
                        onQuitar={() => onQuitarAlcance(i)} />
                ))}

                {armando && (
                    <NodoAlcance alerta={mid} indice='nueva' asignacion={{ scope: armando.scope }}
                        catalogo={catalogo} puedeEditar={puedeEditar} apagada={apagada} armando tirandoEsta={tirandoDe('nueva')}
                        onTirar={e => onTirar(e, 'nueva')}
                        onEditar={() => onEditarAlcance('nueva')} />
                )}

                {/* Asignar una regla NO está acá: está arriba de la columna de
                    reglas, que es donde se eligen. Ver `AsignarRegla`. */}
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
/**
 * Un segundo, y con la misma curva en todo lo que se mueve.
 *
 * Los cables y las cajas tienen que viajar juntos: si la caja se desliza y el
 * cable salta a su destino, durante ese segundo el cable apunta a donde la
 * caja TODAVÍA no está.
 *
 * El `d` de un path se puede animar por CSS en Chrome, Safari y Firefox
 * modernos. Donde no, el cable salta y la caja se desliza igual — que es
 * exactamente como se veía antes de esto.
 */
const TRANSICION = {
    transition: 'transform 1s ease-in-out, background-color .3s, border-color .3s',
};

/** El mismo segundo, para el `d` de los cables. */
const TRANSICION_CABLE = { transition: 'd 1s ease-in-out, stroke .3s' };

const COLOR_ALCANCE = '#29c50c';
const COLOR_NEUTRO = '#9aa6b5';

/** El gris de lo apagado: se ve el cable, se lee que no está en uso. */
const COLOR_APAGADO = '#c3cad4';

/** Lo apagado se muestra sin color, no se esconde. */
const APAGADO = 'grayscale opacity-70';

/** ¿Dos mapas de desplazamiento dicen lo mismo? */
const mismoMapa = (a, b) => {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (b.get(k) !== v) return false;
    return true;
};

const Marco = ({ children }) => (
    <section className='bg-white rounded-xl shadow-sm border overflow-hidden'>{children}</section>
);

const Rotulo = ({ children }) => (
    <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>{children}</span>
);


/** La capa de cables. Va debajo de las cajas y no intercepta el puntero. */
function Cables({ cables, tirando, lienzo, escala = 1 }) {
    const base = lienzo.current?.getBoundingClientRect();

    let goma = null;
    if (tirando && base) {
        const n = lienzo.current.querySelector(tirando.desde === 'alerta'
            ? `[data-nodo="alerta-${tirando.menuId}"]`
            : `[data-nodo="alcance-${tirando.menuId}-${tirando.indice}"]`);
        if (n) {
            // Igual que en el trazado: pantalla ÷ escala = layout. `tirando`
            // guarda el puntero en coordenadas de viewport, así que entra en
            // la misma cuenta.
            const r = n.getBoundingClientRect();
            const x1 = (r.right - base.left) / escala, y1 = (r.top - base.top + r.height / 2) / escala;
            const x2 = (tirando.x - base.left) / escala, y2 = (tirando.y - base.top) / escala;
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
                <path key={c.id} d={c.d} fill='none' stroke={c.color} strokeWidth='2.5' className='mapa-anima'
                    style={TRANSICION_CABLE}
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
                                        {yaEsta ? (a.bonifies === true ? 'ya está en el mapa' : 'en el mapa, apagada')
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


/**
 * El punto del que nace un cable, en el borde derecho de una caja.
 *
 * Es el mismo control en la alerta y en el alcance a propósito: quien aprendió
 * a tirar de uno ya sabe usar el otro, y que las dos cajas tengan puerto es lo
 * que hace que el mapa se lea como un tablero y no como dos mitades.
 */
function Puerto({ activo, titulo, onTirar }) {
    return (
        <span role='button' tabIndex={0} onPointerDown={onTirar} title={titulo}
            className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full
                        bg-white border-2 cursor-grab active:cursor-grabbing z-[3] grid place-items-center
                        transition-colors hover:border-[#29c50c]
                        focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]
                        ${activo ? 'border-[#29c50c]' : 'border-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-[#29c50c]' : 'bg-gray-400'}`} />
        </span>
    );
}


/**
 * El interruptor de la alerta. Solo lo ven los administradores; para el resto
 * el estado se lee, no se toca.
 *
 * Son tres estados y la llave tiene dos posiciones, así que la posición dice si
 * PAGA —lo único que cambia el dinero— y el rótulo distingue el apagado
 * decidido del nunca decidido.
 */
function Interruptor({ valor, editable, onAlternar }) {
    const encendido = valor === true;
    const rotulo = encendido ? 'Bonifica' : valor === false ? 'Desactivado' : 'Sin decidir';

    if (!editable) {
        return (
            <span className={`text-[11px] font-bold ${encendido ? 'text-[#1f9a08]' : 'text-gray-500'}`}>
                {rotulo}
            </span>
        );
    }

    return (
        <button type='button' role='switch' aria-checked={encendido} onClick={onAlternar}
            title={encendido
                ? 'Apagar: deja de bonificar, pero conserva el cableado'
                : 'Encender: vuelve a bonificar con el cableado que ya tiene'}
            className='w-full flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 transition-colors
                       hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
            <span className={`relative w-9 h-5 shrink-0 rounded-full transition-colors
                              ${encendido ? 'bg-[#29c50c]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all
                                  ${encendido ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
            <span className={`text-[11.5px] font-bold ${encendido ? 'text-[#1f9a08]' : 'text-gray-600'}`}>
                {rotulo}
            </span>
        </button>
    );
}


/** La alerta que se está mapeando. Su puerto abre una asignación nueva. */
function NodoAlerta({ alerta, puedeEditar, apagada, sinCablear, tirandoDeEsta, onTirar, onAlternar, onSacar }) {
    const categoria = CATEGORIAS_OPERATIVAS[alerta?.category];

    return (
        <div data-nodo={`alerta-${alerta._id}`}
            className={`${CAJA} relative bg-white border-[1.5px] rounded-xl px-4 py-3.5 transition-colors
                        ${apagada ? 'border-gray-300' : 'border-[#29c50c]'}`}>

            {/* Solo la identidad se apaga; el interruptor queda a todo color o
                no se vería con qué volver a encenderla. */}
            <div className={apagada ? APAGADO : ''}>
                <div className='flex items-start gap-2'>
                    <span className='flex-1 text-[13.5px] font-bold text-gray-800 leading-tight'>{alerta?.es || alerta?.en}</span>
                    {puedeEditar && sinCablear && (
                        <button type='button' onClick={onSacar} title='Sacar del mapa: la deja sin decidir'
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
                </div>

            <div className='mt-auto pt-3'>
                <Interruptor valor={alerta?.bonifies} editable={puedeEditar} onAlternar={onAlternar} />
            </div>

            {puedeEditar && (
                <Puerto activo={tirandoDeEsta} onTirar={onTirar}
                    titulo='Arrastrá hasta una regla para asignarla, o soltá al aire para elegir primero dónde aplica' />
            )}
        </div>
    );
}


/**
 * Una asignación: DÓNDE aplica. El punto del borde derecho es el cable a la
 * regla — se arrastra para reapuntarla, o afuera para borrarla.
 */
function NodoAlcance({ alerta, indice, asignacion, catalogo, puedeEditar, apagada, armando, tirandoEsta, onTirar, onEditar, onQuitar }) {
    const s = asignacion.scope || { mode: 'all' };
    const nombres = nombresDelAlcance(s, catalogo);

    const titulo = s.mode === 'all' ? 'Todos los establecimientos'
        : s.mode === 'only' ? 'Solo en' : 'Todos menos';

    return (
        <div data-nodo={`alcance-${alerta}-${indice}`}
            className={`${CAJA} relative bg-white rounded-xl px-4 py-3.5 transition-shadow border-[1.5px]
                        ${armando ? 'border-dashed' : ''}
                        ${apagada ? `border-gray-300 ${APAGADO}`
                            : tirandoEsta ? 'border-[#29c50c] shadow-md' : 'border-[#29c50c]/60'}`}>
            {/* El punto por donde LLEGA el cable de la alerta, y el botón para
                cortarlo. Arrastrar el puerto de la derecha borra la asignación
                cuando hay una sola; con dos o más, arrastrar es el gesto para
                reapuntar y no queda ninguno para quitar la del medio. Acá está,
                justo donde se ve el cable que se va a cortar. */}
            {puedeEditar && onQuitar && (
                <button type='button' onClick={onQuitar}
                    title='Quitar esta asignación — la alerta deja de bonificar acá'
                    className='absolute -left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full z-[3]
                               grid place-items-center border-2 bg-white text-transparent
                               border-gray-400 hover:border-red-500 hover:text-red-600
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500
                               transition-colors'>
                    <span className='text-[9px] font-black leading-none'>✕</span>
                </button>
            )}

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

            {/* Le falta el otro cable, y decirlo evita que la caja se
                lea como una asignación ya guardada. */}
            {armando && (
                <span className='mt-auto pt-3 text-[10.5px] font-bold text-[#1f9a08]'>
                    Falta la regla — llevá el punto hasta una
                </span>
            )}

            {puedeEditar && (
                <Puerto activo={tirandoEsta} onTirar={onTirar}
                    titulo={armando
                        ? 'Arrastrá hasta la regla que aplica acá; soltarlo afuera descarta esta caja'
                        : 'Arrastrá hasta otra regla, o afuera para quitar'} />
            )}
        </div>
    );
}


/** Una regla: destino de cables. Se ilumina si esta alerta la usa. */
function NodoRegla({ regla, categoria, conectada, puedeEditar, correr = 0, onEditar }) {
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');
    const inactiva = regla.active === false;

    return (
        <div data-nodo={`regla-${regla._id}`} data-tipo='regla' data-regla={String(regla._id)}
            style={{ transform: `translateY(${correr}px)`, ...TRANSICION }}
            className={`${CAJA} mapa-anima border-2 rounded-xl px-4 py-3.5
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


/**
 * ASIGNAR UNA REGLA A UNA ALERTA.
 *
 * Vive arriba de la columna de reglas porque es donde se eligen. Esa columna
 * la comparten todas las alertas —una regla usada por tres se dibuja una vez—,
 * así que lo primero que pregunta es a cuál.
 *
 * Las dos preguntas van en la misma pantalla y no en dos pasos: son cuatro
 * alertas y cinco reglas, y partir eso en un asistente hace más largo lo que
 * ya se resolvía de un vistazo.
 */
function AsignarRegla({ alertas, reglas, categoriaDe, onCerrar, onAsignar }) {

    const [alerta, setAlerta] = useState(alertas.length === 1 ? alertas[0] : null);

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[82vh] flex flex-col'
                onClick={e => e.stopPropagation()}>

                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>Asignar una regla</h3>
                    <p className='text-[11.5px] text-gray-500 mt-0.5'>
                        {alerta
                            ? <>La regla que elijas se le suma a «<b className='font-semibold text-gray-700'>{alerta.es || alerta.en}</b>».</>
                            : 'Primero, a qué alerta.'}
                    </p>
                </div>

                <div className='flex-1 min-h-0 overflow-y-auto p-3'>

                    {/* Paso uno. Con una sola alerta en el mapa viene resuelto,
                        pero se sigue mostrando: saber a qué se le está por
                        asignar importa más que ahorrar un renglón. */}
                    <Rotulo>Alerta</Rotulo>
                    <div className='flex flex-wrap gap-1.5 mt-1.5 mb-4'>
                        {alertas.map(a => (
                            <button key={a._id} type='button' onClick={() => setAlerta(a)}
                                aria-pressed={alerta?._id === a._id}
                                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                    ${alerta?._id === a._id
                                        ? 'bg-[#29c50c] text-white'
                                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                {a.es || a.en}
                            </button>
                        ))}
                    </div>

                    <Rotulo>Regla</Rotulo>
                    <ul className='mt-1.5'>
                        {reglas.map(r => {
                            const cat = categoriaDe.get(r.bonusCategory);
                            return (
                                <li key={r._id}>
                                    <button type='button' disabled={!alerta}
                                        onClick={() => onAsignar(alerta, String(r._id))}
                                        className='w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg
                                                   hover:bg-[#29c50c]/10 disabled:opacity-40
                                                   disabled:hover:bg-transparent disabled:cursor-not-allowed
                                                   transition-colors'>
                                        {cat && (
                                            <span className='shrink-0 w-1.5 h-1.5 rounded-full'
                                                style={{ background: cat.color || '#9aa6b5' }} />
                                        )}
                                        <span className='flex-1 text-[12.5px] text-gray-800 truncate'>{r.name}</span>
                                        <span className='text-[10.5px] text-gray-500 whitespace-nowrap'>{formulaLabel(r)}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className='px-5 py-3 border-t border-gray-100 flex justify-end'>
                    <button type='button' onClick={onCerrar}
                        className='h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'>
                        Cancelar
                    </button>
                </div>
            </div>
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
