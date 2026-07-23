'use client';
import { slug } from '../../lib/format.js';

/**
 * Encabezado visual de una sección del formulario (ícono + etiqueta).
 *
 * El `id` se deriva del label con `slug()`; la barra de navegación (FormNav)
 * usa exactamente el mismo label para hacer scroll hasta aquí, por lo que ambos
 * deben mantenerse sincronizados.
 */
export default function SectionHeader({ icon: Icon, label, color = '#374151', bg = '#f3f4f6' }) {
    return (
        <div id={slug(label)} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 10px',
            borderRadius: '7px',
            background: bg,
            marginBottom: '6px',
            scrollMarginTop: '10px',
        }}>
            <Icon size={13} color={color} />
            <span style={{
                fontWeight: 700,
                fontSize: '11px',
                color: color,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
            }}>
                {label}
            </span>
        </div>
    );
}
