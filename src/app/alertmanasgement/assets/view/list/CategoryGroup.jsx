'use client';
import { metaOf } from '../../lib/categoryMeta.js';

/**
 * Sección de la lista agrupada por categoría: encabezado fijo (sticky) con el
 * ícono, el nombre y el contador, y debajo las tarjetas que recibe por children.
 */
export default function CategoryGroup({ value, text, count, children }) {
    const meta = metaOf(value);

    return (
        <section>
            <div style={{
                display:                'flex',
                alignItems:             'center',
                gap:                    '8px',
                marginBottom:           '12px',
                position:               'sticky',
                top:                    0,
                zIndex:                 2,
                background:             'rgba(249,244,233,0.92)',
                backdropFilter:         'blur(4px)',
                WebkitBackdropFilter:   'blur(4px)',
                paddingTop:             '4px',
                paddingBottom:          '6px',
            }}>
                <span style={{
                    width:          '28px',
                    height:         '28px',
                    borderRadius:   '8px',
                    background:     meta.bg,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                }}>
                    <meta.Icon size={13} color={meta.color} />
                </span>

                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: 0 }}>{text}</h3>

                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: '#fff', border: '1px solid #e6dcc6', borderRadius: '999px', padding: '1px 8px' }}>
                    {count}
                </span>

                <span style={{ flex: 1, height: '1px', background: '#e6dcc6', marginLeft: '4px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {children}
            </div>
        </section>
    );
}
