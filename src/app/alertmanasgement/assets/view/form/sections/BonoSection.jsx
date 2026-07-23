'use client';
import { useDispatch } from 'react-redux';
import { FaStar } from 'react-icons/fa';
import { setConfigModal } from '@/store/slices/globalModal';
import SectionHeader from '../SectionHeader.jsx';

/** Regla de bonificación vigente y el bloque DEPRECATED de bonos por local. */
export default function BonoSection({ menu, setMenu, local }) {
    const dispatch = useDispatch();

    // Quita un local de la bonificación DEPRECATED (rulesForBonus.forLocal)
    const putArrayForBonus = params => {
        dispatch(setConfigModal({
            modalOpen: true,
            title: 'Aviso',
            description: 'Desea eliminar este local de la bonificación',
            isCallback: () => {
                let newObject;
                if (menu.rulesForBonus.forLocal.length === 1) {
                    newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: 'Todos' } };
                }
                else {
                    const newList = menu.rulesForBonus.forLocal.filter(item => item.idLocal !== params);
                    newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: newList } };
                }
                setMenu(newObject);
            },
            type: 'warning'
        }));
    };

    const localName = local?.map(item => {
        return <option key={item._id} value={item._id}>{item.name}</option>
    });

    return (
        <>
                        {/* ══════════════════════════════════════════════════════════════
                            NUEVO SISTEMA DE BONIFICACIÓN
                            Mapea directamente al Reglamento de Registro de Bonos oficial.
                            Multiplcadores: X1 (1), X2 (2), X3 (3), X5 (5)
                            Valor por punto: 0.20 (diurno) / 0.30 (nocturno y extra)
                            ══════════════════════════════════════════════════════════════ */}
                        {/* ══ SECCIÓN: Regla de bonificación ═══════════════════ */}
                        <SectionHeader icon={FaStar} label="Regla de bonificación" color='#b45309' bg='#fffbeb' />
                        <div className='flex columns __width-complete __oneGap' style={{ border: '2px solid #2bcb00', borderRadius: '8px', padding: '12px' }}>
                            <b>Regla de bonificación</b>
                            <p style={{ fontSize: '12px', color: '#555' }}>Basado en el Reglamento de Registro de Bonos (Gerencia de Operaciones).</p>

                            {/* Activar / Desactivar bono para esta alerta */}
                            <label className='__label __text-center'>
                                <p>¿Esta alerta genera bono al operador?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    checked={Boolean(menu.bonusCalculationRules?.activate)}
                                    onChange={e => setMenu({
                                        ...menu,
                                        bonusCalculationRules: {
                                            ...menu.bonusCalculationRules,
                                            activate: e.target.checked
                                        }
                                    })}
                                />
                            </label>

                            {/* Campos adicionales — solo visibles cuando el bono está activado */}
                            {menu.bonusCalculationRules?.activate && (
                                <>
                                    <div className='contentDoubleLabelFlex'>

                                        {/* Multiplicador del bono según tipo de alerta */}
                                        <label className='__label'>
                                            <p>Multiplicador (tipo de bono)</p>
                                            <select
                                                className='__input'
                                                value={menu.bonusCalculationRules.defaultRule?.worth ?? 1}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            worth: Number(e.target.value)
                                                        }
                                                    }
                                                })}
                                            >
                                                <option value={1}>X1 — Alerta común</option>
                                                <option value={2}>X2 — Alerta resaltante</option>
                                                <option value={3}>X3 — Alerta especial</option>
                                                <option value={5}>X5 — Alerta crítica</option>
                                            </select>
                                        </label>

                                        {/* Ocurrencias antes de contarse como bono (ej: "bono a la 2° vez") */}
                                        <label className='__label'>
                                            <p>Ocurrencias para contar (acumulativo)</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                min='1'
                                                value={menu.bonusCalculationRules.defaultRule?.acum ?? 1}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            acum: Number(e.target.value)
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    <div className='contentDoubleLabelFlex'>
                                        {/* Valor en puntos por turno diurno (reglamento: 0.20) */}
                                        <label className='__label'>
                                            <p>Valor punto — Turno diurno</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                step='0.01'
                                                value={menu.bonusCalculationRules.defaultRule?.valueBonusForTheStaffOnDuty?.day ?? 0.20}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            valueBonusForTheStaffOnDuty: {
                                                                ...menu.bonusCalculationRules.defaultRule.valueBonusForTheStaffOnDuty,
                                                                day: Number(e.target.value)
                                                            }
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                        {/* Valor en puntos por turno nocturno/extra (reglamento: 0.30) */}
                                        <label className='__label'>
                                            <p>Valor punto — Nocturno / Extra</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                step='0.01'
                                                value={menu.bonusCalculationRules.defaultRule?.valueBonusForTheStaffOnDuty?.nigth ?? 0.30}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            valueBonusForTheStaffOnDuty: {
                                                                ...menu.bonusCalculationRules.defaultRule.valueBonusForTheStaffOnDuty,
                                                                nigth: Number(e.target.value)
                                                            }
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    <div className='contentDoubleLabelFlex'>
                                        {/* Código del ítem en el reglamento (ej: "1.1", "R2.3", "E1.1") */}
                                        <label className='__label'>
                                            <p>Código reglamento <span style={{ color: 'red' }}>*</span></p>
                                            <input
                                                className='__input'
                                                type='text'
                                                placeholder='Ej: 1.1 · R2.3 · E1.1'
                                                value={menu.bonusCalculationRules.defaultRule?.reglamentoCode ?? ''}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            reglamentoCode: e.target.value
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                        {/* Activo por defecto: indica si el bono aplica sin acción manual */}
                                        <label className='__label __text-center'>
                                            <p>Activo por defecto</p>
                                            <input
                                                className='__input'
                                                type='checkbox'
                                                checked={Boolean(menu.bonusCalculationRules.defaultRule?.defaultActive)}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            defaultActive: e.target.checked
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    {/* Descripción interna de la regla de bono */}
                                    <label className='__label'>
                                        <p>Descripción interna de la regla</p>
                                        <textarea
                                            className='__input __never-resize'
                                            placeholder='Ej: Se considera bono a la 2° vez por turno diurno'
                                            value={menu.bonusCalculationRules.defaultRule?.description ?? ''}
                                            onChange={e => setMenu({
                                                ...menu,
                                                bonusCalculationRules: {
                                                    ...menu.bonusCalculationRules,
                                                    defaultRule: {
                                                        ...menu.bonusCalculationRules.defaultRule,
                                                        description: e.target.value
                                                    }
                                                }
                                            })}
                                        />
                                    </label>
                                </>
                            )}
                        </div>

                        {/* ── DEPRECATED: bonificación antigua ────────────────────────────
                            Se mantiene para alertas creadas antes del nuevo sistema.
                            No usar para nuevas alertas. */}
                        <details style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px' }}>
                            <summary style={{ cursor: 'pointer', color: '#888', fontSize: '12px' }}>
                                ⚠️ Bonificación (sistema antiguo — solo para alertas existentes)
                            </summary>
                            <div className='flex columns __width-complete __oneGap' style={{ marginTop: '8px' }}>
                                <label className='__label'>Locales o todos
                                    <select
                                        className='__input'
                                        onChange={e => {
                                            if (e.target.value === 'Todos') {
                                                setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: 'Todos' } });
                                            } else {
                                                const localFill = local.filter(item => item._id === e.target.value);
                                                if (!Array.isArray(menu.rulesForBonus?.forLocal)) {
                                                    setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: [{ idLocal: localFill[0]._id, name: localFill[0].name }] } });
                                                } else {
                                                    setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: [...menu.rulesForBonus.forLocal, { idLocal: localFill[0]._id, name: localFill[0].name }] } });
                                                }
                                            }
                                        }}
                                    >
                                        <option value='Todos'>Todos</option>
                                        {localName}
                                    </select>
                                </label>
                                <div className='__center_center __width-complete __oneGap __wrap'>
                                    {menu.rulesForBonus.forLocal === 'Todos' || !Array.isArray(menu.rulesForBonus.forLocal)
                                        ? <p style={{ color: '#001453' }}>Para todos los locales</p>
                                        : menu.rulesForBonus.forLocal.map(loc => (
                                            <div className='tag' key={loc.idLocal}>
                                                <p className='itemlocal-nameText'>{loc.name}</p>
                                                <button className='list-itemlocal-btn' type='button' onClick={() => putArrayForBonus(loc.idLocal)}>
                                                    <img className='list-itemlocal-btnImg' src='ico/delete/delete.svg' alt="" />
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className='contentDoubleLabelFlex'>
                                    <label className='__label'>
                                        <p>Valor de bono</p>
                                        <input type='number' className='__input' value={menu.rulesForBonus?.worth}
                                            onChange={e => setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, worth: Number(e.target.value) } })} />
                                    </label>
                                    <label className='__label'>
                                        <p>Acumulativo</p>
                                        <input className='__input' type='number' value={menu.rulesForBonus?.amulative}
                                            onChange={e => setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, amulative: Number(e.target.value) } })} />
                                    </label>
                                </div>
                            </div>
                        </details>

                        <br />
        </>
    );
}
