'use client';
import { FaTag } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import category from '../../../model/category.js';
import SectionHeader from '../SectionHeader.jsx';

/** Categoría de la alerta y su identificador (solo lectura). */
export default function CategoriaSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Categoría y referencia ═══════════════════ */}
                        <SectionHeader icon={FaTag} label="Categoría y referencia" color='#1d4ed8' bg='#eff6ff' />

                        <div className='contentDoubleLabelFlex'>

                            <InputBorderBlue
                                textLabel='Selecione una categoría'
                                type='select'
                                name='category'
                                value={menu.category.toLowerCase()}
                                childSelect={category}
                                eventChengue={text => {
                                    setMenu({ ...menu, category: text });
                                }}
                            />

                            <label className='__label' >id
                                <input
                                    type='text'
                                    className='__input'
                                    disabled
                                    value={menu._id || ''}
                                />
                            </label>
                        </div>

                        <hr />
        </>
    );
}
