'use client';
import axiosStand from '@/libs/axios.fetch';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { JarvisGroup } from '@/libs/API_JARVIS';
import { setConfigModal } from '@/store/slices/globalModal';
import titleHeader from '../model/optionsHeader.js';
import category from '../model/category.js';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import axios from 'axios';



function Form({
    menuIndividual,
    local,
    resetNoveltie,
    putMenuProps,
    createMenu,
    modal,
    addMenu,
    user = null
}) {


    const factorReset = {
        es: '',
        en: '',
        textHeader: null,
        especial: null,
        amountOfSomething: false,
        table: false,
        time: false,
        timeUnique: false,
        category: '--Selecione una categoria--',
        isArea: false,
        isDescriptionPerson: false,
        photos: {
            length: '',
            caption: []
        },
        _id: null,
        car: false,
        rulesForBonus: {
            forLocal: 'Todos',
            worth: '',
            amulative: ''
        },
        useOnlyForTheReportingDocument: false,
        useOfLiveAlertForTheCustomer: false,
        groupingInTheReport: 'individual',
        descriptionNoteForReportDocument: false,
        doesItrequireVideo: false
    };


    const [menu, setMenu] = useState(factorReset);
    const dispatch = useDispatch();




    useEffect(() => {
        if (menuIndividual) {
            setMenu({ ...menuIndividual });
        }
        else {
            setMenu({ ...factorReset });
        }
    }, [menuIndividual]);




    function boxRender() {
        if (menu?.photos?.length > 0) {
            return (
                menu?.photos?.caption?.map((item, index, arr) => (
                    <div className='__border-smoothed __midPadding' key={item.index} >
                        <p className=''>caption de la imagen: n° {item.index}</p>

                        <label className='__width-complete __label'>
                            {
                                console.log(arr)
                            }
                            <p>Títutlo en español</p>
                            <textarea  //configurationMenu-input count-img-form-child-input
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
                            <p>Títutlo en ingles</p>
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


    const setCaptionArrays = (length) => {
        const arrayCapcion = [];
        for (let index = 0; index < length; index++) {
            console.log(index === 1)
            arrayCapcion.push({
                index: index + 1,
                es: length < 2 ? 'Novedad' : index === 0 ? 'Inicio' : index === length - 1 ? 'Fin' : 'Secuencia',
                en: length < 2 ? 'Novelty' : index === 0 ? 'Start' : index === length - 1 ? 'End' : 'Sequence'
            });
        }
        return (arrayCapcion);
    };

    const putMenu = e => {
        e.preventDefault();
        if (menu.category === '- Selecione una categoria -') return console.error('Selecione una categoria');
        if (menu.photos.length === 0) return console.error('debería haber algun valor en cantidad de fotos');
        if (menu.rulesForBonus.amulative === '' || menu.rulesForBonus.worth === '') return console.error('valores nulos en cantidad y acumulativo');

        if (menu._id === null) {
            createMenu(menu, (err, data) => {
                if (err) return console.error(err);
                addMenu(data.data);
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Exito',
                    description: 'Menú creado',
                    isCallback: null,
                    type: 'successfull'
                }));
                sendAlert(`Menu creado por: ${user.name} ${user.surName}\nTítulo: ${menu.es}\nEn: ${menu.en}`)
                resetNoveltie();
                setMenu(factorReset);
            });
        }
        else if (menu._id !== null) {
            putMenuProps(menu, (err, data) => {
                if (err) return console.error(err);
                resetNoveltie();
                setMenu(factorReset);
                sendAlert(`Menu editado por: ${user.name} ${user.surName}\nTítulo: ${menu.es}\nEn: ${menu.en}`);
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Exito',
                    description: 'Menú editado',
                    isCallback: null,
                    type: 'successfull'
                }));
            });
        }
    };


    const putArrayForBonus = params => {
        dispatch(setConfigModal({
            modalOpen: true,
            title: 'Aviso',
            description: 'Desea eliminar este local de la bonificación',
            isCallback: () => {
                let newObject;
                if (menu.rulesForBonus.forLocal.length === 1) {
                    newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: 'Todos' } };
                }
                else {
                    const newList = menu.rulesForBonus.forLocal.filter(item => item.idLocal !== params);
                    newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: newList } };
                }
                setMenu(newObject);
            },
            type: 'warning'
        }));
    };


    const localName = local?.map(item => {
        return <option key={item._id} value={item._id}>{item.name}</option>
    });


    const sendAlert = text => {
        const formData = new FormData();
        formData.append('my-text', text);
        axios.post(`https://72.68.60.254:4000/bot/imgV2/number=${JarvisGroup}`, formData)
            .then(response => response)
            .catch(err => console.error(err));
    };


    return (
        <>
            <div
                className='contentStatic __width-mid __padding1rem scrollthemeY __border-smoothed bgWhite __flexRowFlex __oneGap'
                id='menu-render'
            >
                <div className='contain-between'>
                    <p className='menuConfigurtationHeader-text'>Configuración alertas</p>
                    <button
                        className='btn-item btn-item__reset'
                        disabled={!Boolean(menu)}
                        onClick={() => {
                            resetNoveltie();
                            setMenu({ ...factorReset });
                        }}
                    >reset</button>
                </div>
                <hr />

                <div className='configurationMenu'>
                    <form className='__flexRowFlex __oneGap' id='form-menu' onSubmit={e => putMenu(e)}>

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

                        <div className='__flexRowFlex __width-complete'>
                            <label className='__label' >
                                <p className='__text-center'>Requiere numero de mesa</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={menu.table}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, table: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />



                        <div className='flex columns __width-complete __oneGap'>


                            <p className='__text-center'>Tipo de tiempo</p>

                            <div className='__center_center __oneGap'>
                                <label className='__label'>
                                    <p className='__text-center'>Sin tiempo</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={!Boolean(menu.time) && !Boolean(menu.timeUnique)}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: false, timeUnique: false, especial: null };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>

                                <label className='__label'>
                                    <p className='__text-center'>Tiempo único</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={menu.timeUnique}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: false, timeUnique: true, especial: null };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>

                                <label className='__label'>
                                    <p className='__text-center'>Tiempo de inició y finalizó</p>
                                    <input
                                        className='configurationMenu-radio'
                                        required
                                        type='radio'
                                        name='time'
                                        checked={menu.time}
                                        onChange={
                                            () => {
                                                const newMenu = { ...menu, time: true, timeUnique: false };
                                                setMenu(newMenu);
                                            }
                                        }
                                    />
                                    <div className='configurationMenu-radio-dog'></div>
                                </label>
                            </div>
                        </div>

                        <hr />

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
                        {
                            console.log(menu)
                        }
                        <div className='__flexRowFlex __width-complete'>
                            <label className='__label' >
                                <p className='__text-center'>¿Se requiere contabilizar un objetivo?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.amountOfSomething)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, amountOfSomething: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label __text-center' >
                                <p>¿ Requiere Modelo y colores de automovil ?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.car)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, car: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label __text-center' >
                                <p>¿ Descipción de persona ?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.isDescriptionPerson)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, isDescriptionPerson: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />

                        <div className='flex columns __width-complete __oneGap'>
                            <label className='__label' >
                                <p className='__text-center'>¿Descipción de área?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.isArea)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, isArea: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                        </div>
                        <hr />

                        <div className='flex columns __width-complete __oneGap'>
                            <p className=''>bonificación para:</p>
                            <label className='__label'> Locales o todos
                                <select
                                    className='__input'
                                    onChange={
                                        e => {
                                            if (e.target.value === 'Todos') {
                                                const newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: 'Todos' } }
                                                setMenu(newObject);
                                            }
                                            else {
                                                const localFill = local.filter(item => item._id === e.target.value);
                                                if (menu.rulesForBonus?.forLocal === undefined || typeof menu.rulesForBonus?.forLocal === 'string') {

                                                    const newArrayLocal = [{ idLocal: localFill[0]._id, name: localFill[0].name }];
                                                    const newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: newArrayLocal } };
                                                    setMenu(newObject);
                                                }
                                                else {
                                                    const newArrayLocal = [...menu.rulesForBonus.forLocal, { idLocal: localFill[0]._id, name: localFill[0].name }];
                                                    const newObject = { ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: newArrayLocal } };
                                                    setMenu(newObject);
                                                }
                                            }
                                        }
                                    }
                                >
                                    <option value='Todos'>Todos</option>
                                    {localName}
                                </select>
                            </label>
                        </div>


                        <div className='__center_center __width-complete __oneGap __wrap'>
                            {
                                menu.rulesForBonus.forLocal === 'Todos' || menu.rulesForBonus.forLocal === undefined ?
                                    (
                                        <>
                                            <h2
                                                style={{
                                                    textAlign: 'center',
                                                    color: '#001453'
                                                }}
                                            >Para todos los locales</h2>
                                        </>
                                    )
                                    :
                                    (
                                        <>
                                            {
                                                Array.isArray(menu.rulesForBonus.forLocal) ?
                                                    (
                                                        menu.rulesForBonus.forLocal.map(local => (
                                                            <>
                                                                <div className='tag'>
                                                                    <p className='itemlocal-nameText'>{local.name}</p>
                                                                    <button
                                                                        className='list-itemlocal-btn'
                                                                        type='button'
                                                                        onClick={
                                                                            () => {
                                                                                putArrayForBonus(local.idLocal);
                                                                            }
                                                                        }
                                                                    >
                                                                        <img className='list-itemlocal-btnImg'
                                                                            src='ico/delete/delete.svg' alt="" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ))

                                                    )
                                                    :
                                                    (null)
                                            }
                                        </>
                                    )
                            }

                        </div>
                        <hr />
                        <div className='__center_center columns __width-complete __oneGap'>
                            <p className='__text-center'>Regla de bonificación</p>

                            <div className='contentDoubleLabelFlex'>
                                <label className='__label'>
                                    <p>Valor de bono</p>
                                    <input
                                        type='number'
                                        className='__input'
                                        value={menu.rulesForBonus?.worth}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    rulesForBonus: {
                                                        ...menu.rulesForBonus,
                                                        worth: Number(e.target.value)
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                                <label className='__label'>
                                    <p>Aumulativo</p>
                                    <input
                                        className='__input'
                                        type='number'
                                        value={menu.rulesForBonus?.amulative}
                                        onChange={
                                            e => {
                                                const newObject = {
                                                    ...menu,
                                                    rulesForBonus: {
                                                        ...menu.rulesForBonus,
                                                        amulative: Number(e.target.value)
                                                    }
                                                };
                                                setMenu(newObject);
                                            }
                                        }
                                    />
                                </label>
                            </div>
                        </div>

                        <br />
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
                                        {text: 'Individual por pagina', value:'individual' },
                                        {text: 'Dos por paginas', value:'dual' },,
                                        {text: '4 por páginas', value:'quadruple' }
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

                        <button className='btn-item'>
                            {
                                menu._id === null ?
                                    'Crear' :
                                    'Editar'
                            }
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}


export { Form };