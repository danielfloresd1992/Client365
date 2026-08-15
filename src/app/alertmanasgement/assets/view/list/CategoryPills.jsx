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
 * Sirve para las DOS categorías de una alerta, que resuelven su apariencia de
 * forma distinta: la operativa la saca del mapa fijo del código, y la de
 * bonificación la trae en el propio documento porque se crea desde la pantalla.
 * Por eso el resolutor es un parámetro y no algo fijo acá adentro.
 *
 * @param categories   - lista a mostrar: { value, es, active?, ... }
 * @param active       - categoría seleccionada ('all' por defecto)
 * @param onSelect     - cambia la categoría activa
 * @param resolveMeta  - item → { Icon, bg, color }. Por defecto, el mapa fijo.
 * @param allLabel     - texto de la pill que quita el filtro
 */
export default function CategoryPills({
    categories,
    active,
    onSelect,
    resolveMeta = item => metaOf(item.value),
    allLabel = 'Todos',
}) {
    return (
        <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', flexWrap: 'nowrap', paddingTop: '10px', paddingBottom: '10px' }}>
            {/* Pill especial que quita el filtro */}
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
                <FaFilter size={10} /> {allLabel}
            </button>

            {/* Una pill por categoría */}
            {categories.map((item, i) => {
                const meta     = resolveMeta(item);
                const isActive = active === item.value;
                const etiqueta = item.es || item.value;
                return (
                    <button
                        key={i}
                        type='button'
                        title={item.active === false ? `${etiqueta} (desactivada)` : etiqueta}
                        onClick={() => onSelect(item.value)}
                        style={{
                            ...PILL_BASE,
                            background: isActive ? meta.color : '#fff',
                            color:      isActive ? '#fff'     : meta.color,
                            border:     isActive ? `1px solid ${meta.color}` : `1px solid ${meta.bg}`,
                            boxShadow:  isActive ? `0 2px 7px ${meta.color}55` : 'none',
                            // Una categoría desactivada sigue apareciendo mientras
                            // tenga alertas, pero atenuada: se puede filtrar por
                            // ella sin que parezca una opción vigente.
                            opacity:    item.active === false ? 0.55 : 1,
                        }}
                    >
                        <meta.Icon size={10} /> {etiqueta}
                    </button>
                );
            })}
        </div>
    );
}
