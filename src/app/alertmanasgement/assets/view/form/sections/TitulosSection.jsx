'use client';
import { FaLanguage } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Títulos bilingües (ES / EN) de la alerta. */
export default function TitulosSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Títulos bilingües de la alerta ═══════════ */}
                        <SectionHeader icon={FaLanguage} label="Títulos de la alerta (ES / EN)" color='#9a3412' bg='#fff7ed' />
                        <div className='__flexRowFlex __width-complete __oneGap'>
                            <label className='__label __width-complete' >
                                <p>TÍtulo en castellano</p>
                                <textarea
                                    className='__input __width-complete __never-resize'
                                    style={{ height: '100px' }}
                                    spellCheck={true}
                                    lang='es'
                                    required
                                    value={menu.es}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, es: e.target.value });
                                        }
                                    }
                                >
                                </textarea>
                            </label>

                            <label className='__label __width-complete'>
                                <p>TÍtulo en ingles</p>
                                <textarea
                                    className='__input __width-complete __never-resize'
                                    style={{ height: '100px' }}
                                    spellCheck={true}
                                    lang='en'
                                    required
                                    value={menu.en}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, en: e.target.value });
                                        }
                                    }
                                >
                                </textarea>
                            </label>
                        </div>
                        <hr />
        </>
    );
}
