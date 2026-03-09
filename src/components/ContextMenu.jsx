import React from 'react';

/**
 * Menú contextual reutilizable.
 * @param {Object} props
 * @param {Object} props.position - {x, y} posición del menú
 * @param {boolean} props.open - Si el menú está abierto
 * @param {function} props.onClose - Función para cerrar el menú
 * @param {React.ReactNode} props.children - Opciones del menú
 */
export default function ContextMenu({ position, open, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [open, onClose]);

  if (!open || !position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: 160,
        padding: 4,
      }}
      onContextMenu={e => e.preventDefault()}
    >
      {children}
    </div>
  );
}
