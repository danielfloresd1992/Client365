'use client';
import { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import useConfirm from '@/hook/useConfirm.js';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories.js';
import { iconOf } from '@/libs/alerts/categoryIcons.js';
import {
    bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos,
    nombresDelAlcance, describirAlcance, claveDeAsignacion, usosPorAlerta,
} from './bonusRuleFormat';
import { ChipCategoria } from './mapaEstilos.jsx';
import EditorDeAlcance from './EditorDeAlcance.jsx';

/**
 * LA LISTA DE REGLAS. LA REGLA ES LA FILA.
 *
 *     categoría
 *       └── REGLA          «Perimetrales 3x1 — 3 alertas = 1 bono»
 *             └── ALCANCE  «Solo en Miami, Doral — 7 alertas»
 *                   └── la alerta, en un chip, con su ✕
 *
 * POR QUÉ LA REGLA Y NO LA ALERTA. El mapa entra por la alerta porque la misma
 * alerta puede pagar con reglas distintas según el local, y eso sólo se ve
 * poniendo la alerta primero. Pero ése es el caso raro: con una sola asignación
 * general el mapa es una línea recta. Lo que hay son 40 alertas y 5 reglas, y
 * entrar por el lado de las 5 deja 5 renglones en vez de 40. Y la regla es la
 * unidad de PLATA: es lo que el reglamento nombra con su código y lo que se
 * edita cuando cambia el pago — y editarla cambia lo que cobran TODAS sus
 * alertas, así que tener el «quiénes» al lado del botón «Editar» es
 * exactamente el dato que hoy hay que ir a buscar entrando a la regla.
 *
 * LO QUE ESTA VISTA NO CONTESTA BIEN: «esta alerta, ¿bajo qué reglas paga?».
 * Ésa es la pregunta del mapa, y por eso el mapa no se toca ni se degrada. El
 * buscador de acá tapa el caso puntual —busca por nombre de alerta y abre sola
 * la regla que la usa—, pero la lectura por alerta sigue siendo la del mapa.
 *
 *
 * CÓMO NO SE VUELVE OTRA MADEJA
 *
 * El mapa dibuja UN CABLE POR ASIGNACIÓN: 24 alertas con la misma regla son 24
 * curvas superpuestas de las que no se puede seguir ninguna. Acá no se dibuja
 * nunca un elemento por asignación. Se dibuja uno por RELACIÓN DISTINTA y la
 * multiplicidad va como NÚMERO:
 *
 *   · las 24 asignaciones que dicen lo mismo colapsan en UN renglón de alcance
 *     —con `claveDeAsignacion`, la misma clave que agrupa las cajas del medio
 *     del mapa, así que las dos vistas colapsan igual—;
 *   · el renglón de la regla arranca CERRADO y dice sólo «24 alertas · 3 alcances»;
 *   · los nombres de las 24 se piden a mano, por alcance, con «24 alertas ▾»;
 *   · y el buscador filtra por regla Y por alerta: escribir «puerta» abre sola
 *     la regla que la usa y deja visibles nada más los chips que coinciden.
 *
 * O sea que el peor caso —una regla usada por 24 alertas— ocupa una fila de 54
 * píxeles hasta que alguien pregunte, y cuando pregunta recibe 24 chips
 * ordenados en cuatro renglones, no 24 curvas cruzadas.
 *
 *
 * MUESTRA TODAS LAS ALERTAS, NO LAS DEL LIENZO. `enLienzo` es estado de
 * PANTALLA del mapa (BonusMap.jsx:141-144) y desde acá no se puede leer, pero
 * además no habría que: una alerta sacada del lienzo con asignaciones sigue
 * pagando —vuelve sola al recargar, BonusMap.jsx:306-309— y omitirla sería
 * esconder plata. De ahí que la cabecera diga sobre qué cuenta, «alertas con
 * regla», y el mapa se quede con su «en el mapa».
 *
 * CERO SERVIDOR NUEVO. Las diez escrituras del cableado pasan por el único
 * endpoint que ya hay: `PUT /bonus/menu/id=<id>` con la lista COMPLETA de
 * asignaciones de esa alerta (bonus.fecth.js:173-176). Acá no hace falta ni un
 * endpoint ni un campo: hace falta saber armar el array.
 */

/** Las reglas sin categoría, o con una que el catálogo no conoce. */
const SIN_CATEGORIA = '~sin-categoria';

/** El marco, LITERALMENTE el mismo del mapa: las dos vistas son una pantalla. */
const Marco = ({ children }) => (
    <section className='bg-white rounded-xl shadow-sm border overflow-hidden'>{children}</section>
);

const enMinuscula = (s) => String(s || '').toLowerCase();


export default function ListaDeReglas({
    reglas, alertas, alcance, categorias, sinCatalogo, cargando, puedeEditar,
    onEscribirAsignaciones, onEditarRegla, onNuevaRegla, conmutador,
}) {

    const [busqueda, setBusqueda] = useState('');
    const [abiertas, setAbiertas] = useState(() => new Set());       // reglas desplegadas
    const [desplegados, setDesplegados] = useState(() => new Set()); // alcances con sus chips a la vista
    const [asignando, setAsignando] = useState(null);                // { regla } | { alerta }
    const [editandoAlcance, setEditandoAlcance] = useState(null);    // { alerta, provisoria } | { nodo }
    const confirmar = useConfirm();

    const porId = useMemo(() => new Map((reglas || []).map(r => [String(r._id), r])), [reglas]);
    const categoriaDe = useMemo(() => new Map((categorias || []).map(c => [c.value, c])), [categorias]);

    /**
     * POR REGLA, CON SUS ALCANCES ADENTRO — la inversión de `bonusRules`.
     *
     * El dato está guardado del lado de la alerta y esta lista se lee del lado
     * de la regla. Dos niveles porque los dos importan: el ALCANCE agrupa el
     * renglón, la ALERTA es lo que se desconecta.
     *
     * El nodo sale con la MISMA forma que los del mapa
     * (`{ clave, rule, scope, usos:[{alerta,indice}] }`, BonusMap.jsx:339-341)
     * y eso no es casualidad: es lo que deja que las escrituras de acá sean
     * calcadas de las de allá en vez de inventar un segundo modelo.
     */
    const porRegla = useMemo(() => {
        const mapa = new Map();                    // Map<ruleId, Map<clave, nodo>>

        for (const alerta of (alertas || [])) {
            (alerta.bonusRules || []).forEach((asig, indice) => {
                if (!asig?.rule) return;

                const id = String(asig.rule);
                if (!mapa.has(id)) mapa.set(id, new Map());
                const nodos = mapa.get(id);

                const clave = claveDeAsignacion(asig);
                if (!nodos.has(clave)) nodos.set(clave, { clave, rule: id, scope: asig.scope, usos: [] });
                nodos.get(clave).usos.push({ alerta, indice });
            });
        }

        return mapa;
    }, [alertas]);

    /**
     * LOS GRUPOS, EN EL MISMO ORDEN QUE LAS BALDOSAS DEL MOSAICO.
     *
     * Es la siembra de `secciones` (BonusMap.jsx:374-403) sin su tercera
     * pasada: allá los alcances vuelven a caer en la baldosa de la categoría de
     * su regla porque cada uno es una CAJA que tiene que aterrizar enfrente;
     * acá el alcance va ANIDADO en el renglón de su regla, así que la categoría
     * de la regla ya lo ubica.
     *
     * Se copia lo demás al pie de la letra: el catálogo siembra las ACTIVAS
     * para que una categoría recién creada tenga su grupo y su botón, las
     * inactivas no abren grupo pero aparecen si tienen reglas, las desconocidas
     * van al final con `Number.MAX_SAFE_INTEGER`, y el orden es el del catálogo.
     * Si el orden no fuera el mismo, pasar de una vista a la otra se sentiría
     * como cambiar de sistema.
     */
    const grupos = useMemo(() => {
        const orden = new Map((categorias || []).map((c, i) => [c.value, i]));
        const mapa = new Map();

        const grupo = (valor) => {
            const id = valor || SIN_CATEGORIA;
            if (!mapa.has(id)) {
                mapa.set(id, {
                    id,
                    categoria: categoriaDe.get(valor) || null,
                    orden: orden.has(valor) ? orden.get(valor) : Number.MAX_SAFE_INTEGER,
                    reglas: [],
                });
            }
            return mapa.get(id);
        };

        // Sin `value` no se siembra: `grupo` manda todo lo falsy al centinela,
        // así que una entrada rota se apropiaría de «Sin categoría».
        (categorias || []).forEach(c => { if (c.value && c.active !== false) grupo(c.value); });
        (reglas || []).forEach(r => grupo(r.bonusCategory).reglas.push(r));

        return [...mapa.values()]
            .sort((a, b) => a.orden - b.orden || String(a.id).localeCompare(String(b.id), 'es'));
    }, [reglas, categorias, categoriaDe]);

    const texto = busqueda.trim().toLowerCase();

    /**
     * QUÉ ENTRA EN LA BÚSQUEDA — y el «por alerta» es un dato, no un detalle.
     *
     * Una regla que aparece porque coincidió una de SUS ALERTAS se abre sola y
     * muestra nada más los chips que coincidieron. Es el atajo que reemplaza al
     * arrastre —«¿dónde está Puerta abierta?»— sin volver la lista un árbol de
     * cuarenta hojas siempre desplegado.
     *
     * Se calcula UNA vez para todos: si se llamara adentro del `map` de cada
     * categoría habría que recorrer las asignaciones dos veces, una para saber
     * si la sección se muestra y otra para pintarla.
     */
    const vista = useMemo(() => {
        const tiene = (s) => enMinuscula(s).includes(texto);

        const armar = (regla) => {
            const nodos = [...(porRegla.get(String(regla._id))?.values() || [])];
            if (!texto) return { regla, nodos, porAlerta: false, visible: true };

            const conHits = nodos.map(n => ({
                ...n,
                hits: n.usos.filter(u => tiene(u.alerta.es) || tiene(u.alerta.en)),
            }));
            const porAlerta = conHits.some(n => n.hits.length > 0);
            const enRegla = tiene(regla.name) || tiene(regla.regulationCode) || tiene(regla.description);

            return { regla, nodos: conHits, porAlerta, visible: enRegla || porAlerta };
        };

        const secciones = grupos.map(g => ({ grupo: g, filas: g.reglas.map(armar).filter(f => f.visible) }));
        return { secciones, cuantas: secciones.reduce((n, s) => n + s.filas.length, 0) };
    }, [grupos, porRegla, texto]);

    /**
     * ASIGNACIONES QUE APUNTAN A UNA REGLA QUE NO ESTÁ EN LA LISTA.
     *
     * En el mapa caen igual en pantalla: `grupo(porId.get(...)?.bonusCategory)`
     * devuelve `undefined` y el centinela las recibe, así que la caja se dibuja
     * aunque no haya regla enfrente. Acá el renglón ES la regla, así que sin
     * este balde desaparecerían sin dejar rastro. Y el caso normal no es una
     * regla borrada —el servidor responde 409 si alguien la usa
     * (bonus.fecth.js:148-151)— sino el GET de reglas caído: el catch de
     * useBonusRules.js:43 deja la lista VACÍA, no null, y `cargando` se apaga.
     */
    const huerfanas = useMemo(
        () => [...porRegla.entries()].filter(([id]) => !porId.has(id)),
        [porRegla, porId],
    );

    /**
     * EL BALDE QUE EL MAPA MUESTRA COMO CAJA SUELTA EN EL BANCO.
     *
     * Encendida y sin asignaciones no paga nada: la resolución corta en
     * «sin-regla» (BonusMap.jsx:876-879). En la lista es una fila que dice qué
     * falta y ofrece la regla, no una zona donde soltar un cable.
     */
    const sinRegla = useMemo(
        () => (alertas || []).filter(a => a.bonifies === true && !(a.bonusRules || []).length),
        [alertas],
    );

    const conRegla = useMemo(() => (alertas || []).filter(a => (a.bonusRules || []).length).length, [alertas]);
    const enUso = useMemo(() => (reglas || []).filter(r => porRegla.has(String(r._id))).length, [reglas, porRegla]);
    const vacias = useMemo(() => grupos.filter(g => !g.reglas.length).length, [grupos]);

    const alternar = (conjunto, poner) => (clave) => poner(previas => {
        const siguientes = new Set(previas);
        if (siguientes.has(clave)) siguientes.delete(clave); else siguientes.add(clave);
        return siguientes;
    });
    const alternarRegla = alternar(abiertas, setAbiertas);
    const alternarNodo = alternar(desplegados, setDesplegados);


    // ── La compuerta va DESPUÉS de todos los hooks ────────────────────
    // `react-hooks/rules-of-hooks` es error y `next build` no ignora ESLint: un
    // hook detrás de este return rompe el deploy de Netlify.
    //
    // Y el conmutador se pinta TAMBIÉN acá: sin él, entrar con los datos
    // todavía en vuelo deja la pantalla sin forma de volver al mapa.
    if (cargando) {
        return (
            <Marco>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <h2 className='text-[15px] font-bold text-gray-800 leading-tight'>Reglas de bonificación</h2>
                    {conmutador}
                </div>
                <p className='px-5 py-10 text-[13px] text-gray-500'>Cargando las reglas…</p>
            </Marco>
        );
    }


    // ── Escritura ─────────────────────────────────────────────────────
    /**
     * El MISMO primitivo del mapa, con el MISMO valor por omisión de
     * `bonifies` (BonusMap.jsx:778-782).
     *
     * El endpoint recibe siempre los tres campos, y el destructurado del hook
     * deja `bonifies` en `null` si no va (useBonusRules.js:137): llamarlo sin
     * pasarlo haría que una alerta encendida pasara a «Sin decidir» y dejara de
     * pagar, en silencio y de forma optimista. Cablear no enciende ni apaga.
     */
    const escribir = (alerta, bonusRules, bonifies = alerta.bonifies ?? null) =>
        onEscribirAsignaciones(alerta._id, { bonifies, bonusRules });

    /** Desconectar UNA alerta de un alcance. Acá es el gesto normal, no la excepción. */
    const desconectar = (nodo, alerta) => {
        const indices = nodo.usos
            .filter(u => String(u.alerta._id) === String(alerta._id))
            .map(u => u.indice);

        escribir(alerta, (alerta.bonusRules || []).filter((_, j) => !indices.includes(j)));
    };

    /**
     * Quitar el alcance entero: afecta a TODAS las alertas que lo comparten,
     * igual que la cruz de la caja del mapa.
     *
     * UNA sola llamada por alerta, con todos sus índices juntos: `bonusRules`
     * viaja entero, `anterior` se lee del `alertas` del closure
     * (useBonusRules.js:140) y dentro del mismo tick todavía es el viejo, así
     * que dos escrituras seguidas sobre la misma alerta se pisan.
     */
    const quitarNodo = (nodo) => {
        for (const { alerta, indices } of usosPorAlerta(nodo.usos)) {
            escribir(alerta, (alerta.bonusRules || []).filter((_, j) => !indices.includes(j)));
        }
    };

    const cambiarAlcance = (nodo, scope) => {
        for (const { alerta, indices } of usosPorAlerta(nodo.usos)) {
            escribir(alerta, (alerta.bonusRules || [])
                .map((a, j) => (indices.includes(j) ? { ...a, scope } : a)));
        }
    };

    /**
     * Preguntar antes de borrar una referencia guardada. El mensaje dice las
     * dos cosas que hay que decir: a cuántas alertas afecta y que la REGLA no
     * se borra.
     */
    const quitarPreguntando = (nodo) => {
        const cuantas = usosPorAlerta(nodo.usos).length;
        const regla = porId.get(nodo.rule);

        confirmar({
            titulo: cuantas === 1 ? '¿Quitar esta asignación?' : `¿Quitar esta asignación de ${cuantas} alertas?`,
            descripcion: (cuantas === 1
                ? `«${nodo.usos[0].alerta.es || nodo.usos[0].alerta.en}» va a dejar de bonificar en `
                : `Las ${cuantas} alertas que comparten este alcance van a dejar de bonificar en `)
                + `${describirAlcance(nodo.scope, alcance)}. `
                + `La regla${regla ? ` «${regla.name}»` : ''} no se borra: sigue disponible para otras alertas.`,
            alAceptar: () => quitarNodo(nodo),
        });
    };

    /**
     * Suma una asignación. La primera es general —así una alerta simple queda
     * lista de un gesto—; con alcances ya cargados, se pregunta dónde.
     *
     * La pregunta es si la alerta YA TIENE alcances, no si tiene uno general:
     * es el criterio exacto de `sumar` (BonusMap.jsx:905-911), y está escrito
     * ahí por un pozo concreto. Con una alerta que tenga un «solo en» y un
     * «todos menos» —ninguno general— el criterio ingenuo crea en silencio un
     * TERCER alcance «todos los establecimientos» que solapa a los otros dos.
     */
    const sumar = (alerta, ruleId) => {
        const actuales = alerta.bonusRules || [];

        if (!actuales.length) {
            return escribir(alerta, [...actuales, {
                rule: ruleId,
                scope: { mode: 'all', franchises: [], locals: [] },
            }]);
        }

        setEditandoAlcance({
            alerta,
            provisoria: { rule: ruleId, scope: { mode: 'only', franchises: [], locals: [] } },
        });
    };

    /**
     * ¿La alerta ya tiene otra asignación general?
     *
     * Dos generales serían ambiguas y el servidor las rechaza; el comentario de
     * `escribirAsignaciones` avisa que «el 400 más probable es un alcance a
     * medias» y que se evita antes de llegar (useBonusRules.js:112-115).
     */
    const hayOtraGeneral = (edicion) => {
        if (!edicion) return false;
        if (edicion.provisoria) return (edicion.alerta.bonusRules || []).some(a => a.scope?.mode === 'all');

        const { alerta, indices } = usosPorAlerta(edicion.nodo.usos)[0];
        return (alerta.bonusRules || []).some((a, j) => a.scope?.mode === 'all' && !indices.includes(j));
    };

    // Las inactivas se ENUMERAN pero no se ofrecen para asignar, que es por lo
    // que el banco del mapa las excluye (BonusMap.jsx:436). `!== false` y no
    // `=== true`: una regla vieja sin el campo cuenta como activa.
    const activas = (reglas || []).filter(r => r.active !== false);

    return (
        <>
            <Marco>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <div className='min-w-0'>
                        <h2 className='text-[15px] font-bold text-gray-800 leading-tight'>Reglas de bonificación</h2>

                        {/* DICE SOBRE QUÉ CUENTA. El mapa dice «N alertas en el
                            mapa» y ése es `puestas.length`, el recorte del
                            lienzo. Acá se cuenta sobre TODAS, así que el número
                            va a ser otro: con el mismo sustantivo, alternar se
                            leería como que aparecieron alertas de la nada. */}
                        <p className='text-[11.5px] text-gray-500 tabular-nums'>
                            {(reglas || []).length} regla{(reglas || []).length === 1 ? '' : 's'}
                            {' · '}{enUso} en uso
                            {' · '}{conRegla} alerta{conRegla === 1 ? '' : 's'} con regla
                            {' · '}{grupos.length} categoría{grupos.length === 1 ? '' : 's'}
                            {vacias > 0 && ` · ${vacias} sin reglas todavía`}
                        </p>
                    </div>

                    {/* El conmutador va acá, ANTES del `ml-auto`, y en el mismo
                        lugar del encabezado del mapa: pegado al título no se
                        mueve nunca y al alternar queda debajo del cursor. Dentro
                        del racimo de la derecha lo correría de lugar cualquier
                        botón que aparezca o desaparezca. */}
                    {conmutador}

                    <div className='ml-auto flex items-center gap-2'>
                        {puedeEditar && (
                            <button type='button' onClick={() => onNuevaRegla()}
                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white
                                           bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                + Regla
                            </button>
                        )}
                    </div>
                </div>

                {/* UN SOLO BUSCADOR, y filtra las dos puntas. En memoria y sin
                    debounce: las reglas y las alertas ya están todas acá, bajan
                    por props. Y sin tope de 60 como el desplegable del mapa —una
                    lista que esconde filas deja de servir para auditar. */}
                <div className='px-5 py-3 border-b border-gray-100'>
                    <div className='relative max-w-[420px]'>
                        <FiSearch size={15} aria-hidden='true'
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                        <input type='search' value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            placeholder='Buscar una regla, un código o una alerta…'
                            className='w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800
                                       placeholder:text-gray-400
                                       focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
                    </div>
                    {texto && (
                        <p className='mt-1.5 text-[11px] text-gray-500 max-w-[72ch]'>
                            Busca reglas y alertas. Las reglas que aparecen por una de sus alertas se abren solas.
                        </p>
                    )}
                </div>

                {/* El alto acotado con las mismas medidas que el lienzo del mapa
                    (`min-h-[360px] max-h-[72vh]`, BonusMap.jsx:1128): así la
                    tarjeta no cambia de tamaño al alternar y el conmutador no se
                    va de lugar bajo el cursor. */}
                <div className='min-h-[360px] max-h-[72vh] overflow-y-auto bg-gray-50 p-4 space-y-3'>

                    {sinCatalogo && (
                        <p className='text-[11px] text-[#8a5a2b] bg-[#fdf6e7] rounded-lg px-3 py-2 max-w-[72ch]'>
                            No se pudo leer el catálogo de categorías: las reglas se listan igual, pero van a
                            aparecer todas bajo «Sin categoría» y sin sus colores hasta que responda.
                        </p>
                    )}

                    {!(reglas || []).length && (
                        <p className='py-12 text-center text-sm text-gray-400'>
                            Todavía no hay reglas. Creá la primera con «+ Regla».
                        </p>
                    )}

                    {vista.secciones.map(({ grupo: g, filas }) => {
                        // Con búsqueda puesta, una categoría sin coincidencias no
                        // se muestra vacía: mostraría su invitación a crear una
                        // regla como si el filtro no existiera.
                        if (texto && !filas.length) return null;

                        return (
                            <section key={g.id} className='bg-white rounded-xl border border-gray-200'>

                                {/* PEGAJOSO, y por eso esta sección NO lleva
                                    `overflow-hidden`: `overflow:hidden` crea un
                                    contenedor de scroll propio y ahí el sticky se
                                    clava en el borde de la sección, o sea deja de
                                    pegarse. La línea de abajo va como SOMBRA
                                    INTERIOR y no como borde, que es lo que la hace
                                    viajar con el encabezado (el mismo truco de
                                    ResumenGeneral.jsx:270-278). Y el `bg-white` es
                                    obligatorio: sin él las filas se ven pasar por
                                    detrás del texto. */}
                                <h3 className='sticky top-0 z-[1] bg-white rounded-t-xl px-4 py-2.5
                                               flex items-center gap-2.5 shadow-[inset_0_-1px_0_#e5e7eb]'>
                                    {g.categoria
                                        ? <ChipCategoria categoria={g.categoria} />
                                        : (
                                            <span className='rounded-md bg-gray-100 px-2 py-1 text-[10.5px] font-bold text-gray-600'>
                                                Sin categoría
                                            </span>
                                        )}
                                    <span className='ml-auto shrink-0 text-[10.5px] text-gray-500 tabular-nums'>
                                        {g.reglas.length} regla{g.reglas.length === 1 ? '' : 's'}
                                    </span>
                                </h3>

                                {filas.length ? (
                                    <ul className='divide-y divide-gray-100'>
                                        {filas.map(fila => (
                                            <FilaDeRegla key={fila.regla._id}
                                                fila={fila}
                                                catalogo={alcance}
                                                puedeEditar={puedeEditar}
                                                abierta={abiertas.has(String(fila.regla._id)) || fila.porAlerta}
                                                desplegados={desplegados}
                                                onAbrir={() => alternarRegla(String(fila.regla._id))}
                                                onAlternarNodo={alternarNodo}
                                                onEditar={() => onEditarRegla(fila.regla)}
                                                onAsignar={() => setAsignando({ regla: fila.regla })}
                                                onCambiarAlcance={nodo => setEditandoAlcance({ nodo })}
                                                onQuitarNodo={quitarPreguntando}
                                                onDesconectar={desconectar} />
                                        ))}
                                    </ul>
                                ) : (
                                    /* Una categoría sin reglas no es un hueco: es
                                       el lugar donde se le crea la primera. Mismo
                                       texto y mismo botón que la baldosa vacía del
                                       mosaico (BonusMap.jsx:1201-1218), con la
                                       categoría ya puesta: se tocó el botón que
                                       está ADENTRO de este grupo, y volver a
                                       preguntarla es preguntar lo que se dijo. */
                                    <div className='px-4 py-6 grid place-items-center gap-3 text-center'>
                                        <p className='text-[12px] text-gray-500'>Todavía no hay reglas en esta categoría.</p>
                                        {puedeEditar && g.categoria && (
                                            <button type='button' onClick={() => onNuevaRegla(g.categoria.value)}
                                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white
                                                           bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                                + Regla en {g.categoria.es}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        );
                    })}

                    {texto && !vista.cuantas && (
                        <p className='py-12 text-center text-sm text-gray-400'>Sin coincidencias para «{busqueda.trim()}».</p>
                    )}

                    {!texto && sinRegla.length > 0 && (
                        <section className='bg-white rounded-xl border border-[#d9a441]/60'>
                            <h3 className='sticky top-0 z-[1] bg-white rounded-t-xl px-4 py-2.5
                                           flex items-center gap-2.5 shadow-[inset_0_-1px_0_#e5e7eb]'>
                                <span className='rounded-md bg-[#fdf6e7] px-2 py-1 text-[10.5px] font-bold text-[#8a5a2b]'>
                                    Bonifican y no pagan nada
                                </span>
                                <span className='ml-auto shrink-0 text-[10.5px] text-gray-500 tabular-nums'>
                                    {sinRegla.length}
                                </span>
                            </h3>
                            <p className='px-4 pt-2 text-[11px] text-gray-500 max-w-[72ch]'>
                                El interruptor dice que bonifican, pero no tienen ninguna regla asignada:
                                la resolución corta en «sin regla» y no suman nada.
                            </p>
                            <ul className='mt-1 divide-y divide-gray-100'>
                                {sinRegla.map(a => (
                                    <li key={a._id} className='px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors'>
                                        {!a.bonusReviewed && (
                                            <span className='shrink-0 w-1.5 h-1.5 rounded-full bg-[#d9a441]' title='Sin revisar' />
                                        )}
                                        <span className='min-w-0 flex-1 text-[13px] font-semibold text-gray-800 truncate'>
                                            {a.es || a.en}
                                        </span>
                                        <ChipOperativo alerta={a} />
                                        {puedeEditar && activas.length > 0 && (
                                            <button type='button' onClick={() => setAsignando({ alerta: a })}
                                                className='shrink-0 h-8 px-3 rounded-lg text-[11.5px] font-bold text-white
                                                           bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                                Asignar regla
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {!texto && huerfanas.length > 0 && (
                        <section className='bg-white rounded-xl border border-gray-200 p-4'>
                            <h3 className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
                                Asignaciones sin regla
                            </h3>
                            <p className='mt-1.5 text-[11px] text-[#8a5a2b] bg-[#fdf6e7] rounded-lg px-3 py-2 max-w-[72ch]'>
                                Apuntan a una regla que no está en la lista. En el mapa caen bajo «Sin categoría»
                                y se ven igual; acá el renglón ES la regla, así que van aparte. Lo más probable no
                                es una regla borrada —el servidor no deja borrar una en uso— sino que la consulta
                                de reglas falló: recargá la pantalla antes de tocar nada.
                            </p>
                            <ul className='mt-2 divide-y divide-gray-100'>
                                {huerfanas.map(([id, nodos]) => {
                                    const cuantas = new Set([...nodos.values()]
                                        .flatMap(n => n.usos.map(u => String(u.alerta._id)))).size;
                                    return (
                                        <li key={id} className='px-1 py-2.5 flex items-center gap-2'>
                                            <span className='min-w-0 flex-1 font-mono text-[11.5px] text-gray-600 truncate'>{id}</span>
                                            <span className='shrink-0 text-[10.5px] text-gray-500 tabular-nums'>
                                                {cuantas} alerta{cuantas === 1 ? '' : 's'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </div>
            </Marco>

            {asignando && (
                <Asignar
                    regla={asignando.regla || null}
                    alerta={asignando.alerta || null}
                    reglas={activas}
                    alertas={alertas || []}
                    categoriaDe={categoriaDe}
                    onCerrar={() => setAsignando(null)}
                    onElegir={(alerta, ruleId) => { setAsignando(null); sumar(alerta, ruleId); }} />
            )}

            {editandoAlcance && (
                <EditorDeAlcance
                    catalogo={alcance}
                    inicial={editandoAlcance.nodo?.scope ?? editandoAlcance.provisoria?.scope}
                    yaHayGeneral={hayOtraGeneral(editandoAlcance)}
                    onCerrar={() => setEditandoAlcance(null)}
                    onGuardar={(scope) => {
                        const edicion = editandoAlcance;
                        setEditandoAlcance(null);
                        if (edicion.provisoria) {
                            return escribir(edicion.alerta,
                                [...(edicion.alerta.bonusRules || []), { ...edicion.provisoria, scope }]);
                        }
                        cambiarAlcance(edicion.nodo, scope);
                    }} />
            )}
        </>
    );
}


// ══════════════════════════════════════════════════════════════════════

/**
 * UNA REGLA POR FILA. Cerrada dice lo que paga y a cuántas; abierta, dónde.
 *
 * LA FILA NO ES UN BOTÓN —tiene tres controles adentro—, así que su hover es el
 * gris de «esto se lee» (UsersDirectory.jsx:102). El que despliega es el
 * nombre, que sí es un `<button>` con `aria-expanded`. El verde al 10% queda
 * para lo que se ELIGE, que en esta pantalla son las filas de los modales:
 * reusar ese color acá haría que las dos cosas se leyeran igual.
 *
 * Y nada de `<table>`: styles.css estila el elemento desnudo con
 * `th, td { width: calc(800px / 3); text-align: center }` (styles.css:6921), y
 * eso se filtra en todo lo que ninguna utilidad de Tailwind declare. El `grid`
 * en el `li` da columnas alineadas entre filas sin heredar una línea de eso, y
 * el `minmax(0,…)` es lo que permite que el `truncate` del nombre funcione.
 */
function FilaDeRegla({
    fila, catalogo, puedeEditar, abierta, desplegados,
    onAbrir, onAlternarNodo, onEditar, onAsignar, onCambiarAlcance, onQuitarNodo, onDesconectar,
}) {
    const { regla, nodos, porAlerta } = fila;
    const inactiva = regla.active === false;
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');

    // Deduplicada por alerta, igual que el `inUse` que recalcula el hook
    // (useBonusRules.js:150): la que tiene esta regla en dos alcances es UNA
    // alerta que paga en dos lados, no dos alertas. Por eso `inUse` no se
    // pinta: contaría lo mismo y se contradiría un instante cuando el reconteo
    // optimista y el servidor discrepen.
    const cuantasAlertas = new Set(nodos.flatMap(n => n.usos.map(u => String(u.alerta._id)))).size;

    return (
        <li className='hover:bg-gray-50 transition-colors'>
            <div className='px-4 py-3 grid gap-3 items-center
                            grid-cols-1 sm:grid-cols-[minmax(0,1.5fr)_minmax(150px,auto)_minmax(110px,auto)_auto]'>

                <button type='button' onClick={onAbrir} aria-expanded={abierta}
                    className='min-w-0 text-left flex items-start gap-2 rounded-lg -m-1 p-1
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'
                        strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
                        className={`shrink-0 mt-1 w-3 h-3 text-gray-400 transition-transform ${abierta ? '' : '-rotate-90'}`}>
                        <path d='m6 9 6 6 6-6' />
                    </svg>

                    {/* Inactiva se atenúa la IDENTIDAD, no la fila: las
                        acciones quedan a todo color o no se vería con qué
                        volver a activarla. Es el criterio de NodoAlerta con su
                        interruptor (BonusMap.jsx:1826-1828). */}
                    <span className={`min-w-0 ${inactiva ? 'opacity-60' : ''}`}>
                        <span className='block text-[13px] font-black text-slate-900 leading-tight truncate'>
                            {regla.name}
                        </span>
                        {/* El código del reglamento y las excepciones NO se ven
                            en ninguna caja del mapa: el código es lo que permite
                            cotejar con el PDF (RuleForm.jsx:67-69) y las
                            excepciones hoy sólo se ven entrando a editar. */}
                        <span className='block mt-0.5 text-[11px] text-gray-500 truncate'>
                            {regla.regulationCode ? `${regla.regulationCode} · ` : ''}
                            {regla.description || 'Sin descripción'}
                            {(regla.overrides || []).length > 0
                                && ` · ${regla.overrides.length} excepción${regla.overrides.length === 1 ? '' : 'es'}`}
                        </span>
                    </span>
                </button>

                {/* La fórmula y el bono, con los formateadores que ya existen:
                    es lo que garantiza que «3x1» se lea igual en las dos vistas.
                    Y EL ORO ES EL COLOR DEL DINERO en todo el módulo; el verde
                    queda para totales y aprobaciones. */}
                <span className={`min-w-0 ${inactiva ? 'opacity-60' : ''}`}>
                    <span className='block text-[10px] font-bold uppercase tracking-wider text-gray-500'>
                        {formulaLabel(regla)}
                    </span>
                    <span className='block mt-0.5 text-[14px] font-black text-[#8a5a2b] tabular-nums'>
                        {mismoEnAmbosTurnos(regla)
                            ? <>{formatBonus(dia)} <span className='text-[10.5px] font-bold opacity-70'>por alerta</span></>
                            : <>{formatBonus(dia)} <span className='text-[10.5px] font-bold opacity-70'>día</span>
                                {' · '}{formatBonus(noche)} <span className='text-[10.5px] font-bold opacity-70'>noche</span></>}
                    </span>
                </span>

                {/* LOS DOS NÚMEROS, Y SON DISTINTOS. Una alerta con esta regla en
                    dos alcances es UNA alerta y DOS filas en la base. Decir uno
                    solo bajo una etiqueta hace que las cuentas no cierren contra
                    el mapa, donde la primera es un cable y la segunda una caja. */}
                <span className='text-[11.5px] tabular-nums'>
                    {cuantasAlertas > 0 ? (
                        <>
                            <span className='font-bold text-[#1f9a08]'>{cuantasAlertas}</span>
                            <span className='text-gray-500'> alerta{cuantasAlertas === 1 ? '' : 's'}</span>
                            <span className='text-gray-400'> · {nodos.length} alcance{nodos.length === 1 ? '' : 's'}</span>
                        </>
                    ) : (
                        <span className='text-gray-400'>Nadie la usa</span>
                    )}
                    {inactiva && (
                        <span className='ml-1.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-red-100 text-red-700'>
                            Inactiva
                        </span>
                    )}
                </span>

                {puedeEditar && (
                    <span className='flex items-center gap-1.5 sm:justify-end'>
                        {/* No se ofrece asignar una regla inactiva, por lo mismo
                            que el banco del mapa las excluye. */}
                        {!inactiva && (
                            <button type='button' onClick={onAsignar}
                                title='Sumarle una alerta a esta regla, sin arrastrar nada'
                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white
                                           bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                Asignar alerta
                            </button>
                        )}
                        <button type='button' onClick={onEditar}
                            className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700
                                       bg-gray-100 hover:bg-gray-200 transition-colors'>
                            Editar
                        </button>
                    </span>
                )}
            </div>

            {abierta && (
                <div className='px-4 pb-3 pl-9 space-y-1.5'>
                    {nodos.length ? nodos.map(nodo => (
                        <FilaDeAlcance key={nodo.clave} nodo={nodo} catalogo={catalogo} puedeEditar={puedeEditar}
                            desplegada={desplegados.has(nodo.clave) || Boolean(nodo.hits?.length)}
                            soloHits={porAlerta ? nodo.hits : null}
                            onAlternar={() => onAlternarNodo(nodo.clave)}
                            onCambiar={() => onCambiarAlcance(nodo)}
                            onQuitar={() => onQuitarNodo(nodo)}
                            onDesconectar={alerta => onDesconectar(nodo, alerta)} />
                    )) : (
                        <p className='text-[12px] text-gray-500'>
                            Ninguna alerta la usa todavía.
                            {puedeEditar && !inactiva && ' Tocá «Asignar alerta» para sumarle la primera.'}
                        </p>
                    )}
                </div>
            )}
        </li>
    );
}


/**
 * UN ALCANCE POR RENGLÓN — no una asignación.
 *
 * Las 24 asignaciones que dicen «todos los establecimientos» son UN renglón con
 * un 24 al lado. Es la misma unión que hace la caja del medio del mapa, con la
 * misma clave, pero sin cables: acá la multiplicidad es un número y los nombres
 * se piden. Eso es todo el truco por el que la lista no se vuelve otra madeja.
 *
 * En la BASE siguen siendo 24 filas, y por eso tocar este renglón las toca a
 * todas — igual que en el mapa. Para que una sola cambie se la desconecta con
 * su ✕ y se le arma la suya, que es lo que dice el mapa en BonusMap.jsx:786-789.
 */
function FilaDeAlcance({ nodo, catalogo, puedeEditar, desplegada, soloHits, onAlternar, onCambiar, onQuitar, onDesconectar }) {
    const s = nodo.scope || { mode: 'all' };
    const usos = usosPorAlerta(nodo.usos);

    // Gris sólo si TODAS las que lo usan están apagadas: mientras una pague, el
    // renglón está en uso. Mismo criterio que la caja (BonusMap.jsx:1896): tres
    // alertas de las que dos están apagadas NO es un renglón apagado.
    const apagado = usos.length > 0 && usos.every(u => u.alerta.bonifies !== true);

    // El modo CRUDO y no la frase de `describirAlcance`: esa función devuelve
    // «todos los establecimientos» tanto para `all` como para un `except` con
    // las dos listas vacías (bonusRuleFormat.js:131), y en una lista donde las
    // filas se comparan de un vistazo eso hace ver dos alcances distintos como
    // el mismo renglón. La frase queda para las confirmaciones.
    const titulo = s.mode === 'all' ? 'Todos los establecimientos'
        : s.mode === 'only' ? 'Solo en' : 'Todos menos';

    const nombres = nombresDelAlcance(s, catalogo);
    const cuantos = (s.franchises?.length || 0) + (s.locals?.length || 0);
    // Con el catálogo de establecimientos caído —el catch de useBonusRules.js:45
    // es un comentario vacío a propósito— `nombresDelAlcance` devuelve un «…»
    // por id, y seis puntos suspensivos en un renglón dicen menos que el número.
    const anonimos = cuantos > 0 && nombres.every(n => n === '…');

    const visibles = soloHits ? usosPorAlerta(soloHits) : usos;

    return (
        <div className={`rounded-lg border border-gray-200 px-3 py-2 ${apagado ? 'grayscale opacity-70' : ''}`}>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                <span className='shrink-0 text-[12px] font-bold text-gray-800'>{titulo}</span>

                {s.mode !== 'all' && (
                    <span className='min-w-0 flex-1 text-[11px] text-gray-600 truncate'>
                        {anonimos ? `${cuantos} establecimiento${cuantos === 1 ? '' : 's'}` : nombres.join(', ')}
                    </span>
                )}

                {/* EL CONTADOR ES EL BOTÓN. Los nombres de las 24 se piden, no se
                    imponen: cerrado son 34px, abierto son cuatro renglones de
                    chips. Es la diferencia entre un renglón y una madeja. */}
                <button type='button' onClick={onAlternar} aria-expanded={desplegada}
                    className='ml-auto shrink-0 h-7 px-2 rounded-md text-[11px] font-bold text-gray-600 tabular-nums
                               bg-gray-100 hover:bg-gray-200 transition-colors
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                    {usos.length} alerta{usos.length === 1 ? '' : 's'} {desplegada ? '▴' : '▾'}
                </button>

                {puedeEditar && (
                    <>
                        <button type='button' onClick={onCambiar}
                            title={usos.length > 1
                                ? `Cambiar dónde aplica — afecta a las ${usos.length} alertas que lo comparten`
                                : 'Cambiar dónde aplica'}
                            className='shrink-0 h-7 px-2 rounded-md text-[11px] font-bold text-[#1f9a08]
                                       hover:bg-[#29c50c]/10 transition-colors'>
                            Cambiar
                        </button>
                        <button type='button' onClick={onQuitar}
                            title={usos.length > 1
                                ? `Quitar esta asignación de las ${usos.length} alertas que la usan`
                                : 'Quitar esta asignación — la alerta deja de bonificar acá'}
                            className='shrink-0 h-7 w-7 grid place-items-center rounded-md text-[11px] font-black
                                       text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors'>
                            ✕
                        </button>
                    </>
                )}
            </div>

            {desplegada && (
                <div className='mt-2 pt-2 border-t border-gray-100'>
                    {soloHits && visibles.length < usos.length && (
                        <p className='mb-1 text-[10.5px] text-gray-500 tabular-nums'>
                            {visibles.length} de {usos.length} coinciden con la búsqueda.
                        </p>
                    )}
                    <ul className='flex flex-wrap gap-1'>
                        {visibles.map(({ alerta, indices }) => (
                            <li key={alerta._id}
                                className={`inline-flex items-center gap-1 max-w-[200px] rounded px-1.5 py-0.5
                                            text-[10.5px] font-semibold
                                            ${alerta.bonifies === true
                                                ? 'bg-[#29c50c]/10 text-[#1f9a08]'
                                                : 'bg-gray-100 text-gray-500'}`}>
                                {!alerta.bonusReviewed && (
                                    <span className='shrink-0 w-1.5 h-1.5 rounded-full bg-[#d9a441]' title='Sin revisar' />
                                )}
                                <span className='truncate'>{alerta.es || alerta.en}</span>

                                {/* Dato viejo: `sumarACaja` previene el duplicado
                                    (BonusMap.jsx:943), así que si aparece es de
                                    antes. La ✕ borra TODOS sus índices de una sola
                                    escritura; en dos, la segunda pisa a la primera. */}
                                {indices.length > 1 && (
                                    <span className='shrink-0 text-[9px] font-black opacity-70 tabular-nums'
                                        title='Esta alerta tiene la misma regla con el mismo alcance más de una vez'>
                                        ×{indices.length}
                                    </span>
                                )}

                                {puedeEditar && (
                                    <button type='button' onClick={() => onDesconectar(alerta)}
                                        title={`Desconectar «${alerta.es || alerta.en}» — las demás siguen igual`}
                                        className='shrink-0 text-[9px] font-black opacity-60
                                                   hover:opacity-100 hover:text-red-600 transition-colors'>
                                        ✕
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


/**
 * ASIGNAR, EN LOS DOS SENTIDOS Y SIN ARRASTRAR NADA.
 *
 * Una punta viene FIJA —la que se tocó— y la otra se elige de una lista con
 * buscador. Es el gesto que esta vista viene a instalar: con 40 alertas, atar
 * un cable es un arrastre largo y frágil; acá son dos clics.
 *
 * El buscador es el de «Traer una alerta al mapa» (BonusMap.jsx:1705-1708) y no
 * los chips de «Asignar una regla» (2083-2094): 40 chips apilados son la misma
 * madeja mudada a un modal. Y no se corta la lista en 60 como allá, porque
 * desde acá también se audita.
 *
 * Las filas son `<button>` a todo el ancho con `hover:bg-[#29c50c]/10`: el
 * verde al 10% ya significa «esto lo podés elegir» en los dos modales del mapa,
 * y reusarlo hace que el gesto se entienda sin explicarlo. El
 * `disabled:hover:bg-transparent` no es cosmético: sin él una fila
 * deshabilitada se ilumina de verde y parece clickeable.
 */
function Asignar({ regla, alerta, reglas, alertas, categoriaDe, onCerrar, onElegir }) {
    const [busqueda, setBusqueda] = useState('');
    const eligiendoAlerta = Boolean(regla);

    const visibles = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        const lista = eligiendoAlerta ? (alertas || []) : (reglas || []);
        const nombre = (x) => (eligiendoAlerta ? (x.es || x.en || '') : (x.name || ''));
        const alterno = (x) => (eligiendoAlerta ? (x.en || '') : (x.regulationCode || ''));

        return lista
            .filter(x => !t || `${nombre(x)} ${alterno(x)}`.toLowerCase().includes(t))
            .sort((a, b) => nombre(a).localeCompare(nombre(b), 'es'));
    }, [busqueda, eligiendoAlerta, alertas, reglas]);

    /** ¿Esta combinación ya existe? Repetirla dejaría dos filas idénticas. */
    const yaLaUsa = (a, r) => (a.bonusRules || []).some(x => String(x.rule) === String(r._id));

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[82vh] flex flex-col'
                onClick={e => e.stopPropagation()}>

                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>
                        {eligiendoAlerta ? 'Sumarle una alerta a esta regla' : 'Asignarle una regla a esta alerta'}
                    </h3>
                    <p className='text-[11.5px] text-gray-500 mt-0.5'>
                        {eligiendoAlerta
                            ? <>La alerta que elijas va a pagar bajo «<b className='font-semibold text-gray-700'>{regla.name}</b>».</>
                            : <>La regla que elijas se le suma a «<b className='font-semibold text-gray-700'>{alerta.es || alerta.en}</b>».</>}
                    </p>
                    <input type='search' value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder={eligiendoAlerta ? 'Buscar alerta…' : 'Buscar regla…'} autoFocus
                        className='h-9 w-full mt-3 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                                   placeholder:text-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]' />
                </div>

                <ul className='flex-1 min-h-0 overflow-y-auto p-2'>
                    {visibles.map(x => {
                        const laAlerta = eligiendoAlerta ? x : alerta;
                        const laRegla = eligiendoAlerta ? regla : x;
                        const repetida = yaLaUsa(laAlerta, laRegla);
                        const cat = categoriaDe.get(laRegla.bonusCategory);

                        return (
                            <li key={x._id}>
                                <button type='button' disabled={repetida}
                                    onClick={() => onElegir(laAlerta, String(laRegla._id))}
                                    className='w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg
                                               hover:bg-[#29c50c]/10 disabled:opacity-45 disabled:hover:bg-transparent
                                               disabled:cursor-not-allowed transition-colors'>
                                    {eligiendoAlerta
                                        ? !x.bonusReviewed && (
                                            <span className='shrink-0 w-1.5 h-1.5 rounded-full bg-[#d9a441]' title='Sin revisar' />
                                        )
                                        : cat && (
                                            <span className='shrink-0 w-1.5 h-1.5 rounded-full'
                                                style={{ background: cat.color || '#9aa6b5' }} />
                                        )}

                                    <span className='flex-1 text-[12.5px] text-gray-800 truncate'>
                                        {eligiendoAlerta ? (x.es || x.en) : x.name}
                                    </span>

                                    <span className='shrink-0 text-[10.5px] text-gray-500 whitespace-nowrap'>
                                        {repetida ? 'ya la usa' : eligiendoAlerta
                                            ? (x.bonifies === true ? '' : 'no bonifica todavía')
                                            : formulaLabel(x)}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {!visibles.length && (
                        <li className='px-3 py-6 text-[12.5px] text-gray-500'>Ninguna coincide.</li>
                    )}
                </ul>

                <div className='px-5 py-3 border-t border-gray-100 flex justify-end'>
                    <button type='button' onClick={onCerrar}
                        className='h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-600
                                   hover:bg-gray-100 transition-colors'>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}


/**
 * La categoría OPERATIVA de la alerta («Demoras», «Comidas»…).
 *
 * El mapa la sacó de sus cajas a propósito y el motivo está escrito en
 * BonusMap.jsx:1843-1850: adentro de una baldosa que ya declara una categoría
 * de BONIFICACIÓN, un segundo chip de otra clasificación se leía como si
 * fueran lo mismo. Acá se pinta SÓLO en el balde de las que no tienen regla,
 * que no está bajo ninguna categoría de bonificación y donde «es una alerta de
 * demoras» ayuda a elegir con qué regla cablearla.
 */
function ChipOperativo({ alerta }) {
    const cat = CATEGORIAS_OPERATIVAS[alerta?.category];
    if (!cat) return null;

    const Icono = iconOf(cat.icon);
    return (
        <span className='shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold'
            style={{ background: cat.bg, color: cat.color }}>
            <Icono size={11} aria-hidden='true' />
            {cat.es}
        </span>
    );
}
