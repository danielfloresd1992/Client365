'use client';
import { FaTrash, FaFileAlt, FaBroadcastTower, FaLock, FaLockOpen } from 'react-icons/fa';
import { metaOf, BONUS_BADGE } from '../../lib/categoryMeta.js';
import PersonRow from './PersonRow.jsx';
import FlagChip from './FlagChip.jsx';

/**
 * Tarjeta de una alerta dentro de la lista.
 *
 * Estructura: fila superior (ícono de categoría, títulos ES/EN, indicadores de
 * reporte, badge de bono, bloqueo y botón eliminar) y, debajo, la autoría
 * (creador + últimas ediciones).
 *
 * @param item         - documento de menú/alerta
 * @param isSelected   - true si es la alerta abierta en el formulario
 * @param onSelect     - abre la alerta en el formulario
 * @param onDelete     - pide confirmación y elimina
 * @param isAdmin      - true → puede bloquear/desbloquear (admin de la sesión)
 * @param onToggleLock - (id, nextLocked) cambia el bloqueo en el servidor
 */
export default function AlertCard({ item, isSelected, onSelect, onDelete, isAdmin = false, onToggleLock = () => {} }) {
    const { Icon, bg, color } = metaOf(item.category);

    const bonusActive = Boolean(item.bonusCalculationRules?.activate);
    const bonusWorth  = item.bonusCalculationRules?.defaultRule?.worth ?? 1;
    const badge       = BONUS_BADGE[bonusWorth] ?? BONUS_BADGE[1];

    // Bloqueo administrativo: con true el backend rechaza editar y borrar (423)
    const isLocked = Boolean(item.isLocked);

    // Autoría: creador + últimas 3 ediciones que devuelve el backend
    const editors       = Array.isArray(item.lastEditors) ? item.lastEditors : [];
    const hasAuthorship = Boolean(item.createdBy) || editors.length > 0;

    return (
        <div
            onClick={() => onSelect(item._id)}
            style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           '9px',
                padding:       '12px 12px',
                borderRadius:  '12px',
                background:    isSelected ? '#f0fdf4' : '#fff',
                border:        isSelected ? '2px solid #29c50c' : bonusActive ? '2px solid #16a34a' : '1px solid #eee7d6',
                boxSizing:     'border-box',
                cursor:        'pointer',
                boxShadow:     '0 1px 2px rgba(0,0,0,0.03)',
                transition:    'box-shadow 0.15s, border-color 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* Fila superior: ícono + títulos + indicadores + bono + eliminar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Círculo con el ícono de la categoría */}
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
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <p style={{
                        fontWeight:   600,
                        fontSize:     '13px',
                        margin:       0,
                        whiteSpace:   'nowrap',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        color:        '#111827',
                    }}>
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

                {/* Indicadores: reporte del cliente / alerta en vivo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <FlagChip Icon={FaFileAlt} label='Reporte' active={Boolean(item.useOnlyForTheReportingDocument)} />
                    <FlagChip Icon={FaBroadcastTower} label='En vivo' active={Boolean(item.useOfLiveAlertForTheCustomer)} />
                </div>

                {/* Badge del multiplicador de bono (solo si está activo) */}
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

                {/* Bloqueada: candado visible para TODOS (solo informativo) */}
                {isLocked && !isAdmin && (
                    <span
                        title='Alerta bloqueada por administración: no se puede editar ni eliminar'
                        style={{
                            flexShrink:     0,
                            padding:        '7px',
                            borderRadius:   '8px',
                            border:         '1px solid #fde68a',
                            background:     '#fffbeb',
                            color:          '#b45309',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FaLock size={13} />
                    </span>
                )}

                {/* Bloquear/desbloquear: SOLO administradores (admin === true) */}
                {isAdmin && (
                    <button
                        type='button'
                        title={isLocked ? 'Desbloquear alerta (permitir editar y borrar)' : 'Bloquear alerta (impedir editar y borrar)'}
                        style={{
                            flexShrink:     0,
                            padding:        '7px',
                            borderRadius:   '8px',
                            border:         isLocked ? '1px solid #fde68a' : '1px solid #e5e7eb',
                            background:     isLocked ? '#fffbeb' : '#f9fafb',
                            color:          isLocked ? '#b45309' : '#9ca3af',
                            cursor:         'pointer',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isLocked ? '#fde68a' : '#f3f4f6'}
                        onMouseLeave={e => e.currentTarget.style.background = isLocked ? '#fffbeb' : '#f9fafb'}
                        onClick={e => { e.stopPropagation(); onToggleLock(item._id, !isLocked); }}
                    >
                        {isLocked ? <FaLock size={13} /> : <FaLockOpen size={13} />}
                    </button>
                )}

                {/* Eliminar: deshabilitado si la alerta está bloqueada.
                    Detiene la propagación para no abrir el formulario. */}
                <button
                    type='button'
                    title={isLocked ? 'Bloqueada por administración: no se puede eliminar' : 'Eliminar alerta'}
                    disabled={isLocked}
                    style={{
                        flexShrink:     0,
                        padding:        '7px',
                        borderRadius:   '8px',
                        border:         isLocked ? '1px solid #e5e7eb' : '1px solid #fee2e2',
                        background:     isLocked ? '#f9fafb' : '#fff5f5',
                        color:          isLocked ? '#d1d5db' : '#dc2626',
                        cursor:         isLocked ? 'not-allowed' : 'pointer',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={e => { if (!isLocked) e.currentTarget.style.background = '#fee2e2'; }}
                    onMouseLeave={e => { if (!isLocked) e.currentTarget.style.background = '#fff5f5'; }}
                    onClick={e => { e.stopPropagation(); if (!isLocked) onDelete(item._id); }}
                >
                    <FaTrash size={13} />
                </button>
            </div>

            {/* Autoría (debajo de es/en): quién creó + últimas ediciones */}
            {hasAuthorship && (
                <div style={{
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '5px',
                    paddingLeft:   '50px',
                    paddingTop:    '7px',
                    borderTop:     '1px dashed #f0ede4',
                }}>
                    {item.createdBy && <PersonRow person={item.createdBy} kind='creator' />}
                    {editors.map((editor, i) => (
                        <PersonRow key={`${editor._id ?? i}_${i}`} person={editor} kind='editor' />
                    ))}
                </div>
            )}
        </div>
    );
}
