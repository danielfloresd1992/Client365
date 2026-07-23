'use client';
import { initials, photoUrl } from '../../lib/format.js';
import { labelFor } from '../../lib/fieldLabels.js';

/**
 * Fila de autoría que se muestra debajo de los títulos de una alerta.
 *
 * @param person - { name, surName, img, date?, changedFields? }
 * @param kind   - 'creator' (chip verde, "creó la alerta")
 *                 'editor'  (chip gris,  "cambió: <campos>")
 */
export default function PersonRow({ person, kind }) {
    const isCreator = kind === 'creator';
    const name      = `${person?.name ?? ''} ${person?.surName ?? ''}`.trim() || 'Usuario';
    const url       = photoUrl(person?.img);
    const fields    = Array.isArray(person?.changedFields) ? person.changedFields : [];
    const dateStr   = person?.date ? new Date(person.date).toLocaleDateString() : '';

    const detail = isCreator
        ? 'creó la alerta'
        : (fields.length ? `cambió: ${fields.map(labelFor).join(', ')}` : 'editó');

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span style={{
                width:          '22px',
                height:         '22px',
                borderRadius:   '50%',
                flexShrink:     0,
                overflow:       'hidden',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     isCreator ? '#dcfce7' : '#e5e7eb',
                color:          isCreator ? '#15803d' : '#4b5563',
                fontSize:       '8px',
                fontWeight:     700,
                border:         '1.5px solid #fff',
                boxShadow:      '0 1px 2px rgba(0,0,0,0.10)',
            }}>
                {url
                    ? <img src={url} alt='' loading='lazy' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(person)}
            </span>

            <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {name}
            </span>

            <span style={{
                fontSize:     '10px',
                color:        isCreator ? '#15803d' : '#6b7280',
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                minWidth:     0,
            }}>
                · {detail}
            </span>

            {dateStr && (
                <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>
                    {dateStr}
                </span>
            )}
        </div>
    );
}
