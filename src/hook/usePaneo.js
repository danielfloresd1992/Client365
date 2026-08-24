'use client';
import { useCallback, useRef, useState } from 'react';

/**
 * DESPLAZAR UN CONTENEDOR ARRASTRÁNDOLO POR EL FONDO.
 *
 * Un lienzo grande con `overflow: auto` se recorre con la rueda y con las
 * barras, y las dos son incómodas cuando lo que se quiere es moverse en
 * diagonal: la rueda solo va en vertical y las barras obligan a ir hasta el
 * borde. Agarrar el fondo y tirar es el gesto de cualquier mapa.
 *
 *
 * SOLO DESDE EL FONDO, Y SOLO CON EL MOUSE.
 *
 * El fondo es lo que NO es una caja ni un control: `ignorar` lista lo que se
 * queda con el gesto. Sin eso, arrastrar una caja movería el lienzo debajo y
 * las dos cosas se anularían.
 *
 * Y solo con mouse porque en touch el navegador YA desplaza al arrastrar: si
 * además lo hiciéramos nosotros, el lienzo viajaría al doble de velocidad.
 *
 *
 * TAMPOCO DESDE LAS BARRAS. Un `pointerdown` sobre la barra de desplazamiento
 * cae en el contenedor igual que uno sobre el fondo, así que sin distinguirlos
 * arrastrar la barra movería el lienzo dos veces —lo que arrastra la barra más
 * lo que arrastra el paneo—. La barra queda fuera de `clientWidth`, y eso es
 * lo que se mira.
 *
 *     const paneo = usePaneo();
 *     <div ref={paneo.ref} className={paneo.puedeDesplazar ? 'cursor-grab' : ''}
 *          onPointerDown={paneo.alApretar} onPointerMove={paneo.alMover}
 *          onPointerUp={paneo.alSoltar} onPointerCancel={paneo.alSoltar}>
 *
 *
 * EL CONTENEDOR NECESITA UN ALTO ACOTADO. Con `overflow:auto` pero sin `height`
 * ni `max-height`, el div crece hasta contener todo y `scrollHeight` termina
 * igual a `clientHeight`: no hay nada que desplazar y el paneo no mueve nada.
 * Quien scrollea en ese caso es la página, y eso no lo maneja este hook.
 *
 * Los tres manejadores se devuelven sueltos —y no como un objeto para
 * esparcir— porque el contenedor que los recibe suele tener los suyos: acá el
 * mismo div ya escucha el arrastre de los cables.
 */
const NO_ARRASTRA = 'button, a, input, select, textarea, [role="button"], [role="switch"], [data-caja]';

export default function usePaneo({ ignorar = NO_ARRASTRA, activo = true } = {}) {

    const nodo = useRef(null);
    const inicio = useRef(null);
    const observador = useRef(null);
    const [paneando, setPaneando] = useState(false);

    /**
     * SI HAY ALGO QUE DESPLAZAR.
     *
     * El contenedor puede no desbordar —contenido chico, pantalla ancha, zoom
     * alejado— y entonces no hay paneo posible. Se expone para que la mano
     * abierta del cursor no prometa un gesto que no va a hacer nada.
     */
    const [puedeDesplazar, setPuedeDesplazar] = useState(false);

    const revisar = useCallback(() => {
        const el = nodo.current;
        if (!el) return;
        // Un píxel de tolerancia: entre el redondeo del layout y el zoom, un
        // contenedor que entra justo se declara desbordado por nada.
        setPuedeDesplazar(
            el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
        );
    }, []);

    // El ref monta el observador: hay que mirar las dos cosas, porque el
    // desbordamiento cambia tanto si se achica el contenedor como si crece lo
    // que tiene adentro —y el zoom hace lo segundo—.
    const ref = useCallback((n) => {
        observador.current?.disconnect();
        observador.current = null;
        nodo.current = n;
        if (!n) return;

        const ro = new ResizeObserver(revisar);
        ro.observe(n);
        if (n.firstElementChild) ro.observe(n.firstElementChild);
        observador.current = ro;
        revisar();
    }, [revisar]);

    const alApretar = useCallback((e) => {
        const el = nodo.current;
        if (!el || !activo) return;

        // En touch y lápiz el navegador ya desplaza solo.
        if (e.pointerType !== 'mouse' || e.button !== 0) return;

        // Sobre una caja o un control, el gesto es de ellos.
        if (e.target?.closest?.(ignorar)) return;

        // Sobre las barras de desplazamiento, del navegador.
        const r = el.getBoundingClientRect();
        if (e.clientX - r.left > el.clientWidth) return;
        if (e.clientY - r.top > el.clientHeight) return;

        // Y si no hay nada que desplazar, tampoco hay gesto: el cursor no
        // debería cerrarse en un puño para después no mover nada.
        if (el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1) return;

        inicio.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
        try { el.setPointerCapture(e.pointerId); }
        catch { /* el puntero se soltó entre el evento y esta línea */ }
        setPaneando(true);
    }, [ignorar, activo]);

    const alMover = useCallback((e) => {
        const el = nodo.current;
        const desde = inicio.current;
        if (!el || !desde) return;

        // Al revés que el puntero: arrastrar el fondo hacia la izquierda trae
        // a la vista lo que estaba a la derecha.
        el.scrollLeft = desde.left - (e.clientX - desde.x);
        el.scrollTop = desde.top - (e.clientY - desde.y);
    }, []);

    const alSoltar = useCallback((e) => {
        if (!inicio.current) return;
        inicio.current = null;
        setPaneando(false);
        try { nodo.current?.releasePointerCapture?.(e.pointerId); }
        catch { /* el puntero ya se había soltado */ }
    }, []);

    return { ref, paneando, puedeDesplazar, alApretar, alMover, alSoltar };
}
