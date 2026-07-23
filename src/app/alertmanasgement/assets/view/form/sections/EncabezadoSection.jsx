'use client';
import { FaAlignLeft } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import titleHeader from '../../../model/optionsHeader.js';
import SectionHeader from '../SectionHeader.jsx';

/** Encabezado textual opcional que antecede al título de la alerta. */
export default function EncabezadoSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Encabezado textual ═══════════════════════ */}
                        <SectionHeader icon={FaAlignLeft} label="Encabezado textual" color='#7e22ce' bg='#faf5ff' />
                        <div className='__center_center __width-complete' style={{ flexDirection: 'column', alignItems: 'center' }} >
                            <label className='__label __text-center' > Título con encabezado
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.textHeader)}
                                    onChange={
                                        () => {
                                            if (!Boolean(menu.textHeader)) {
                                                setMenu({ ...menu, textHeader: { es: '', en: '' } });
                                            }
                                            else {
                                                setMenu({ ...menu, textHeader: null });
                                            }
                                        }
                                    }
                                />
                            </label>
                            {
                                Boolean(menu.textHeader) ?
                                    (
                                        <>
                                            <InputBorderBlue
                                                textLabel='Texto del encabezado'
                                                type='select'
                                                name='titleHeader'
                                                value={menu.textHeader.en || null}
                                                childSelect={titleHeader}
                                                eventChengue={text => {
                                                    const newObject = titleHeader.filter(item => item.en === text);
                                                    setMenu({ ...menu, textHeader: { es: newObject[0].es, en: newObject[0].en } });
                                                }}
                                            />
                                        </>
                                    )
                                    :
                                    (null)
                            }
                        </div>

                        <hr />
        </>
    );
}
