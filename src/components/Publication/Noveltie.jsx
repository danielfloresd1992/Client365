'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import { FiCheckCircle, FiXCircle, FiSun, FiMoon, FiDownload, FiSend, FiTrash2, FiClock, FiUser, FiShield, FiMoreHorizontal } from 'react-icons/fi';


import useAxios from "@/hook/useAxios";
import DataFormart from '@/libs/time/dateFormat.js';
import typeShareJarvis from './assets/shareJarvis';


import { useDispatch, useSelector } from 'react-redux';
import { setConfigModal } from "@/store/slices/globalModal";

import { ImgContext } from "@/contexts/imgContext";
import socket from "@/libs/socket/socketIo";
import Img from './assets/Img';
import { useInView } from 'react-intersection-observer';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';

import changeHostNameForImg from '@/libs/script/changeHostName';
import useAuthOnServer from '@/hook/auth';

import TextAreaAutoResize from '@/components/inpust/text_area_autoresize';
import MemoSlider from '@/components/carruzel/slider';





function Noveltie({ data, idNoveltie, isNotLobby }) {

    const whatsAppSendingSettings = useSelector(state => state.filterClientList?.groupIdWhatsapp);
    const [noveltyState, setNoveltyState] = useState(null);
    const [deleteState, serDeleteState] = useState(false);
    const [isVideoBooleanState, setIsVideoBooleanState] = useState(false);
    const containBtnRef = useRef(null);
    const menuRef = useRef(null);


    const dataDeleteForUserRef = useRef();
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const { setImg } = useContext(ImgContext);
    const permissionUser = !(user?.admin || user?.super);
    const { requestAction } = useAxios();
    const dispatch = useDispatch();

    const { ref, inView } = useInView({
        triggerOnce: true
    });



    useEffect(() => {

        if (data.isNewData) {
            getNovelty();
        }
        else {
            if (inView && !noveltyState) getNovelty();
        }
    }, [inView]);



    useEffect(() => {
        let isSubscribed = true;
        function handlePutPublisher(data) {
            if (isSubscribed) {
                const { doc, user } = data;
                if (data.userSessionId !== user.idUser && doc._id === noveltyState?._id) {
                    setNoveltyState(doc);
                }
            }
        }
        function handleDeletePublisher(data) {
            if (isSubscribed) {
                if (data.userSessionId !== user.userSessionId && data.idNoveltie === noveltyState?._id) {
                    dataDeleteForUserRef.current = data;
                    serDeleteState(true);
                };
            }
        }


        socket.on('document_updated', handlePutPublisher);
        socket.on('reciveDeletePublisher', handleDeletePublisher);
        return () => {
            isSubscribed = false;
            socket.off('document_updated', handlePutPublisher);
            socket.off('reciveDeletePublisher', handleDeletePublisher);
        };
    }, [noveltyState, dataSessionState]);



    const getNovelty = () => {
        requestAction({ url: `/novelties/img/id=${idNoveltie}`, action: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    setNoveltyState(response.data[0]);
                    response.data[0].videoUrl ? setIsVideoBooleanState(true) : setIsVideoBooleanState(false);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };



    const putValidateNoveltie = (id, dataParams) => {
        if (user.admin || user.super) {
            requestAction({ url: `/novelties/id=${id}`, body: dataParams, action: 'PUT' })
                .then(response => {
                    if (response?.status === 200) {
                        setNoveltyState({ ...noveltyState, ...dataParams });
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };




    const deleteNoveltie = () => {
        if (user.admin) {
            requestAction({ url: `/user/publisher/delete=${data._id}`, action: 'delete' })
                .then(response => {
                    if (response.status === 201) {
                        dataDeleteForUserRef.current = { idNoveltie: noveltyState._id, userSessionId: user.userSessionId, username: `${user.name} ${user.surName}`, action: 'DELETE' };
                        setNoveltyState(null);
                        serDeleteState(true);
                        socket.emit('deletedPublisher', { idNoveltie: noveltyState._id, userSessionId: user.userSessionId, username: `${user.name} ${user.surName}`, action: 'DELETE' });
                    }
                })
                .catch(err => {
                    console.log(err);
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
            if (!whatsAppSendingSettings) {
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


                const responseSend = await typeShareJarvis([noveltieCopi], whatsAppSendingSettings.key);


                putValidateNoveltie(noveltyState._id, {
                    sharedByAmazonActive: true,
                    givenToTheGroup: true
                });

                dispatch(setConfigModal(
                    {
                        modalOpen: true,
                        title: 'Enviado con éxito',
                        description: `La novedad fue enviada al grupo de ${whatsAppSendingSettings.name}.`,
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



    const returnDeleteNovetie = data => {
        return (
            <div className='divContentNovelties-boxAwait'>
                <h2>Publicación eliminada por {data.username}</h2>
            </div>
        )
    }


    const parseMenu = menu => {
        const menuNoveltie = menu.replaceAll('*', '').replaceAll('_', '').split('\n');
        return menuNoveltie.join('\n');
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
    const canManageState = !permissionUser;
    const canShare = isValidated && canManageState && noveltyState?.shift !== null;




    return (
        <div
            onClick={() => {
                if (process.env.NODE_ENV === 'development') console.log(noveltyState);
            }}
            className={data.isNewData ? 'divContentNovelties start' : 'divContentNovelties'}
            ref={ref}
        >
            {
                noveltyState ?
                    (
                        <>
                            <div className='divContentNovelties-divTitle'>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '80x',
                                    width: '80px',
                                }}>
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
                                                        description: 'La nodedad se eliminará permanentemente del muro',
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


                            <div className={isNotLobby ? 'none' : 'divContentNovelties-text divContentNovelties-menuContain p-[1rem]'} ref={menuRef}>
                                <TextAreaAutoResize
                                    value={noveltyState.menu ? parseMenu(noveltyState.menu) : ''}
                                    changeEvent={text => {
                                        putValidateNoveltie(noveltyState._id, {
                                            menu: text,
                                            isValidate: {
                                                ...noveltyState.isValidate,
                                                menuEditedBy: `${user.name} ${user.surName}`
                                            },
                                            isValidate: {
                                                ...noveltyState.isValidate,
                                                menuEditedBy: `${user.name} ${user.surName}`
                                            }
                                        });
                                    }}
                                    invalidText={validationValue}
                                    editedBy={noveltyState?.isValidate?.menuEditedBy}
                                />
                            </div>



                            <MemoSlider
                                imageShare={noveltyState.imageToShare}
                                video={noveltyState.videoUrl}
                                imageGroup={noveltyState.imageUrl}
                                isDrag={typeof validationValue === 'boolean' ? true : false}
                            />




                            <div className='p-[.6rem_.5rem] flex items-center justify-between flex-wrap gap-2'>
                                <div className='divContentNovelties-textContain __row-text lobby-noveltie-metaItem'>
                                    <FiUser className='divContentNovelties-pDateImg' />
                                    <p className='divContentNovelties-pDate'>Compartido por {noveltyState?.userPublic?.name} </p>
                                </div>
                                {
                                    typeof validationValue === 'boolean' ?
                                        (
                                            <div className='divContentNovelties-textContain __row-text lobby-noveltie-metaItem'>
                                                <FiShield className='divContentNovelties-pDateImg' />
                                                <p className='divContentNovelties-pDate'>Validado por {noveltyState?.isValidate?.for}</p>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )

                                }
                                {
                                    noveltyState.givenToTheGroup ?
                                        (
                                            <div className='divContentNovelties-textContain __row-text lobby-noveltie-metaItem'>
                                                <FiSend className='divContentNovelties-pDateImg' />
                                                <p className='divContentNovelties-pDate'>Enviado a Amazonas Activo</p>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )
                                }
                            </div>


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
                                    disabled={permissionUser}
                                    title={permissionUser ? 'Sin permiso para validar' : 'Validar para poder enviar'}
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
                                    disabled={permissionUser}
                                    title={permissionUser ? 'Sin permiso para validar' : 'Invalidar novedad'}
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
                                    disabled={permissionUser && !isValidated}
                                    title={permissionUser ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                >
                                    <FiSun className='btnPublic-img' />
                                    <p className='__textGrayForList'
                                        style={{
                                            color: noveltyState.shift === 'day' ? '#fff' : 'unset'
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
                                    disabled={permissionUser}
                                    title={permissionUser ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                >
                                    <FiMoon className='btnPublic-img' />
                                    <p className='__textGrayForList'
                                        style={{
                                            color: noveltyState.shift === 'night' ? '#fff' : 'unset'
                                        }}
                                    >Turno noche</p>
                                </button>

                            </div>



                            <div className='divContentNovelties-divBtn' style={{ gap: 0, borderRadius: '0 0 5px 5px', overflow: 'hidden' }}>
                                {
                                    isVideoBooleanState ?
                                        <>
                                            <button
                                                className={isValidated ? 'btnPublic __btn-download' : 'btnPublic'}
                                                onClick={e => {
                                                    e.preventDefault()

                                                    axiosInstance.get(changeHostNameForImg(noveltyState.videoUrl), { responseType: 'blob' })
                                                        .then(response => {
                                                            const blob = new Blob([response.data], { type: response.data.type });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `${noveltyState.title}.${response.data.type.split('/')[1]}`; // Nombre del archivo al descargar
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                        });

                                                }
                                                }
                                                disabled={!canShare}
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Descargar video de la alerta'}
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
                                                    title={permissionUser ? 'Sin permiso para enviar' : 'Enviar al grupo de Amazonas Activo'}
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
                                                onClick={e => {
                                                    e.preventDefault()

                                                    axiosInstance.get(changeHostNameForImg(noveltyState.imageToShare), { responseType: 'blob' })
                                                        .then(response => {
                                                            const blob = new Blob([response.data], { type: response.data.type });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `${noveltyState.title}.${response.data.type.split('/')[1]}`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                        });

                                                }
                                                }
                                                disabled={!canShare}
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Descargar video de la alerta'}
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
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Enviar solo imagen de la alerta'}
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