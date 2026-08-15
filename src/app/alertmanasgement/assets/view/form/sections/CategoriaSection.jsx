'use client';
import { FaTag } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { listaDeCategorias } from '../../../lib/categoryMeta.js';
import SectionHeader from '../SectionHeader.jsx';

/**
 * Las DOS categorías de la alerta, que son cosas distintas:
 *
 *   · La OPERATIVA ('delay', 'food'…) dice de qué se trata la alerta. Sale de
 *     una lista FIJA escrita en el código y no se administra, porque
 *     reportes365 y Jarvis-express365 la leen con nombres escritos a mano y se
 *     despliegan por separado. Una categoría nueva sería una que ninguno de
 *     los dos entiende. Ver la nota en categoryMeta.js.
 *
 *   · La de BONIFICACIÓN dice con qué criterio agrupa en los cortes de bono.
 *     Ésa sí viene del catálogo del servidor y se crea desde esta misma
 *     pantalla, porque se calcula puertas adentro.
 *
 * Son independientes: dos alertas de categorías operativas distintas pueden
 * bonificar por el mismo concepto, y al revés.
 */
export default function CategoriaSection({ menu, setMenu }) {
    const { categorias: categoriasDeBono, sinCatalogo } = useBonusCategories(false);

    // ── Categoría operativa ──────────────────────────────────────────
    const actual = menu.category;
    const opciones = listaDeCategorias().map(c => ({ value: c.value, text: c.es }));

    // Una alerta vieja puede tener una categoría que ya no está en la lista
    // —se escribió a mano en su momento—. Si no se agrega, el select saldría
    // vacío y guardar el formulario por otra razón le borraría la categoría.
    if (actual && !opciones.some(o => o.value === actual)) {
        opciones.unshift({ value: actual, text: `${actual} (fuera de la lista)` });
    }

    // ── Categoría de bonificación ────────────────────────────────────
    // Es opcional, así que la primera opción es no tener ninguna.
    const actualBono = menu.bonusCategory || '';
    const opcionesBono = [
        { value: '', text: sinCatalogo ? 'Catálogo no disponible' : 'Sin categoría de bonificación' },
        ...categoriasDeBono.map(c => ({ value: c.value, text: c.es })),
    ];

    // Igual que arriba: si la que tiene guardada se desactivó, se agrega para
    // no perderla al guardar por cualquier otro motivo.
    if (actualBono && !opcionesBono.some(o => o.value === actualBono)) {
        opcionesBono.push({ value: actualBono, text: `${actualBono} (desactivada)` });
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

                <InputBorderBlue
                    textLabel='Categoría de bonificación'
                    type='select'
                    name='bonusCategory'
                    value={actualBono}
                    childSelect={opcionesBono}
                    eventChengue={text => {
                        // Vacío se guarda como null y no como '': el modelo la
                        // declara opcional con default null, y así una alerta
                        // sin bonificación se ve igual la haya tocado alguien
                        // o no.
                        setMenu({ ...menu, bonusCategory: text || null });
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
