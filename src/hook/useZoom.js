'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ZOOM SOBRE UN ELEMENTO, RECORDADO ENTRE SESIONES.
 *
 * Devuelve un `ref` —una FUNCIÓN, se usa igual: `<div ref={zoom.ref}>`— que
 * se le pone al elemento a escalar, y los controles para moverlo. El hook no
 * dibuja nada: quién muestra los botones, dónde y con qué estilos lo decide
 * quien lo usa.
 *
 * Es un callback y no un ref objeto a propósito: aplica el zoom en cuanto el
 * nodo monta, aunque monte tarde —detrás de un estado de carga—. Quien
 * combine este ref con otro propio tiene que LLAMARLO (`zoom.ref(nodo)`), no
 * asignarle `.current`.
 *
 * También devuelve `listo`, en `false` hasta que se restaura el zoom guardado.
 * Quien mida el layout tiene que esperarlo: medir antes es medir con el zoom
 * equivocado.
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

    const nodoRef = useRef(null);

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

    // `listo` avisa que el zoom ya es el definitivo. Importa para quien mida
    // el layout: entre el primer render y la restauración hay un momento con
    // el zoom en su valor inicial, y colocar cosas ahí significa colocarlas
    // dos veces —una mal y otra bien— con el salto a la vista.
    //
    // Sin nombre no hay nada que restaurar, así que arranca listo.
    const [listo, setListo] = useState(!nombre);

    useEffect(() => {
        if (restaurado.current || !nombre) return;
        restaurado.current = true;

        const guardado = leer(nombre);
        if (guardado !== null) setEscala(acotar(guardado));
        setListo(true);
    }, [nombre, acotar]);

    useEffect(() => {
        if (nombre && restaurado.current) guardar(nombre, escala);
    }, [nombre, escala]);

    // La escala también en un ref, para que el callback de abajo lea siempre
    // la vigente sin tener que recrearse (recrearlo desmontaría y remontaría
    // el nodo en cada cambio de zoom).
    const escalaRef = useRef(escala);
    escalaRef.current = escala;

    // EL REF ES UNA FUNCIÓN, Y APLICA EL ZOOM AL MONTAR. No alcanza con un
    // efecto que dependa de `escala`: el nodo puede montarse DESPUÉS de que el
    // zoom guardado se restauró —mientras cargan los datos, la pantalla suele
    // mostrar un "cargando" y el elemento no existe—. Con un ref objeto, el
    // efecto corría contra `null`, no volvía a intentarlo, y el contenido
    // quedaba al 100% visual mientras todo lo que medía dividía por la escala
    // guardada: la colocación entera salía al doble hasta el próximo cambio
    // de zoom.
    //
    // El callback corre en el commit, ANTES de los efectos de quien lo usa:
    // cualquier medición posterior ya ve el nodo escalado.
    const ref = useCallback((nodo) => {
        nodoRef.current = nodo;
        if (nodo) nodo.style.zoom = String(escalaRef.current);
    }, []);

    // Y los cambios de escala con el nodo ya montado los sigue este efecto.
    useEffect(() => {
        const nodo = nodoRef.current;
        if (nodo) nodo.style.zoom = String(escala);
    }, [escala]);

    const acercar = useCallback(() => setEscala(e => acotar(e + paso)), [acotar, paso]);
    const alejar = useCallback(() => setEscala(e => acotar(e - paso)), [acotar, paso]);
    const restablecer = useCallback(() => setEscala(acotar(inicial)), [acotar, inicial]);

    return useMemo(() => ({
        ref,
        escala,
        listo,
        porcentaje: Math.round(escala * 100),
        acercar,
        alejar,
        restablecer,
        puedeAcercar: escala < max,
        puedeAlejar: escala > min,
    }), [ref, escala, listo, acercar, alejar, restablecer, min, max]);
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
