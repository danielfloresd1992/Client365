'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Menú contextual reutilizable.
 *
 * Se renderiza en un portal sobre document.body para escapar de contenedores
 * con `zoom`/`overflow` (la grilla de horarios escala su contenido y un
 * position:fixed dentro de ella quedaría mal posicionado).
 *
 * Se cierra con: click/tap fuera del menú, scroll en cualquier contenedor,
 * tecla Escape y resize de la ventana.
 *
 * @param {Object} props
 * @param {Object} props.position - {x, y} posición del menú (coordenadas de viewport)
 * @param {boolean} props.open - Si el menú está abierto
 * @param {function} props.onClose - Función para cerrar el menú
 * @param {React.ReactNode} props.children - Opciones del menú
 */
export default function ContextMenu({ position, open, onClose, children }) {
    const menuRef = useRef(null);
    const [adjustedPos, setAdjustedPos] = useState(null);

    // Reajustar la posición para que el menú no se corte en los bordes del viewport
    useLayoutEffect(() => {
        if (!open || !position) {
            setAdjustedPos(null);
            return;
        }
        const el = menuRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const MARGIN = 8;
        let { x, y } = position;
        if (x + rect.width > window.innerWidth - MARGIN) x = Math.max(MARGIN, window.innerWidth - rect.width - MARGIN);
        if (y + rect.height > window.innerHeight - MARGIN) y = Math.max(MARGIN, window.innerHeight - rect.height - MARGIN);
        setAdjustedPos({ x, y });
    }, [open, position]);

    useEffect(() => {
        if (!open) return;

        // Solo cierra si el click/tap ocurre FUERA del menú
        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
        };
        // capture:true para atrapar el scroll de contenedores internos (la grilla)
        const handleScroll = () => onClose();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('pointerdown', handlePointerDown, true);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown, true);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open || !position || typeof window === 'undefined') return null;

    const pos = adjustedPos || position;

    return createPortal(
        <div
            ref={menuRef}
            role='menu'
            style={{ top: pos.y, left: pos.x }}
            className='ctx-menu fixed z-[1010] min-w-[190px] bg-white rounded-lg border border-gray-200 shadow-xl p-1.5'
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
            <style jsx>{`
                .ctx-menu {
                    animation: ctxMenuIn 0.15s ease-out;
                    transform-origin: top left;
                }
                @keyframes ctxMenuIn {
                    from {
                        opacity: 0;
                        transform: scale(0.96) translateY(-2px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .ctx-menu {
                        animation: none;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
}