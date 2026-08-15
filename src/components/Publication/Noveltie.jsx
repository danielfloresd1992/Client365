'use client';
import { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiSun, FiMoon, FiDownload, FiSend, FiTrash2, FiClock, FiUser, FiShield, FiMoreHorizontal, FiThumbsUp, FiThumbsDown, FiShare2, FiStar } from 'react-icons/fi';
import { FaWhatsapp } from "react-icons/fa";
import { isMobile } from 'react-device-detect';

import useAxios from "@/hook/useAxios";
import DataFormart from '@/libs/time/dateFormat.js';
import typeShareJarvis from './assets/shareJarvis';


import { useDispatch, useSelector } from 'react-redux';
import { setConfigModal } from "@/store/slices/globalModal";

import useImageViewer from '@/hook/useImageViewer';
import socket from "@/libs/socket/socketIo";
import Img from './assets/Img';
import { useInView } from 'react-intersection-observer';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';

import changeHostNameForImg from '@/libs/script/changeHostName';
import useAuthOnServer from '@/hook/auth';
import { useDayRole } from '@/contexts/dayRoleContext';

import TextAreaAutoResize from '@/components/inpust/text_area_autoresize';
import MemoSlider from '@/components/carruzel/slider';





function Noveltie({ data, idNoveltie, isNotLobby }) {


    const whatsAppSendingDefault = useSelector(state => state.filterClientList?.groupIdWhatsapp);



    const [noveltyState, setNoveltyState] = useState(null);
    const [deleteState, setDeleteState] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [shareMessageText, setShareMessageText] = useState('');
    const containBtnRef = useRef(null);
    const menuRef = useRef(null);

    // Refs para leer el valor más reciente dentro de los listeners de socket / debounce sin re-suscribir
    const noveltyStateRef = useRef(noveltyState);
    const saveMenuTimeout = useRef(null);

    // Evita el envío duplicado por doble clic en "Enviar video" / "Enviar imagen".
    // El cerrojo vive en un ref y no en el estado porque un doble clic ejecuta
    // ambos handlers antes de que React re-renderice con el estado actualizado.
    const isSharingRef = useRef(false);
    const [isSharing, setIsSharing] = useState(false);
    // Envío automático a WhatsApp falló → habilita descargar imagen/video
    const [autoSendFailed, setAutoSendFailed] = useState(false);
    // El último envío al grupo se hizo SOLO con la imagen: el video se quedó
    // sin publicar. Vive en el estado local porque putValidateNoveltie no
    // refresca noveltyState (eso llega por el socket document_updated) y el
    // botón de descarga tiene que aparecer en el mismo momento del envío.
    const [sentAsImageOnly, setSentAsImageOnly] = useState(false);


    const dataDeleteForUserRef = useRef();
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const { open: openImageViewer } = useImageViewer();
    // Rol del día según el horario: el designado (encargado/auxiliar) puede
    // validar/enviar — el backend lo exige con validateDayRoleUser en el PUT.
    const { hasDayRole } = useDayRole();
    const isReadOnly = !(user?.admin || hasDayRole);
    const hasVideo = !!noveltyState?.videoUrl;
    const { requestAction } = useAxios();
    const dispatch = useDispatch();


    const groupId = noveltyState?.establishment?.groupId;

    useEffect(() => { noveltyStateRef.current = noveltyState; }, [noveltyState]);

    const { ref, inView } = useInView({
        triggerOnce: true
    });



    useEffect(() => {

        if (data.isNewData && !noveltyState) {
            getNovelty();
        }
        else {
            if (inView && !noveltyState) getNovelty();
        }
    }, [inView]);



    useEffect(() => {
        let isSubscribed = true;
        function handlePutPublisher(data) {
            if (!isSubscribed) return;
            const { doc, user: eventUser } = data;
            if (data.userSessionId !== eventUser?.idUser && doc._id === noveltyStateRef.current?._id) {
                setNoveltyState(doc);
            }
        }
        function handleDeletePublisher(data) {
            if (!isSubscribed) return;
            if (data.userSessionId !== user?.userSessionId && data.idNoveltie === noveltyStateRef.current?._id) {
                dataDeleteForUserRef.current = data;
                setDeleteState(true);
            }
        }


        socket.on('document_updated', handlePutPublisher);
        socket.on('reciveDeletePublisher', handleDeletePublisher);

        return () => {
            isSubscribed = false;
            socket.off('document_updated', handlePutPublisher);
            socket.off('reciveDeletePublisher', handleDeletePublisher);
        };

    }, [user?.userSessionId]);



    const getNovelty = () => {
        requestAction({ url: `/novelties/img/id=${idNoveltie}`, action: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    setNoveltyState(response.data[0]);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };



    const putValidateNoveltie = (id, dataParams) => {
        if (user?.admin || hasDayRole) {
            requestAction({ url: `/novelties/id=${id}`, body: dataParams, action: 'PUT' })
                .then(response => {
                    if (response?.status === 200) {

                    }
                })
                .catch(err => {
                    console.log(err);
                    // 403 = sin rol del día (encargado de turno / auxiliar); el
                    // mensaje viene del middleware del backend. Otros errores
                    // muestran un aviso genérico.
                    const status = err?.response?.status;
                    dispatch(setConfigModal({
                        modalOpen: true,
                        title: status === 403 ? 'Acción no permitida' : 'No se pudo actualizar',
                        description: err?.response?.data?.message
                            || 'No se pudo actualizar la novedad. Intenta de nuevo.',
                        isCallback: null,
                        type: status === 403 ? 'warning' : 'error'
                    }));
                });
        }
    };


    // Guarda el menú con debounce para no golpear el backend en cada tecla
    const saveMenuDebounced = (text) => {
        if (saveMenuTimeout.current) clearTimeout(saveMenuTimeout.current);
        saveMenuTimeout.current = setTimeout(() => {
            putValidateNoveltie(noveltyState._id, {
                menu: text,
                isValidate: {
                    ...noveltyState.isValidate,
                    menuEditedBy: `${user.name} ${user.surName}`
                }
            });
        }, 600);
    };


    // Limpia el timer del menú pendiente al desmontar
    useEffect(() => () => {
        if (saveMenuTimeout.current) clearTimeout(saveMenuTimeout.current);
    }, []);




    const deleteNoveltie = () => {
        if (user?.admin) {
            requestAction({ url: `/user/publisher/delete=${data._id}`, action: 'delete' })
                .then(response => {
                    if (response.status === 201) {
                        dataDeleteForUserRef.current = { idNoveltie: noveltyState._id, userSessionId: user.userSessionId, username: `${user.name} ${user.surName}`, action: 'DELETE' };
                        setNoveltyState(null);
                        setDeleteState(true);
                        socket.emit('deletedPublisher', { idNoveltie: noveltyState._id, userSessionId: user.userSessionId, username: `${user.name} ${user.surName}`, action: 'DELETE' });
                    }
                })
                .catch(err => {
                    dispatch(setConfigModal({
                        modalOpen: true,
                        title: 'Error al eliminar',
                        description: 'No se pudo eliminar la publicación. Intenta de nuevo.',
                        isCallback: null,
                        type: 'error'
                    }));
                });
        }
        else {
            dispatch(setConfigModal(
                {
                    modalOpen: true,
                    title: 'Error al eliminar del muro',
                    description: 'No cuentas con permisos de administrador.',
                    isCallback: null,
                    type: 'warning'
                }
            ));
        }
    };



    const shareNoveltyForApiAva = async (imageOnly) => {
        if (isSharingRef.current) return;   // ya hay un envío en curso
        isSharingRef.current = true;
        setIsSharing(true);
        setAutoSendFailed(false);   // nuevo intento: ocultar descargas hasta el resultado

        try {
            if (!whatsAppSendingDefault) {
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Error de envio',
                    description: 'Debe seleccionar un grupo de whatsapp para el envio de novedades en la pestaña de filtros.',
                    isCallback: null,
                    type: 'error'
                }));
                return null
            }


            if (user.admin || hasDayRole) {
                if (validationValue !== true) return
                const noveltieCopi = { ...noveltyState };

                if (imageOnly) delete noveltieCopi.videoUrl; // ojo aquí

                // Destinos DEDUPLICADOS: si el grupo del establecimiento y el
                // grupo por defecto son el mismo, se envía UNA sola vez (antes
                // salían dos mensajes idénticos). También filtra ids vacíos
                // (un establecimiento sin groupId posteaba a number=undefined).
                const targets = [...new Set([groupId, whatsAppSendingDefault?.key].filter(Boolean))];
                if (targets.length === 0) {
                    return dispatch(setConfigModal({
                        modalOpen: true,
                        title: 'Error de envio',
                        description: 'No hay grupo de destino configurado para esta novedad.',
                        isCallback: null,
                        type: 'error'
                    }));
                }

                for (const target of targets) {
                    await typeShareJarvis([noveltieCopi], target);
                }

                // El estado y el aviso de éxito van DESPUÉS de completar todos
                // los envíos: antes el modal salía entre el 1º y el 2º envío, y
                // un fallo del 2º invitaba a reintentar duplicando el 1º.
                putValidateNoveltie(noveltyState._id, {
                    sharedByAmazonActive: true,
                    givenToTheGroup: true
                });

                // Qué se acaba de mandar al grupo. Si fue solo la imagen, el
                // video quedó sin publicar y hay que ofrecer su descarga.
                setSentAsImageOnly(Boolean(imageOnly));

                dispatch(setConfigModal(
                    {
                        modalOpen: true,
                        title: 'Enviado con éxito',
                        description: `La novedad fue enviada al grupo de ${whatsAppSendingDefault.name}.`,
                        isCallback: null,
                        type: 'successfull'
                    }
                ));
            }


        }
        catch (error) {
            console.log(error);
            // El envío automático falló: se habilita la descarga manual de la
            // imagen y el video para que el usuario los suba al grupo a mano.
            setAutoSendFailed(true);
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Envío automático falló',
                description: 'No se pudo enviar la novedad automáticamente a WhatsApp. Quedó habilitada la opción de DESCARGAR la imagen y el video para enviarlos manualmente al grupo. Verifica que estés en el grupo y que el servidor de Jarvis esté activo.',
                isCallback: null,
                type: 'warning'
            }
            ));
        }
        finally {
            isSharingRef.current = false;
            setIsSharing(false);
        }
    };



    // Descarga un archivo (video o imagen) del backend como blob
    const downloadBlob = (url, filename) => {
        axiosInstance.get(changeHostNameForImg(url), { responseType: 'blob' })
            .then(response => {
                const blob = new Blob([response.data], { type: response.data.type });
                const objectUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = `${filename}.${response.data.type.split('/')[1]}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(objectUrl);
            })
            .catch(() => {
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Error al descargar',
                    description: 'No se pudo descargar el archivo.',
                    isCallback: null,
                    type: 'error'
                }));
            });
    };


    const returnDeleteNovetie = data => {
        return (
            <div className='divContentNovelties-boxAwait'>
                <h2>Publicación eliminada por {data.username}</h2>
            </div>
        )
    }


    const parseMenu = menu => menu.replaceAll('*', '').replaceAll('_', '');


    // Comparte esta alerta/novedad en el chat general (POST /chat con sharedAlert)
    const shareAlertToChat = () => {
        const messageToSend = shareMessageText.trim();
        setShareMenuOpen(false);
        requestAction({
            url: '/chat',
            action: 'post',
            body: {
                message: messageToSend,
                sharedAlert: {
                    noveltyId: noveltyState._id,
                    title: noveltyState.title,
                    menu: noveltyState.menu ? parseMenu(noveltyState.menu) : '',
                    validation: noveltyState?.isValidate?.validation ?? null,
                    localName: noveltyState.local?.name ?? '',
                    image: noveltyState.imageToShare
                        || (Array.isArray(noveltyState.imageUrl) ? noveltyState.imageUrl[0]?.url : '')
                        || ''
                }
            }
        })
            .then(() => {
                setShareMessageText('');
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Compartido',
                    description: 'La alerta se compartió en el chat general.',
                    isCallback: null,
                    type: 'successfull'
                }));
            })
            .catch(() => {
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Error',
                    description: 'No se pudo compartir la alerta en el chat.',
                    isCallback: null,
                    type: 'error'
                }));
            });
    };

    const parseValidationValue = (value) => {
        if (value === true || value === false) return value;
        if (typeof value !== 'string') return null;

        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
        return null;
    };

    const validationValue = parseValidationValue(noveltyState?.isValidate?.validation);
    const isValidated = validationValue === true;
    const isInvalid = validationValue === false;
    const canManageState = !isReadOnly;

    // ── Progresión obligatoria de las acciones ──────────────────────────
    // Los tres grupos de botones se habilitan en cadena y cada paso exige el
    // anterior:
    //
    //   1. Aprobar / Rechazar    disponible siempre para quien tiene permiso
    //   2. Turno día / noche     solo si quedó APROBADA
    //   3. Descargar / Enviar    solo si está aprobada Y con turno asignado
    //
    // Rechazar corta la cadena: una novedad invalidada no lleva turno ni se
    // manda al grupo, así que los grupos 2 y 3 quedan bloqueados.
    //
    // El turno además decide el valor del bono al validarse (el sello se
    // congela en la API con el turno que tenga), así que enviar sin turno
    // dejaría la novedad sin sellar.
    //
    // Se compara contra los valores reales y no con `!== null`: una novedad
    // anterior a este campo lo tiene en `undefined`, que pasaba ese chequeo y
    // habilitaba el envío sin turno.
    const hasShift = noveltyState?.shift === 'day' || noveltyState?.shift === 'night';
    const canSetShift = canManageState && isValidated;
    const canShare = canManageState && isValidated && hasShift;

    // El motivo por el que un botón está bloqueado, para que el tooltip lo diga
    // en vez de dejar al usuario adivinando.
    const shiftHint = isReadOnly ? 'Sin permiso para validar'
        : isInvalid ? 'La novedad fue rechazada: no lleva turno'
            : !isValidated ? 'Primero aprobá la novedad'
                : null;

    const shareHint = isReadOnly ? 'Sin permiso para enviar'
        : isInvalid ? 'La novedad fue rechazada: no se envía al grupo'
            : !isValidated ? 'Primero aprobá la novedad'
                : !hasShift ? 'Asigná el turno antes de enviar'
                    : null;

    // ── Bono de la alerta ───────────────────────────────────────────────
    // El sello lo congela la API cuando la novedad queda aprobada Y con turno,
    // y vuelve dentro del documento que llega por el socket `document_updated`.
    // Por eso aparece solo al completarse el circuito: validar → turno → envío.
    //
    // Se muestra únicamente cuando bonifica. Un sello con `appliesBonus: false`
    // es una decisión legítima ("esta alerta no bonifica") y no tiene valor que
    // mostrar; ponerle una estrella en cero sería ruido.
    const bonusSeal = noveltyState?.bonus;
    const hasBonus = bonusSeal?.appliesBonus === true;

    const bonusWorth = Number(bonusSeal?.bonusWorth) || 1;
    const bonusAccumulation = Number(bonusSeal?.accumulationRequired) || 1;

    // La proporción tal como la escribe el reglamento: "3x1" se lee "tres
    // alertas por un bono". Con acumulación y valor en 1 no se escribe nada: es
    // el caso normal y etiquetarlo lo haría parecer una excepción. Mismo
    // criterio que ratioLabel() en libs/bonus/bonusLabels.lib.js de la API.
    const bonusRatio = (bonusAccumulation === 1 && bonusWorth === 1)
        ? ''
        : `${bonusAccumulation}x${bonusWorth}`;

    const bonusShiftLabel = bonusSeal?.workShift === 'night' ? 'turno noche'
        : bonusSeal?.workShift === 'day' ? 'turno día'
            : null;

    const bonusDetail = [
        `Bonifica X${bonusWorth}`,
        bonusRatio ? `se acumulan ${bonusAccumulation} por bono` : null,
        bonusShiftLabel,
    ].filter(Boolean).join(' · ');

    // ── Descarga del video ──────────────────────────────────────────────
    // shareJarvis manda el video SIEMPRE que exista; el único caso en que el
    // grupo recibe la imagen es cuando se pulsa "Enviar imagen", que elimina
    // videoUrl de la copia enviada. En ese caso el video se queda sin publicar
    // y hay que poder bajarlo para subirlo a mano.
    //
    // El envío no deja registrado con qué medio se hizo (imagen y video
    // guardan el mismo givenToTheGroup), así que para una novedad ya enviada
    // en una sesión anterior no se puede distinguir: si tiene video E imagen y
    // está validada y enviada, se ofrece la descarga. Es preferible ofrecerla
    // de más que dejar sin publicar un video que nadie puede recuperar.
    const hasImageToShare = !!noveltyState?.imageToShare;
    const sentToGroup = noveltyState?.givenToTheGroup === true;
    const canDownloadVideo = hasVideo
        && (autoSendFailed || sentAsImageOnly || (hasImageToShare && isValidated && sentToGroup));



    console.log('noveltyState', noveltyState);

    return (
        <div
            style={{
                boxShadow: 'rgb(167 167 167) 4px 4px 8px 1px'
            }}
            onClick={() => {
                if (process.env.NODE_ENV === 'development') console.log(noveltyState);
            }}
            className={`${data.isNewData ? 'start' : ''} divContentNovelties shadow-md bg-gray-600`}
            ref={ref}
        >
            {
                noveltyState ?
                    (
                        <>
                            <div className='divContentNovelties-divTitle'>
                                <div className='lobby-noveltie-logoWrap'>
                                    <Img idLocal={noveltyState.local.idLocal} />
                                </div>

                                <div className='divContentNovelties-textContain'>
                                    <p className='lobby-noveltie-local' title='Nombre del restaurante o cliente'>{noveltyState.local.name}</p>
                                    <p className='divContentNovelties-pTitle __text__oneLine' title='Título de la novedad'>{noveltyState.title}</p>
                                    <div className='__align-center'>

                                        <p
                                            className='divContentNovelties-pDate __text__oneLine'
                                            title='Fecha y hora de la novedad'
                                            style={{ color: '#7b8494', fontWeight: '500' }}
                                        >
                                            {DataFormart.formatDateApp(noveltyState.date)}

                                        </p>
                                        <FiClock className='divContentNovelties-pDateImg' />
                                    </div>
                                </div>

                                <div className='contain-btnNoveltie'
                                    onBlur={e => {
                                        if (e.target.className !== 'btn-circle divContentNovelties-headerOption_btn') {
                                            containBtnRef.current.classList.remove('showListOption');
                                        }
                                    }}
                                >
                                    <button
                                        className='btn-circle divContentNovelties-headerOption_btn'
                                        type='button'
                                        aria-label='Opciones de la publicación'
                                        onClick={() => {
                                            containBtnRef.current.classList.toggle('showListOption');
                                        }}
                                    >
                                        <FiMoreHorizontal className='icoBtnHeader headerNoveltieIco' />
                                    </button>
                                    <div
                                        className='divContentNovelties-headerListOption'
                                        ref={containBtnRef}
                                    >
                                        <button
                                            className='divContentNovelties-headerListOptionBtn'
                                            onClick={() => {
                                                setShareMenuOpen(true);
                                                containBtnRef.current.classList.remove('showListOption');
                                            }}
                                        >
                                            Compartir en chat
                                            <FiShare2 className='divContentNovelties-headerListOptionImg' />
                                        </button>
                                        <button
                                            className='divContentNovelties-headerListOptionBtn'
                                            onClick={() => {
                                                dispatch(setConfigModal(
                                                    {
                                                        modalOpen: true,
                                                        title: 'Eliminar',
                                                        description: 'La novedad se eliminará permanentemente del muro',
                                                        isCallback: deleteNoveltie,
                                                        type: 'warning'
                                                    }
                                                ));
                                                containBtnRef.current.classList.remove('showListOption');
                                            }}
                                        >
                                            Eliminar publicación
                                            <FiTrash2 className='divContentNovelties-headerListOptionImg' />
                                        </button>
                                    </div>

                                    {
                                        shareMenuOpen && (
                                            <>
                                                <div className='fixed inset-0 z-[90]' onClick={() => setShareMenuOpen(false)} />
                                                <div className='absolute top-[38px] right-[10px] z-[100] w-[260px]'>
                                                    {/* caret */}
                                                    <div className='absolute -top-[5px] right-[14px] w-2.5 h-2.5 bg-emerald-50 border-l border-t border-emerald-100 rotate-45' />

                                                    <div className='relative bg-white rounded-xl border border-gray-100 shadow-[0_8px_28px_rgba(0,0,0,0.25)] overflow-hidden'>
                                                        {/* encabezado */}
                                                        <div className='flex items-center gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100'>
                                                            <span className='flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white'>
                                                                <FiShare2 className='w-[13px] h-[13px]' />
                                                            </span>
                                                            <div className='flex flex-col leading-tight'>
                                                                <span className='text-[12.5px] font-semibold text-emerald-800'>Compartir en el chat</span>
                                                                <span className='text-[10.5px] text-emerald-600'>Se enviará al Chat365</span>
                                                            </div>
                                                        </div>

                                                        {/* cuerpo */}
                                                        <div className='p-3 flex flex-col gap-2'>
                                                            <textarea
                                                                value={shareMessageText}
                                                                onChange={e => setShareMessageText(e.target.value)}
                                                                placeholder='Agrega un mensaje (opcional)…'
                                                                rows={2}
                                                                maxLength={300}
                                                                autoFocus
                                                                className='w-full text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2 resize-none transition-colors placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white'
                                                            />
                                                            <div className='flex items-center justify-between gap-2'>
                                                                <button
                                                                    type='button'
                                                                    className='text-[12px] text-gray-400 hover:text-gray-600 px-1'
                                                                    onClick={() => setShareMenuOpen(false)}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    type='button'
                                                                    className='flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg transition'
                                                                    onClick={shareAlertToChat}
                                                                >
                                                                    <FiSend className='w-[13px] h-[13px]' /> Compartir
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                </div>

                            </div>


                            <div className={isNotLobby ? 'none' : 'divContentNovelties-text divContentNovelties-menuContain'} ref={menuRef}>
                                <TextAreaAutoResize
                                    value={noveltyState.menu ? parseMenu(noveltyState.menu) : ''}
                                    changeEvent={saveMenuDebounced}
                                    invalidText={validationValue}
                                    editedBy={noveltyState?.isValidate?.menuEditedBy}
                                    lockFirstTwoLines={true}
                                />
                            </div>



                            <MemoSlider
                                imageShare={noveltyState.imageToShare}
                                video={noveltyState.videoUrl}
                                imageGroup={noveltyState.imageUrl}
                                isDrag={typeof validationValue === 'boolean' ? true : false}
                            />




                            {/* Trazabilidad de la novedad: quién la reportó, quién la
                                validó, si se envió al grupo y cuánto bonifica.
                                Los chips se reparten la fila y bajan de línea
                                cuando no entran, en vez de apretarse. */}
                            <div className='novelty-chip-row'>

                                {/* Operador — quien reportó la novedad */}
                                <div className='novelty-chip novelty-chip--operador'>
                                    {
                                        noveltyState?.sharedByUser?.user?.id?.img ?
                                            <img className='novelty-chip-icon w-[40px] h-[40px] min-w-[40px] object-cover rounded-full' src={noveltyState?.sharedByUser?.user?.id?.img} alt='ico-user' loading='lazy' decoding='async' />
                                            :
                                            <div className='novelty-chip-icon flex justify-center items-center w-[40px] h-[40px] min-w-[40px] rounded-full bg-stone-500'>
                                                <FiUser className='w-[22px] h-[22px]' stroke='white' />
                                            </div>
                                    }
                                    <div className='novelty-chip-text flex flex-col'>
                                        <p className='text-[11px]'>operador</p>
                                        <p className='font-semibold text-[12px] text-primary-800'>{noveltyState?.sharedByUser?.user.nameUser}</p>
                                    </div>
                                </div>


                                {/* Coordinador — quien validó, con el pulgar del resultado */}
                                {
                                    typeof validationValue === 'boolean' ?
                                        (

                                            <div className='novelty-chip novelty-chip--coordinador'>
                                                {
                                                    noveltyState?.validationResult?.validatedByUser?.user?.id?.img ?
                                                        <img className='novelty-chip-icon w-[40px] h-[40px] min-w-[40px] object-cover rounded-full' src={noveltyState?.validationResult?.validatedByUser?.user?.id?.img} alt='ico-user' loading='lazy' decoding='async' />
                                                        :
                                                        <div className='novelty-chip-icon flex justify-center items-center w-[40px] h-[40px] min-w-[40px] rounded-full bg-purple-500'>
                                                            <FiShield className='w-[22px] h-[22px]' stroke='white' />
                                                        </div>
                                                }
                                                <div className='novelty-chip-text flex flex-col'>
                                                    <p className='text-[11px]'>Coordinador</p>
                                                    <p className='font-semibold text-[12px] text-primary-800'>{noveltyState?.isValidate?.for}</p>
                                                </div>
                                                {
                                                    typeof isValidated === 'boolean' ?
                                                        <div className={`novelty-chip-icon w-[40px] h-[40px] flex justify-center items-center ${isInvalid ? 'bg-[#891616]' : 'bg-[#161a89]'}`}>
                                                            {
                                                                isInvalid ?
                                                                    <FiThumbsDown className='w-[18px] h-[18px] text-white' stroke='white' />
                                                                    :
                                                                    <FiThumbsUp className='w-[18px] h-[18px] text-white' stroke='white' />
                                                            }
                                                        </div>
                                                        : null
                                                }
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )

                                }



                                {/* Envío al grupo de Amazonas365 */}
                                {
                                    noveltyState.givenToTheGroup ?
                                        (

                                            <div className='novelty-chip novelty-chip--envio'>
                                                <p className='novelty-chip-text font-semibold text-[12px] text-primary-800 truncate'>Enviado a amazonas365</p>
                                                <div className='novelty-chip-icon w-[40px] h-[40px] min-w-[40px] flex justify-center items-center bg-[#18e018]'>
                                                    <FaWhatsapp className='w-[20px] h-[20px]' style={{ color: 'white' }} />
                                                </div>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )
                                }

                                {/* Bono — cuánto vale esta alerta.
                                    Aparece recién cuando la API selló la novedad, que es
                                    al quedar aprobada y con turno asignado. */}
                                {
                                    hasBonus ?
                                        (
                                            <div className='novelty-chip novelty-chip--bono' title={bonusDetail}>
                                                <span className='novelty-chip-icon novelty-bono-star'>
                                                    <FiStar className='w-[22px] h-[22px]' />
                                                </span>
                                                <div className='novelty-chip-text flex flex-col'>
                                                    <p className='text-[11px]'>Bono</p>
                                                    <p className='novelty-bono-value'>
                                                        X{bonusWorth}
                                                        {bonusRatio ? <span className='novelty-bono-ratio'>{bonusRatio}</span> : null}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )
                                }
                            </div>


                            {/* Acciones (validar, turno, enviar): para administradores
                                o para quien tiene el rol del día en el horario
                                (encargado de turno o auxiliar) */}
                            {
                                !isMobile && (user?.admin === true || hasDayRole) ? (
                                    <>
                                        <div className='divContentNovelties-divBtn lobby-noveltie-actionGrid' style={{ gap: 0, overflow: 'hidden' }}>
                                            <button
                                                className={isValidated ? 'btnPublic __btn-blue' : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        validationResult: {
                                                            isApproved: true
                                                        },
                                                        isValidate: {
                                                            ...noveltyState.isValidate,
                                                            validation: 'true',
                                                            for: `${user.name} ${user.surName}`
                                                        }
                                                    });
                                                }}
                                                disabled={isReadOnly}
                                                title={isReadOnly ? 'Sin permiso para validar' : 'Validar para poder enviar'}
                                            >
                                                <FiCheckCircle className='btnPublic-img' />
                                                <p className='__textGrayForList'>Aprobar</p>
                                            </button>

                                            <button
                                                className={isInvalid ? 'btnPublic __btn-red' : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        validationResult: {
                                                            isApproved: false
                                                        },
                                                        isValidate: {
                                                            ...noveltyState.isValidate,
                                                            validation: 'false',
                                                            for: `${user.name} ${user.surName}`
                                                        }
                                                    });
                                                }}
                                                disabled={isReadOnly}
                                                title={isReadOnly ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                            >
                                                <FiXCircle className='btnPublic-img' />
                                                <p className='__textGrayForList'>Rechazar</p>
                                            </button>



                                            <button
                                                className={noveltyState.shift === 'day' ? `btnPublic __day` : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        shift: 'day'
                                                    });
                                                }}
                                                disabled={!canSetShift}
                                                title={shiftHint ?? 'Marcar como turno día'}
                                            >
                                                <FiSun className='btnPublic-img' />
                                                <p className='__textGrayForList'>Turno día</p>
                                            </button>
                                            <button
                                                className={noveltyState.shift === 'night' ? `btnPublic __night` : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        shift: 'night'
                                                    });
                                                }}
                                                disabled={!canSetShift}
                                                title={shiftHint ?? 'Marcar como turno noche'}
                                            >
                                                <FiMoon className='btnPublic-img' />
                                                <p className='__textGrayForList'>Turno noche</p>
                                            </button>

                                        </div>
                                        <div className='divContentNovelties-divBtn' style={{ gap: 0, borderRadius: '0 0 5px 5px', overflow: 'hidden' }}>
                                            {
                                                hasVideo ?
                                                    <>
                                                        {canDownloadVideo && (
                                                            <button
                                                                className={isValidated ? 'btnPublic __btn-download' : 'btnPublic'}
                                                                type='button'
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    downloadBlob(noveltyState.videoUrl, noveltyState.title);
                                                                }}
                                                                disabled={!canShare}
                                                                title={shareHint ?? (autoSendFailed
                                                                    ? 'El envío automático falló: descarga el video para subirlo al grupo'
                                                                    : 'Al grupo se envió la imagen: descarga el video para subirlo a mano')}
                                                            >
                                                                <FiDownload className='btnPublic-img' />
                                                                <p className='__textGrayForList'>Descargar video</p>
                                                            </button>
                                                        )}
                                                        <button //button whastapp
                                                            className={isValidated ? 'btnPublic  __btn-green' : 'btnPublic'}
                                                            type='button'
                                                            onClick={() => {
                                                                dispatch(setConfigModal(
                                                                    {
                                                                        modalOpen: true,
                                                                        title: 'Enviando',
                                                                        description: 'Por favor verifique que el video este en el grupo. en caso de no estarlo, descárgalo',
                                                                        isCallback: null,
                                                                        type: 'warning'
                                                                    }
                                                                ));
                                                                shareNoveltyForApiAva()
                                                            }
                                                            }
                                                            disabled={!canShare || isSharing}
                                                            title={shareHint ?? 'Enviar al grupo de Amazonas Activo'}
                                                        >
                                                            <FiSend className='btnPublic-img' />
                                                            <p className='__textGrayForList'>Enviar video</p>
                                                        </button>
                                                    </>
                                                    :
                                                    null
                                            }
                                            {
                                                noveltyState.imageToShare ?
                                                    <>
                                                        {autoSendFailed && (
                                                            <button
                                                                className={isValidated ? 'btnPublic __btn-download' : 'btnPublic'}
                                                                type='button'
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    downloadBlob(noveltyState.imageToShare, noveltyState.title);
                                                                }}
                                                                disabled={!canShare}
                                                                title={shareHint ?? 'Descargar imagen de la alerta'}
                                                            >
                                                                <FiDownload className='btnPublic-img' />
                                                                <p className='__textGrayForList'>Descargar imagen</p>
                                                            </button>
                                                        )}


                                                        <button //button for image
                                                            className={isValidated ? 'btnPublic  __btn-green' : 'btnPublic'}
                                                            onClick={e => {
                                                                e.preventDefault()
                                                                dispatch(setConfigModal(
                                                                    {
                                                                        modalOpen: true,
                                                                        title: 'Enviando',
                                                                        description: '',
                                                                        isCallback: null,
                                                                        type: 'await'
                                                                    }
                                                                ));
                                                                shareNoveltyForApiAva(noveltyState.imageToShare);
                                                            }
                                                            }
                                                            disabled={!canShare || isSharing}
                                                            title={shareHint ?? 'Enviar solo imagen de la alerta'}
                                                        >
                                                            <FiSend className='btnPublic-img' />
                                                            <p className='__textGrayForList'>Enviar imagen</p>
                                                        </button>
                                                    </>
                                                    :
                                                    null
                                            }
                                        </div>

                                    </>
                                )

                                    :
                                    null
                            }
                        </>
                    )
                    :
                    (
                        deleteState ?
                            returnDeleteNovetie(dataDeleteForUserRef.current)
                            :

                            <div className='elemento divContentNovelties-divTitle' style={{ height: '600px' }}>
                                <div className='w-full h-full flex flex-col'>
                                    <div className='w-full flex items-center gap-4'>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '100%',
                                            height: '80px',
                                            width: '90px',
                                            overflow: 'hidden',
                                            backgroundColor: 'rgb(183 183 183)'
                                        }}>
                                            <div style={{ width: '50px', height: '50px', backgroundColor: 'rgb(183 183 183)' }}>  </div>
                                        </div>

                                        <div className='divContentNovelties-textContain __width-complete'>
                                            <p style={{ color: '#000', fontSize: '1.1rem', backgroundColor: 'rgb(183 183 183)', height: '15px' }} ></p>
                                            <p style={{ color: '#000', fontSize: '1.1rem', backgroundColor: 'rgb(183 183 183)', height: '15px', width: '50%' }} ></p>
                                            <div className='__align-center'>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='w-full h-[500px] bg-[#ddd] mx-auto mt-4 rounded-lg' style={{ backgroundColor: 'rgb(183 183 183)' }}></div>
                                </div>
                            </div>
                    )
            }
        </div>
    )
}



export { Noveltie };