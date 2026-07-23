'use client';
import { FaUserTie } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Referencia de gerentes/managers en el título y en la novedad. */
export default function GerentesSection({ menu, setMenu }) {
    return (
        <>
                        <SectionHeader icon={FaUserTie} label="Configuración de Gerentes o MAnagers en título y referencias" color='#FF2700' bg='#FFE5E0' />

                        <div className='flex columns __width-complete __oneGap'>


                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                <p className='__text-center'>Referencia de gerentes en la novedad</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.managerReferenceId)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, managerReferenceId: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                <p className='__text-center'>Referencia de gerentes en el título</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.managerReferenceTitle)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, managerReferenceTitle: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                            {
                                menu?.managerReferenceTitle && (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#666', fontWeight: 'semibold' }}>Nota a considerar, acomode el titulo acerde al nombre del manager o gerente
                                            <br />
                                            <b>Ejemplo en castellano: &quot;{menu?.es} Gerente JARVIS&quot;</b>
                                            <br />
                                            <b>Ejemplo en ingles: &quot;Manager JARVIS {menu?.en}&quot;</b>
                                        </p>
                                    </>
                                )

                            }
                        </div>
                        <hr />
        </>
    );
}
