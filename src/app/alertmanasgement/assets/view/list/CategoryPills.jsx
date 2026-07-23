'use client';
import { FaFilter } from 'react-icons/fa';
import { metaOf } from '../../lib/categoryMeta.js';

/** Estilo base compartido por todas las pills de filtro. */
const PILL_BASE = {
    flexShrink:   0,
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '5px',
    padding:      '6px 13px',
    borderRadius: '999px',
    cursor:       'pointer',
    fontWeight:   600,
    fontSize:     '12px',
    whiteSpace:   'nowrap',
    transition:   'all 0.15s ease',
};

/**
 * Filtro por categoría (tags). 'all' muestra todas las secciones;
 * cualquier otro valor deja visible únicamente esa categoría.
 *
 * @param categories - arreglo { text, value } de ../model/category.js
 * @param active     - categoría seleccionada ('all' por defecto)
 * @param onSelect   - cambia la categoría activa
 */
export default function CategoryPills({ categories, active, onSelect }) {
    return (
        <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', flexWrap: 'nowrap', paddingTop: '10px', paddingBottom: '10px' }}>
            {/* Pill especial "Todos" */}
            <button
                type='button'
                onClick={() => onSelect('all')}
                style={{
                    ...PILL_BASE,
                    background: active === 'all' ? '#1f2937' : '#fff',
                    color:      active === 'all' ? '#fff'     : '#4b5563',
                    border:     active === 'all' ? '1px solid #1f2937' : '1px solid #e6dcc6',
                    boxShadow:  active === 'all' ? '0 2px 6px rgba(31,41,55,0.22)' : 'none',
                }}
            >
                <FaFilter size={10} /> Todos
            </button>

            {/* Una pill por categoría */}
            {categories.map((item, i) => {
                const meta     = metaOf(item.value);
                const isActive = active === item.value;
                return (
                    <button
                        key={i}
                        type='button'
                        title={item.text}
                        onClick={() => onSelect(item.value)}
                        style={{
                            ...PILL_BASE,
                            background: isActive ? meta.color : '#fff',
                            color:      isActive ? '#fff'     : meta.color,
                            border:     isActive ? `1px solid ${meta.color}` : `1px solid ${meta.bg}`,
                            boxShadow:  isActive ? `0 2px 7px ${meta.color}55` : 'none',
                        }}
                    >
                        <meta.Icon size={10} /> {item.text}
                    </button>
                );
            })}
        </div>
    );
}
