'use client';
import { FaClipboardList } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Datos que la alerta exige al operador (p. ej. número de mesa). */
export default function DatosRequeridosSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Datos requeridos en la alerta ════════════ */}
                        <SectionHeader icon={FaClipboardList} label="Datos requeridos" color='#0369a1' bg='#f0f9ff' />
                        <div className='__flexRowFlex __width-complete'>
                            <label className='__label' >
                                <p className='__text-center'>Requiere numero de mesa</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={menu.table}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, table: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />
        </>
    );
}
