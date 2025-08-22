'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal.js';
import { useSearchParams } from 'next/navigation';
import BannerBetween from '@/components/Header/BannerBetween';
import InputBorderBlue from '@/components/inpust/InputBorderBlue.jsx';

import LoandingData from '@/components/loandingComponent/loanding';
import Table from '@/components/tablet_component/Table';
import FormDish from './FormDish.tsx'
import Image from 'next/image';
import WindowFormLayaut from '@/layaut/windowForForm';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';
import useAuthOnServer from '@/hook/auth';
import useAxios from '@/hook/useAxios';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';



export default function Layautbody() {


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const id = searchParams.get('id');
    const { requestAction } = useAxios();
    const selectEstablishment = useSelector(state => state.clients);
    const [openFormCloneConfigDishState, setOpenFormCloneConfigDishState] = useState(false);
    const [state, setState] = useState(null);
    const [showFormBoolean, setShowFormBoolean] = useState(false);

    const refPutData = useRef(null);

    const { fetchData } = useSingleFetch(null, false);



    useEffect(() => {
        getStablishment();
    }, []);


    const getStablishment = () => {
        requestAction({ url: `/local/id=${id}?populate=dishes`, action: 'GET' })
            .then(response => {
                if (response.status === 200) setState(response.data);
            })
            .catch(err => {
                console.log(err);
            });
    }



    const validateAuthorization = useCallback(callback => {
        if (!user.admin) {
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tienes autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else {
            callback();
        }
    }, [user]);



    const showOpenForm = () => {
        validateAuthorization(() => {
            setShowFormBoolean(true);
        });
    };


    const closeForm = () => {
        refPutData.current = null;
        setShowFormBoolean(false);
    };


    const closeOpenFormCloneConfigDish = () => {
        setOpenFormCloneConfigDishState(false);
    };


    const askCloneDishConfigurationObject = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Aviso',
                description: '¿Seguro de clonar configuración de otro local o establecimiento?',
                type: 'warning',
                isCallback: () => {
                    setOpenFormCloneConfigDishState(true);
                }
            }));
        });
    };


    const cloneDishConfigurationObject = idParameter => {
        requestAction({ url: `/local/id=${idParameter}`, action: 'GET' })
            .then(response => {
                if (response.status === 200 && response.data.dishes.length > 0) {
                    const bodyForRequest = state;
                    delete bodyForRequest.img;

                    requestAction({ url: `/local/${state._id}?populate=dishes`, body: { ...bodyForRequest, dishes: response.data.dishes }, action: 'PUT' })
                        .then(responsePut => {
                            if (response.status === 200) {
                                dispatch(setConfigModal({
                                    title: 'Succesful',
                                    description: 'El recurso fue clonado con exito',
                                    modalOpen: true,
                                    callback: null,
                                    type: 'successfull'
                                }));
                                getStablishment();
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .finally(() => {
                            closeOpenFormCloneConfigDish();
                        })

                }
                else {
                    dispatch(setConfigModal({
                        title: 'Error',
                        description: 'No existe recursos asociados al establecimineto selecionado',
                        modalOpen: true,
                        callback: null,
                        type: 'successfull'
                    }));
                }
            })
    };


    const deleteDishItem = idDish => {
        validateAuthorization(() => {
            requestAction({ url: `/dishes?id=${id}&dish=${idDish}`, action: 'DELETE' })
                .then(response => {
                    if (response.status === 200) {
                        dispatch(setConfigModal({
                            title: 'Succesful',
                            description: 'El recurso fue eliminado con exito',
                            modalOpen: true,
                            callback: null,
                            type: 'successfull'
                        }));
                        const filteredDishes = state.dishes.filter(dishe => dishe._id !== idDish);
                        setState({ ...state, dishes: filteredDishes });
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        });
    };


    const askResetConfigRequest = () => {
        validateAuthorization(() => {
            validateAuthorization(() => {
                dispatch(setConfigModal({
                    modalOpen: true,
                    title: 'Aviso',
                    description: '¿Seguro de resetear configuración del establecimiento?',
                    type: 'warning',
                    isCallback: () => {
                        resetConfigRequest();
                    }
                }));
            });
        });
    };


    const resetConfigRequest = () => {
        const bodyForRequest = { ...state };
        delete bodyForRequest.img;
        requestAction({ url: `https://${IP}/local/${state._id}?populate`, body: { ...bodyForRequest, dishes: [] }, action: 'PUT' })
            .then(response => {
                if (response.status === 200) setState({ ...state, dishes: [] });
            })
            .catch(err => {
                console.log(err);
            })
    };


    const pushData = data => {
        setState({ ...state, dishes: [...state.dishes, data.newDish] });
    };


    const handdlerClickGetDish = (id) => {
        fetchData({
            url: `/dishes/id=${id}`, method: 'get', autoGetDat: false, callback: (response, error) => {
                if (response?.data) refPutData.current = { ...response.data?.data, isPut: true, idLocalRef: state._id };
                setShowFormBoolean(true);
            }
        })
    };



    if (!state) return <LoandingData title='Cargando datos' />



    return (
        <>
            <BannerBetween>
                <h3>Gestionar platos en {state.name}</h3>
                <div className='flex __oneGap'>
                    <ButtonForBanner ico='/ico/icons8-cita-recurrente-50.png' value='Resetear' actionButton={askResetConfigRequest} />
                    <ButtonForBanner ico='/ico/añadir-50.png' value='Add new' actionButton={showOpenForm} />
                    <ButtonForBanner ico='/ico/icons8-copiar-50.png' value='Clonar platos' actionButton={askCloneDishConfigurationObject} />
                    <ButtonForBanner url='' ico='/ico/gira-a-la-izquierda-32.png' value='volver' />
                </div>
            </BannerBetween>

            <Table dataHead={['Eliminar de la lista', 'nombre de plato', 'Regla de uso', 'editar']} >
                {
                    state.dishes.map((item, index) => (
                        <tr key={index} >
                            <td>
                                <button className='__pointer' onClick={() => {
                                    dispatch(setConfigModal({
                                        title: 'Aviso',
                                        description: 'Segura de eliminar este plato',
                                        modalOpen: true,
                                        type: 'warning',
                                        isCallback: () => {
                                            deleteDishItem(item._id)
                                        }
                                    }));
                                }}
                                >
                                    <Image className='__never-pointer' src='/ico/icons8-basura-26.png' alt='ico-delete' width={25} height={25} />
                                </button>
                            </td>
                            <td>{item.nameDishe}</td>
                            <td>
                                {
                                    typeof item.nameDishe === 'string' ?
                                        'Genérico'
                                        :
                                        'Detallado'
                                }
                            </td>
                            <td>
                                <button className='color-gray-500 border-solid border-[1px] text-[.7rem] p-[.2rem_.5rem] rounded-[4px]' onClick={() => handdlerClickGetDish(item._id)}>editar</button>
                            </td>
                        </tr>
                    ))
                }
            </Table>

            {
                showFormBoolean ?
                    (
                        <WindowFormLayaut close={closeForm}>
                            <FormDish establishment={state} pushData={pushData} close={closeForm} putData={refPutData.current} />
                        </WindowFormLayaut>
                    )
                    :
                    (
                        null
                    )

            }
            {
                openFormCloneConfigDishState ?
                    <WindowFormLayaut close={closeOpenFormCloneConfigDish} >
                        <form style={{ width: '50%', padding: '2rem 1rem' }} className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap'>
                            <h2>Listas de locales</h2>
                            <InputBorderBlue
                                textLabel='Seleciones un establecimiento'
                                type='select'
                                childSelect={
                                    selectEstablishment.map(item => {
                                        return { value: item._id, text: item.name }
                                    })
                                }
                                eventChengue={value => {
                                    cloneDishConfigurationObject(value);
                                }}
                            />
                        </form>
                    </WindowFormLayaut>
                    :
                    null
            }
        </>
    );
}