'use client';
import { FaCar, FaClipboardList, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Datos opcionales: contador, vehículo, descripción de persona y de área. */
export default function DatosAdicionalesSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Datos adicionales de la alerta ══════════ */}
                        <SectionHeader icon={FaClipboardList} label="Datos adicionales" color='#0369a1' bg='#f0f9ff' />
                        <div className='__flexRowFlex __width-complete'>
                            <label className='__label' >
                                <p className='__text-center'>¿Se requiere contabilizar un objetivo?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.amountOfSomething)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, amountOfSomething: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label __text-center' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaCar size={14} color='#475569' />
                                <p>¿ Requiere Modelo y colores de automovil ?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.car)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, car: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label __text-center' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaUser size={14} color='#065f46' />
                                <p>¿ Descipción de persona ?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.isDescriptionPerson)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, isDescriptionPerson: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaMapMarkerAlt size={14} color='#b91c1c' />
                                <p className='__text-center'>¿Descipción de área?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.isArea)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, isArea: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />
        </>
    );
}
