'use client';
import { FaCheck } from 'react-icons/fa';

/**
 * Indicador de una capacidad de la alerta (reporte del cliente / alerta en vivo).
 * Verde con ✓ cuando está habilitada; gris atenuado cuando no.
 */
export default function FlagChip({ Icon, label, active }) {
    return (
        <span
            title={`${label}: ${active ? 'habilitado' : 'no habilitado'}`}
            style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '4px',
                padding:      '2px 8px',
                borderRadius: '999px',
                fontSize:     '10px',
                fontWeight:   700,
                flexShrink:   0,
                background:   active ? '#ecfdf5' : '#f3f4f6',
                color:        active ? '#047857' : '#9ca3af',
                border:       active ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
            }}
        >
            <Icon size={9} />
            {label}
            {active && <FaCheck size={8} />}
        </span>
    );
}
