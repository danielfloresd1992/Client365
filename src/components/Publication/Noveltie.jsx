'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import IP from '@/libs/ajaxClient/dataFecth';

import useAxios from "@/hook/useAxios";
import DataFormart from '@/libs/dateFormat.js';
import typeShareJarvis from './assets/shareJarvis';


import { useDispatch } from "react-redux";
import { setConfigModal } from "@/store/slices/globalModal";

import { ImgContext } from "@/contexts/imgContext";
import socket from "@/libs/socketIo";
import Img from './assets/Img';
import { useInView } from 'react-intersection-observer';
import axiosInstance from '@/libs/axios.config';

import changeHostNameForImg from '@/libs/changeHostName';
import useAuthOnServer from '@/hook/auth';

import TextAreaAutoResize from '@/components/inpust/text_area_autoresize';
import MemoSlider from '@/components/carruzel/slider';





function Noveltie({ data, idNoveltie, isNotLobby }) {


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
        requestAction({ url: `https://${IP}/novelties/img/id=${idNoveltie}`, action: 'GET' })
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
            requestAction({ url: `https://${IP}/novelties/id=${id}`, body: dataParams, action: 'PUT' })
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
            requestAction({ url: `https://${IP}/user/publisher/delete=${data._id}`, action: 'delete' })
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
            if (user.admin || user.super) {
                if (typeof eval(noveltyState.isValidate.validation) !== 'boolean' || !eval(noveltyState.isValidate.validation)) return
                const noveltieCopi = { ...noveltyState };

                if (imageOnly) delete noveltieCopi.videoUrl; // ojo aquí

                const responseSend = await typeShareJarvis([noveltieCopi]);


                putValidateNoveltie(noveltyState._id, {
                    sharedByAmazonActive: true,
                    givenToTheGroup: true
                });

                dispatch(setConfigModal(
                    {
                        modalOpen: true,
                        title: 'Enviado con éxito',
                        description: 'La novedad fue enviada al grupo de Amazonas activo.',
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
                                    borderRadius: '100%',
                                    height: '80x',
                                    width: '80px',
                                    overflow: 'hidden'
                                }}>
                                    <Img idLocal={noveltyState.local.idLocal} />
                                </div>

                                <div className='divContentNovelties-textContain'>
                                    <p style={{ color: '#000', fontSize: '1.1rem' }} title='Nombre del restaurante o cliente'>{noveltyState.local.name}</p>
                                    <p className='divContentNovelties-pTitle __text__oneLine' title='Título de la novedad'>{noveltyState.title}</p>
                                    <div className='__align-center'>

                                        <p
                                            className='divContentNovelties-pDate __text__oneLine'
                                            title='Fecha y hora de la novedad'
                                            style={{ color: '#797979', fontWeight: '500' }}
                                        >
                                            {DataFormart.formatDateApp(noveltyState.date)}

                                        </p>
                                        <img className='divContentNovelties-pDateImg' src='ico/clock/clock.svg' />
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
                                        <img className='icoBtnHeader headerNoveltieIco' src='ico/more_horiz/more_horiz.svg' />
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
                                            <img className='divContentNovelties-headerListOptionImg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVR4nO2WTQrCMBBG30LcdKH38Q6CvZN6MHGteIZ6ihZGRiZQwTQTGtpNPvgWyfw8EgYS8KkFXsAAiHmwvROFdBw1j7ktAXpaszPQjPYb4GKxx1zIBuit2e5PfG+x3nLdujuuyevbFEgKexGIxGCLgYKSCQm561cDycx1VBUk9eqC6jBIHYbVhyFX4q1/W+IhG8G3Rms7T/K1wGOnP6aktgYLJ8uxnkQh2uNHHwhHEn7bB9NrAAAAAElFTkSuQmCC' />
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
                                    invalidText={eval(noveltyState.isValidate.validation)}
                                    editedBy={noveltyState?.isValidate?.menuEditedBy}
                                />
                            </div>



                            <MemoSlider
                                imageShare={noveltyState.imageToShare}
                                video={noveltyState.videoUrl}
                                imageGroup={noveltyState.imageUrl}
                                isDrag={typeof eval(noveltyState.isValidate.validation) === 'boolean' ? true : false}
                            />




                            <div className='p-[.6rem_.3rem] flex items-center justify-between'>
                                <div className='divContentNovelties-textContain __row-text'>
                                    <img className='divContentNovelties-pDateImg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA00lEQVR4nOWUsQ2DMBBFX+3CM4QRqIGOCQJNGpiEDEF2yBDsQ5agSIR0SBGyjXFMpChfusrSv9Pd84d/lwJyoJYqAB3TvAIuq6rk7WPlBvOlshgNakeD+S1YJ6AH2tgNUuAOTMATuO5dkY2IEhjE9L1GoDGYn01HthHRAA+D+SCNlUy7DJXZCHIR0YnpJCuaVxWViBa4AUmIsW+DXugJVnH0irTjyOPGkb2zyEZEuRPT4CxKVx+tOyqLEqEqelR8Lex8yIsS19pCnjGLQqV8s+h39QIjDlqEQHfS9gAAAABJRU5ErkJggg==' />
                                    <p className='divContentNovelties-pDate' style={{ color: ' #000' }} >Compartido por {noveltyState.userPublic.name} </p>
                                </div>
                                {
                                    typeof eval(noveltyState.isValidate.validation) === 'boolean' ?
                                        (
                                            <div className='divContentNovelties-textContain __row-text'>
                                                <img style={{ filter: 'none' }} className='divContentNovelties-pDateImg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABz0lEQVR4nK1VO08CQRC+H2HhC7lFQ2FnZ2UsLCQ+foKxsFDBH4Oyi0c0MdEYQ6mgvXYaW1+VxthZcDt7pxyaNQPHIeHeMMkkl+zeNzvfzHyjKD42Sc0EKUKOMH5FKDwSBqLp+E35JWGQncob40pUGy8aY4SBpjLeIAykv/NfwqCsFsxkKHCV6asqBR4MDF3e/IfqK/7gFHbsF0UCJ/+zKULOFTzJRIZQ/hMfHJwgyEIP53FoIV50MdAnNDHyj3c4GBQ46bjWacU+qEnvg8ycCZcseAOZsQsbD3y6BPLm7VtaliXXzo3eO5RvK/bA9AX+XrPk7JFrLSqYwUsc8OvXFvhHrS4XTnspamUAT1hgcDtcLgv5CXW5e2v6vnz+xAO8lQEoXu2JAYxvqwlE78zI4O12xQyevS5sVA0niHb/FQnc9ofAIq9fGFJ8tYIEcu5WZJTcoIsbdiYRXt70JOWbCup5GFmeOxZy5jA8uDNoaIRBKc4sEH8vOlqU2DNGByp2FGrJghjuluuCWByUXBOmL7vuBHv/9rdwGGR9txpGxwGJQ0uK6ku+4G1La3yIUJ4P0132Ha1rwYQ1bLMU41sq5VWcStQWW7vwu4JnTit62B/eQgtoymS3jgAAAABJRU5ErkJggg==' />
                                                <p className='divContentNovelties-pDate' style={{ color: ' #000' }}>Validado por {noveltyState.isValidate.for}</p>
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
                                            <div className='divContentNovelties-textContain __row-text'>
                                                <img style={{ filter: 'none' }} className='divContentNovelties-pDateImg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAACNklEQVR4nMVWv2sUQRReCPfeCmlSGGxE/w39B0QlpDEQQdhJIWIgf4Bkx1QSma0txFgLVpekSkBu5g4CGqukSAxoI2gXIxYqyL3wZndvd2921xsbD6a4fTvf935+b4Pgf/zodTBFBl6SwTMyuEU9vFqxvwmv2OcGv5GGDX7fj8DAPBmk0jmjfmfR2jQsWOCKHeb9CDSujxFQdvZrn2tU5fv31pJZIdX7SKpBE0G3gYAazkEZPIrVoZAJRTLZb0gRnkwMrvE3aZjje0uPnlyMpDpgcBGro2hNXcoLyjl/Shq3ScNH0jickOAXabjZCJ4VbaPeM/hCBp5n5+s/gWfpGOsIe97RIJgZvTMIZsjArjd4RrDlEoTX2RbJ5LaQic0v9YKQNOyUwSsFjdUh/3cLmg5NNYpeMM02EavvQqqhkMlyQRJemxi8aEs7PE4ES6vqYUpQkLSBc2R5dHWtWQyRxrfsrU3TY3U/J4lW1UpTzi24TR92XfA+3HHrALu0F1ywqZLJ8ogkTj47nhu8QQZ/Finu3C15Hl4mjaf1fQ4jkiKSMc/HwXPtygWyvosq87AzSleshJDqVSXnnJb6u5ttc+CS7KWRlBrjVgs41/G0fZLdC8dk8EEqK/CMDP75i1MvUoJci1iiUxU98dAiysiHmYZtW01jvLYlRBo+eRJ8aASrJ7Ce+BB0/QhsmF4bbd2TwNnJvNwXrK3fWcw+Bsrz4rmT86+KdAA3WRArdhbIVFl/cLe0FfQctsS8Kx+x7ooAAAAASUVORK5CYII=' />
                                                <p className='divContentNovelties-pDate' style={{ color: ' #000' }}>Enviado a amazonas activo</p>
                                            </div>
                                        )
                                        :
                                        (
                                            null
                                        )
                                }
                            </div>


                            <div className='divContentNovelties-divBtn' style={{ gap: 0, overflow: 'hidden' }}>
                                <button
                                    className={eval(noveltyState.isValidate.validation) === true ? 'btnPublic __btn-blue' : 'btnPublic'}
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
                                    <img className='btnPublic-img' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEvklEQVR4nO2abWxTVRjHjxpjYmJi/CAxfvCTxvhRTDSiMfbcdu09t1vac652gi842RyEACrOTaQTZZuw6TaWvRKHERUyhQDyolt8Aec2ysY0UUOQlUkGBZwiK+vm6o45JWc92223BW9dd+/9Jc/H257/v/c8Pc//XgAsLCwsLCwsLCzmFofivRfKZDlEpBAi8ozN7VsAzMDDmZm3QEQ+lhChYkFERiSE31JV9QZgVJxO500Qkc6p4icZIZNGYFQkhIu4ULui0teLS2jT+x/S1WvXTTLBrmAHMCJQxn1c5I6W3ZQzPj5OK6pqRRM+BUbDbvfczgXKnmw6MjpKRU73nxG2AT4JjIYN4Ue5wNwVL9OpDJw9Z2wDIFJzucANpRUaAwLdx8VG2AaMBpRJHRf40Y7PNAbs2rM/3gNkXAuMBkQkwAUePXZcY0B5pdAEFfwiMBI2t28BlPE/TJzD/QS9fHlIY0D+qlfjBjg9DwEjYZPVHC5uTcF6jfgrw8PUmeXjDTCqKMrNwEhIiLRzA1p27dUY0N5xVNz/3wMjYVM893Nx7Ff+489LGgMqaxoEA4gfGAlJJru5uNLNVRrx0WiU4qeejx+DZfwgMAp2l3eRePY/+WufxoCuQI8wEeIgAOA6YJTJT5LJD1xcWUU1TQS7K4QD0EZgFKCMy7kwBS+mofMXNOIjkRHqxkuEIQg3SAgXJC0XeQG6nrwHpDs2RHwSIuNc2L4DXyT89Y+0dybNBWaoVgl57wbpO/TgCF8sm/nZuJuIYz2912oA6xeDkgs/ANIJScEQIhzmi8zJX02HwmE6HR1dgVg2MJtix2W2nQQjTrOIDaQDkqw+fTXXu7o4dXEOPRc6T/Vm4GyIZj+bJ5wb1NfmVPjChbk3SgjXi7cnW+BvZwZoqvjmcLt4cOqeUwMgIoWi+KV5q2gopO34ejIciYi9IKybGAnhTRLCf8/QgE6JHbh0c3WbGHSwwSbVhMNXRAP+0s2ADLdvdHYdmBTyayKR0Q37D7XSb7/rSNrt9ebnX06IZ4efdDOgvKaZZmT6ZvMXVMyvoZQW0/+Zzw+2itPjJ7oZEAyFabKqatyeNgZsqdsq3gFFpjNgTcH6+FpcWDGdAV7f0om1PC577zKVARcu/i7e/pd0HZ+D88CArkC32ACP6CZ+vhjAZoKUPT8IzgMDxABFQmq+6QxYtuKleH7o8i4ylQFjY9GJ5wcscHksK+tWUxnQF+yflAXoKn4+GND29WExQN0LzGZAU/P21CbIwTQ3oMhfMrEGFryazoBsIQqzOdX7TGXA0FBYzCNGWBRnKgN6en8U93+v7uLT3YBN79WIQ1ADSBcDLg4OltQ2NtPq2qZYLJbo7Y//AovZ9h34MvZwdWL/u1R7Sgzo7D1F67e10LrmnZpaudaf0IC3y97dI8Zl7BUYdlwt8m+k71RsofVbP4j9fV1LVdY00ryVr0yN5L4CqSL7ueUz5oFTDbAj1TOba/QpfCIjw3NHygyQYpH3zAuxy3jJpOsU9ZHYa3Ay7k+R+DFJJtscDvW2lIlnsLwfIvwGRKQsWTHxfr//epAEG1LvZC87SwgvY4+0IcJvTvd505ZM1rHvY5+Z7PssLCwsLCzArPkXTUqV7bRwSGsAAAAASUVORK5CYII=' />
                                    <p style={eval(noveltyState.isValidate.validation) === true ? { color: '#fff' } : { color: 'revert-layer' }} className='__textGrayForList'>Validado</p>
                                </button>

                                <button
                                    className={eval(noveltyState.isValidate.validation) === false ? 'btnPublic __btn-red' : 'btnPublic'}
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
                                    <img className='btnPublic-img' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEZ0lEQVR4nO2aX2wURRzHp/6LMTExMT6Y+OCf8GKML30zMRdu5ri7meu1dzPTpq1HFVQsDeKfVpQS2qARDJGIlggHlNJaAmJCIkQSMIailSAx8QUrf9rSykNpJbUg2NLaMdP0R+fuVmuhu15295NMctn29rvf79z+5s8uQj4+Pj4+Pj4+Pj63TSCSeIRQmSKMr7qtRmWqoaHhDjiv/vyfzxuVFQihAuQkuKTkQcxEG6Z8gjCh5qVRmbp5fiYWz+W7mIlKR3sdU35u3oxPt6+/6VDA7vZ9c/ouZrzRKf8FmIkOU7z2nUa1dXuL2r7rs1tu2vzk5KRlANWvva02Ne3Iafq44wEEozwKouF4mfruxEllB2YATekWdXHgck7Txx0PAFORBtF0c6st5vM9gJ9A9Oz5bm8FUFj48t2Y8jEtGCkuU+Pj494KIMQST4HgSzVv2GY+bwMgUVkBgus3bvZgAIyvB8G9+w94MoBDIHjy1I/eCwBT3g+Cg0O/eSuAQHHxA4SJSS1WUlqVMWvzRABBxp8FsddXrbXVfF4GEIryGhD75NMd3guAML4VxA4dPurFAEQniJ3uOuO5AAow4yNaKBST6tq1644GkN7VrkauXs9p+rgjAYSK5GMglFpaY7v57AD059n+x9YACJNxEFr77gfeCwBTsQaEWtr2ejAAJvaBUMe333svAML4aRDq67/oeABv1a+bWnxlN33coV8AH4E9wImJCdvNj1y5ol59c3X+7Apjxv+AXSC7A+ju6VWVS6rnZH5qeKb8ORsDEKdAqPPED7aZ/7nrjCouXTzTq5T/RajYiZnY8G9NmzefKs1/AFTWwUWVVy1T/b/Ofx3o+uWsisvUTK9SMUyoZCgfeCYev58wcQEujibK1XsbNqnW9s8ti1N2m23qfGlwSMnKpcb9LC4Fi/jTKJ9YxGQhZvzyXO9NqB0DA4OW5sfGbqhlK2qNnudDwYh8EuUjhCUXEMaP3EoI3b0XLAPQD1eMe35M7zugfIew5ALM+BI99PxTYSKMHzbXD1Y7SLroLSoqNYKS1cgtYCb2gLHm1j2Wvb+ytt78lRx1/Bm/XcRisfsI5VfBXE9vX455PZwaRW80HC57FLmFEJMJMPficusnSCvMmR7lHyI3QRjfBub0UJnNufM9Gb0ficiHkJsglPeBQT3ByUZvqhoBtCE3gVnycTDHy1+wrP4Vz79yM4AgTS5EboJQngRz9Y3v55jXBdGc7gYCgbuQmyBUrAODO3fnDn8HvzpiFr/9yG0QKg6AwWPHO3MC2LwlbYz9fDVyG8TYPbKa/q6sWzNTAKM8htwGnt480W10dDQnAF0Y4e8LI2VPILdBjBng8PDvOctec/yXUt6J3Aah4jiY3LKtOSOAj5pm7n/9siVyI2TqBefMt0j1kjdr4aOmX3B2JQWYii9n2R/4wjUrPysCgap7CeMfE8ZvZBrnf2ImNkop70FeIKDfKtcbJ1TWhZiQ4XDi4f/7mnx8fHyQ1/kbFQDCU9JTFb0AAAAASUVORK5CYII=' />
                                    <p style={eval(noveltyState.isValidate.validation) === false ? { color: '#fff' } : { color: 'revert-layer' }} className='__textGrayForList'>No válido</p>
                                </button>



                                <button
                                    className={noveltyState.shift === 'day' ? `btnPublic __day` : 'btnPublic'}
                                    onClick={() => {
                                        putValidateNoveltie(noveltyState._id, {
                                            shift: 'day'
                                        });
                                    }}
                                    disabled={permissionUser && !eval(noveltyState.isValidate.validation)}
                                    title={permissionUser ? 'Sin permiso para validar' : 'Invalidar novedad'}
                                >

                                    <img className='btnPublic-img' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAABsUlEQVR4nO2ZzU7CQBSFJ8TUN9CFuMcVpobQxAdzKUvfgIlGA76E7uARZCkYSFhUkz7EMddWLWM7xeH2Z8jc5CQESjlfO733TBDClStXrva2MBQDDMWNsNa8FPiSbRBIm7cNAlnmbYGAznwTIFBkjknCAeRU4dV7OACej4HZGbD0gY8gFr2edYCno/iYxt2BuxYwbQNhAESXetExk3b8HdkEgJEHzLvFxlW9nQOPhzUDjD1g3fu/+W+te/E5agGgJbAwuPKq5l3gtlUDwPR0d/NRInomygbYGFLUSbZ5YLdVGGx2J+5h92fCUqvkMh8lohZbxsTOjAfU57kBXjr8sSM326wu+AGWPm920gazd8b1HyWic3IGQEhxVSlAqAGQ4trsLuRBrPzqlpA0NK+FoGBWxUMsdzSfC1FFG5VM5jMh2AdZX43ZvOZTEL8/QuOfC2ByUlOYM4nRql7rCnNccXrkWbqhWTRhQyNNtpT9+PlRlg1qBUh3J2qHNCdoMNHEJtFr6vP02X0TN/WSV8IBGJY2AJY9pCqCaLb5Agg7zOdA2GVe+Ytp8POGK1euXO1dfQIP3ciBFRe34QAAAABJRU5ErkJggg==' alt='sun--v1' />
                                    <p className='__textGrayForList'
                                        style={{
                                            color: noveltyState.shift === 'day' ? '#fff' : 'unset'
                                        }}
                                    >Diurno</p>
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

                                    <img
                                        className='btnPublic-img'
                                        src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEmUlEQVR4nO2Zz08bRxTHrSpSDk3+hTaRqrRSo/S/qHIIp1659YcqVVWI2TUGDGsbJH7aYGx+Gb9Zi0PBOUBABmPtm1rqpScS1CY55lCp6iEkElRVm5Bmq7fyWuvFxuPx2s3BT3rSsrvMfD8z78cs+Hxd61rXukaWTqevA8A3ALAJAD8zxp4xxv5ijL0GgJeMsSMAuA8A9wDgM9+7YIlE4rKu618zxp4yxswm/QljzJ9Kpa50XLimae/puv49APwhIbzKAeAYAPo0TbvUEfG6rl8DgFKrwmv4w0wm83FbxUcikS8A4KQN4s2ynzLGetoiXlGU3nA4/Myx9eb8/LwZjUbNoaEhU1VVMxAImKFQyJyamrKeS0KcAUCvp+L7+/t7FEV5Mzc395YmWV5eNkdGRizR9XxiYqKVnTgDgDueiPf7/TcURTklUaurq2YymbRW+iLx5MFg0Jmo5uTkpHWPfHx83Eyn040g/tR1/ZOWxFNlUBTl0Ba1sLAgJJ58cHCwImZ6evrccwo1aBBmAHDYUnVSFKVPRGwtJ9G2EBJb653Z2dlzoin0aJcceXRXSryqqlcVRTmWET86Olq1uvV2LRQKnQMYGBioPI/H41afyGQyV2VWX5Fd/ZWVlar4v+jdeDxeBTA8PFx5Rtfl+34ZgKeyAGtraxVBBNPo/Wg0WknqWCxWuU+7YR87mhV/yzlBOBy2XBTAFkRO1yK/EwwGzaWlJWvHKH+oCFDlshcik8ncbAbALwJADSwSiVgiaULZHVMdEM7dc7l4MquqmhNd6bGxMcsJpFUAVVWtHlGrvNIxXRggEAg88QqAKhAJODg4MLPZrBBEJBKxur0L4JEwgKZpb2oNTMcHEm3XdQob+pkmrBdCuq6bnHPLEVG6lzDGngsDxGKxf2sNaK+2aGLSYc8Wb3szuRJ0HEcYY/8IA2Sz2bNaA9LKE0C9zuo8clDIuMWTU6cVBQhVNzpxgEKh8ILoZROxnnjyzc3Nmp05mUxayZtIJKzqRvPTtVQIcc5/WVxcbAsAOQl1HhlUVRU5nR41A3CfRNCZRgZgY2PjQgDyfD5f1XU1TbOO6/UAdF1/IAxgGIafJtne3q46m4j6zMxMQwC7Ko04PowodOqIN3d2dqaFARDxlnOlqJo0A0JCRAB4OSdopymkqIm5xVPvyOfzbw3D+EAYoAzxq3uyra0tIQAqlaIA3OGFQsHM5XLm+vq6JZyui8UiPTtsSrwzjGTqOJ2bZAB4/VD7rmmAYrH4PiI+dw9GX1GNAFKplJcAv+3v71/2yRgi9rkH3N3dvTAfqJo0KqNNrv63PlkrlUqXOOcP3YPu7e1Z3ZaSj5oSAVEC0seLl+I55z+RBmmAMsRHnPMTL2NacOVfcs4/9HlhiNiDiGcdBHhlGMZtT8Q7IHo7AYGIfxuG4c1f5dxGAyPiaRsBTjjnn7dFvAPiBjWWNoj/0bOYb2RUGRDxLuf82APhv1Ojon+adES8C+QKdWxEfCwR648R8UvpJuW1cc4/pV1BxBwiPuKcv6BqgoivqaMj4hEi/oCIX5VKpWv/t96uda1rvnfD/gM0dKahps3mYgAAAABJRU5ErkJggg=='
                                        alt='moon-'
                                        style={{ filter: 'brightness(1.2)' }}
                                    />
                                    <p className='__textGrayForList'
                                        style={{
                                            color: noveltyState.shift === 'night' ? '#fff' : 'unset'
                                        }}
                                    >Nocturno</p>
                                </button>

                            </div>



                            <div className='divContentNovelties-divBtn' style={{ gap: 0, borderRadius: '0 0 5px 5px', overflow: 'hidden' }}>
                                {
                                    isVideoBooleanState ?
                                        <>
                                            <button
                                                className={eval(noveltyState.isValidate.validation) === true ? 'btnPublic __btn-download' : 'btnPublic'}
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
                                                disabled={!(eval(noveltyState.isValidate.validation) === true) || permissionUser || noveltyState.shift === null}
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Descargar video de la alerta'}
                                            >


                                                <img style={{ width: '20px' }} className='btnPublic-img' src='/ico/icons8-descargar (1).gif' />
                                                <p className='__textGrayForList'>Video</p>



                                            </button>
                                            {
                                                <button //button whastapp
                                                    className={eval(noveltyState.isValidate.validation) === true ? 'btnPublic  __btn-green' : 'btnPublic'}
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
                                                    disabled={!(eval(noveltyState.isValidate.validation) === true) || permissionUser || noveltyState.shift === null}
                                                    title={permissionUser ? 'Sin permiso para enviar' : 'Enviar al grupo de Amazonas Activo'}
                                                >
                                                    <img className='btnPublic-img' src='data:image/png;base64,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' />
                                                    <p className='__textGrayForList'>Video</p>
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
                                                className={eval(noveltyState.isValidate.validation) === true ? 'btnPublic __btn-download' : 'btnPublic'}
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
                                                disabled={!(eval(noveltyState.isValidate.validation) === true) || permissionUser || noveltyState.shift === null}
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Descargar video de la alerta'}
                                            >
                                                <img style={{ width: '20px' }} className='btnPublic-img' src='/ico/icons8-descargar (1).gif' />
                                                <p className='__textGrayForList'>Imagen</p>
                                            </button>

                                            <button //button for image
                                                className={eval(noveltyState.isValidate.validation) === true ? 'btnPublic  __btn-green' : 'btnPublic'}
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
                                                disabled={!(eval(noveltyState.isValidate.validation) === true) || permissionUser || noveltyState.shift === null}
                                                title={permissionUser ? 'Sin permiso para enviar' : 'Enviar solo imagen de la alerta'}
                                            >
                                                <img className='btnPublic-img' src='data:image/png;base64,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' />
                                                <p className='__textGrayForList'>Imagen</p>
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
                                            backgroundColor: '#ddd'
                                        }}>
                                            <div style={{ width: '50px', height: '50px', backgroundColor: '#ddd' }}>  </div>
                                        </div>

                                        <div className='divContentNovelties-textContain __width-complete'>
                                            <p style={{ color: '#000', fontSize: '1.1rem', backgroundColor: '#f5f3f3', height: '15px' }} ></p>
                                            <p style={{ color: '#000', fontSize: '1.1rem', backgroundColor: '#f5f3f3', height: '15px', width: '50%' }} ></p>
                                            <div className='__align-center'>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='w-full h-[500px] bg-[#ddd] mx-auto mt-4 rounded-lg' style={{ backgroundColor: '#ddd' }}></div>
                                </div>
                            </div>
                    )
            }
        </div>
    )
}



export { Noveltie };