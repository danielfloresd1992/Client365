'use client';
import { FaCamera } from 'react-icons/fa';
import SectionHeader from '../SectionHeader.jsx';

/** Genera los subtítulos por defecto según la cantidad de fotos requeridas. */
const setCaptionArrays = (length) => {
    const arrayCapcion = [];
    for (let index = 0; index < length; index++) {
        arrayCapcion.push({
            index: index + 1,
            es: length < 2 ? 'Novedad' : index === 0 ? 'Inicio' : index === length - 1 ? 'Fin' : 'Secuencia',
            en: length < 2 ? 'Novelty' : index === 0 ? 'Start' : index === length - 1 ? 'End' : 'Sequence'
        });
    }
    return (arrayCapcion);
};

/** Cantidad de fotos requeridas y el subtítulo bilingüe de cada una. */
export default function FotosSection({ menu, setMenu }) {
    // Subtítulos por cada foto requerida (se regeneran al cambiar la cantidad)
    function boxRender() {
        if (menu?.photos?.length > 0) {
            return (
                menu?.photos?.caption?.map((item, index, arr) => (
                    <div className='__border-smoothed __midPadding' key={item.index} >
                        <p className=''>caption de la imagen: n° {item.index}</p>

                        <label className='__width-complete __label'>
                            <p>Título en español</p>
                            <textarea
                                className='__input __never-resize'
                                required
                                value={item.es || ''}
                                onChange={
                                    e => {
                                        let newArray = [...menu.photos.caption];
                                        newArray[item.index - 1].es = e.target.value;
                                        setMenu({ ...menu, photos: { ...menu.photos, caption: newArray } });
                                    }
                                }
                            >
                            </textarea>
                        </label>
                        <label className='__width-complete __label'>
                            <p>Título en inglés</p>
                            <textarea
                                className='__input __never-resize'
                                required
                                value={item.en || ''}
                                onChange={
                                    e => {
                                        let newArray = [...menu.photos.caption];
                                        newArray[item.index - 1].en = e.target.value;
                                        setMenu({ ...menu, photos: { ...menu.photos, caption: newArray } });
                                    }
                                }
                            >
                            </textarea>
                        </label>
                    </div>
                ))
            )
        }
    };

    return (
        <>
                        {/* ══ SECCIÓN: Fotografías ══════════════════════════════ */}
                        <SectionHeader icon={FaCamera} label="Fotografías y subtítulos" color='#6d28d9' bg='#f5f3ff' />
                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label'>
                                <p>Número de imagenes</p>
                                <input
                                    className='__input'
                                    required
                                    name='photosLength'
                                    type='number'
                                    min='1'
                                    max='4'
                                    value={menu.photos?.length || 0}
                                    onChange={
                                        e => {
                                            if (e.target.value === '0' || Number(e.target.value) > 4) return console.error('el numero de fotos no puede superar a 4');
                                            setMenu(
                                                {
                                                    ...menu,
                                                    photos: {
                                                        length: Number(e.target.value),
                                                        caption: setCaptionArrays(Number(e.target.value))
                                                    }
                                                }
                                            );
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <div className='__center_center __width-complete __oneGap __wrap'>
                            {
                                boxRender()
                            }
                        </div>
                        <hr />
        </>
    );
}
