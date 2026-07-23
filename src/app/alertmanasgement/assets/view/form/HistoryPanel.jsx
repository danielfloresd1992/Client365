'use client';
import { FaHistory } from 'react-icons/fa';
import { initials, photoUrl } from '../../lib/format.js';
import { labelFor } from '../../lib/fieldLabels.js';

/**
 * Historial de ediciones de la alerta, colapsable.
 *
 * Se alimenta de `updateByUser` (auditoría del documento Menu), que el backend
 * envía poblado —con nombre y foto— al pedir la alerta por id. Se muestra de la
 * edición más reciente a la más antigua.
 *
 * @param entries - updateByUser: [{ user: { name, surName, img }, change: [{ key }], date }]
 */
export default function HistoryPanel({ entries }) {
    if (!Array.isArray(entries) || entries.length === 0) return null;

    return (
        <details style={{ margin: '0 0 12px', border: '1px solid #e6dcc6', borderRadius: '10px', background: '#faf7ef', overflow: 'hidden' }}>
            <summary style={{ cursor: 'pointer', padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaHistory size={13} color='#047857' />
                Historial de cambios ({entries.length})
            </summary>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 12px 12px' }}>
                {[...entries].reverse().map((entry, i) => {
                    const url    = photoUrl(entry.user?.img);
                    const fields = Array.isArray(entry.change) ? entry.change.map(c => labelFor(c.key)) : [];

                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', minWidth: 0 }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                                {url
                                    ? <img src={url} alt='' loading='lazy' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials(entry.user)}
                            </span>

                            <span style={{ fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {entry.user?.name} {entry.user?.surName}
                            </span>

                            <span style={{ color: '#6b7280', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                · cambió: {fields.length ? fields.join(', ') : 'sin detalle'}
                            </span>

                            <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: '11px' }}>
                                {entry.date ? new Date(entry.date).toLocaleDateString() : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </details>
    );
}
