'use client';
import { useDispatch } from 'react-redux';
import { FaCog } from 'react-icons/fa';
import { setConfigModal } from '@/store/slices/globalModal';
import SectionHeader from '../SectionHeader.jsx';

/** Títulos personalizados de inicio/fin (requiere tipo de tiempo "inicio y fin"). */
export default function TiempoEspecialSection({ menu, setMenu }) {
    const dispatch = useDispatch();

    return (
        <>
                        {/* ══ SECCIÓN: Configuración especial de tiempo ════════ */}
                        <SectionHeader icon={FaCog} label="Configuración especial de tiempo" color='#475569' bg='#f8fafc' />
                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label'>
                                <p className='__text-center'>Configuración adaptada en el tiempo</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='special'
                                    checked={menu.time && Boolean(menu.especial)}
                                    onChange={
                                        e => {
                                            if (!menu.time) {
                                                return dispatch(setConfigModal({
                                                    modalOpen: true,
                                                    title: 'Aviso',
                                                    description: 'Esta opción solo se puede habilitar si la opción de inicio y fin esta marcada en la casilla.',
                                                    isCallback: null,
                                                    type: 'error'
                                                }));
                                            }
                                            if (!e.target.checked) {
                                                setMenu({ ...menu, especial: null });
                                            }
                                            else {
                                                setMenu({
                                                    ...menu, especial: {
                                                        time: {
                                                            timeInitTitle: {
                                                                es: '',
                                                                en: ''
                                                            },
                                                            timeEndTitle: {
                                                                es: '',
                                                                en: ''
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }
                                />
                            </label>
                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>
                                    <p>Tiempo de inicio en castellano</p>
                                    <input
                                        className='__input'
                                        required
                                        type='text'
                                        disabled={menu.time === false || menu.especial === null}
                                        value={menu.especial?.time?.timeInitTitle?.es || ''}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    especial: {
                                                        time: {
                                                            ...menu.especial.time,
                                                            timeInitTitle: {
                                                                ...menu.especial.time.timeInitTitle,
                                                                es: e.target.value
                                                            }
                                                        }
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                                <label className='__label'>
                                    <p>Tiempo de inicio en ingles</p>
                                    <input
                                        className='__input'
                                        required
                                        type='text'
                                        disabled={menu.time === false || menu.especial === null}
                                        value={menu.especial?.time?.timeInitTitle?.en || ''}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    especial: {
                                                        time: {
                                                            ...menu.especial.time,
                                                            timeInitTitle: {
                                                                ...menu.especial.time.timeInitTitle,
                                                                en: e.target.value
                                                            }
                                                        }
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                            </div>
                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>Tiempo de finalización en castellano
                                    <input
                                        className='__input'
                                        required
                                        type='text'
                                        disabled={menu.time === false || menu.especial === null}
                                        value={menu.especial?.time?.timeEndTitle?.es || ''}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    especial: {
                                                        time: {
                                                            ...menu.especial.time,
                                                            timeEndTitle: {
                                                                ...menu.especial.time.timeEndTitle,
                                                                es: e.target.value
                                                            }
                                                        }
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                                <label className='__label'>
                                    <p>Tiempo de finalización en ingles</p>
                                    <input
                                        className='__input'
                                        required
                                        type='text'
                                        disabled={menu.time === false || menu.especial === null}
                                        value={menu.especial?.time?.timeEndTitle?.en || ''}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    especial: {
                                                        time: {
                                                            ...menu.especial.time,
                                                            timeEndTitle: {
                                                                ...menu.especial.time.timeEndTitle,
                                                                en: e.target.value
                                                            }
                                                        }
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                            </div>
                        </div>
                        <hr />
        </>
    );
}
