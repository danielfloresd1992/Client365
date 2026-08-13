'use client';
import { FaTag } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import useCategories from '../../../lib/useCategories.js';
import SectionHeader from '../SectionHeader.jsx';

/**
 * Categoría de la alerta y su identificador (solo lectura).
 *
 * Las categorías vienen del catálogo del servidor, no de una lista escrita en
 * el código. Se piden solo las activas: una categoría dada de baja no debe
 * ofrecerse al crear una alerta nueva.
 */
export default function CategoriaSection({ menu, setMenu }) {
    const { categorias } = useCategories(false);

    // La categoría guardada puede no estar entre las activas —se desactivó
    // después de crear la alerta—. Si no se agrega, el select aparecería vacío y
    // guardar el formulario por otra razón le borraría la categoría a la alerta.
    const actual = menu.category;
    const opciones = categorias.map(c => ({ value: c.value, text: c.es }));
    if (actual && !opciones.some(o => o.value === actual)) {
        opciones.unshift({ value: actual, text: `${actual} (desactivada)` });
    }

    return (
        <>
                        {/* ══ SECCIÓN: Categoría y referencia ═══════════════════ */}
                        <SectionHeader icon={FaTag} label="Categoría y referencia" color='#1d4ed8' bg='#eff6ff' />

                        <div className='contentDoubleLabelFlex'>

                            <InputBorderBlue
                                textLabel='Selecione una categoría'
                                type='select'
                                name='category'
                                // Va tal cual está guardada. Antes se bajaba a
                                // minúsculas, y eso dejaba sin seleccionar a las
                                // que llevan mayúscula dentro ('localIncident').
                                value={actual}
                                childSelect={opciones}
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
