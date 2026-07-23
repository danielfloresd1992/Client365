'use client';
import { FaFileAlt } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Título alternativo que se usa en el PDF de reporte del cliente. */
export default function TituloReporteSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Título para el documento de reporte ══════ */}
                        {/* Permite un título alternativo cuando la alerta se incluye
                            en el PDF del cliente. Si se deja vacío, se usa el principal. */}
                        <SectionHeader icon={FaFileAlt} label="Título para documento de reporte" color='#047857' bg='#ecfdf5' />
                        <div className='flex columns __width-complete __oneGap'>
                            <b>Título para documento de reporte</b>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                Opcional. Si se completa, el reporte impreso usará este título en lugar del principal.
                            </p>
                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>
                                    <p>Título de reporte en castellano</p>
                                    <input
                                        className='__input'
                                        type='text'
                                        placeholder='Ej: Incumplimiento de protocolo'
                                        value={menu.titleForDocumentReport?.es || ''}
                                        onChange={e => setMenu({
                                            ...menu,
                                            titleForDocumentReport: {
                                                ...menu.titleForDocumentReport,
                                                es: e.target.value
                                            }
                                        })}
                                    />
                                </label>
                                <label className='__label'>
                                    <p>Título de reporte en inglés</p>
                                    <input
                                        className='__input'
                                        type='text'
                                        placeholder='Ex: Protocol non-compliance'
                                        value={menu.titleForDocumentReport?.en || ''}
                                        onChange={e => setMenu({
                                            ...menu,
                                            titleForDocumentReport: {
                                                ...menu.titleForDocumentReport,
                                                en: e.target.value
                                            }
                                        })}
                                    />
                                </label>
                            </div>
                        </div>
                        <hr />
        </>
    );
}
