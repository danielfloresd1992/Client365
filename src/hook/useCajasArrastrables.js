'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * CAJAS QUE SE PUEDEN PONER A MANO.
 *
 * Guarda un desplazamiento `{x, y}` por caja, en píxeles de LAYOUT, para
 * aplicar con `transform: translate(...)`. Con transform y no con margen por
 * la misma razón de siempre: un margen cambiaría el alto de la columna y eso
 * volvería a disparar la medición del mapa.
 *
 *
 * UNA CAJA PUESTA A MANO SALE DE LA COLOCACIÓN AUTOMÁTICA.
 *
 * Es la única forma de que las dos cosas convivan. El mapa acomoda solo cada
 * caja frente a los cables que le llegan; si además se pudiera arrastrar y las
 * dos reglas siguieran vigentes, el próximo cambio de datos devolvería la caja
 * al lugar calculado y el arrastre se sentiría roto. Quien la mueve manda:
 * `posiciones` tiene prioridad y la cascada la saltea. Doble clic —`olvidar`—
 * la devuelve al automático.
 *
 *
 * EL ZOOM DIVIDE. El puntero se mueve en píxeles de pantalla, que ya vienen
 * multiplicados por la escala; el transform se escribe en píxeles de layout.
 * Al 50%, mover el mouse 100px tiene que correr la caja 200 de layout para que
 * en pantalla se vean los 100 que la mano hizo.
 *
 *
 * SE GUARDA EN localStorage, y por eso hay un `listo`: en Next el primer
 * render es del servidor y no puede leerlo, así que la restauración pasa en un
 * efecto. Colocar el mapa antes de eso significa colocarlo dos veces —una en
 * el lugar equivocado— y, con la animación encendida, ver el salto.
 *
 * @param nombre  la clave de localStorage. Sin nombre no persiste.
 * @param escala  el zoom del lienzo.
 * @param activo  false deja las posiciones guardadas pero no permite mover.
 */
export default function useCajasArrastrables({ nombre = '', escala = 1, activo = true } = {}) {

    const [posiciones, setPosiciones] = useState(() => new Map());
    const [listo, setListo] = useState(!nombre);
    const [moviendo, setMoviendo] = useState(null);

    // Espejos para los manejadores del arrastre: viven fuera de React y se
    // crean una sola vez por gesto, así que leer el estado directo les daría
    // el valor del momento en que empezó el arrastre.
    const posRef = useRef(posiciones);
    posRef.current = posiciones;

    const escalaRef = useRef(escala);
    escalaRef.current = escala;

    useEffect(() => {
        if (!nombre) return;
        setPosiciones(leer(nombre));
        setListo(true);
    }, [nombre]);

    const guardar = useCallback((mapa) => {
        if (!nombre) return;
        try {
            const plano = {};
            for (const [clave, p] of mapa) plano[clave] = [p.x, p.y];
            localStorage.setItem(nombre, JSON.stringify(plano));
        }
        catch { /* modo privado, cuota llena: la sesión sigue andando igual */ }
    }, [nombre]);

    const escribir = useCallback((mapa, persistir = true) => {
        posRef.current = mapa;
        setPosiciones(mapa);
        if (persistir) guardar(mapa);
    }, [guardar]);


    /**
     * Empieza a mover una caja. Va en el `onPointerDown` de la caja entera:
     * cualquier parte sirve de agarre menos sus controles, que se quedan con
     * el gesto —el puerto del cable es uno de ellos—.
     *
     * NO cancela el evento. `preventDefault` en un `pointerdown` puede tragarse
     * el `click` y el `dblclick` que vienen detrás, y el doble clic es el gesto
     * que devuelve la caja a su lugar automático. Lo único que ese
     * `preventDefault` compraba era evitar que se seleccione texto al arrastrar,
     * y de eso ya se ocupa el `select-none` del lienzo.
     */
    const tomar = useCallback((e, clave) => {
        if (!activo || e.pointerType === 'touch') return;
        if (e.button !== 0) return;
        if (e.target?.closest?.('button, a, input, [role="button"], [role="switch"]')) return;

        // Que no lo tome también el paneo del lienzo.
        e.stopPropagation();

        const desde = posRef.current.get(clave) || { x: 0, y: 0 };
        const x0 = e.clientX;
        const y0 = e.clientY;

        // Los oyentes van en la ventana y no en la caja: si el puntero sale
        // del lienzo —o de la ventana— a mitad del arrastre, la caja tiene que
        // seguirlo igual y soltarse donde el botón se levante de verdad.
        const mover = (ev) => {
            const k = escalaRef.current || 1;
            const siguiente = new Map(posRef.current);
            siguiente.set(clave, {
                x: Math.round(desde.x + (ev.clientX - x0) / k),
                y: Math.round(desde.y + (ev.clientY - y0) / k),
            });
            escribir(siguiente, false);   // guardar en cada píxel sería absurdo
        };

        const soltar = () => {
            removeEventListener('pointermove', mover);
            removeEventListener('pointerup', soltar);
            removeEventListener('pointercancel', soltar);
            setMoviendo(null);
            guardar(posRef.current);
        };

        addEventListener('pointermove', mover);
        addEventListener('pointerup', soltar);
        addEventListener('pointercancel', soltar);
        setMoviendo(clave);
    }, [activo, escribir, guardar]);


    /** Devuelve UNA caja a su lugar automático. */
    const olvidar = useCallback((clave) => {
        if (!posRef.current.has(clave)) return;
        const siguiente = new Map(posRef.current);
        siguiente.delete(clave);
        escribir(siguiente);
    }, [escribir]);

    /** Devuelve TODAS. Es la salida cuando el mapa quedó hecho un nudo. */
    const limpiar = useCallback(() => {
        if (posRef.current.size === 0) return;
        escribir(new Map());
    }, [escribir]);

    return { posiciones, listo, moviendo, tomar, olvidar, limpiar };
}


const leer = (nombre) => {
    try {
        const crudo = JSON.parse(localStorage.getItem(nombre) || '{}');
        const mapa = new Map();

        for (const [clave, par] of Object.entries(crudo)) {
            // Se valida antes de entrar: una entrada rota —de una versión
            // vieja del formato, o editada a mano— pondría `NaN` en el
            // transform y la caja desaparecería de la pantalla sin explicación.
            if (!Array.isArray(par) || par.length !== 2) continue;
            const [x, y] = par.map(Number);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            mapa.set(clave, { x, y });
        }

        return mapa;
    }
    catch { return new Map(); }
};
