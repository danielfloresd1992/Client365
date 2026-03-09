'use client';
import { useState, useCallback } from 'react';

/**
 * Hook para obtener la posición del click derecho para menús contextuales.
 * @returns {Object} { position, handleContextMenu, closeMenu }
 */
export default function useContextMenuPosition() {
    const [position, setPosition] = useState(null);

    const handleContextMenu = useCallback((event) => {
        event.preventDefault();
        setPosition({
            x: event.clientX,
            y: event.clientY,
        });
    }, []);

    const closeMenu = useCallback(() => {
        setPosition(null);
    }, []);

    return { position, handleContextMenu, closeMenu };
}
