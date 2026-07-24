'use client';
/**
 * useDragCopy — hook reutilizable de arrastrar-para-copiar entre componentes.
 *
 * Generaliza el patrón "arrastro A y lo suelto sobre B para copiar A en B".
 * No sabe nada del dominio: `source` y `target` son payloads arbitrarios
 * (números de día, ids, objetos…) y la acción real la decide el consumidor
 * en `onDropCopy` (ahí va la confirmación con el modal global, la petición, etc.).
 *
 * Uso:
 *   const { dragProps, dropProps, overTarget, isDragging } = useDragCopy({
 *       onDropCopy: (source, target) => { ... },       // se soltó source sobre target
 *       canDrop:    (source, target) => boolean,       // opcional: filtra destinos válidos
 *   });
 *
 *   <div {...dragProps(3)}>Miércoles</div>             // origen arrastrable
 *   <div {...dropProps(4)}>Jueves</div>                // destino que acepta el drop
 *
 * `overTarget` permite resaltar el destino bajo el cursor e `isDragging`
 * atenuar/marcar los destinos posibles mientras se arrastra.
 */
import { useState, useCallback } from 'react';

export default function useDragCopy({ onDropCopy, canDrop } = {}) {

    const [dragSource, setDragSource] = useState(null);   // payload en vuelo (null = no hay arrastre)
    const [overTarget, setOverTarget] = useState(null);   // destino bajo el cursor

    const allowed = useCallback(
        (source, target) => source !== null && source !== target && (!canDrop || canDrop(source, target)),
        [canDrop],
    );

    /** Props para el elemento ORIGEN. `draggable=false` lo desactiva sin desmontar. */
    const dragProps = (source, draggable = true) => ({
        draggable,
        onDragStart: e => {
            setDragSource(source);
            e.dataTransfer.effectAllowed = 'copy';
            // Firefox exige datos para iniciar el arrastre
            try { e.dataTransfer.setData('text/plain', String(source)); } catch { /* noop */ }
        },
        onDragEnd: () => {
            setDragSource(null);
            setOverTarget(null);
        },
    });

    /** Props para cada elemento DESTINO. */
    const dropProps = target => ({
        onDragOver: e => {
            if (!allowed(dragSource, target)) return;
            e.preventDefault();                       // habilita soltar aquí
            e.dataTransfer.dropEffect = 'copy';
            setOverTarget(target);
        },
        onDragLeave: () => {
            setOverTarget(prev => (prev === target ? null : prev));
        },
        onDrop: e => {
            e.preventDefault();
            const source = dragSource;
            setDragSource(null);
            setOverTarget(null);
            if (!allowed(source, target)) return;
            onDropCopy?.(source, target);
        },
    });

    return {
        dragProps,
        dropProps,
        dragSource,
        overTarget,
        isDragging: dragSource !== null,
    };
}