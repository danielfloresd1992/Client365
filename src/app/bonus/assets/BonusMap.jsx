'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIAS_OPERATIVAS } from '@/libs/alerts/categories';
import useBonusCategories from '@/hook/useBonusCategories.js';
import useZoom from '@/hook/useZoom.js';
import usePaneo from '@/hook/usePaneo.js';
import useCajasArrastrables from '@/hook/useCajasArrastrables.js';
import useConfirm from '@/hook/useConfirm.js';
import ControlesDeZoom from '@/components/ZoomControls.jsx';
import { agruparParaSelector } from '@/libs/parser/estableshment';
import {
    bonusPerAlert, formatBonus, formulaLabel, mismoEnAmbosTurnos,
    nombresDelAlcance, describirAlcance,
} from './bonusRuleFormat';
import SeccionDelMapa from './SeccionDelMapa.jsx';
import { COLUMNAS, ANCHO_MAPA, sinAchicar, Rotulo, ChipCategoria } from './mapaEstilos.jsx';

/**
 * EL MAPA DE UNA ALERTA.
 *
 *     alerta  ──→  ¿dónde?  ──→  regla
 *                  (todos)  ──→  Perimetrales 3x1
 *                  (Miami)  ──→  Miami reforzada
 *
 * TRES COLUMNAS, Y LAS TRES SON COMPARTIDAS. Cada caja se dibuja UNA VEZ y le
 * llegan tantos cables como cosas la usen:
 *
 *   dos alertas con la misma regla y los mismos establecimientos comparten la
 *   caja del medio; tres alcances con la misma regla comparten la de la
 *   derecha.
 *
 * Dibujarlas repetidas obligaba a comparar dos listas largas de locales para
 * descubrir que decían lo mismo. Compartiendo la caja, que sean lo mismo se ve.
 *
 * EN LA BASE SIGUEN SIENDO VARIAS. `Menu.bonusRules` guarda el alcance
 * EMBEBIDO dentro de cada alerta, con `_id: false`: no hay nada a lo que dos
 * alertas puedan apuntar. La regla sí es una referencia, y por eso la columna
 * de la derecha ya se comportaba así. La unión de la columna del medio es de
 * la PANTALLA — y por eso cada acción sobre una caja se aplica a todas las
 * alertas que la usan, con un chip por alerta para sacar a una sola.
 *
 * «+ Asignar una regla» vive arriba de la columna de reglas y pregunta a qué
 * alerta: el botón no puede saberlo, la columna no es de nadie en particular.
 *
 *
 * LAS CAJAS SE PARAN FRENTE A SUS CABLES
 *
 * Las tres columnas se apilan desde arriba, así que sin acomodarlas la alerta
 * queda pegada a su primer alcance y la regla arriba de todo, con huecos debajo
 * y los cables cruzando en diagonal. Cada caja se corre —con `transform`, que
 * no toca el layout— hasta quedar enfrente del promedio de lo que la conecta:
 *
 *     la ALERTA  al centro de SUS alcances (está sola en su fila)
 *     la REGLA   al centro de los alcances que la usan, esquivando a las otras
 *                reglas de la columna, que sí comparten espacio
 *
 * El viaje dura un segundo y lo hacen juntas la caja y sus cables; ver
 * `trazar`, que por eso calcula el destino en vez de medirlo.
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
 *   puerto de la ALERTA   ¿dónde bonifica? En una regla la asigna de un gesto;
 *                         sobre una caja del medio que ya existe, esta alerta
 *                         pasa a usarla TAMBIÉN; al aire pregunta dónde aplica
 *                         y deja la caja armada esperando su regla.
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
 *
 *
 * EL MAPA VA PARTIDO EN SECCIONES, UNA POR CATEGORÍA DE REGLA
 *
 * Tres columnas se leen bien con cinco alertas y son ilegibles con cien. Cada
 * sección es un mapa chico y completo —estas alertas, con estos alcances,
 * pagan bajo estas reglas— y se pliega para sacarla del medio. La última es el
 * BANCO DE TRABAJO: lo que todavía no está cableado, con todas las reglas
 * enfrente para poder cablearlo. Se vacía sola y desaparece.
 *
 * Una alerta que bonifica bajo reglas de dos categorías se dibuja en las dos
 * secciones, y cada copia es una caja distinta: se mide, se acomoda y se
 * arrastra por separado. De ahí que la identidad de una caja sea `llave`
 * —sección + tipo + id— y no el `_id` del dato.
 *
 *
 * EL LIENZO SE RECORRE ARRASTRANDO EL FONDO, y las cajas se pueden poner a
 * mano. Son dos gestos sobre el mismo botón del mouse, y los separa dónde
 * empieza: sobre el fondo, se mueve la vista; sobre una caja, se mueve la
 * caja; sobre su puerto, sale un cable.
 *
 * PONER UNA CAJA A MANO LA SACA DE LA COLOCACIÓN AUTOMÁTICA — es la única
 * forma de que las dos reglas convivan. Si la cascada siguiera mandando, el
 * próximo cambio de datos devolvería la caja al lugar calculado y el arrastre
 * se sentiría roto. Queda marcada con un punto y vuelve al automático con
 * doble clic, o todas juntas con «Reacomodar».
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
    // El cable que se está arrastrando. `nodo` es la clave completa de la caja
    // de la que sale: con el mapa partido en secciones, el `_id` del dato ya no
    // alcanza para encontrarla en el DOM.
    const [tirando, setTirando] = useState(null);        // { desde, menuId, clave, nodo, x, y }
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

    /**
     * LAS BASES MEDIDAS, Y CUÁNDO DEJAN DE VALER.
     *
     * La base de una caja —dónde cae su hueco en la columna— solo cambia
     * cuando cambia el LAYOUT: el zoom, el tamaño del lienzo, qué secciones
     * están abiertas, qué cajas hay. NO cambia cuando cambia un corrimiento,
     * porque un corrimiento es un `transform`, y un transform mueve lo que se
     * dibuja sin tocar el hueco que la caja ocupa.
     *
     * MEDIR DE NUEVO EN CADA CORRIMIENTO ERA EL ERROR, y se veía justo al
     * tocar «Reacomodar»: las cajas arrancan un viaje de un segundo y
     * `getBoundingClientRect` devuelve la posición ANIMADA, no la de destino.
     * Esa lectura, menos el corrimiento nuevo, daba una base corrida — y como
     * después de esa pasada ya nada vuelve a disparar el trazado, los cables
     * quedaban apuntando al aire hasta que se tocara el zoom.
     *
     * Con la época, un cambio de corrimiento no vuelve a medir NADA: reusa las
     * bases y solo recalcula destinos. Que además es lo más barato.
     */
    const medidas = useRef(new Map());
    const epocaRef = useRef({});

    // Lo mismo para la columna del medio. Las ALERTAS no se corren: son el
    // ancla de la cascada —los alcances se paran frente a ellas y las reglas
    // frente a los alcances—, así que moverlas volvería circular la cuenta.
    const [correrAlcance, setCorrerAlcance] = useState(new Map());
    const correrAlcanceRef = useRef(new Map());

    // Si el movimiento se anima o es instantáneo. Arranca APAGADA: la primera
    // colocación, al abrir la pantalla, tiene que ser instantánea.
    const [animar, setAnimar] = useState(false);

    // Qué secciones están plegadas. No se guarda entre sesiones a propósito:
    // volver a la pantalla y encontrar media configuración escondida, sin
    // recordar haberla plegado, se lee como datos que faltan.
    const [plegadas, setPlegadas] = useState(() => new Set());

    const alternarSeccion = useCallback((id) => {
        setPlegadas(previas => {
            const siguientes = new Set(previas);
            if (siguientes.has(id)) siguientes.delete(id);
            else siguientes.add(id);
            return siguientes;
        });
    }, []);

    // El zoom del lienzo. Un mapa con muchas alertas no entra en pantalla, y
    // alejarlo para ver el conjunto es distinto de acercarlo para cablear fino.
    const zoom = useZoom({ nombre: 'mapa-de-bonificacion', min: 0.5, max: 1.5, paso: 0.1 });
    const confirmar = useConfirm();
    const escala = zoom.escala;

    // Recorrer el lienzo arrastrando el fondo. Excluye las cajas y los
    // controles, que se quedan con el gesto.
    const paneo = usePaneo();

    // Las cajas puestas a mano. Solo quien puede editar las mueve; para el
    // resto las guardadas se siguen respetando, porque son parte de cómo se ve
    // el mapa y no de lo que se puede cambiar.
    const cajas = useCajasArrastrables({
        nombre: 'mapa-de-bonificacion:cajas',
        escala,
        activo: Boolean(puedeEditar),
    });

    // Nada se coloca hasta que el zoom y las posiciones guardadas sean los
    // definitivos. Al recargar, el primer render viene al 100% y sin nada
    // puesto a mano, y recién un momento después se restauran los dos: medir
    // en el medio significa colocar todo dos veces —una mal y otra bien— y, si
    // la animación ya está encendida, ver el salto entero.
    const listo = zoom.listo && cajas.listo;

    // Mientras una caja va en la mano nada se anima: la caja tiene que seguir
    // al cursor, no llegar un segundo después.
    const animando = animar && !cajas.moviendo;

    // El mismo nodo es el que se escala y el que sirve de origen para medir las
    // cajas. Un ref de función los conecta a los dos sin envolver nada de más.
    // Desestructurado porque es lo único estable del hook: el objeto `zoom`
    // cambia con cada escala, y depender de él recrearía este callback —y React
    // desmonta y remonta un callback ref que cambia— en cada toque de zoom.
    const refDeZoom = zoom.ref;

    // El montaje del lienzo, también en estado. El lienzo aparece TARDE,
    // detrás del «Cargando…», y para entonces `listo` ya se encendió: el
    // efecto de los observadores corrió contra null y, como un callback ref
    // no re-dispara efectos, no volvía a intentarlo en toda la sesión —sin
    // ResizeObserver y con el encendido de `animar` huérfano—. Anotarlo en
    // estado es lo que trae ese efecto de vuelta cuando el nodo existe.
    const [lienzoMontado, setLienzoMontado] = useState(false);

    const montarLienzo = useCallback((nodo) => {
        lienzo.current = nodo;
        setLienzoMontado(Boolean(nodo));
        // Se LLAMA, no se le asigna `.current`: el ref del zoom es una función
        // que aplica la escala en cuanto el nodo existe. Importa cuando el
        // lienzo monta tarde, detrás del "cargando": con un ref objeto el zoom
        // guardado quedaba sin aplicar y toda la colocación salía al doble.
        refDeZoom(nodo);
    }, [refDeZoom]);

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


    /**
     * LOS ALCANCES, UNA CAJA POR COMBINACIÓN — NO POR ALERTA.
     *
     * Dos alertas con la misma regla y los mismos establecimientos son, para
     * quien mira el mapa, la misma cosa; dibujarlas dos veces obliga a
     * comparar dos listas largas para descubrir que dicen lo mismo. Se dibuja
     * una caja y le llegan dos cables, igual que en la columna de reglas.
     *
     * En la BASE siguen siendo dos: `Menu.bonusRules` guarda el alcance
     * embebido dentro de cada alerta, con `_id: false`. Esta unión es de la
     * pantalla, no del modelo — por eso cada acción sobre la caja se aplica a
     * TODAS las alertas que la usan.
     */
    const alcancesUnicos = useMemo(() => {
        const mapa = new Map();

        for (const alerta of puestas) {
            (alerta.bonusRules || []).forEach((asig, indice) => {
                if (!asig?.rule) return;

                const clave = claveDeAsignacion(asig);
                if (!mapa.has(clave)) {
                    mapa.set(clave, { clave, rule: String(asig.rule), scope: asig.scope, usos: [] });
                }
                mapa.get(clave).usos.push({ alerta, indice });
            });
        }

        return [...mapa.values()];
    }, [puestas]);


    /**
     * EL MAPA, PARTIDO POR LA CATEGORÍA DE LA REGLA.
     *
     * La categoría es la de la REGLA y no la de la alerta a propósito: es la
     * que agrupa en el corte, la que decide cuánto se paga. La categoría
     * operativa de la alerta ('delay', 'food'…) sigue en su chip, dentro de
     * la caja.
     *
     * LAS REGLAS ABREN LAS SECCIONES. Una categoría del catálogo sin ninguna
     * regla no es una sección vacía: es una fila que nadie usó todavía, y
     * dibujarle tres columnas en blanco sería inventar trabajo que no existe.
     * Al revés sí: una categoría con reglas que nadie usa se muestra igual,
     * porque «estas reglas están y no las usa nadie» es justo lo que hay que
     * poder ver.
     */
    const secciones = useMemo(() => {
        const orden = new Map(categorias.map((c, i) => [c.value, i]));
        const grupos = new Map();

        const grupo = (valor) => {
            const id = valor || SIN_CATEGORIA;
            if (!grupos.has(id)) {
                grupos.set(id, {
                    id,
                    categoria: categoriaDe.get(valor) || null,
                    // Las que el catálogo no conoce van al final, en bloque:
                    // una categoría dada de baja no tiene lugar en el orden.
                    orden: orden.has(valor) ? orden.get(valor) : Number.MAX_SAFE_INTEGER,
                    alcances: [],
                    reglas: [],
                    conAlerta: new Set(),
                });
            }
            return grupos.get(id);
        };

        (reglas || []).forEach(r => grupo(r.bonusCategory).reglas.push(r));

        alcancesUnicos.forEach(nodo => {
            const g = grupo(porId.get(nodo.rule)?.bonusCategory);
            g.alcances.push(nodo);
            nodo.usos.forEach(({ alerta }) => g.conAlerta.add(String(alerta._id)));
        });

        // En el orden del mapa, no en el de las asignaciones: la columna de
        // alertas tiene que leerse igual en todas las secciones.
        const lista = [...grupos.values()]
            .sort((a, b) => a.orden - b.orden || String(a.id).localeCompare(String(b.id), 'es'))
            .map(g => ({ ...g, alertas: puestas.filter(a => g.conAlerta.has(String(a._id))) }));

        // EL BANCO: lo que todavía no fue a ninguna sección. Y también la
        // alerta de la caja a medio armar, aunque ya esté cableada en otro
        // lado — esa caja sin regla vive acá, y el cable que las une tiene que
        // ser corto en vez de cruzar el mapa entero.
        const cableadas = new Set(lista.flatMap(s => s.alertas.map(a => String(a._id))));
        const sueltas = puestas.filter(a => (
            !cableadas.has(String(a._id)) || String(a._id) === armando?.menuId
        ));

        if (sueltas.length) {
            lista.push({
                id: SIN_ASIGNAR,
                banco: true,
                categoria: null,
                alertas: sueltas,
                alcances: [],
                // Todas las activas: es la única sección donde hay algo que
                // cablear, así que es la única que necesita todas las reglas
                // enfrente. Las inactivas no, que no se pueden asignar.
                reglas: (reglas || []).filter(r => r.active !== false),
            });
        }

        return lista;
    }, [reglas, alcancesUnicos, porId, categoriaDe, categorias, puestas, armando]);


    // ── Los cables, sobre las posiciones reales de las cajas ──────────
    //
    // TRES ETAPAS, Y EL ORDEN IMPORTA:
    //
    //   1. medir todo, con cada caja en su posición SIN corrimiento
    //   2. decidir dónde se para cada una, en cascada de izquierda a derecha
    //   3. recién ahí trazar, apuntando los cables a donde las cajas VAN A
    //      QUEDAR — no a donde están
    //
    // Trazar primero y correr después dejaba los cables clavados en la
    // posición vieja. Y volver a medir tampoco alcanza: durante la animación
    // `getBoundingClientRect` devuelve la posición INTERMEDIA, así que los
    // cables perseguirían a las cajas en vez de viajar con ellas. Por eso el
    // destino se calcula —base + corrimiento— en vez de medirse.
    //
    // LA CASCADA NO ES CIRCULAR, y por eso las alertas no se mueven: son el
    // ancla. Los alcances se paran frente a sus alertas y las reglas frente a
    // sus alcances. Si además las alertas se centraran en sus alcances, cada
    // una dependería de la otra y la cuenta no cerraría nunca.
    const trazar = useCallback(() => {
        const base = lienzo.current?.getBoundingClientRect();
        if (!base) return setCables([]);

        const fijas = cajas.posiciones;

        // Mientras una caja va en la mano la cascada se congela: viaja solo
        // ella, con sus cables. Recalcular la colocación en cada píxel haría
        // bailar a las demás debajo del cursor.
        const congelado = Boolean(cajas.moviendo);

        // ¿Sigue siendo el mismo layout que cuando se midió? Se compara por
        // IDENTIDAD y no por contenido: `secciones` es un memo y `plegadas` un
        // Set nuevo en cada cambio, así que la referencia ya dice todo.
        const epoca = epocaRef.current;
        if (epoca.escala !== escala || epoca.secciones !== secciones || epoca.plegadas !== plegadas) {
            medidas.current.clear();
            epocaRef.current = { escala, secciones, plegadas };
        }

        // Los rects llegan en píxeles de pantalla, ya multiplicados por el
        // zoom; el SVG dibuja en coordenadas de layout. Sin dividir, al 150%
        // los cables saldrían medio ancho más lejos que las cajas que unen.
        //
        // Y se le RESTA lo que la caja YA tiene puesto, para leer siempre su
        // posición de origen: sin eso, la medición de la vuelta siguiente
        // incluiría el desplazamiento ya aplicado y la caja se iría corriendo
        // sola en cada pasada.
        const caja = (clave, quita) => {
            // El cache guarda la BASE, ya sin corrimiento. Mientras el layout
            // no cambie vale para siempre, arrastre y reacomodo incluidos.
            const guardada = medidas.current.get(clave);
            if (guardada) return guardada;

            const n = lienzo.current.querySelector(`[data-nodo="${clave}"]`);
            if (!n) return null;

            const r = n.getBoundingClientRect();
            const dx = quita?.x || 0;
            const dy = quita?.y || 0;

            const c = {
                x1: (r.left - base.left) / escala - dx,
                x2: (r.right - base.left) / escala - dx,
                y: (r.top - base.top + r.height / 2) / escala - dy,
                alto: r.height / escala,
            };

            medidas.current.set(clave, c);
            return c;
        };

        /** La misma caja, ya llevada a donde VA A QUEDAR. */
        const llevar = (c, d) => (c
            ? { ...c, x1: c.x1 + (d?.x || 0), x2: c.x2 + (d?.x || 0), y: c.y + (d?.y || 0) }
            : null);

        const curva = (de, a) => {
            if (!de || !a) return null;
            const dx = Math.max(30, (a.x1 - de.x2) / 2);
            return `M ${de.x2} ${de.y} C ${de.x2 + dx} ${de.y}, ${a.x1 - dx} ${a.y}, ${a.x1} ${a.y}`;
        };

        const nuevos = [];
        const sigAlcance = new Map();
        const sigRegla = new Map();

        secciones.forEach(sec => {
            // Una sección plegada no está en el DOM: no hay nada que medir y
            // sus cables se van con ella, en vez de quedar colgando de la nada.
            if (plegadas.has(sec.id)) return;

            const kAlerta = id => llave(sec.id, 'alerta', id);
            const kAlcance = id => llave(sec.id, 'alcance', id);
            const kRegla = id => llave(sec.id, 'regla', id);

            /** Lo que la caja lleva puesto: la mano si la hay, si no el automático. */
            const puestoDe = (k, automatico) => fijas.get(k) || { x: 0, y: automatico.get(k) || 0 };


            // ── 1. Medir ──────────────────────────────────────────────
            // Las ALERTAS no se acomodan solas: son el ancla de la cascada, y
            // lo único que las corre es la mano.
            const deAlerta = new Map();
            sec.alertas.forEach(alerta => {
                const k = kAlerta(alerta._id);
                const c = caja(k, fijas.get(k));
                if (c) deAlerta.set(k, llevar(c, fijas.get(k)));
            });

            const deAlcance = new Map();
            sec.alcances.forEach(nodo => {
                const k = kAlcance(nodo.clave);
                const c = caja(k, puestoDe(k, correrAlcanceRef.current));
                if (c) deAlcance.set(k, c);
            });

            const deRegla = new Map();
            sec.reglas.forEach(regla => {
                const k = kRegla(regla._id);
                const c = caja(k, puestoDe(k, correrRef.current));
                if (c) deRegla.set(k, c);
            });


            // ── 2. Decidir dónde va cada caja, de izquierda a derecha ──
            // Los alcances se paran frente a las alertas que los usan.
            const aLosAlcances = new Map();
            sec.alcances.forEach(nodo => {
                const alturas = nodo.usos
                    .map(u => deAlerta.get(kAlerta(u.alerta._id))?.y)
                    .filter(y => typeof y === 'number');
                if (alturas.length) aLosAlcances.set(kAlcance(nodo.clave), alturas);
            });

            const autoAlcance = congelado
                ? vigentes(correrAlcanceRef.current, deAlcance.keys())
                : acomodarColumna(deAlcance, aLosAlcances, fijas);

            // Y las reglas frente a los alcances que ya quedaron colocados.
            const aLasReglas = new Map();
            sec.alcances.forEach(nodo => {
                const k = kAlcance(nodo.clave);
                const c = deAlcance.get(k);
                if (!c) return;
                const kr = kRegla(nodo.rule);
                if (!aLasReglas.has(kr)) aLasReglas.set(kr, []);
                aLasReglas.get(kr).push(c.y + puestoDe(k, autoAlcance).y);
            });

            const autoRegla = congelado
                ? vigentes(correrRef.current, deRegla.keys())
                : acomodarColumna(deRegla, aLasReglas, fijas);

            for (const [k, v] of autoAlcance) sigAlcance.set(k, v);
            for (const [k, v] of autoRegla) sigRegla.set(k, v);


            // ── 3. Trazar ─────────────────────────────────────────────
            sec.alcances.forEach(nodo => {
                const k = kAlcance(nodo.clave);
                const dAlc = llevar(deAlcance.get(k), puestoDe(k, autoAlcance));
                if (!dAlc) return;

                // Un cable por cada alerta que usa esta caja. Es lo que hace
                // ver de un vistazo cuántas comparten la configuración.
                nodo.usos.forEach(({ alerta, indice }) => {
                    const d = curva(deAlerta.get(kAlerta(alerta._id)), dAlc);
                    if (!d) return;
                    nuevos.push({
                        id: `${k}~a~${alerta._id}~${indice}`,
                        d,
                        color: alerta.bonifies !== true ? COLOR_APAGADO : COLOR_ALCANCE,
                    });
                });

                // El que se arrastra no se dibuja fijo: lo dibuja la goma.
                if (tirando?.desde === 'alcance' && tirando?.nodo === k) return;

                const kr = kRegla(nodo.rule);
                const d2 = curva(dAlc, llevar(deRegla.get(kr), puestoDe(kr, autoRegla)));
                if (!d2) return;

                // Gris si TODAS las alertas que la usan están apagadas:
                // mientras alguna pague, ese cable está en uso.
                const apagadas = nodo.usos.every(u => u.alerta.bonifies !== true);
                const cat = categoriaDe.get(porId.get(nodo.rule)?.bonusCategory);

                nuevos.push({
                    id: `${k}~r`,
                    d: d2,
                    color: apagadas ? COLOR_APAGADO : (cat?.color || COLOR_NEUTRO),
                });
            });

            // La que se está armando: su cable a la alerta ya existe, el de la
            // derecha todavía no, y esa punta suelta es justo lo que falta.
            if (sec.banco && armando?.menuId) {
                const k = kAlcance('nueva');
                const d = curva(
                    deAlerta.get(kAlerta(armando.menuId)),
                    llevar(caja(k, fijas.get(k)), fijas.get(k)),
                );
                if (d) nuevos.push({ id: 'a~nueva', d, color: COLOR_ALCANCE });
            }
        });

        aplicarSi(sigAlcance, correrAlcanceRef, setCorrerAlcance);
        aplicarSi(sigRegla, correrRef, setCorrer);
        setCables(nuevos);
    }, [secciones, plegadas, tirando, armando, porId, categoriaDe, escala,
        cajas.posiciones, cajas.moviendo]);

    useEffect(() => { if (listo) trazar(); }, [trazar, listo]);

    // `trazar` se rehace con cada píxel de arrastre. El observador de tamaño no
    // tiene por qué desconectarse y volver a conectarse con él —ni reprogramar
    // su temporizador—, así que lo lee por ref y se monta una sola vez.
    const trazarRef = useRef(trazar);
    trazarRef.current = trazar;

    /**
     * Se vuelve a medir cuando el lienzo cambia de tamaño, y ESO NO SE ANIMA.
     *
     * Al abrir la pantalla las cajas se acomodan por primera vez: animarlo
     * significa que las cien se deslizan a la vez apenas carga, que es a la vez
     * feo y caro —cien `transform` más cien `d` de path en el mismo frame—. Lo
     * mismo al arrastrar el borde de la ventana: ahí cada píxel de resize
     * dispararía un viaje de un segundo y las cajas irían siempre atrasadas.
     *
     * La animación se enciende sola un momento después de la primera medición,
     * y se apaga mientras dure el resize. Se anima lo que el usuario CAMBIA, no
     * lo que el navegador recalcula.
     *
     * `lienzoMontado` está en las dependencias porque en el arranque frío
     * `listo` se enciende detrás del «Cargando…», con el lienzo todavía sin
     * montar: sin esa dependencia este efecto salía por el guard una vez y no
     * volvía a correr nunca.
     */
    useEffect(() => {
        const el = lienzo.current;
        if (!el || !listo) return undefined;

        let volverAAnimar;

        const recalcular = () => {
            setAnimar(false);
            clearTimeout(volverAAnimar);

            // El único caso en que el layout cambia sin que cambie ninguna de
            // las tres cosas que forman la época. Se invalida a mano.
            medidas.current.clear();
            epocaRef.current = {};

            requestAnimationFrame(() => trazarRef.current());
            volverAAnimar = setTimeout(() => setAnimar(true), 250);
        };

        const ro = new ResizeObserver(recalcular);
        ro.observe(el);
        addEventListener('resize', recalcular);

        // Terminada la primera colocación, lo que venga después sí se anima.
        volverAAnimar = setTimeout(() => setAnimar(true), 250);

        return () => {
            ro.disconnect();
            removeEventListener('resize', recalcular);
            clearTimeout(volverAAnimar);
        };
    }, [listo, lienzoMontado]);

    /**
     * EL ZOOM TAMPOCO SE ANIMA. Es la misma regla del resize —se anima lo que
     * el usuario cambia de contenido, no lo que el navegador recalcula— y el
     * zoom es un cambio de cámara, no de contenido.
     *
     * Sin esto, al tocar zoom las cajas saltan al instante a su geometría
     * nueva (el `zoom` de CSS no transiciona) pero los cables reciben su `d`
     * con la transición de un segundo activa: las flechas persiguen durante un
     * segundo a cajas que ya llegaron. Y el zoom − lo sufre doble, porque por
     * debajo del ~80% los mínimos de letra agrandan los títulos en layout y
     * las cajas cambian de alto además de escala.
     *
     * El ref evita apagarla en el montaje: de eso ya se ocupa el arranque en
     * `false` de `animar`.
     */
    const escalaAnterior = useRef(escala);
    useEffect(() => {
        if (escalaAnterior.current === escala) return undefined;
        escalaAnterior.current = escala;

        // Sin lienzo no hubo gesto: este cambio de escala es la RESTAURACIÓN
        // del zoom guardado, que llega detrás del «Cargando…». Programar acá
        // el encendido rompía la primera colocación —que tiene que ser
        // instantánea— y una tanda tardía de datos re-medía cajas en pleno
        // viaje de un segundo: la base quedaba corta en el cache y los cables
        // apuntaban al aire hasta el próximo toque de zoom. Del encendido tras
        // el montaje ya se ocupa el efecto de los observadores.
        if (!lienzo.current) return undefined;

        setAnimar(false);
        const timer = setTimeout(() => setAnimar(true), 250);
        return () => clearTimeout(timer);
    }, [escala]);


    // ── Escritura ─────────────────────────────────────────────────────
    // Cada gesto arma el estado siguiente de ESA alerta y lo manda. Las demás
    // no se tocan: el mapa es una vista de relaciones, no un formulario único.
    // Cablear no enciende ni apaga: `bonifies` se conserva tal cual. Si no,
    // tocar el cableado de una alerta apagada la volvería a encender sola, y
    // el único que decide eso es el interruptor.
    const escribir = (alerta, bonusRules, bonifies = alerta.bonifies ?? null) =>
        onEscribirAsignaciones(alerta._id, { bonifies, bonusRules });

    // ── Sobre una caja COMPARTIDA ─────────────────────────────────────
    // La caja del medio es una combinación de regla y alcance que puede usar
    // más de una alerta. Tocarla las toca a TODAS: es lo que significa que
    // compartan la caja. Para que una sola cambie, primero se la desconecta y
    // se le arma la suya.
    //
    // Cada alerta se escribe una vez —su `bonusRules` viaja entero— aunque
    // tenga la misma asignación repetida.

    const cambiarAlcanceCompartido = (nodo, scope) => {
        for (const { alerta, indices } of usosPorAlerta(nodo.usos)) {
            escribir(alerta, (alerta.bonusRules || [])
                .map((a, j) => (indices.includes(j) ? { ...a, scope } : a)));
        }
    };

    const reapuntarCompartido = (nodo, ruleId) => {
        for (const { alerta, indices } of usosPorAlerta(nodo.usos)) {
            escribir(alerta, (alerta.bonusRules || [])
                .map((a, j) => (indices.includes(j) ? { ...a, rule: ruleId } : a)));
        }
    };

    const quitarCompartido = (nodo) => {
        for (const { alerta, indices } of usosPorAlerta(nodo.usos)) {
            escribir(alerta, (alerta.bonusRules || []).filter((_, j) => !indices.includes(j)));
        }
    };

    /**
     * ¿La alerta ya tiene otra asignación general?
     *
     * Dos generales en la misma alerta serían ambiguas —cuál gana lo decidiría
     * el orden de carga— y el servidor las rechaza. Se comprueba sobre la
     * primera alerta que use la caja, sin contar la que se está editando.
     */
    const hayOtraGeneral = (edicion) => {
        const alerta = edicion?.alerta ?? edicion?.nodo?.usos?.[0]?.alerta;
        if (!alerta) return false;

        const propios = edicion?.nodo
            ? edicion.nodo.usos.filter(u => String(u.alerta._id) === String(alerta._id)).map(u => u.indice)
            : [];

        return (alerta.bonusRules || []).some((a, j) => a.scope?.mode === 'all' && !propios.includes(j));
    };


    /** Desconectar UNA sola alerta de una caja que comparte con otras. */
    const desconectar = (nodo, alerta) => {
        const indices = nodo.usos
            .filter(u => String(u.alerta._id) === String(alerta._id))
            .map(u => u.indice);

        escribir(alerta, (alerta.bonusRules || []).filter((_, j) => !indices.includes(j)));
    };

    /**
     * Quitar la caja, preguntando.
     *
     * Soltar el cable a un centímetro de la caja borra referencias guardadas, y
     * desde el mapa no se ve qué se perdió: la caja desaparece con su alcance
     * adentro. El mensaje dice CUÁNTAS alertas quedan afectadas —una caja
     * compartida por tres las desconecta a las tres— y aclara lo que NO toca,
     * que es la regla.
     */
    const quitarCompartidoPreguntando = (nodo) => {
        const cuantas = usosPorAlerta(nodo.usos).length;
        const regla = porId.get(nodo.rule);

        confirmar({
            titulo: cuantas === 1 ? '¿Quitar esta asignación?' : `¿Quitar esta asignación de ${cuantas} alertas?`,
            descripcion: (cuantas === 1
                ? `«${nodo.usos[0].alerta.es || nodo.usos[0].alerta.en}» va a dejar de bonificar en `
                : `Las ${cuantas} alertas que usan esta caja van a dejar de bonificar en `)
                + `${describirAlcance(nodo.scope, alcance)}. `
                + `La regla${regla ? ` «${regla.name}»` : ''} no se borra: sigue disponible para otras alertas.`,
            alAceptar: () => quitarCompartido(nodo),
        });
    };

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

        // La pregunta es si la alerta YA TIENE alcances, no si tiene uno
        // general. Antes se miraba `mode === 'all'`, y con una alerta que
        // tuviera un «solo en» y un «todos menos» —ninguno general— el cable
        // creaba en silencio un tercer alcance «todos los establecimientos»
        // que solapaba a los otros dos. Cuál gana lo decide después la
        // especificidad, que no es algo que nadie espere de arrastrar un cable.
        const hayAlcances = actuales.length > 0;

        if (!hayAlcances) {
            // Vacía: el primero es general y queda lista de un gesto, que es
            // el caso normal.
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
     * Esta alerta pasa a usar TAMBIÉN una caja que ya existe.
     *
     * En la pantalla es «se suma a esa caja»; en la base es una COPIA de
     * `{ rule, scope }` dentro de su propio `bonusRules`, porque el alcance es
     * un objeto embebido con `_id: false` y no hay nada a lo que apuntar. Las
     * dos versiones son ciertas: comparten la caja del mapa, y cada una tiene
     * su fila en su documento.
     */
    const sumarACaja = (alerta, nodo) => {
        const actuales = alerta.bonusRules || [];

        // Ya la usa: sumarla otra vez dejaría dos filas idénticas contando dos
        // veces la misma alerta.
        if (actuales.some(a => a.rule && claveDeAsignacion(a) === nodo.clave)) return;

        escribir(alerta, [...actuales, {
            rule: nodo.rule,
            scope: { ...(nodo.scope || { mode: 'all', franchises: [], locals: [] }) },
        }]);
    };


    // ── Arrastre ──────────────────────────────────────────────────────
    // `menuId` para el cable que sale de una alerta; `clave` para el que sale
    // de una caja del medio, que ya no es de una alerta sola.
    const empezar = (e, desde, { menuId = null, clave = null, nodo = null } = {}) => {
        if (!puedeEditar) return;
        e.preventDefault();
        // Que no lo tomen también el arrastre de la caja ni el paneo del
        // lienzo: los tres nacen del mismo botón y los separa dónde empiezan.
        e.stopPropagation();
        lienzo.current.setPointerCapture(e.pointerId);
        setTirando({ desde, menuId, clave, nodo, x: e.clientX, y: e.clientY });
    };

    /** Dónde cayó el cable decide qué significó el gesto. */
    const soltar = async (e) => {
        if (!tirando) return;
        const { desde, menuId, clave } = tirando;
        setTirando(null);

        const bajoElCursor = document.elementFromPoint(e.clientX, e.clientY);
        const regla = bajoElCursor?.closest('[data-tipo="regla"]')?.dataset.regla || null;
        const claveDestino = bajoElCursor?.closest('[data-tipo="alcance"]')?.dataset.clave || null;


        // ── Desde una ALERTA ──────────────────────────────────────────
        // El cable nace sin destino, y lo que significa lo decide dónde cae:
        //
        //   en una REGLA    queda la asignación armada de un gesto
        //   en un ALCANCE   esta alerta pasa a usar TAMBIÉN esa caja
        //   al aire         pregunta dónde aplica
        if (desde === 'alerta') {
            const alerta = puestas.find(a => String(a._id) === menuId);
            if (!alerta) return;

            if (regla) return sumar(alerta, regla);

            if (claveDestino && claveDestino !== 'nueva') {
                const nodo = alcancesUnicos.find(x => x.clave === claveDestino);
                if (nodo) sumarACaja(alerta, nodo);
                return;
            }

            return setEditandoAlcance({ alerta, sinRegla: true });
        }


        // ── Desde la caja a medio armar ───────────────────────────────
        // Solo se guarda si llegó a una regla; soltarla afuera la descarta,
        // igual que soltar cualquier otro cable al aire.
        if (clave === 'nueva') {
            const alerta = puestas.find(a => String(a._id) === armando?.menuId);
            setArmando(null);

            if (regla && alerta) {
                await escribir(alerta, [...(alerta.bonusRules || []), { rule: regla, scope: armando.scope }]);
            }
            return;
        }


        // ── Desde una caja COMPARTIDA ─────────────────────────────────
        const nodo = alcancesUnicos.find(x => x.clave === clave);
        if (!nodo) return;

        if (regla) reapuntarCompartido(nodo, regla);
        else quitarCompartidoPreguntando(nodo);
    };


    if (cargando) return <Marco><p className='px-5 py-10 text-[13px] text-gray-500'>Cargando el mapa…</p></Marco>;

    const activasReglas = (reglas || []).filter(r => r.active !== false);
    const aMano = cajas.posiciones.size;

    /** El desplazamiento que lleva puesto una caja: la mano si la hay, si no el automático. */
    const puestaDe = (clave, automatico) => cajas.posiciones.get(clave) || { x: 0, y: automatico || 0 };

    return (
        <>
            <Marco>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
                    <div className='min-w-0'>
                        <h2 className='text-[15px] font-bold text-gray-800 leading-tight'>Mapa de bonificación</h2>
                        <p className='text-[11.5px] text-gray-500'>
                            {puestas.length} alerta{puestas.length === 1 ? '' : 's'} en el mapa
                            {' · '}{(reglas || []).length} regla{(reglas || []).length === 1 ? '' : 's'}
                            {' · '}{secciones.length} {secciones.length === 1 ? 'sección' : 'secciones'}
                        </p>
                    </div>

                    <div className='ml-auto flex items-center gap-2'>
                        {aMano > 0 && (
                            <button type='button' onClick={cajas.limpiar}
                                title='Devuelve todas las cajas puestas a mano a su lugar automático'
                                className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700
                                           bg-gray-100 hover:bg-gray-200 transition-colors'>
                                Reacomodar
                            </button>
                        )}

                        <ControlesDeZoom zoom={zoom} />

                        {puedeEditar && (
                            <>
                                <button type='button' onClick={() => setEligiendo(true)}
                                    className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'>
                                    + Alerta
                                </button>

                                {/* Asignar necesita las dos puntas y el botón no
                                    puede saber ninguna: con el mapa partido en
                                    secciones, la alerta y la regla pueden estar
                                    en dos lugares distintos de la pantalla. Por
                                    eso vive acá arriba y pregunta las dos. */}
                                {activasReglas.length > 0 && puestas.length > 0 && (
                                    <button type='button' onClick={() => setAsignando(true)}
                                        className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'>
                                        + Asignar
                                    </button>
                                )}

                                <button type='button' onClick={onNuevaRegla}
                                    className='h-8 px-3 rounded-lg text-[11.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors'>
                                    + Regla
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* TRES GESTOS SOBRE EL MISMO BOTÓN DEL MOUSE, y los separa
                    dónde empiezan: el FONDO desplaza la vista, una CAJA se
                    mueve, un PUERTO saca un cable.

                    Y dos capas, cada una con su trabajo: la de afuera
                    desplaza, la de adentro escala. Si el zoom fuera sobre la
                    que desplaza, se escalaría también su propio ancho y la
                    tarjeta entera crecería en vez de aparecer una barra.

                    EL ALTO VA ACOTADO, Y NO ES DECORATIVO: con `overflow:auto`
                    pero sin límite, el div crece hasta contener el mapa entero
                    y `scrollHeight` queda igual a `clientHeight` — no hay nada
                    que desplazar, y arrastrar el fondo no mueve nada porque
                    quien scrollea es la página. Acotado se vuelve una ventana
                    de verdad, y de paso la barra de herramientas —el zoom,
                    «Reacomodar»— deja de irse de pantalla en un mapa largo. */}
                <div ref={paneo.ref}
                    className={`lienzo-punteado p-5 overflow-auto select-none
                                min-h-[360px] max-h-[72vh]
                                ${!paneo.puedeDesplazar ? ''
                                    : paneo.paneando ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={paneo.alApretar}
                    onPointerMove={e => {
                        paneo.alMover(e);
                        if (tirando) setTirando(t => ({ ...t, x: e.clientX, y: e.clientY }));
                    }}
                    onPointerUp={e => { paneo.alSoltar(e); soltar(e); }}
                    onPointerCancel={e => { paneo.alSoltar(e); setTirando(null); }}>

                    <div ref={montarLienzo} className='relative'>

                        <Cables cables={cables} tirando={tirando} lienzo={lienzo} escala={escala} animar={animando} />

                        {/* El mapa tiene ANCHO PROPIO, no el del contenedor.
                            Es lo que hace que el zoom se vea en horizontal: con
                            un ancho elástico el mapa se reajusta para llenar
                            siempre la ventana, y alejarse no achica nada — solo
                            entra más contenido en la misma franja. Con ancho
                            propio, alejarse lo achica de verdad y deja lienzo
                            libre alrededor, que es donde se pueden acomodar las
                            cajas a mano. */}
                        <div className={`relative z-[1] flex flex-col gap-9 ${ANCHO_MAPA}`}>

                            {/* Los rótulos, una sola vez para todas las
                                secciones: repetirlos en cada una serían tres
                                renglones de ruido por categoría. Comparten la
                                definición de columnas, así que caen sobre las
                                suyas. */}
                            <div className={`${COLUMNAS} -mb-5`}>
                                <Rotulo escala={escala}>Alertas · Menu.model</Rotulo>
                                <Rotulo escala={escala}>Dónde aplica</Rotulo>
                                <Rotulo escala={escala}>Reglas de bonificación</Rotulo>
                            </div>

                            {!puestas.length && (
                                <p className='text-[12.5px] text-gray-500'>
                                    El mapa está vacío. Tocá «+ Alerta» para traer una y empezar a conectarla.
                                </p>
                            )}

                            {!(reglas || []).length && (
                                <p className='text-[11.5px] text-gray-500'>
                                    Todavía no hay reglas. Creá la primera con «+ Regla».
                                </p>
                            )}

                            {secciones.map(sec => {
                                const kNueva = llave(sec.id, 'alcance', 'nueva');

                                return (
                                    <SeccionDelMapa key={sec.id} seccion={sec} escala={escala}
                                        abierta={!plegadas.has(sec.id)}
                                        onAlternar={() => alternarSeccion(sec.id)}

                                        alertas={sec.alertas.map(alerta => {
                                            const k = llave(sec.id, 'alerta', alerta._id);
                                            return (
                                                <NodoAlerta key={k} dataNodo={k} alerta={alerta}
                                                    puedeEditar={puedeEditar}
                                                    apagada={alerta.bonifies !== true}
                                                    sinCablear={!(alerta.bonusRules || []).length}
                                                    animar={animando}
                                                    escala={escala}
                                                    puesta={puestaDe(k, 0)}
                                                    fijada={cajas.posiciones.has(k)}
                                                    moviendo={cajas.moviendo === k}
                                                    onTomar={e => cajas.tomar(e, k)}
                                                    onLiberar={() => cajas.olvidar(k)}
                                                    tirandoDeEsta={tirando?.desde === 'alerta' && tirando?.nodo === k}
                                                    onTirar={e => empezar(e, 'alerta', { menuId: String(alerta._id), nodo: k })}
                                                    onAlternar={() => alternarBonifica(alerta)}
                                                    onSacar={() => sacar(alerta)} />
                                            );
                                        })}

                                        alcances={<>
                                            {sec.alcances.map(nodo => {
                                                const k = llave(sec.id, 'alcance', nodo.clave);
                                                return (
                                                    <NodoAlcance key={k} dataNodo={k} nodo={nodo}
                                                        catalogo={alcance}
                                                        puedeEditar={puedeEditar}
                                                        animar={animando}
                                                        escala={escala}
                                                        puesta={puestaDe(k, correrAlcance.get(k))}
                                                        fijada={cajas.posiciones.has(k)}
                                                        moviendo={cajas.moviendo === k}
                                                        onTomar={e => cajas.tomar(e, k)}
                                                        onLiberar={() => cajas.olvidar(k)}
                                                        tirandoEsta={tirando?.desde === 'alcance' && tirando?.nodo === k}
                                                        esDestino={tirando?.desde === 'alerta'}
                                                        onTirar={e => empezar(e, 'alcance', { clave: nodo.clave, nodo: k })}
                                                        onEditar={() => setEditandoAlcance({ nodo })}
                                                        onQuitar={() => quitarCompartidoPreguntando(nodo)}
                                                        onDesconectar={a => desconectar(nodo, a)} />
                                                );
                                            })}

                                            {/* La que se está armando: ya sabe dónde,
                                                le falta la regla. Vive solo en
                                                pantalla, y en el banco para tener su
                                                alerta al lado. */}
                                            {sec.banco && armando && (
                                                <NodoAlcance dataNodo={kNueva}
                                                    nodo={{ clave: 'nueva', scope: armando.scope, usos: [] }}
                                                    catalogo={alcance}
                                                    puedeEditar={puedeEditar}
                                                    animar={animando}
                                                    escala={escala}
                                                    armando
                                                    puesta={puestaDe(kNueva, 0)}
                                                    fijada={cajas.posiciones.has(kNueva)}
                                                    moviendo={cajas.moviendo === kNueva}
                                                    onTomar={e => cajas.tomar(e, kNueva)}
                                                    onLiberar={() => cajas.olvidar(kNueva)}
                                                    tirandoEsta={tirando?.desde === 'alcance' && tirando?.nodo === kNueva}
                                                    onTirar={e => empezar(e, 'alcance', { clave: 'nueva', nodo: kNueva })}
                                                    onEditar={() => setEditandoAlcance({
                                                        alerta: puestas.find(a => String(a._id) === armando.menuId),
                                                        sinRegla: true,
                                                    })} />
                                            )}

                                            {!sec.alcances.length && !(sec.banco && armando) && sec.alertas.length > 0 && (
                                                <p className='text-[11.5px] text-gray-500'>
                                                    Tirá el punto de una alerta hasta una regla para decir dónde bonifica.
                                                </p>
                                            )}
                                        </>}

                                        reglas={sec.reglas.map(r => {
                                            const k = llave(sec.id, 'regla', r._id);
                                            return (
                                                <NodoRegla key={k} dataNodo={k} regla={r}
                                                    puedeEditar={puedeEditar}
                                                    animar={animando}
                                                    escala={escala}
                                                    puesta={puestaDe(k, correr.get(k))}
                                                    fijada={cajas.posiciones.has(k)}
                                                    moviendo={cajas.moviendo === k}
                                                    onTomar={e => cajas.tomar(e, k)}
                                                    onLiberar={() => cajas.olvidar(k)}
                                                    categoria={categoriaDe.get(r.bonusCategory) || null}
                                                    conectada={alcancesUnicos.some(n => n.rule === String(r._id))}
                                                    onEditar={() => onEditarRegla(r)} />
                                            );
                                        })}
                                    />
                                );
                            })}
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
                    inicial={editandoAlcance.nodo?.scope ?? editandoAlcance.provisoria?.scope}
                    // Una alerta no puede tener DOS asignaciones generales: cuál
                    // gana quedaría librado al orden de carga. Se mira sobre la
                    // primera que use la caja, excluyendo la que se está
                    // editando.
                    yaHayGeneral={hayOtraGeneral(editandoAlcance)}
                    onCerrar={() => setEditandoAlcance(null)}
                    onGuardar={async (scope) => {
                        const { alerta, provisoria, sinRegla, nodo } = editandoAlcance;
                        setEditandoAlcance(null);

                        // Sin regla todavía: la caja queda en pantalla, cableada
                        // a la alerta, hasta que su puerto llegue a una regla.
                        if (sinRegla) return setArmando({ menuId: String(alerta._id), scope });
                        if (provisoria) return escribir(alerta, [...(alerta.bonusRules || []), { ...provisoria, scope }]);
                        if (nodo) cambiarAlcanceCompartido(nodo, scope);
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
 * LA IDENTIDAD DE UNA CAJA EN EL MAPA, QUE NO ES LA DEL DATO.
 *
 * Con el mapa partido en secciones, la misma alerta puede estar dibujada en
 * dos —si bonifica bajo reglas de dos categorías— y la misma regla aparece
 * además en el banco. Son cajas distintas: se miden, se acomodan y se
 * arrastran por separado, así que necesitan claves distintas.
 *
 * Las comillas y la barra invertida se reemplazan porque esta clave termina
 * dentro de un selector `[data-nodo="…"]`: una comilla en el nombre de una
 * categoría partiría el selector al medio.
 */
const llave = (seccion, tipo, id) => `${seccion}/${tipo}/${id}`.replace(/["\\]/g, '_');

/** Las reglas sin categoría, y las alertas que todavía no fueron a ninguna. */
const SIN_CATEGORIA = '~sin-categoria';
const SIN_ASIGNAR = '~sin-asignar';


/**
 * Pone cada caja de una columna frente a los cables que le llegan.
 *
 * Una columna se apila desde arriba, así que una caja que usan tres cosas del
 * medio de la lista queda arriba de todo con un hueco debajo y sus cables
 * cruzando en diagonal. Corrida al promedio de sus llegadas, salen casi rectos
 * y se lee de un vistazo qué la usa.
 *
 * SE MUEVE CON `transform`, NO CON MARGEN. Un margen cambiaría el alto de la
 * columna, y eso vuelve a disparar la medición: la caja se correría de nuevo
 * en cada pasada, sin parar. `transform` no toca el layout.
 *
 * LAS PUESTAS A MANO QUEDAN AFUERA. Es lo único que hace que arrastrar y
 * acomodar solo puedan convivir: si la cascada siguiera mandando sobre una
 * caja que alguien movió, el próximo cambio de datos la devolvería al lugar
 * calculado. Tampoco cuentan como obstáculo —una caja libre puede quedar
 * encima de una puesta a mano—, porque quien la puso ahí eligió ese lugar.
 *
 * Las que no reciben ningún cable se quedan donde estén: correrlas no
 * apuntaría a nada y solo movería la lista.
 *
 * Es la misma cuenta para los alcances y para las reglas, y por eso está
 * escrita una vez. Es pura: se la llama una vez por columna y por sección, y
 * quien acumula y guarda los resultados es `trazar`.
 *
 * @param cajas     clave → { y, alto } ya medidas SIN corrimiento
 * @param llegadas  clave → alturas de lo que le llega
 * @param fijas     clave → { x, y } de las puestas a mano
 * @returns {Map<string, number>} clave → píxeles a correr
 */
const acomodarColumna = (cajas, llegadas, fijas) => {
    const SEPARACION = 12;

    const objetivos = [];

    for (const [clave, c] of cajas) {
        if (fijas.has(clave)) continue;
        const alturas = llegadas.get(clave);
        objetivos.push({
            clave,
            base: c.y,
            alto: c.alto,
            deseada: alturas?.length ? alturas.reduce((s, y) => s + y, 0) / alturas.length : c.y,
        });
    }

    // De arriba abajo, respetando el orden en que están en la columna: una no
    // puede subir por encima de la anterior ni pisarla.
    objetivos.sort((a, b) => a.base - b.base);

    let piso = -Infinity;
    const siguiente = new Map();

    for (const o of objetivos) {
        const centro = Math.max(o.deseada, piso + o.alto / 2);
        piso = centro + o.alto / 2 + SEPARACION;

        const corrimiento = Math.round(centro - o.base);
        if (corrimiento) siguiente.set(o.clave, corrimiento);
    }

    return siguiente;
};


/** Los corrimientos que ya están puestos, para las claves que se piden. */
const vigentes = (mapa, claves) => {
    const m = new Map();
    for (const k of claves) {
        const v = mapa.get(k);
        if (v) m.set(k, v);
    }
    return m;
};


/**
 * Guarda los corrimientos nuevos, y solo si de verdad cambiaron: sin esta
 * comparación cada medición dispararía un render y el render otra medición.
 */
const aplicarSi = (siguiente, ref, aplicar) => {
    if (mismoMapa(siguiente, ref.current)) return;
    ref.current = siguiente;
    aplicar(siguiente);
};


/** Lo que dentro de una caja se queda con el gesto en vez de moverla. */
const CONTROLES = 'button, a, input, [role="button"], [role="switch"]';


/**
 * El doble clic que devuelve una caja a su lugar automático.
 *
 * Mira dónde cayó: dos clics rápidos en «Editar» o en el interruptor son un
 * gesto sobre ESE control, y reacomodar la caja además sería un efecto que
 * nadie pidió.
 */
const dobleClicDeCaja = (fijada, onLiberar) => (fijada && onLiberar
    ? (e) => { if (!e.target?.closest?.(CONTROLES)) onLiberar(); }
    : undefined);


/**
 * La marca de una caja puesta a mano.
 *
 * Sin ella no habría forma de saber por qué esa caja no se acomoda con las
 * demás, ni que hay un gesto para devolverla.
 */
const MarcaDeMano = () => (
    <span title='Puesta a mano — doble clic para devolverla a su lugar automático'
        className='absolute right-1.5 top-1.5 w-[7px] h-[7px] rounded-full bg-gray-400/70 z-[2]' />
);


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
const SIN_VIAJE = 'background-color .3s, border-color .3s';

const transicionDeCaja = (animar) => ({
    transition: animar ? `transform 1s ease-in-out, ${SIN_VIAJE}` : SIN_VIAJE,
});

/** El mismo segundo, para el `d` de los cables. */
const transicionDeCable = (animar) => ({
    transition: animar ? 'd 1s ease-in-out, stroke .3s' : 'stroke .3s',
});

const COLOR_ALCANCE = '#29c50c';
const COLOR_NEUTRO = '#9aa6b5';

/** El gris de lo apagado: se ve el cable, se lee que no está en uso. */
const COLOR_APAGADO = '#c3cad4';

/** Lo apagado se muestra sin color, no se esconde. */
const APAGADO = 'grayscale opacity-70';

/**
 * La identidad de una asignación: su regla y su alcance.
 *
 * Dos asignaciones con la misma clave son la misma caja en el mapa. Las listas
 * se ORDENAN antes de comparar: los mismos seis locales cargados en distinto
 * orden son el mismo alcance, y sin ordenar cada uno tendría su caja.
 */
const claveDeAsignacion = (asig) => {
    const s = asig.scope || {};
    const lista = (xs) => [...(xs || [])].map(String).sort().join(',');
    return `${String(asig.rule)}|${s.mode || 'all'}|${lista(s.franchises)}|${lista(s.locals)}`;
};


/**
 * Los usos de una caja, agrupados por alerta.
 *
 * Cada alerta se escribe UNA vez aunque tenga la misma asignación repetida:
 * su `bonusRules` se manda entero, así que dos escrituras seguidas sobre la
 * misma alerta harían que la segunda pisara a la primera.
 */
const usosPorAlerta = (usos = []) => {
    const mapa = new Map();

    for (const uso of usos) {
        const clave = String(uso.alerta._id);
        if (!mapa.has(clave)) mapa.set(clave, { alerta: uso.alerta, indices: [] });
        mapa.get(clave).indices.push(uso.indice);
    }

    return [...mapa.values()];
};


/** ¿Dos mapas de desplazamiento dicen lo mismo? */
const mismoMapa = (a, b) => {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (b.get(k) !== v) return false;
    return true;
};

const Marco = ({ children }) => (
    <section className='bg-white rounded-xl shadow-sm border overflow-hidden'>{children}</section>
);

/** La capa de cables. Va debajo de las cajas y no intercepta el puntero. */
function Cables({ cables, tirando, lienzo, escala = 1, animar = false }) {
    const base = lienzo.current?.getBoundingClientRect();

    let goma = null;
    if (tirando && base) {
        // La clave completa de la caja viaja en `tirando`: con el mapa
        // partido en secciones, el `_id` del dato ya no alcanza para
        // encontrarla —la misma alerta puede estar dibujada en dos—.
        const n = lienzo.current.querySelector(`[data-nodo="${tirando.nodo}"]`);
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
                    style={transicionDeCable(animar)}
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
                        bg-white border-2 cursor-crosshair z-[3] grid place-items-center
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
function NodoAlerta({
    alerta, puedeEditar, apagada, sinCablear, animar, escala,
    dataNodo, puesta, fijada, moviendo, onTomar, onLiberar,
    tirandoDeEsta, onTirar, onAlternar, onSacar,
}) {
    const categoria = CATEGORIAS_OPERATIVAS[alerta?.category];

    return (
        <div data-nodo={dataNodo} data-caja='1'
            onPointerDown={puedeEditar ? onTomar : undefined}
            onDoubleClick={dobleClicDeCaja(fijada, onLiberar)}
            style={{ transform: `translate(${puesta.x}px, ${puesta.y}px)`, ...transicionDeCaja(animar) }}
            className={`${CAJA} mapa-anima relative bg-white border-[1.5px] rounded-xl px-4 py-3.5
                        ${apagada ? 'border-gray-300' : 'border-[#29c50c]'}
                        ${puedeEditar ? (moviendo ? 'cursor-grabbing' : 'cursor-move') : ''}`}>

            {fijada && <MarcaDeMano />}

            {/* Solo la identidad se apaga; el interruptor queda a todo color o
                no se vería con qué volver a encenderla. */}
            <div className={apagada ? APAGADO : ''}>
                <div className='flex items-start gap-2'>
                    <span style={sinAchicar(13.5, escala)}
                        className='flex-1 font-bold text-gray-800 leading-tight'>
                        {alerta?.es || alerta?.en}
                    </span>
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
 * DÓNDE APLICA: UNA CAJA POR COMBINACIÓN DE REGLA Y ALCANCE.
 *
 * No es de una alerta: la comparten todas las que tengan esa misma regla con
 * esos mismos establecimientos, y por eso le llega un cable por cada una. Dos
 * alertas configuradas igual se ven como lo que son —la misma cosa— en vez de
 * obligar a comparar dos listas largas para descubrirlo.
 *
 * Y POR ESO CADA ACCIÓN LAS TOCA A TODAS. Cambiar el alcance lo cambia en las
 * que la comparten; la cruz la desconecta de todas. Para que una sola cambie
 * está el chip con su nombre, que la saca a ella y le deja armar la suya.
 */
function NodoAlcance({
    nodo, catalogo, puedeEditar, armando, animar, escala,
    dataNodo, puesta, fijada, moviendo, onTomar, onLiberar,
    tirandoEsta, esDestino, onTirar, onEditar, onQuitar, onDesconectar,
}) {

    const s = nodo.scope || { mode: 'all' };
    const nombres = nombresDelAlcance(s, catalogo);
    const usos = usosPorAlerta(nodo.usos);

    // Gris solo si TODAS las que la usan están apagadas: mientras alguna pague,
    // la caja está en uso.
    const apagada = usos.length > 0 && usos.every(u => u.alerta.bonifies !== true);

    const titulo = s.mode === 'all' ? 'Todos los establecimientos'
        : s.mode === 'only' ? 'Solo en' : 'Todos menos';

    return (
        <div data-nodo={dataNodo} data-tipo='alcance' data-clave={nodo.clave} data-caja='1'
            onPointerDown={puedeEditar ? onTomar : undefined}
            onDoubleClick={dobleClicDeCaja(fijada, onLiberar)}
            style={{ transform: `translate(${puesta.x}px, ${puesta.y}px)`, ...transicionDeCaja(animar) }}
            className={`${CAJA} mapa-anima relative bg-white rounded-xl px-4 py-3.5 border-[1.5px]
                        ${armando ? 'border-dashed' : ''}
                        ${puedeEditar ? (moviendo ? 'cursor-grabbing' : 'cursor-move') : ''}
                        ${esDestino ? 'border-[#29c50c] border-dashed shadow-md ring-2 ring-[#29c50c]/25'
                            : apagada ? `border-gray-300 ${APAGADO}`
                                : tirandoEsta ? 'border-[#29c50c] shadow-md' : 'border-[#29c50c]/60'}`}>

            {fijada && <MarcaDeMano />}

            {/* La cruz, en el borde por donde LLEGAN los cables. Arrastrar el
                puerto de la derecha afuera hace lo mismo, pero con dos o más
                cajas ese gesto es el de reapuntar y no queda ninguno para
                quitar la del medio. */}
            {puedeEditar && onQuitar && (
                <button type='button' onClick={onQuitar}
                    title={usos.length > 1
                        ? `Quitar esta asignación de las ${usos.length} alertas que la usan`
                        : 'Quitar esta asignación — la alerta deja de bonificar acá'}
                    className='absolute -left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full z-[3]
                               grid place-items-center border-2 bg-white text-transparent
                               border-gray-400 hover:border-red-500 hover:text-red-600
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500
                               transition-colors'>
                    <span className='text-[9px] font-black leading-none'>✕</span>
                </button>
            )}

            <div className='flex items-start gap-2'>
                <span style={sinAchicar(12.5, escala)}
                    className='flex-1 font-bold text-gray-800 leading-tight'>
                    {titulo}
                </span>
                {puedeEditar && onEditar && (
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

            {/* Quiénes la usan, solo cuando son varias. Con una sola el cable
                ya lo dice y el chip sería ruido; con dos o más es la única
                forma de sacar a UNA sin tocar a las otras. */}
            {usos.length > 1 && (
                <div className='mt-auto pt-3 flex flex-wrap gap-1 items-center'>
                    <span className='text-[9px] font-bold uppercase tracking-wider text-gray-400'>
                        {usos.length} alertas
                    </span>
                    {usos.map(({ alerta }) => (
                        <span key={alerta._id}
                            className='inline-flex items-center gap-1 text-[10px] font-semibold rounded
                                       px-1.5 py-0.5 bg-[#29c50c]/10 text-[#1f9a08] max-w-[130px]'>
                            <span className='truncate'>{alerta.es || alerta.en}</span>
                            {puedeEditar && onDesconectar && (
                                <button type='button' onClick={() => onDesconectar(alerta)}
                                    title={`Desconectar «${alerta.es || alerta.en}» — las demás siguen igual`}
                                    className='shrink-0 text-[9px] font-black text-[#1f9a08]/60 hover:text-red-600 transition-colors'>
                                    ✕
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Le falta el otro cable, y decirlo evita que la caja se lea como
                una asignación ya guardada. */}
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
function NodoRegla({
    regla, categoria, conectada, puedeEditar, animar, escala,
    dataNodo, puesta, fijada, moviendo, onTomar, onLiberar, onEditar,
}) {
    const dia = bonusPerAlert(regla, 'day');
    const noche = bonusPerAlert(regla, 'night');
    const inactiva = regla.active === false;

    return (
        <div data-nodo={dataNodo} data-tipo='regla' data-regla={String(regla._id)} data-caja='1'
            onPointerDown={puedeEditar ? onTomar : undefined}
            onDoubleClick={dobleClicDeCaja(fijada, onLiberar)}
            style={{ transform: `translate(${puesta.x}px, ${puesta.y}px)`, ...transicionDeCaja(animar) }}
            className={`${CAJA} mapa-anima relative border-2 rounded-xl px-4 py-3.5
                        ${conectada ? 'bg-[#fdf6e7] border-[#d9a441]' : 'bg-white border-gray-200'}
                        ${inactiva ? 'opacity-60' : ''}
                        ${puedeEditar ? (moviendo ? 'cursor-grabbing' : 'cursor-move') : ''}`}>

            {fijada && <MarcaDeMano />}
            <div className='flex items-start gap-2'>
                <span style={sinAchicar(13, escala)}
                    className='flex-1 font-black text-slate-900 leading-tight'>
                    {regla.name}
                </span>
                {puedeEditar && (
                    <button type='button' onClick={onEditar}
                        className='shrink-0 text-[11px] font-bold text-[#8a5a2b] hover:underline'>Editar</button>
                )}
            </div>
            {/* La categoría de bonificación, con su ícono y su color del catálogo.
                Va antes de la fórmula porque es lo que agrupa en el corte: se
                lee "esta regla es de Higiene" antes que "es 3x1". */}
            {categoria && (
                <span className='mt-2'><ChipCategoria categoria={categoria} escala={escala} /></span>
            )}

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
