'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ZOOM SOBRE UN ELEMENTO, RECORDADO ENTRE SESIONES.
 *
 * Devuelve un `ref` que se le pone al elemento a escalar y los controles para
 * moverlo. El hook no dibuja nada: quién muestra los botones, dónde y con qué
 * estilos lo decide quien lo usa.
 *
 *     const zoom = useZoom({ nombre: 'mapa-de-bonificacion' });
 *
 *     <ControlesDeZoom zoom={zoom} className='ml-auto' />
 *     <div className='overflow-auto'>
 *         <div ref={zoom.ref}>…</div>
 *     </div>
 *
 *
 * POR QUÉ LA PROPIEDAD `zoom` Y NO `transform: scale()`
 *
 * `zoom` participa en el layout: el elemento de verdad ocupa más lugar, así
 * que un contenedor con `overflow:auto` crece y se puede desplazar hasta lo
 * que quedó afuera. Con `transform` el contenido desborda sin generar scroll
 * y al acercar se pierde la mitad del mapa sin forma de llegar a ella.
 *
 * El costo es el soporte: `zoom` es de siempre en Chrome y Safari, y en
 * Firefox desde la 126. Para esta app —Chrome y un WebView de Cordova— no es
 * una restricción.
 *
 *
 * SI MEDÍS COORDENADAS, DIVIDÍ POR `escala`
 *
 * `getBoundingClientRect()` devuelve píxeles de pantalla, o sea YA
 * multiplicados por el zoom, mientras que un SVG hijo dibuja en coordenadas
 * de layout. Quien calcule posiciones a partir de los hijos —el mapa traza
 * sus cables así— tiene que dividir por `escala`, o al 150% las líneas saldrían
 * medio ancho más lejos que las cajas que unen. Por eso `escala` es parte de
 * la API y no un detalle interno.
 *
 *
 * @param {object}  opciones
 * @param {string}  opciones.nombre   Con qué nombre se recuerda. Sin nombre
 *                                    funciona igual, pero no se guarda.
 * @param {number} [opciones.min]     Cuánto se puede alejar.
 * @param {number} [opciones.max]     Cuánto se puede acercar.
 * @param {number} [opciones.paso]    Cuánto mueve cada toque.
 * @param {number} [opciones.inicial] Con cuánto arranca y a cuánto vuelve.
 */
export default function useZoom({
    nombre,
    min = 0.5,
    max = 2,
    paso = 0.1,
    inicial = 1,
} = {}) {

    const ref = useRef(null);

    // Dos decimales: sumar 0,1 diez veces da 0,9999999999999999, y ese número
    // termina escrito en localStorage y mostrado como 99%.
    const acotar = useCallback(
        (n) => Math.round(Math.min(max, Math.max(min, n)) * 100) / 100,
        [min, max],
    );

    // Arranca en el valor inicial y recién DESPUÉS lee lo guardado. Leerlo en
    // el estado inicial rompería la hidratación de Next: el servidor no tiene
    // localStorage y renderizaría un número distinto del que pinta el navegador.
    const [escala, setEscala] = useState(() => acotar(inicial));
    const restaurado = useRef(false);

    useEffect(() => {
        if (restaurado.current || !nombre) return;
        restaurado.current = true;
        const guardado = leer(nombre);
        if (guardado !== null) setEscala(acotar(guardado));
    }, [nombre, acotar]);

    useEffect(() => {
        if (nombre && restaurado.current) guardar(nombre, escala);
    }, [nombre, escala]);

    // El zoom se escribe sobre el nodo en vez de devolverse como estilo: así
    // el elemento no depende de que quien lo use se acuerde de aplicarlo, que
    // es justo lo que el ref viene a resolver.
    useEffect(() => {
        const nodo = ref.current;
        if (!nodo) return undefined;
        nodo.style.zoom = String(escala);
        return () => { nodo.style.zoom = ''; };
    }, [escala]);

    const acercar = useCallback(() => setEscala(e => acotar(e + paso)), [acotar, paso]);
    const alejar = useCallback(() => setEscala(e => acotar(e - paso)), [acotar, paso]);
    const restablecer = useCallback(() => setEscala(acotar(inicial)), [acotar, inicial]);

    return useMemo(() => ({
        ref,
        escala,
        porcentaje: Math.round(escala * 100),
        acercar,
        alejar,
        restablecer,
        puedeAcercar: escala < max,
        puedeAlejar: escala > min,
    }), [escala, acercar, alejar, restablecer, min, max]);
}


// ── El navegador, cuando deja ──────────────────────────────────────────
// En modo privado o con las cookies bloqueadas, `localStorage` tira al leer y
// al escribir. El zoom tiene que seguir andando igual: simplemente no se
// recuerda.

const clave = (nombre) => `zoom:${nombre}`;

const leer = (nombre) => {
    try {
        const n = Number(window.localStorage.getItem(clave(nombre)));
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    catch {
        return null;
    }
};

const guardar = (nombre, escala) => {
    try {
        window.localStorage.setItem(clave(nombre), String(escala));
    }
    catch {
        // Sin storage. Nada que hacer y nada que avisar.
    }
};
