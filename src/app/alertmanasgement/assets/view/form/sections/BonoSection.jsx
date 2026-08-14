'use client';
import { useState } from 'react';
import { FaStar, FaTrashAlt, FaPlus, FaStore, FaBuilding } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';
import {
    describeBonusSystem, describeException, pointValueLabel,
    MULTIPLICADORES, bonusSystemVacio,
} from '../../../lib/bonusLabels.js';

/**
 * El sistema de bonificación de una alerta.
 *
 * Se lee en TRES CAPAS y gana la más específica:
 *
 *     regla general        todos los establecimientos
 *     por franquicia       una marca entera
 *     por establecimiento  uno concreto
 *
 * La pantalla está armada en ese orden a propósito. Lo primero que se ve es lo
 * que pasa en todos lados, y recién después las excepciones — que es como se
 * lee el reglamento: "bonifica X1, SOLO FRANCISCAS", no al revés.
 *
 * Un establecimiento nuevo entra por la regla general sin que nadie lo agregue.
 * La lista de excepciones dice en qué se APARTA, no quiénes participan.
 */

const CAJA = {
    border: '1px solid #e6dcc6',
    borderRadius: '10px',
    padding: '12px',
    background: '#fff',
};

const ETIQUETA_MINI = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    color: '#92400e',
};


export default function BonoSection({ menu, setMenu, local = [], franchises = [] }) {
    const sistema = menu.bonusSystem || bonusSystemVacio();
    const regla = sistema.defaultRule || {};

    const [marcaElegida, setMarcaElegida] = useState('');
    const [localElegido, setLocalElegido] = useState('');

    /** Escribe dentro de bonusSystem sin perder el resto del menú. */
    const cambiar = (parcial) =>
        setMenu({ ...menu, bonusSystem: { ...sistema, ...parcial } });

    const cambiarRegla = (parcial) =>
        cambiar({ defaultRule: { ...regla, ...parcial } });

    // ── Excepciones ───────────────────────────────────────────────────
    const agregarExcepcion = (clave, campoRef, id) => {
        if (!id) return;
        const lista = sistema[clave] || [];
        if (lista.some(e => String(e[campoRef]) === String(id))) return;   // ya está
        cambiar({
            [clave]: [...lista, {
                [campoRef]: id,
                // null = hereda de la capa de arriba. Se declara solo lo que
                // se aparta, así que una excepción nace sin apartarse en nada
                // y quien la crea decide qué cambiar.
                bonifies: null,
                bonusWorth: null,
                accumulationRequired: null,
                note: '',
            }],
        });
    };

    const editarExcepcion = (clave, indice, parcial) => {
        const lista = [...(sistema[clave] || [])];
        lista[indice] = { ...lista[indice], ...parcial };
        cambiar({ [clave]: lista });
    };

    const quitarExcepcion = (clave, indice) =>
        cambiar({ [clave]: (sistema[clave] || []).filter((_, i) => i !== indice) });

    const nombreDeLocal = (id) => local.find(l => String(l._id) === String(id))?.name || '(establecimiento no encontrado)';
    const nombreDeMarca = (id) => franchises.find(f => String(f._id) === String(id))?.name || '(franquicia no encontrada)';


    /** Una excepción, sea de marca o de establecimiento. */
    const Excepcion = ({ clave, campoRef, indice, excepcion, nombre, Icono }) => (
        <div style={{ ...CAJA, background: '#fffdf8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icono size={13} color='#b45309' />
                <b style={{ fontSize: '13px', flex: 1, minWidth: 0 }}>{nombre}</b>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                    {describeException(excepcion, regla)}
                </span>
                <button
                    type='button'
                    title='Quitar esta excepción'
                    onClick={() => quitarExcepcion(clave, indice)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#b91c1c', padding: '2px' }}
                >
                    <FaTrashAlt size={12} />
                </button>
            </div>

            <div className='contentDoubleLabelFlex'>
                <label className='__label'>
                    <p style={ETIQUETA_MINI}>¿Bonifica acá?</p>
                    <select
                        className='__input'
                        value={excepcion.bonifies === null || excepcion.bonifies === undefined ? 'heredar' : String(excepcion.bonifies)}
                        onChange={e => editarExcepcion(clave, indice, {
                            bonifies: e.target.value === 'heredar' ? null : e.target.value === 'true',
                        })}
                    >
                        <option value='heredar'>Igual que la regla general</option>
                        <option value='true'>Sí, bonifica</option>
                        <option value='false'>No bonifica</option>
                    </select>
                </label>

                <label className='__label'>
                    <p style={ETIQUETA_MINI}>Valor</p>
                    <select
                        className='__input'
                        value={excepcion.bonusWorth ?? ''}
                        onChange={e => editarExcepcion(clave, indice, {
                            bonusWorth: e.target.value === '' ? null : Number(e.target.value),
                        })}
                    >
                        <option value=''>Igual que la general</option>
                        {MULTIPLICADORES.map(m => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
                    </select>
                </label>

                <label className='__label'>
                    <p style={ETIQUETA_MINI}>Acumulación</p>
                    <input
                        className='__input'
                        type='number'
                        min='1'
                        placeholder='Igual que la general'
                        value={excepcion.accumulationRequired ?? ''}
                        onChange={e => editarExcepcion(clave, indice, {
                            accumulationRequired: e.target.value === '' ? null : Math.max(1, Number(e.target.value)),
                        })}
                    />
                </label>
            </div>

            <label className='__label'>
                <p style={ETIQUETA_MINI}>Por qué es distinto</p>
                <input
                    className='__input'
                    type='text'
                    placeholder='Ej: excluido por el reglamento del 11-08-2026'
                    value={excepcion.note || ''}
                    onChange={e => editarExcepcion(clave, indice, { note: e.target.value })}
                />
            </label>
        </div>
    );


    return (
        <>
            <SectionHeader icon={FaStar} label='Sistema de bonificación' color='#b45309' bg='#fffbeb' />

            <div className='flex columns __width-complete __oneGap'
                style={{ border: '2px solid #f59e0b', borderRadius: '10px', padding: '14px', background: '#fffdf5' }}>

                {/* ── El interruptor ─────────────────────────────────── */}
                <label className='__label __text-center'>
                    <p><b>¿Esta alerta genera bono al operador?</b></p>
                    <input
                        className='__input'
                        type='checkbox'
                        checked={Boolean(sistema.isEnabled)}
                        onChange={e => cambiar({ isEnabled: e.target.checked })}
                    />
                </label>

                {/* El resumen que se verá en la lista, mientras se edita. Sin
                    esto hay que guardar para saber cómo quedó. */}
                <p style={{
                    fontSize: '12px', color: '#92400e', fontWeight: 600,
                    background: '#fef3c7', borderRadius: '8px', padding: '8px 10px', margin: 0,
                }}>
                    {describeBonusSystem(sistema)}
                    {sistema.isEnabled && ` · ${pointValueLabel(sistema)}`}
                </p>

                {sistema.isEnabled && (
                    <>
                        {/* ── Capa 1: la regla general ───────────────── */}
                        <div style={CAJA}>
                            <p style={{ ...ETIQUETA_MINI, marginBottom: '8px' }}>
                                Regla general · lo que pasa en todos los establecimientos
                            </p>

                            <label className='__label __text-center'>
                                <p>¿Bonifica en todos por defecto?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    checked={regla.bonifies !== false}
                                    onChange={e => cambiarRegla({ bonifies: e.target.checked })}
                                />
                            </label>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '-4px' }}>
                                Desactivalo cuando la alerta bonifique <b>solo</b> en algunos: entonces
                                cada uno se agrega abajo como excepción.
                            </p>

                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>
                                    <p>Valor del bono</p>
                                    <select
                                        className='__input'
                                        value={regla.bonusWorth ?? 1}
                                        onChange={e => cambiarRegla({ bonusWorth: Number(e.target.value) })}
                                    >
                                        {MULTIPLICADORES.map(m => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
                                    </select>
                                </label>

                                <label className='__label'>
                                    <p>Acumulación (cada cuántas)</p>
                                    <input
                                        className='__input'
                                        type='number'
                                        min='1'
                                        value={regla.accumulationRequired ?? 1}
                                        // Mínimo 1: es divisor al contar los bonos. Un 0 daría
                                        // infinito y un negativo, bonos negativos — los datos
                                        // viejos tenían catorce así.
                                        onChange={e => cambiarRegla({ accumulationRequired: Math.max(1, Number(e.target.value) || 1) })}
                                    />
                                </label>
                            </div>

                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 8px' }}>
                                Los dos juntos son la proporción del reglamento: acumulación 3 con valor 1
                                es <b>3x1</b>, tres alertas por un bono.
                            </p>

                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>
                                    <p>Valor del punto — diurno</p>
                                    <input
                                        className='__input' type='number' step='0.01' min='0'
                                        value={regla.pointValue?.day ?? 0.20}
                                        onChange={e => cambiarRegla({
                                            pointValue: { ...regla.pointValue, day: Number(e.target.value) },
                                        })}
                                    />
                                </label>
                                <label className='__label'>
                                    <p>Valor del punto — nocturno</p>
                                    <input
                                        className='__input' type='number' step='0.01' min='0'
                                        value={regla.pointValue?.night ?? 0.30}
                                        onChange={e => cambiarRegla({
                                            pointValue: { ...regla.pointValue, night: Number(e.target.value) },
                                        })}
                                    />
                                </label>
                            </div>

                            <label className='__label'>
                                <p>Código del reglamento <span style={{ color: 'red' }}>*</span></p>
                                <input
                                    className='__input'
                                    type='text'
                                    placeholder='Ej: 1.1 · R2.6 · E4.3'
                                    value={sistema.regulationCode || ''}
                                    onChange={e => cambiar({ regulationCode: e.target.value })}
                                />
                            </label>
                        </div>

                        {/* ── Capa 2: por franquicia ─────────────────── */}
                        <div style={CAJA}>
                            <p style={{ ...ETIQUETA_MINI, marginBottom: '8px' }}>
                                Excepciones por franquicia · una marca entera
                            </p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>
                                El reglamento dice «SOLO FRANCISCAS» diecinueve veces. Puesto acá, una
                                Francisca nueva queda cubierta sola; con una lista de establecimientos
                                habría que acordarse de agregarla.
                            </p>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <label className='__label' style={{ flex: 1 }}>
                                    <select className='__input' value={marcaElegida} onChange={e => setMarcaElegida(e.target.value)}>
                                        <option value=''>Elegí una franquicia…</option>
                                        {franchises.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                    </select>
                                </label>
                                <button
                                    type='button'
                                    onClick={() => { agregarExcepcion('franchiseExceptions', 'franchise', marcaElegida); setMarcaElegida(''); }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontSize: '12px', fontWeight: 700, color: '#fff', background: '#b45309',
                                    }}
                                >
                                    <FaPlus size={10} /> Agregar
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {(sistema.franchiseExceptions || []).map((ex, i) => (
                                    <Excepcion
                                        key={`${ex.franchise}_${i}`}
                                        clave='franchiseExceptions' campoRef='franchise'
                                        indice={i} excepcion={ex}
                                        nombre={nombreDeMarca(ex.franchise)} Icono={FaBuilding}
                                    />
                                ))}
                                {!(sistema.franchiseExceptions || []).length && (
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Ninguna franquicia se aparta de la regla general.</p>
                                )}
                            </div>
                        </div>

                        {/* ── Capa 3: por establecimiento ─────────────── */}
                        <div style={CAJA}>
                            <p style={{ ...ETIQUETA_MINI, marginBottom: '8px' }}>
                                Excepciones por establecimiento · uno concreto
                            </p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>
                                Manda sobre la franquicia. Es lo que resuelve casos como «todos los
                                Mister <b>excepto</b> Fort Lauderdale».
                            </p>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <label className='__label' style={{ flex: 1 }}>
                                    <select className='__input' value={localElegido} onChange={e => setLocalElegido(e.target.value)}>
                                        <option value=''>Elegí un establecimiento…</option>
                                        {local.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                    </select>
                                </label>
                                <button
                                    type='button'
                                    onClick={() => { agregarExcepcion('localExceptions', 'local', localElegido); setLocalElegido(''); }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontSize: '12px', fontWeight: 700, color: '#fff', background: '#b45309',
                                    }}
                                >
                                    <FaPlus size={10} /> Agregar
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {(sistema.localExceptions || []).map((ex, i) => (
                                    <Excepcion
                                        key={`${ex.local}_${i}`}
                                        clave='localExceptions' campoRef='local'
                                        indice={i} excepcion={ex}
                                        nombre={nombreDeLocal(ex.local)} Icono={FaStore}
                                    />
                                ))}
                                {!(sistema.localExceptions || []).length && (
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Ningún establecimiento se aparta.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <br />
        </>
    );
}
