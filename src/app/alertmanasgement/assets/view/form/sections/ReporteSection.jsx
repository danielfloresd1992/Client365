'use client';
import { FaFileContract } from 'react-icons/fa';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import SectionHeader from '../SectionHeader.jsx';

/** Configuración del documento de reporte y de la alerta en vivo. */
export default function ReporteSection({ menu, setMenu }) {
    return (
        <>
                        {/* ══ SECCIÓN: Configuración de reporte y alerta en vivo */}
                        <SectionHeader icon={FaFileContract} label="Configuración de reporte y alerta en vivo" color='#1e40af' bg='#eff6ff' />
                        <div className='flex columns __width-complete __oneGap'>
                            <b className=''>Configuración para el reporte y la alerta en vivo</b>
                            <p>Nota: Ingrese la configuración cuidadosa mente.</p>
                            <hr />

                            <div className='flex columns __width-complete __oneGap'>
                                <label className='__label' >
                                    <p className='__text-center'>Uso en documento de reporte para el cliente</p>
                                    <input
                                        className='__input'
                                        type='checkbox'
                                        name='onlyTheReportDocument'
                                        checked={Boolean(menu.useOnlyForTheReportingDocument)}
                                        onChange={
                                            e => {
                                                setMenu({ ...menu, useOnlyForTheReportingDocument: e.target.checked });
                                            }
                                        }
                                    />
                                </label>
                            </div>



                            <div className='flex columns __width-complete __oneGap'>
                                <label className='__label' >
                                    <p className='__text-center'>Remover el subtítulo en el documento de imagenes en reporte</p>
                                    <input
                                        className='__input'
                                        type='checkbox'
                                        name='noSubtitleInTheReport'
                                        checked={Boolean(menu.noSubtitleInTheReport)}
                                        onChange={
                                            e => {
                                                setMenu({ ...menu, noSubtitleInTheReport: e.target.checked });
                                            }
                                        }
                                    />
                                </label>
                            </div>


                            <div className='flex columns __width-complete __oneGap'>
                                <label className='__label' >
                                    <p className='__text-center'>Uso en alertas en vivo para el cliente</p>
                                    <input
                                        className='__input'
                                        type='checkbox'
                                        name='onlyTheReportDocument'
                                        checked={Boolean(menu.useOfLiveAlertForTheCustomer)}
                                        onChange={
                                            e => {
                                                setMenu({ ...menu, useOfLiveAlertForTheCustomer: e.target.checked });
                                            }
                                        }
                                    />
                                </label>
                            </div>


                            <div className='flex columns __width-complete __oneGap'>
                                <label className='__label' >
                                    <p className='__text-center'>Añadir nota de descripción en el documento de reporte</p>
                                    <input
                                        className='__input'
                                        type='checkbox'
                                        name='onlyTheReportDocument'
                                        checked={Boolean(menu.descriptionNoteForReportDocument)}
                                        onChange={
                                            e => {
                                                setMenu({ ...menu, descriptionNoteForReportDocument: e.target.checked });
                                            }
                                        }
                                    />
                                </label>
                            </div>


                            <div className='flex columns __width-complete __oneGap'>
                                <InputBorderBlue
                                    textLabel='Agupación de alertas en el documento de reporte'
                                    type='select'
                                    value={menu.groupingInTheReport}
                                    childSelect={[
                                        { text: 'Individual por pagina', value: 'individual' },
                                        { text: 'Dos por página', value: 'dual' },
                                        { text: '4 por página', value: 'quadruple' }
                                    ]}
                                    eventChengue={text => {
                                        setMenu({ ...menu, groupingInTheReport: text });
                                    }}
                                />
                            </div>




                            <div className='flex columns __width-complete __oneGap'>
                                <label className='__label' >
                                    <p className='__text-center'>¿Requiere que se le añada video para la alerta en vivo?</p>
                                    <input
                                        className='__input'
                                        type='checkbox'
                                        name='doesItrequireVideo'
                                        checked={Boolean(menu.doesItrequireVideo)}
                                        onChange={
                                            e => {
                                                setMenu({ ...menu, doesItrequireVideo: e.target.checked });
                                            }
                                        }
                                    />
                                </label>
                            </div>


                        </div>
        </>
    );
}
