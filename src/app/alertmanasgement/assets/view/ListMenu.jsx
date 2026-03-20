'use client';
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getMenuAll, deleteMenu } from '../model/menu.model.js';
import { setConfigModal } from '@/store/slices/globalModal.js';
import categoryArr from '../model/category.js';

// ── Iconos generales ──────────────────────────────────────────────────────────
import {
    FaBell,             // encabezado general / estado vacío
    FaFilter,           // pill "Todos"
    FaTrash,            // botón eliminar alerta
} from 'react-icons/fa';

// ── Iconos por categoría ──────────────────────────────────────────────────────
import {
    FaUsers,                // client        — atención al cliente
    FaClock,                // delay         — demoras
    FaDoorOpen,             // door          — puerta
    FaUserTie,              // employee      — empleados
    FaTools,                // failed        — fallas
    FaUtensils,             // food          — comidas
    FaExclamationTriangle,  // incident      — incidencias
    FaBuilding,             // localIncident — incidencias en el local
    FaBoxOpen,              // merchandise   — mercancía
    FaClipboardCheck,       // protocol      — protocolos
    FaTrashAlt,             // trash         — basura
    FaShieldAlt,            // perimeter     — perimetral
} from 'react-icons/fa';

// ── Metadatos por categoría: ícono + paleta cromática ────────────────────────
// bg    → color de fondo del círculo/pill
// color → color del ícono y del texto activo
const CATEGORY_META = {
    client:        { Icon: FaUsers,                bg: '#dbeafe', color: '#1d4ed8' },
    delay:         { Icon: FaClock,                bg: '#fef9c3', color: '#854d0e' },
    door:          { Icon: FaDoorOpen,             bg: '#f3e8ff', color: '#7e22ce' },
    employee:      { Icon: FaUserTie,              bg: '#d1fae5', color: '#065f46' },
    failed:        { Icon: FaTools,                bg: '#fee2e2', color: '#991b1b' },
    food:          { Icon: FaUtensils,             bg: '#fff7ed', color: '#9a3412' },
    incident:      { Icon: FaExclamationTriangle,  bg: '#ffedd5', color: '#c2410c' },
    localIncident: { Icon: FaBuilding,             bg: '#e0f2fe', color: '#0369a1' },
    merchandise:   { Icon: FaBoxOpen,              bg: '#fdf4ff', color: '#7c3aed' },
    protocol:      { Icon: FaClipboardCheck,       bg: '#ecfdf5', color: '#047857' },
    trash:         { Icon: FaTrashAlt,             bg: '#f1f5f9', color: '#475569' },
    perimeter:     { Icon: FaShieldAlt,            bg: '#fef2f2', color: '#b91c1c' },
};

// ── Badge de multiplicador de bono ────────────────────────────────────────────
// X1 azul / X2 ámbar / X3 naranja / X5 rojo
const BONUS_BADGE = {
    1: { bg: '#dbeafe', color: '#1e40af', label: 'X1' },
    2: { bg: '#fef9c3', color: '#92400e', label: 'X2' },
    3: { bg: '#ffedd5', color: '#c2410c', label: 'X3' },
    5: { bg: '#fee2e2', color: '#991b1b', label: 'X5' },
};

function ListMenu({ setMenu, resetNoveltie, modal, newMENU, resetAddManuState }) {

    const [arrayMenuAll, setArrayMenuAll] = useState([]);
    const [category, setCategory]         = useState('all');
    const categoryRef                     = useRef(null);
    const dispatch                        = useDispatch();

    // Recarga la lista cuando cambia el filtro de categoría o se crea una nueva alerta
    useEffect(() => {
        getMenuAll(category, (err, { menuList, categoryList }) => {
            categoryRef.current = categoryList;
            setArrayMenuAll([...menuList]);
        });
    }, [category, newMENU]);

    // Inserta la alerta recién creada en el estado local sin refetch completo
    useEffect(() => {
        if (Boolean(newMENU)) {
            setArrayMenuAll(prev => [...prev, newMENU]);
            resetAddManuState();
        }
    }, [newMENU]);

    // Remueve el ítem del estado local tras confirmarse la eliminación en el servidor
    const deleteMenuAllArray = id => {
        setArrayMenuAll(prev => prev.filter(menu => id !== menu._id));
        resetNoveltie();
    };

    // ── Tarjeta de alerta individual ─────────────────────────────────────────
    const listMenuHtml = arrayMenuAll.map((item, index) => {

        // Metadatos de categoría (fallback si el valor no está mapeado)
        const meta            = CATEGORY_META[item.category] ?? { Icon: FaBell, bg: '#f3f4f6', color: '#374151' };
        const { Icon, bg, color } = meta;

        // Sistema nuevo de bonificación
        const bonusActive = Boolean(item.bonusCalculationRules?.activate);
        const bonusWorth  = item.bonusCalculationRules?.defaultRule?.worth ?? 1;
        const badge       = BONUS_BADGE[bonusWorth] ?? BONUS_BADGE[1];

        return (
            <div
                key={`${index}_${item._id}`}
                style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '10px',
                    padding:      '10px 12px',
                    borderRadius: '10px',
                    background:   '#fff',
                    // Borde verde destacado cuando el bono está activo
                    border:       bonusActive ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    width:        '100%',
                    boxSizing:    'border-box',
                    transition:   'box-shadow 0.15s',
                }}
            >
                {/* Círculo con ícono de la categoría */}
                <div style={{
                    width:          '40px',
                    height:         '40px',
                    borderRadius:   '50%',
                    background:     bg,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                }}>
                    <Icon size={17} color={color} />
                </div>

                {/* Título en español e inglés */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p
                        style={{
                            fontWeight:   600,
                            fontSize:     '13px',
                            cursor:       'pointer',
                            margin:       0,
                            whiteSpace:   'nowrap',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                        }}
                        onClick={() => setMenu(item._id)}
                    >
                        {item.es}
                    </p>
                    <p style={{
                        fontSize:     '11px',
                        color:        '#6b7280',
                        margin:       0,
                        whiteSpace:   'nowrap',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {item.en}
                    </p>
                </div>

                {/* Badge multiplicador de bono (visible solo si está activo) */}
                {bonusActive && (
                    <span style={{
                        fontSize:     '11px',
                        fontWeight:   700,
                        padding:      '2px 8px',
                        borderRadius: '999px',
                        background:   badge.bg,
                        color:        badge.color,
                        flexShrink:   0,
                    }}>
                        {badge.label}
                    </span>
                )}

                {/* Botón de eliminar con ícono de papelera */}
                <button
                    type='button'
                    title='Eliminar alerta'
                    style={{
                        flexShrink:     0,
                        padding:        '7px',
                        borderRadius:   '8px',
                        border:         '1px solid #fee2e2',
                        background:     '#fff5f5',
                        color:          '#dc2626',
                        cursor:         'pointer',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
                    onClick={() => {
                        dispatch(setConfigModal({
                            modalOpen:   true,
                            title:       '¿Seguro que quieres eliminar este elemento?',
                            description: '',
                            isCallback:  () => {
                                deleteMenu(item._id, (err) => {
                                    if (err) {
                                        const text =
                                            err.response?.status === 401 ? 'Usuario no autenticado.'  :
                                            err.response?.status === 403 ? 'Usuario no autorizado.'   :
                                            'Ha ocurrido un error.';
                                        dispatch(setConfigModal({ modalOpen: true, title: 'Error', description: text, isCallback: null, type: 'error' }));
                                    } else {
                                        dispatch(setConfigModal({ modalOpen: true, title: 'Eliminado', description: 'Alerta eliminada de la lista.', isCallback: null, type: 'successfull' }));
                                        deleteMenuAllArray(item._id);
                                    }
                                });
                            },
                            type: 'warning'
                        }));
                    }}
                >
                    <FaTrash size={13} />
                </button>
            </div>
        );
    });

    return (
        <div
            className='contentStatic scrollthemeY'
            style={{
                width:         '50%',
                background:    '#fff',
                display:       'flex',
                flexDirection: 'column',
                gap:           '12px',
                padding:       '16px',
                borderRadius:  '12px',
                border:        '1px solid #e5e7eb',
                boxShadow:     '0 1px 4px rgba(0,0,0,0.06)',
                alignContent:  'flex-start',
                boxSizing:     'border-box',
            }}
        >
            {/* ── Cabecera: ícono + título + contador de alertas ─────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',   height: '50px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBell size={20} color='#d97706' />
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
                        Gestión de Alertas
                    </span>
                </div>
                {/* Contador en badge rojo */}
                <span style={{
                    background:   '#fee2e2',
                    color:        '#b91c1c',
                    borderRadius: '999px',
                    fontSize:     '12px',
                    fontWeight:   700,
                    padding:      '2px 10px',
                }}>
                    {arrayMenuAll.length} alertas
                </span>
            </div>

            {/* ── Filtro por categoría: pills horizontales con ícono ──────────── */}
            {/* Se usa overflowX auto para que no empuje el layout cuando hay muchas categorías */}
            <div style={{
                display:       'flex',
                gap:           '6px',
                overflowX:     'auto',
                paddingBottom: '4px',
                flexWrap:      'nowrap',
                height: '40px'
            }}>
                {/* Pill especial "Todos" */}
                <button
                    type='button'
                    onClick={() => setCategory('all')}
                    style={{
                        flexShrink:   0,
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '5px',
                        padding:      '5px 12px',
                        borderRadius: '999px',
                        border:       'none',
                        cursor:       'pointer',
                        fontWeight:   600,
                        fontSize:     '12px',
                        background:   category === 'all' ? '#111827' : '#f3f4f6',
                        color:        category === 'all' ? '#fff'     : '#374151',
                        transition:   'background 0.15s',
                    }}
                >
                    <FaFilter size={10} /> Todos
                </button>

                {/* Pill por cada categoría */}
                {categoryArr.map((item, i) => {
                    const meta   = CATEGORY_META[item.value] ?? { Icon: FaBell, bg: '#f3f4f6', color: '#374151' };
                    const active = category === item.value;
                    return (
                        <button
                            key={i}
                            type='button'
                            title={item.text}
                            onClick={() => setCategory(item.value)}
                            style={{
                                flexShrink:   0,
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '5px',
                                padding:      '5px 12px',
                                borderRadius: '999px',
                                border:       'none',
                                cursor:       'pointer',
                                fontWeight:   600,
                                fontSize:     '12px',
                                background:   active ? meta.color : meta.bg,
                                color:        active ? '#fff'     : meta.color,
                                transition:   'background 0.15s',
                            }}
                        >
                            <meta.Icon size={10} /> {item.text}
                        </button>
                    );
                })}
            </div>

            {/* ── Lista de tarjetas ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' , height: 'calc(100% - 90px)', padding: '20px 0' , overflowY: 'auto'}}>
                {listMenuHtml.length > 0
                    ? listMenuHtml
                    : (
                        <div style={{
                            textAlign: 'center',
                            color:     '#9ca3af',
                            padding:   '28px 0',
                            fontSize:  '13px',
                        }}>
                            <FaBell size={28} color='#d1d5db' />
                            <p style={{ marginTop: '8px' }}>Sin alertas en esta categoría</p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export { ListMenu };
