'use client';
import { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiSun, FiMoon, FiDownload, FiSend, FiTrash2, FiClock, FiUser, FiShield, FiMoreHorizontal, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
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

import TextAreaAutoResize from '@/components/inpust/text_area_autoresize';
import MemoSlider from '@/components/carruzel/slider';





function Noveltie({ data, idNoveltie, isNotLobby }) {


    const whatsAppSendingDefault = useSelector(state => state.filterClientList?.groupIdWhatsapp);
    


    const [noveltyState, setNoveltyState] = useState(null);
    const [deleteState, setDeleteState] = useState(false);
    const containBtnRef = useRef(null);
    const menuRef = useRef(null);

    // Refs para leer el valor más reciente dentro de los listeners de socket / debounce sin re-suscribir
    const noveltyStateRef = useRef(noveltyState);
    const saveMenuTimeout = useRef(null);


    const dataDeleteForUserRef = useRef();
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const { open: openImageViewer } = useImageViewer();
    const isReadOnly = !(user?.admin || user?.super);
    const hasVideo = !!noveltyState?.videoUrl;
    const { requestAction } = useAxios();
    const dispatch = useDispatch();


    const groupId = noveltyState?.establishment?.groupId || whatsAppSendingDefault.key;

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
        if (user?.admin || user?.super) {
            requestAction({ url: `/novelties/id=${id}`, body: dataParams, action: 'PUT' })
                .then(response => {
                    if (response?.status === 200) {

                    }
                })
                .catch(err => {
                    console.log(err);
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


            if (user.admin || user.super) {
                if (validationValue !== true) return
                const noveltieCopi = { ...noveltyState };

                if (imageOnly) delete noveltieCopi.videoUrl; // ojo aquí


                const responseSend = await typeShareJarvis([noveltieCopi], groupId);


                putValidateNoveltie(noveltyState._id, {
                    sharedByAmazonActive: true,
                    givenToTheGroup: true
                });

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
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Error',
                description: 'Error',
                isCallback: null,
                type: 'error'
            }
            ));
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
    const canShare = isValidated && canManageState && noveltyState?.shift !== null;


   


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




                            <div className='p-[.8rem_.5rem] flex items-center justify-start flex-wrap gap-[6px]'>

                                {/*operador*/}
                                <div className='novelty-chip novelty-chip--operador'>
                                    {
                                        noveltyState?.sharedByUser?.user?.id?.img ?
                                            <img className='novelty-chip-icon w-[40px] h-[40px] min-w-[40px] object-cover rounded-full' src={noveltyState?.sharedByUser?.user?.id?.img} alt='ico-user' loading='lazy' decoding='async' />
                                            :
                                            <div className='novelty-chip-icon flex justify-center items-center w-[40px] h-[40px] min-w-[40px] rounded-full bg-stone-500'>
                                                <FiUser className='w-[22px] h-[22px]' stroke='white' />
                                            </div>
                                    }
                                    <div className='novelty-chip-text flex flex-col p-[0px_15px_0px_0px]'>
                                        <p className='text-[11px]'>operador</p>
                                        <p className='font-semibold text-[12px] text-primary-800'>{noveltyState?.sharedByUser?.user.nameUser}</p>
                                    </div>
                                </div>


                                {/*envio*/}
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
                                                <div className='novelty-chip-text flex flex-col p-[0px_15px_0px_0px]'>
                                                    <p className='text-[11px]'>Coordinador</p>
                                                    <p className='font-semibold text-[12px] text-primary-800'>{noveltyState?.isValidate?.for}</p>
                                                </div>
                                                {
                                                    typeof isValidated === 'boolean' ?
                                                        <div className={`novelty-chip-icon w-[40px] h-[40px] flex justify-center items-center rounded-r-full ${isInvalid ? 'bg-[#891616]' : 'bg-[#161a89]'}`}>
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



                                {/*validador*/}
                                {
                                    noveltyState.givenToTheGroup ?
                                        (

                                            <div className='novelty-chip novelty-chip--envio'>
                                                <p className='novelty-chip-text font-semibold text-[12px] text-primary-800 p-[0px_5px_0px_15px] truncate'>Enviado a amazonas365</p>
                                                <div className='novelty-chip-icon w-[40px] h-[40px] min-w-[40px] flex justify-center items-center bg-[#18e018] rounded-r-full'>
                                                    <FaWhatsapp className='w-[20px] h-[20px]' style={{ color: 'white' }} />
                                                </div>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )
                                }
                            </div>


                            {
                                !isMobile ? (
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
                                                <p style={isValidated ? { color: '#fff' } : { color: 'revert-layer' }} className='__textGrayForList'>Aprobar</p>
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
                                                <p style={isInvalid ? { color: '#fff' } : { color: 'revert-layer' }} className='__textGrayForList'>Rechazar</p>
                                            </button>



                                            <button
                                                className={noveltyState.shift === 'day' ? `btnPublic __day` : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        shift: 'day'
                                                    });
                                                }}
                                                disabled={isReadOnly && !isValidated}
                                                title={isReadOnly ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                            >
                                                <FiSun className='btnPublic-img' />
                                                <p className='__textGrayForList'
                                                    style={{
                                                        color: noveltyState.shift === 'day' ? 'rgb(73 73 73)' : 'unset'
                                                    }}
                                                >Turno día</p>
                                            </button>
                                            <button
                                                className={noveltyState.shift === 'night' ? `btnPublic __night` : 'btnPublic'}
                                                onClick={() => {
                                                    putValidateNoveltie(noveltyState._id, {
                                                        shift: 'night'
                                                    });
                                                }}
                                                disabled={isReadOnly}
                                                title={isReadOnly ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                            >
                                                <FiMoon className='btnPublic-img' />
                                                <p className='__textGrayForList'
                                                    style={{
                                                        color: noveltyState.shift === 'night' ? 'white' : 'unset'
                                                    }}
                                                >Turno noche</p>
                                            </button>

                                        </div>
                                        <div className='divContentNovelties-divBtn' style={{ gap: 0, borderRadius: '0 0 5px 5px', overflow: 'hidden' }}>
                                            {
                                                hasVideo ?
                                                    <>
                                                        <button
                                                            className={isValidated ? 'btnPublic __btn-download' : 'btnPublic'}
                                                            type='button'
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                downloadBlob(noveltyState.videoUrl, noveltyState.title);
                                                            }}
                                                            disabled={!canShare}
                                                            title={isReadOnly ? 'Sin permiso para enviar' : 'Descargar video de la alerta'}
                                                        >
                                                            <FiDownload className='btnPublic-img' />
                                                            <p className='__textGrayForList'>Descargar video</p>
                                                        </button>
                                                        {
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
                                                                disabled={!canShare}
                                                                title={isReadOnly ? 'Sin permiso para enviar' : 'Enviar al grupo de Amazonas Activo'}
                                                            >
                                                                <FiSend className='btnPublic-img' />
                                                                <p className='__textGrayForList'>Enviar video</p>
                                                            </button>

                                                        }

                                                    </>
                                                    :
                                                    null
                                            }
                                            {
                                                noveltyState.imageToShare ?
                                                    <>
                                                        <button
                                                            className={isValidated ? 'btnPublic __btn-download' : 'btnPublic'}
                                                            type='button'
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                downloadBlob(noveltyState.imageToShare, noveltyState.title);
                                                            }}
                                                            disabled={!canShare}
                                                            title={isReadOnly ? 'Sin permiso para enviar' : 'Descargar imagen de la alerta'}
                                                        >
                                                            <FiDownload className='btnPublic-img' />
                                                            <p className='__textGrayForList'>Descargar imagen</p>
                                                        </button>

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
                                                            disabled={!canShare}
                                                            title={isReadOnly ? 'Sin permiso para enviar' : 'Enviar solo imagen de la alerta'}
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