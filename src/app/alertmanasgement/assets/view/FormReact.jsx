'use client';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { JarvisGroup } from '@/libs/ajaxClient/API_JARVIS';
import { setConfigModal } from '@/store/slices/globalModal';
import titleHeader from '../model/optionsHeader.js';
import category from '../model/category.js';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import axios from 'axios';

// ── Iconos de sección (react-icons/fa) ───────────────────────────────────────
import {
    FaBell,           // encabezado principal del formulario
    FaTag,            // categoría y referencia
    FaFileAlt,        // título para el documento de reporte
    FaAlignLeft,      // encabezado textual de la alerta
    FaLanguage,       // títulos bilingües ES / EN
    FaClipboardList,  // datos requeridos (mesa, cantidad)
    FaClock,          // tipo de tiempo
    FaCamera,         // fotografías y subtítulos
    FaCog,            // configuración especial de tiempo
    FaCar,            // datos de vehículo
    FaUser,           // descripción de persona
    FaMapMarkerAlt,   // descripción de área
    FaStar,           // reglas de bonificación
    FaFileContract,   // configuración de reporte y alerta en vivo
    FaRedo,           // botón reset
    FaCheck,          // botón crear / editar
    FaUserTie         // managers
} from 'react-icons/fa';

// ── Encabezado visual de sección ─────────────────────────────────────────────
// Muestra un ícono + etiqueta en mayúsculas para separar visualmente
// cada bloque del formulario sin alterar la lógica de los campos.
const SectionHeader = ({ icon: Icon, label, color = '#374151', bg = '#f3f4f6' }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 10px',
        borderRadius: '7px',
        background: bg,
        marginBottom: '6px',
    }}>
        <Icon size={13} color={color} />
        <span style={{
            fontWeight: 700,
            fontSize: '11px',
            color: color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
        }}>
            {label}
        </span>
    </div>
);


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

        // Título alternativo usado en el documento de reporte (bilingüe)
        titleForDocumentReport: { es: '', en: '' },

        textHeader: null,
        especial: null,
        amountOfSomething: false,
        table: false,
        time: false,
        timeUnique: false,
        category: '--Selecione una categoria--',
        isArea: false,
        managerReferenceTitle: false,
        managerReferenceId: false,
        isDescriptionPerson: false,
        photos: {
            length: '',
            caption: []
        },
        _id: null,
        car: false,

        // DEPRECATED — se mantiene por compatibilidad con alertas antiguas
        rulesForBonus: {
            forLocal: 'Todos',
            worth: '',
            amulative: ''
        },

        // NUEVO sistema de bonificación (mapea al reglamento oficial de bonos)
        bonusCalculationRules: {
            activate: false,
            defaultRule: {
                worth: 1,          // multiplicador: 1=X1, 2=X2, 3=X3, 5=X5
                acum: 1,          // ocurrencias para contar como bono
                valueBonusForTheStaffOnDuty: {
                    day: 0.20,    // valor por punto turno diurno
                    nigth: 0.30     // valor por punto turno nocturno / extra
                },
                reglamentoCode: '', // código del reglamento (ej: "1.1", "R2.3")
                description: '', // descripción interna de la regla
                defaultActive: true
            },
            localSpecificRules: []
        },

        useOnlyForTheReportingDocument: false,
        useOfLiveAlertForTheCustomer: false,
        noSubtitleInTheReport: false,
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
                            <p>Título en español</p>
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

    const putMenu = e => {
        e.preventDefault();
        if (menu.category === '--Selecione una categoria--') {
            return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Seleccione una categoría antes de continuar.', isCallback: null, type: 'error' }));
        }
        if (!menu.photos.length || menu.photos.length === 0) {
            return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Debe indicar al menos 1 foto requerida.', isCallback: null, type: 'error' }));
        }
        // Valida el nuevo sistema de bonificación solo si está activado
        if (menu.bonusCalculationRules.activate) {
            if (!menu.bonusCalculationRules.defaultRule.reglamentoCode.trim()) {
                return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Ingrese el código del reglamento para el bono.', isCallback: null, type: 'error' }));
            }
        }

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
                {/* ── Cabecera del panel: ícono + título + botón reset ───────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBell size={20} color='#d97706' />
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
                            Configuración de alertas
                        </span>
                    </div>
                    <button
                        className='btn-item btn-item__reset'
                        disabled={!Boolean(menu)}
                        onClick={() => {
                            resetNoveltie();
                            setMenu({ ...factorReset });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <FaRedo size={11} /> Reset
                    </button>
                </div>
                <hr />

                <div className='configurationMenu'>
                    <form className='__flexRowFlex __oneGap' id='form-menu' onSubmit={e => putMenu(e)}>

                        {/* ══ SECCIÓN: Categoría y referencia ═══════════════════ */}
                        <SectionHeader icon={FaTag} label="Categoría y referencia" color='#1d4ed8' bg='#eff6ff' />

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

                        {/* ══ SECCIÓN: Datos requeridos en la alerta ════════════ */}
                        <SectionHeader icon={FaClipboardList} label="Datos requeridos" color='#0369a1' bg='#f0f9ff' />
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



                        {/* ══ SECCIÓN: Tipo de tiempo ═══════════════════════════ */}
                        <SectionHeader icon={FaClock} label="Tipo de tiempo" color='#854d0e' bg='#fffbeb' />
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

                        {/* ══ SECCIÓN: Datos adicionales de la alerta ══════════ */}
                        <SectionHeader icon={FaClipboardList} label="Datos adicionales" color='#0369a1' bg='#f0f9ff' />
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
                            <label className='__label __text-center' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaCar size={14} color='#475569' />
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
                            <label className='__label __text-center' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaUser size={14} color='#065f46' />
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
                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaMapMarkerAlt size={14} color='#b91c1c' />
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


                        <SectionHeader icon={FaUserTie} label="Configuración de Gerentes o MAnagers en título y referencias" color='#FF2700' bg='#FFE5E0' />

                        <div className='flex columns __width-complete __oneGap'>


                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                <p className='__text-center'>Referencia de gerentes en la novedad</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.managerReferenceId)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, managerReferenceId: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                            <label className='__label' style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                                <p className='__text-center'>Referencia de gerentes en el título</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    name='table'
                                    checked={Boolean(menu.managerReferenceTitle)}
                                    onChange={
                                        e => {
                                            setMenu({ ...menu, managerReferenceTitle: e.target.checked });
                                        }
                                    }
                                />
                            </label>
                            {
                                menu?.managerReferenceTitle && (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#666', fontWeight: 'semibold' }}>Nota a considerar, acomode el titulo acerde al nombre del manager o gerente
                                            <br />
                                            <b>Ejemplo en castellano: "{menu?.es} Gerente JARVIS"</b>
                                            <br />
                                            <b>Ejemplo en ingles: "Manager JARVIS {menu?.en}"</b>
                                        </p>
                                    </>
                                )

                            }
                        </div>
                        <hr />

                        {/* ══════════════════════════════════════════════════════════════
                            NUEVO SISTEMA DE BONIFICACIÓN
                            Mapea directamente al Reglamento de Registro de Bonos oficial.
                            Multiplcadores: X1 (1), X2 (2), X3 (3), X5 (5)
                            Valor por punto: 0.20 (diurno) / 0.30 (nocturno y extra)
                            ══════════════════════════════════════════════════════════════ */}
                        {/* ══ SECCIÓN: Regla de bonificación ═══════════════════ */}
                        <SectionHeader icon={FaStar} label="Regla de bonificación" color='#b45309' bg='#fffbeb' />
                        <div className='flex columns __width-complete __oneGap' style={{ border: '2px solid #2bcb00', borderRadius: '8px', padding: '12px' }}>
                            <b>Regla de bonificación</b>
                            <p style={{ fontSize: '12px', color: '#555' }}>Basado en el Reglamento de Registro de Bonos (Gerencia de Operaciones).</p>

                            {/* Activar / Desactivar bono para esta alerta */}
                            <label className='__label __text-center'>
                                <p>¿Esta alerta genera bono al operador?</p>
                                <input
                                    className='__input'
                                    type='checkbox'
                                    checked={Boolean(menu.bonusCalculationRules?.activate)}
                                    onChange={e => setMenu({
                                        ...menu,
                                        bonusCalculationRules: {
                                            ...menu.bonusCalculationRules,
                                            activate: e.target.checked
                                        }
                                    })}
                                />
                            </label>

                            {/* Campos adicionales — solo visibles cuando el bono está activado */}
                            {menu.bonusCalculationRules?.activate && (
                                <>
                                    <div className='contentDoubleLabelFlex'>

                                        {/* Multiplicador del bono según tipo de alerta */}
                                        <label className='__label'>
                                            <p>Multiplicador (tipo de bono)</p>
                                            <select
                                                className='__input'
                                                value={menu.bonusCalculationRules.defaultRule?.worth ?? 1}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            worth: Number(e.target.value)
                                                        }
                                                    }
                                                })}
                                            >
                                                <option value={1}>X1 — Alerta común</option>
                                                <option value={2}>X2 — Alerta resaltante</option>
                                                <option value={3}>X3 — Alerta especial</option>
                                                <option value={5}>X5 — Alerta crítica</option>
                                            </select>
                                        </label>

                                        {/* Ocurrencias antes de contarse como bono (ej: "bono a la 2° vez") */}
                                        <label className='__label'>
                                            <p>Ocurrencias para contar (acumulativo)</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                min='1'
                                                value={menu.bonusCalculationRules.defaultRule?.acum ?? 1}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            acum: Number(e.target.value)
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    <div className='contentDoubleLabelFlex'>
                                        {/* Valor en puntos por turno diurno (reglamento: 0.20) */}
                                        <label className='__label'>
                                            <p>Valor punto — Turno diurno</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                step='0.01'
                                                value={menu.bonusCalculationRules.defaultRule?.valueBonusForTheStaffOnDuty?.day ?? 0.20}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            valueBonusForTheStaffOnDuty: {
                                                                ...menu.bonusCalculationRules.defaultRule.valueBonusForTheStaffOnDuty,
                                                                day: Number(e.target.value)
                                                            }
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                        {/* Valor en puntos por turno nocturno/extra (reglamento: 0.30) */}
                                        <label className='__label'>
                                            <p>Valor punto — Nocturno / Extra</p>
                                            <input
                                                className='__input'
                                                type='number'
                                                step='0.01'
                                                value={menu.bonusCalculationRules.defaultRule?.valueBonusForTheStaffOnDuty?.nigth ?? 0.30}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            valueBonusForTheStaffOnDuty: {
                                                                ...menu.bonusCalculationRules.defaultRule.valueBonusForTheStaffOnDuty,
                                                                nigth: Number(e.target.value)
                                                            }
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    <div className='contentDoubleLabelFlex'>
                                        {/* Código del ítem en el reglamento (ej: "1.1", "R2.3", "E1.1") */}
                                        <label className='__label'>
                                            <p>Código reglamento <span style={{ color: 'red' }}>*</span></p>
                                            <input
                                                className='__input'
                                                type='text'
                                                placeholder='Ej: 1.1 · R2.3 · E1.1'
                                                value={menu.bonusCalculationRules.defaultRule?.reglamentoCode ?? ''}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            reglamentoCode: e.target.value
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                        {/* Activo por defecto: indica si el bono aplica sin acción manual */}
                                        <label className='__label __text-center'>
                                            <p>Activo por defecto</p>
                                            <input
                                                className='__input'
                                                type='checkbox'
                                                checked={Boolean(menu.bonusCalculationRules.defaultRule?.defaultActive)}
                                                onChange={e => setMenu({
                                                    ...menu,
                                                    bonusCalculationRules: {
                                                        ...menu.bonusCalculationRules,
                                                        defaultRule: {
                                                            ...menu.bonusCalculationRules.defaultRule,
                                                            defaultActive: e.target.checked
                                                        }
                                                    }
                                                })}
                                            />
                                        </label>
                                    </div>

                                    {/* Descripción interna de la regla de bono */}
                                    <label className='__label'>
                                        <p>Descripción interna de la regla</p>
                                        <textarea
                                            className='__input __never-resize'
                                            placeholder='Ej: Se considera bono a la 2° vez por turno diurno'
                                            value={menu.bonusCalculationRules.defaultRule?.description ?? ''}
                                            onChange={e => setMenu({
                                                ...menu,
                                                bonusCalculationRules: {
                                                    ...menu.bonusCalculationRules,
                                                    defaultRule: {
                                                        ...menu.bonusCalculationRules.defaultRule,
                                                        description: e.target.value
                                                    }
                                                }
                                            })}
                                        />
                                    </label>
                                </>
                            )}
                        </div>

                        {/* ── DEPRECATED: bonificación antigua ────────────────────────────
                            Se mantiene para alertas creadas antes del nuevo sistema.
                            No usar para nuevas alertas. */}
                        <details style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px' }}>
                            <summary style={{ cursor: 'pointer', color: '#888', fontSize: '12px' }}>
                                ⚠️ Bonificación (sistema antiguo — solo para alertas existentes)
                            </summary>
                            <div className='flex columns __width-complete __oneGap' style={{ marginTop: '8px' }}>
                                <label className='__label'>Locales o todos
                                    <select
                                        className='__input'
                                        onChange={e => {
                                            if (e.target.value === 'Todos') {
                                                setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: 'Todos' } });
                                            } else {
                                                const localFill = local.filter(item => item._id === e.target.value);
                                                if (!Array.isArray(menu.rulesForBonus?.forLocal)) {
                                                    setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: [{ idLocal: localFill[0]._id, name: localFill[0].name }] } });
                                                } else {
                                                    setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, forLocal: [...menu.rulesForBonus.forLocal, { idLocal: localFill[0]._id, name: localFill[0].name }] } });
                                                }
                                            }
                                        }}
                                    >
                                        <option value='Todos'>Todos</option>
                                        {localName}
                                    </select>
                                </label>
                                <div className='__center_center __width-complete __oneGap __wrap'>
                                    {menu.rulesForBonus.forLocal === 'Todos' || !Array.isArray(menu.rulesForBonus.forLocal)
                                        ? <p style={{ color: '#001453' }}>Para todos los locales</p>
                                        : menu.rulesForBonus.forLocal.map(loc => (
                                            <div className='tag' key={loc.idLocal}>
                                                <p className='itemlocal-nameText'>{loc.name}</p>
                                                <button className='list-itemlocal-btn' type='button' onClick={() => putArrayForBonus(loc.idLocal)}>
                                                    <img className='list-itemlocal-btnImg' src='ico/delete/delete.svg' alt="" />
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className='contentDoubleLabelFlex'>
                                    <label className='__label'>
                                        <p>Valor de bono</p>
                                        <input type='number' className='__input' value={menu.rulesForBonus?.worth}
                                            onChange={e => setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, worth: Number(e.target.value) } })} />
                                    </label>
                                    <label className='__label'>
                                        <p>Acumulativo</p>
                                        <input className='__input' type='number' value={menu.rulesForBonus?.amulative}
                                            onChange={e => setMenu({ ...menu, rulesForBonus: { ...menu.rulesForBonus, amulative: Number(e.target.value) } })} />
                                    </label>
                                </div>
                            </div>
                        </details>

                        <br />
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

                        {/* Botón de acción principal con ícono contextual */}
                        <button
                            className='btn-item'
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <FaCheck size={13} />
                            {menu._id === null ? 'Crear alerta' : 'Guardar cambios'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}


export { Form };