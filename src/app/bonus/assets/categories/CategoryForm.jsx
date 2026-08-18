'use client';
import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { GRUPOS_DE_ICONO, iconOf } from '@/libs/alerts/categoryIcons.js';

/**
 * Alta y edición de una categoría.
 *
 * Al CREAR se piden las etiquetas, el ícono y el color. Al EDITAR se muestra lo
 * mismo salvo la clave, que aparece pero deshabilitada: es con lo que las
 * alertas apuntan a su categoría y cambiarla las dejaría sin ella. El servidor
 * la ignora igual; acá se muestra para que se entienda por qué no se toca.
 */

/**
 * Paletas listas. Cada una es un par fondo/color, no dos elecciones sueltas:
 * el fondo va claro y el color oscuro del mismo tono, que es lo que hace que
 * el ícono se lea dentro del círculo.
 *
 * Se ofrecen armadas —y no dos selectores de color— porque acertarle a mano a
 * dos hexadecimales que contrasten entre sí y que además peguen con las otras
 * doce categorías es un trabajo de diseño, no de configuración.
 *
 * Van agrupadas por familia para poder recorrerlas: con veinticuatro sueltas,
 * elegir "otro verde" obliga a mirarlas todas.
 */
const FAMILIAS_DE_COLOR = [
    {
        titulo: 'Fríos',
        paletas: [
            { bg: '#dbeafe', color: '#1d4ed8', nombre: 'Azul' },
            { bg: '#e0f2fe', color: '#0369a1', nombre: 'Celeste' },
            { bg: '#cffafe', color: '#0e7490', nombre: 'Cian' },
            { bg: '#ccfbf1', color: '#0f766e', nombre: 'Turquesa' },
            { bg: '#e0e7ff', color: '#4338ca', nombre: 'Índigo' },
            { bg: '#ede9fe', color: '#6d28d9', nombre: 'Lavanda' },
            { bg: '#f3e8ff', color: '#7e22ce', nombre: 'Morado' },
            { bg: '#fae8ff', color: '#a21caf', nombre: 'Fucsia' },
        ],
    },
    {
        titulo: 'Verdes',
        paletas: [
            { bg: '#dcfce7', color: '#1f9a08', nombre: 'Verde marca' },
            { bg: '#d1fae5', color: '#065f46', nombre: 'Bosque' },
            { bg: '#ecfdf5', color: '#047857', nombre: 'Menta' },
            { bg: '#ecfccb', color: '#4d7c0f', nombre: 'Lima' },
            { bg: '#f7fee7', color: '#3f6212', nombre: 'Oliva' },
        ],
    },
    {
        titulo: 'Cálidos',
        paletas: [
            { bg: '#fef9c3', color: '#854d0e', nombre: 'Amarillo' },
            { bg: '#fef3c7', color: '#b45309', nombre: 'Ámbar' },
            { bg: '#ffedd5', color: '#c2410c', nombre: 'Naranja' },
            { bg: '#fff7ed', color: '#9a3412', nombre: 'Terracota' },
            { bg: '#fee2e2', color: '#991b1b', nombre: 'Rojo' },
            { bg: '#fef2f2', color: '#b91c1c', nombre: 'Carmín' },
            { bg: '#ffe4e6', color: '#9f1239', nombre: 'Coral' },
            { bg: '#fce7f3', color: '#be185d', nombre: 'Rosa' },
        ],
    },
    {
        titulo: 'Neutros',
        paletas: [
            { bg: '#f1f5f9', color: '#475569', nombre: 'Gris' },
            { bg: '#e2e8f0', color: '#334155', nombre: 'Pizarra' },
            { bg: '#f3f4f6', color: '#374151', nombre: 'Grafito' },
            { bg: '#efebe9', color: '#5d4037', nombre: 'Marrón' },
        ],
    },
];

/** Todas las paletas juntas, para lo que necesite recorrerlas planas. */
const PALETAS = FAMILIAS_DE_COLOR.flatMap(f => f.paletas);

const ETIQUETA = {
    display:       'block',
    fontSize:      '11px',
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color:         '#6b7280',
    marginBottom:  '5px',
};

const CAMPO = {
    width:        '100%',
    height:       '38px',
    padding:      '0 11px',
    borderRadius: '9px',
    border:       '1px solid #e6dcc6',
    fontSize:     '13px',
    color:        '#1f2937',
    background:   '#fff',
    boxSizing:    'border-box',
};


export default function CategoryForm({ categoria, onGuardar, onCancelar, guardando }) {
    const editando = Boolean(categoria?._id);

    const [es, setEs]       = useState(categoria?.es || '');
    const [en, setEn]       = useState(categoria?.en || '');
    const [icon, setIcon]   = useState(categoria?.icon || 'bell');
    const [bg, setBg]       = useState(categoria?.bg || PALETAS[0].bg);
    const [color, setColor] = useState(categoria?.color || PALETAS[0].color);
    const [order, setOrder] = useState(categoria?.order ?? 100);

    const Icono = iconOf(icon);
    const puedeGuardar = es.trim() && en.trim() && !guardando;

    const enviar = (e) => {
        e.preventDefault();
        if (!puedeGuardar) return;
        onGuardar({ es: es.trim(), en: en.trim(), icon, bg, color, order: Number(order) || 100 });
    };

    return (
        <form
            onSubmit={enviar}
            style={{
                display: 'flex', flexDirection: 'column', gap: '15px',
                padding: '18px', borderRadius: '14px',
                border: '1px solid #e6dcc6', background: '#fffdf8',
            }}
        >
            {/* Vista previa: se ve cómo va a quedar antes de guardar, que es más
                directo que deducirlo de un código de color. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                    width: '38px', height: '38px', borderRadius: '11px', background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Icono size={17} color={color} />
                </span>
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1f2937' }}>
                        {es.trim() || 'Nombre de la categoría'}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                        {editando ? categoria.value : 'la clave se genera al guardar'}
                    </p>
                </div>
            </div>

            {/* Etiquetas */}
            <div style={{ display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={ETIQUETA} htmlFor='cat-es'>Nombre (español)</label>
                    <input id='cat-es' style={CAMPO} value={es} onChange={e => setEs(e.target.value)} placeholder='Incidencias en el local' />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={ETIQUETA} htmlFor='cat-en'>Nombre (inglés)</label>
                    <input id='cat-en' style={CAMPO} value={en} onChange={e => setEn(e.target.value)} placeholder='Local incidents' />
                </div>
                <div style={{ width: '92px' }}>
                    <label style={ETIQUETA} htmlFor='cat-order'>Orden</label>
                    <input id='cat-order' type='number' style={CAMPO} value={order} onChange={e => setOrder(e.target.value)} />
                </div>
            </div>

            {editando && (
                <div>
                    <label style={ETIQUETA} htmlFor='cat-value'>Clave (no se puede cambiar)</label>
                    <input
                        id='cat-value'
                        style={{ ...CAMPO, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                        value={categoria.value}
                        disabled
                    />
                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                        Es con lo que las alertas quedan guardadas. Cambiarla las dejaría sin categoría.
                    </p>
                </div>
            )}

            {/* Ícono, por tema.
                Con cien íconos una rejilla plana es un muro donde nadie
                encuentra nada; los títulos convierten la búsqueda en "voy a
                Comida" en vez de recorrerlos todos. La caja tiene alto máximo
                y su propio desplazamiento: si no, el selector empujaría fuera
                de la vista los botones de guardar. */}
            <div>
                <label style={ETIQUETA}>Ícono</label>
                <div style={{
                    maxHeight: '220px', overflowY: 'auto',
                    border: '1px solid #e6dcc6', borderRadius: '10px',
                    padding: '10px', background: '#fff',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                    {GRUPOS_DE_ICONO.map(grupo => (
                        <div key={grupo.titulo}>
                            <p style={{
                                margin: '0 0 5px', fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af',
                            }}>
                                {grupo.titulo}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {grupo.nombres.map(nombre => {
                                    const I = iconOf(nombre);
                                    const activo = nombre === icon;
                                    return (
                                        <button
                                            key={nombre}
                                            type='button'
                                            title={nombre}
                                            onClick={() => setIcon(nombre)}
                                            style={{
                                                width: '34px', height: '34px', borderRadius: '9px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: activo ? bg : '#fff',
                                                border: activo ? `2px solid ${color}` : '1px solid #e6dcc6',
                                            }}
                                        >
                                            <I size={14} color={activo ? color : '#6b7280'} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Color, por familia.
                Agrupados para poder pedir "otro verde" sin mirar las
                veinticuatro. El nombre va en el title: el color elegido se
                verá después en una lista junto a los demás, y saber que es
                "Ámbar" y no "ese amarillo" ayuda a no repetirlo. */}
            <div>
                <label style={ETIQUETA}>Color</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {FAMILIAS_DE_COLOR.map(familia => (
                        <div key={familia.titulo}>
                            <p style={{
                                margin: '0 0 5px', fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af',
                            }}>
                                {familia.titulo}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {familia.paletas.map(p => {
                                    const activo = p.bg === bg && p.color === color;
                                    return (
                                        <button
                                            key={p.nombre}
                                            type='button'
                                            title={p.nombre}
                                            onClick={() => { setBg(p.bg); setColor(p.color); }}
                                            style={{
                                                width: '34px', height: '34px', borderRadius: '9px', cursor: 'pointer',
                                                background: p.bg,
                                                border: activo ? `2px solid ${p.color}` : '1px solid #e6dcc6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            {/* El tilde va del color OSCURO de la propia paleta:
                                                es la comprobación de que ese par contrasta. */}
                                            {activo && <FaCheck size={11} color={p.color} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
                <button
                    type='button'
                    onClick={onCancelar}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '9px 15px', borderRadius: '9px', cursor: 'pointer',
                        border: '1px solid #e6dcc6', background: '#fff',
                        fontSize: '13px', fontWeight: 700, color: '#4b5563',
                    }}
                >
                    <FaTimes size={11} /> Cancelar
                </button>

                <button
                    type='submit'
                    disabled={!puedeGuardar}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '9px 17px', borderRadius: '9px', border: 'none',
                        cursor: puedeGuardar ? 'pointer' : 'default',
                        opacity: puedeGuardar ? 1 : 0.55,
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                        background: 'linear-gradient(135deg, #29c50c 0%, #1f9a08 100%)',
                        boxShadow: '0 3px 10px rgba(41,197,12,0.30)',
                    }}
                >
                    <FaCheck size={11} /> {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear categoría'}
                </button>
            </div>
        </form>
    );
}

export { PALETAS };
