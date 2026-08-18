'use client';
import { FaTag } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import { listaDeCategorias } from '../../../lib/categoryMeta.js';
import SectionHeader from '../SectionHeader.jsx';

/**
 * La categoría OPERATIVA de la alerta: 'delay', 'food'… dice de qué se trata.
 *
 * Sale de una lista FIJA escrita en el código y no se administra, porque
 * reportes365 y Jarvis-express365 la leen con nombres escritos a mano y se
 * despliegan por separado. Una categoría nueva sería una que ninguno de los dos
 * entiende, y el síntoma no sería un error: la alerta simplemente no aparecería
 * donde corresponde. Ver la nota en categoryMeta.js.
 *
 *
 * ACÁ NO SE CONFIGURA NADA DE BONIFICACIÓN
 *
 * Ni la categoría de bono ni la regla. Todo eso vive en /bonus, junto al
 * valor del bono y la tasa: tener la mitad de la configuración en el formulario
 * de la alerta y la otra mitad en otra pantalla era la forma más fácil de que
 * una alerta quedara a medio configurar sin que nadie lo notara.
 */
export default function CategoriaSection({ menu, setMenu }) {

    // ── Categoría operativa ──────────────────────────────────────────
    const actual = menu.category;
    const opciones = listaDeCategorias().map(c => ({ value: c.value, text: c.es }));

    // Una alerta vieja puede tener una categoría que ya no está en la lista
    // —se escribió a mano en su momento—. Si no se agrega, el select saldría
    // vacío y guardar el formulario por otra razón le borraría la categoría.
    if (actual && !opciones.some(o => o.value === actual)) {
        opciones.unshift({ value: actual, text: `${actual} (fuera de la lista)` });
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
                    // Va tal cual está guardada. Antes se bajaba a minúsculas, y
                    // eso dejaba sin seleccionar a las que llevan mayúscula
                    // dentro ('localIncident').
                    value={actual}
                    childSelect={opciones}
                    eventChengue={text => {
                        setMenu({ ...menu, category: text });
                    }}
                />

            </div>

            <div className='contentDoubleLabelFlex'>
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
