'use client';
import { FaClock } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Tipo de tiempo de la alerta: sin tiempo, único, o inicio y fin. */
export default function TiempoSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Tipo de tiempo ═══════════════════════════ */}
                        <SectionHeader icon={FaClock} label="Tipo de tiempo" color='#854d0e' bg='#fffbeb' />
                        <div className='flex columns __width-complete __oneGap'>

                            <p className='__text-center'>Tipo de tiempo</p>

                            <div className='__center_center __oneGap'>
                                <label className='__label'>
                                    <p className='__text-center'>Sin tiempo</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={!Boolean(menu.time) && !Boolean(menu.timeUnique)}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: false, timeUnique: false, especial: null };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>

                                <label className='__label'>
                                    <p className='__text-center'>Tiempo único</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={menu.timeUnique}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: false, timeUnique: true, especial: null };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>

                                <label className='__label'>
                                    <p className='__text-center'>Tiempo de inició y finalizó</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={menu.time}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: true, timeUnique: false };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>
                            </div>
                        </div>

                        <hr />
        </>
    );
}
