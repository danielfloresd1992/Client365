'use client';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { FaBell, FaRedo, FaCheck } from 'react-icons/fa';

import { JarvisGroup } from '@/libs/ajaxClient/API_JARVIS';
import { setConfigModal } from '@/store/slices/globalModal';

import FormNav from './form/FormNav.jsx';
import HistoryPanel from './form/HistoryPanel.jsx';
import CategoriaSection from './form/sections/CategoriaSection.jsx';
import TituloReporteSection from './form/sections/TituloReporteSection.jsx';
import EncabezadoSection from './form/sections/EncabezadoSection.jsx';
import TitulosSection from './form/sections/TitulosSection.jsx';
import DatosRequeridosSection from './form/sections/DatosRequeridosSection.jsx';
import TiempoSection from './form/sections/TiempoSection.jsx';
import FotosSection from './form/sections/FotosSection.jsx';
import TiempoEspecialSection from './form/sections/TiempoEspecialSection.jsx';
import DatosAdicionalesSection from './form/sections/DatosAdicionalesSection.jsx';
import GerentesSection from './form/sections/GerentesSection.jsx';
import BonoSection from './form/sections/BonoSection.jsx';
import { bonusSystemVacio } from '../lib/bonusLabels.js';
import ReporteSection from './form/sections/ReporteSection.jsx';

/**
 * Formulario de alerta (menú) en modal.
 *
 * Responsabilidades de este archivo: estado del formulario, sincronización con
 * la alerta seleccionada, validaciones y envío (crear / editar parcial), y el
 * caparazón del modal. Cada bloque de campos vive en ./form/sections.
 *
 * @param menuIndividual - alerta cargada (null → modo creación)
 * @param local          - locales, para la bonificación DEPRECATED
 * @param resetNoveltie  - limpia la alerta seleccionada en el contenedor
 * @param putMenuProps   - PUT parcial de la alerta
 * @param createMenu     - POST de una alerta nueva
 * @param addMenu        - inserta la alerta creada en la lista
 * @param user           - usuario en sesión (para el aviso de WhatsApp)
 * @param onClose        - cierra el modal
 * @param onSaved        - avisa que hubo un guardado (refresca la lista)
 */
function Form({
    menuIndividual,
    local,
    // Las franquicias hacen falta para las excepciones por marca. Llegan del
    // contenedor y no se piden acá: el formulario se monta y se desmonta cada
    // vez que se abre una alerta, y volvería a pedirlas en cada apertura.
    franchises = [],
    resetNoveltie,
    putMenuProps,
    createMenu,
    addMenu,
    user = null,
    onClose = () => {},
    onSaved = () => {}
}) {

    /** Estado inicial de una alerta nueva (y forma canónica del documento). */
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

        // Sistema de bonificación. Nace APAGADO: crear una alerta y que
        // empiece a pagar sin que nadie lo decida sería lo contrario de lo
        // que se quiere. Ver assets/lib/bonusLabels.js.
        bonusSystem: bonusSystemVacio(),

        useOnlyForTheReportingDocument: false,
        useOfLiveAlertForTheCustomer: false,
        noSubtitleInTheReport: false,
        groupingInTheReport: 'individual',
        descriptionNoteForReportDocument: false,
        doesItrequireVideo: false
    };

    const [menu, setMenu] = useState(factorReset);
    const dispatch = useDispatch();

    // Carga la alerta seleccionada; sin selección, vuelve al estado inicial
    useEffect(() => {
        if (menuIndividual) {
            setMenu({ ...menuIndividual });
        }
        else {
            setMenu({ ...factorReset });
        }
    }, [menuIndividual]);

    // ¿Hay cambios sin guardar respecto al estado base (edición o creación)?
    const isDirty = () => {
        const base = menuIndividual || factorReset;
        return Object.keys(menu).some(k => {
            if (k === '_id' || k === 'updateByUser' || k === '__v') return false;
            return JSON.stringify(menu[k]) !== JSON.stringify(base?.[k]);
        });
    };

    // Cierre solicitado por el usuario: si hay cambios sin guardar, pide confirmar.
    const requestClose = () => {
        if (!isDirty()) return onClose();
        dispatch(setConfigModal({
            modalOpen: true,
            title: 'Cambios sin guardar',
            description: 'Tienes cambios sin guardar. ¿Deseas descartarlos y cerrar?',
            isCallback: () => onClose(),
            type: 'warning'
        }));
    };

    // Muestra un modal de error con el mensaje del backend (fallback por status).
    const showRequestError = err => {
        const status = err?.response?.status;
        const message = err?.response?.data?.message
            ?? (status === 401 ? 'No autenticado: inicia sesión de nuevo.'
              : status === 403 ? 'No tienes permiso de super usuario para crear o editar alertas.'
              : 'Ocurrió un error al procesar la solicitud.');
        dispatch(setConfigModal({
            modalOpen: true,
            title: status === 403 ? 'No autorizado' : 'Error',
            description: message,
            isCallback: null,
            type: 'error'
        }));
    };

    // Bloquea el scroll del fondo mientras el modal está montado
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prevOverflow; };
    }, []);

    // Cierra con Escape (sin array de deps: capta el estado actual en cada render)
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') requestClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    /** Aviso al grupo de WhatsApp tras crear o editar una alerta. */
    const sendAlert = text => {
        const formData = new FormData();
        formData.append('my-text', text);
        axios.post(`https://72.68.60.254:4000/bot/imgV2/number=${JarvisGroup}`, formData)
            .then(response => response)
            .catch(err => console.error(err));
    };

    /**
     * Envío del formulario: valida, y crea (POST) o edita (PUT parcial).
     *
     * En edición se mandan SOLO los campos modificados respecto a la alerta
     * cargada: el backend hace $set de esos campos y registra la auditoría.
     * Enviar el documento completo borraría lo no incluido y no habría historial.
     */
    const putMenu = e => {
        e.preventDefault();
        if (menu.category === '--Selecione una categoria--') {
            return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Seleccione una categoría antes de continuar.', isCallback: null, type: 'error' }));
        }
        if (!menu.photos.length || menu.photos.length === 0) {
            return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Debe indicar al menos 1 foto requerida.', isCallback: null, type: 'error' }));
        }
        // El sistema de bonificación solo se valida si está encendido.
        if (menu.bonusSystem?.isEnabled) {
            if (!menu.bonusSystem.regulationCode?.trim()) {
                return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'Ingrese el código del reglamento para la bonificación.', isCallback: null, type: 'error' }));
            }
            // Sin regla general Y sin excepciones, la bonificación está
            // encendida pero no aplica en ningún lado. Se avisa acá porque
            // guardado se ve idéntico a una alerta bien configurada.
            const sinExcepciones = !(menu.bonusSystem.franchiseExceptions?.length)
                && !(menu.bonusSystem.localExceptions?.length);
            if (menu.bonusSystem.defaultRule?.bonifies === false && sinExcepciones) {
                return dispatch(setConfigModal({ modalOpen: true, title: 'Validación', description: 'La bonificación está encendida pero no aplica en ningún establecimiento: activá la regla general o agregá al menos una excepción.', isCallback: null, type: 'error' }));
            }
        }

        if (menu._id === null) {
            createMenu(menu, (err, data) => {
                if (err) return showRequestError(err);
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
                onClose();
                onSaved();
            });
        }
        else if (menu._id !== null) {
            const original = menuIndividual || {};
            const changed = {};
            Object.keys(menu).forEach(key => {
                if (key === '_id' || key === 'updateByUser' || key === '__v') return;
                if (JSON.stringify(menu[key]) !== JSON.stringify(original[key])) {
                    changed[key] = menu[key];
                }
            });

            if (Object.keys(changed).length === 0) {
                return dispatch(setConfigModal({ modalOpen: true, title: 'Sin cambios', description: 'No hay cambios para guardar.', isCallback: null, type: 'warning' }));
            }

            const payload = { _id: menu._id, ...changed };

            putMenuProps(payload, (err, data) => {
                if (err) return showRequestError(err);
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
                onClose();
                onSaved();
            });
        }
    };

    const isEdit   = Boolean(menu?._id);
    const subtitle = menu?.category && menu.category !== '--Selecione una categoria--'
        ? menu.category
        : 'Configuración de la alerta';

    return (
        <div
            className='alert-modal-overlay'
            onMouseDown={() => requestClose()}
        >
            <div
                className='alert-modal'
                id='menu-render'
                role='dialog'
                aria-modal='true'
                onMouseDown={e => e.stopPropagation()}
            >
                {/* ── Cabecera fija: ícono + título/categoría + Reset + cerrar ── */}
                <div className='alert-modal__header'>
                    <span className='alert-modal__icon'>
                        <FaBell size={18} />
                    </span>

                    <div className='alert-modal__titles'>
                        <span className='alert-modal__title'>
                            {isEdit ? 'Editar alerta' : 'Nueva alerta'}
                        </span>
                        <span className='alert-modal__subtitle'>{subtitle}</span>
                    </div>

                    <div className='alert-modal__head-actions'>
                        <button
                            type='button'
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

                        <button
                            type='button'
                            className='alert-modal__close'
                            onClick={() => requestClose()}
                            title='Cerrar'
                            aria-label='Cerrar'
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Navegación por secciones */}
                <FormNav />

                {/* ── Cuerpo desplazable con el formulario ────────────────────── */}
                <div className='alert-modal__body scrollthemeY'>
                    {/* Historial de cambios (solo en edición, si hay auditoría) */}
                    <HistoryPanel entries={isEdit ? menuIndividual?.updateByUser : null} />

                    <div className='configurationMenu'>
                        <form className='__flexRowFlex __oneGap' id='form-menu' onSubmit={e => putMenu(e)}>
                            <CategoriaSection        menu={menu} setMenu={setMenu} />
                            <TituloReporteSection    menu={menu} setMenu={setMenu} />
                            <EncabezadoSection       menu={menu} setMenu={setMenu} />
                            <TitulosSection          menu={menu} setMenu={setMenu} />
                            <DatosRequeridosSection  menu={menu} setMenu={setMenu} />
                            <TiempoSection           menu={menu} setMenu={setMenu} />
                            <FotosSection            menu={menu} setMenu={setMenu} />
                            <TiempoEspecialSection   menu={menu} setMenu={setMenu} />
                            <DatosAdicionalesSection menu={menu} setMenu={setMenu} />
                            <GerentesSection         menu={menu} setMenu={setMenu} />
                            <BonoSection             menu={menu} setMenu={setMenu} local={local} franchises={franchises} />
                            <ReporteSection          menu={menu} setMenu={setMenu} />
                        </form>
                    </div>
                </div>

                {/* ── Pie fijo con las acciones principales ──────────────────── */}
                <div className='alert-modal__footer'>
                    <button
                        type='button'
                        className='alert-modal__cancel'
                        onClick={() => requestClose()}
                    >
                        Cancelar
                    </button>

                    <button
                        type='submit'
                        form='form-menu'
                        className='alert-modal__submit'
                    >
                        <FaCheck size={13} />
                        {isEdit ? 'Guardar cambios' : 'Crear alerta'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export { Form };
