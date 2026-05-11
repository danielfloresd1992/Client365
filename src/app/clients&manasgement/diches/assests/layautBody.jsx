'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal.js';
import { useSearchParams } from 'next/navigation';
import InputBorderBlue from '@/components/inpust/InputBorderBlue.jsx';

import LoandingData from '@/components/loandingComponent/loanding';
import FormDish from './FormDish.tsx'
import Image from 'next/image';
import WindowFormLayaut from '@/layaut/windowForForm';
import useAuthOnServer from '@/hook/auth';
import useAxios from '@/hook/useAxios';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import SharedAside, {
    AsideSection,
    AsideActionButton,
    AsideSearchInput,
} from '../../assets/SharedAside';


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
    const [filter, setFilter] = useState('');

    const refPutData = useRef(null);
    const searchRef = useRef(null);

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
        requestAction({ url: `/local/${state._id}?populate`, body: { ...bodyForRequest, dishes: [] }, action: 'PUT' })
            .then(response => {
                if (response.status === 200) setState({ ...state, dishes: [] });
            })
            .catch(err => {
                console.log(err);
            })
    };


    const pushData = data => setState({ ...state, dishes: [...state.dishes, data.newDish] });
    


    const handdlerClickGetDish = (id) => {
        fetchData({
            url: `/dishes/id=${id}`, method: 'get', autoGetDat: false, callback: (response, error) => {
                if (response?.data) refPutData.current = { ...response.data?.data, isPut: true, idLocalRef: state._id };
                setShowFormBoolean(true);
            }
        })
    };



    if (!state) return <LoandingData title='Cargando datos' />



    const CATEGORY_MAP = {
        desserts_and_sweets: { label: 'Postres y dulces', color: 'bg-pink-100 text-pink-700' },
        drinks:              { label: 'Bebidas',          color: 'bg-sky-100 text-sky-700' },
        food:                { label: 'Aperitivos',       color: 'bg-amber-100 text-amber-700' },
    };

    const handleSearch = e => setFilter(e.target.value.toLowerCase());

    const filteredDishes = state.dishes?.filter(d => {
        if (!filter) return true;
        const name = (d.nameDishe || '').toLowerCase();
        const cat  = (CATEGORY_MAP[d.category]?.label || '').toLowerCase();
        return name.includes(filter) || cat.includes(filter);
    });

    const totalDishes   = state.dishes?.length ?? 0;
    const totalFood     = state.dishes?.filter(d => d.category === 'food').length ?? 0;
    const totalDrinks   = state.dishes?.filter(d => d.category === 'drinks').length ?? 0;
    const totalDesserts = state.dishes?.filter(d => d.category === 'desserts_and_sweets').length ?? 0;

    return (
        <>
            <SharedAside
                title={`Platos en ${state.name}`}
                subtitle='Gestión del menú'
                icon='/ico/icons8-menú-50.png'
                footerText={`${totalDishes} platos registrados`}
            >
                <AsideSection label='Buscar'>
                    <AsideSearchInput
                        placeholder='Buscar plato o categoría...'
                        onChange={handleSearch}
                        inputRef={searchRef}
                    />
                </AsideSection>

                <AsideSection label='Acciones'>
                    <AsideActionButton icon='/ico/icons8-agregar-base-de-datos-50.png' label='Agregar plato' onClick={showOpenForm} />
                    <AsideActionButton icon='/ico/icons8-duplicación-50.png' label='Clonar platos' onClick={askCloneDishConfigurationObject} />
                    <AsideActionButton icon='/ico/icons8-repetir-50.png' label='Resetear menú' onClick={askResetConfigRequest} />
                </AsideSection>
            </SharedAside>

            <main className='flex-1 h-full overflow-y-auto p-4 sm:p-6'>

                {/* ── Tarjetas de resumen ──────────────────────────────────── */}
                <div className='flex flex-wrap gap-3 mb-5'>
                    <StatPill value={totalDishes}   label='Total platos' color='emerald' />
                    <StatPill value={totalFood}     label='Aperitivos'   color='amber'   />
                    <StatPill value={totalDrinks}   label='Bebidas'      color='sky'     />
                    <StatPill value={totalDesserts} label='Postres'      color='pink'    />
                    {filter && (
                        <StatPill
                            value={filteredDishes?.length ?? 0}
                            label={`"${filter}"`}
                            color='gray'
                        />
                    )}
                </div>

                {/* ── Grid de platos ───────────────────────────────────────── */}
                {filteredDishes?.length > 0 ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
                        {filteredDishes.map((item, index) => {
                            const cat = CATEGORY_MAP[item.category] ?? { label: item.category || 'Sin categoría', color: 'bg-gray-100 text-gray-600' };
                            return (
                                <div
                                    key={item._id || index}
                                    className='bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow'
                                >
                                    {/* Header: nombre + categoría */}
                                    <div className='flex items-start justify-between gap-2'>
                                        <div className='min-w-0 flex-1'>
                                            <h3 className='text-sm font-semibold text-gray-800 truncate'>
                                                {item.nameDishe || 'Sin nombre'}
                                            </h3>
                                            <span className={`inline-block mt-1 px-2 py-[2px] rounded-full text-[10px] font-semibold ${cat.color}`}>
                                                {cat.label}
                                            </span>
                                        </div>
                                        <span className='text-[10px] text-gray-400 font-mono shrink-0'>#{index + 1}</span>
                                    </div>

                                    {/* Propiedades */}
                                    <div className='flex flex-wrap gap-[6px]'>
                                        {item.allDay && (
                                            <span className='inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-[2px] rounded-md font-medium'>
                                                <span className='w-[5px] h-[5px] rounded-full bg-emerald-400' />
                                                Todo el día
                                            </span>
                                        )}
                                        {item.requiresTableNumber && (
                                            <span className='inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-[2px] rounded-md font-medium'>
                                                <span className='w-[5px] h-[5px] rounded-full bg-blue-400' />
                                                Nro. mesa
                                            </span>
                                        )}
                                        {item.showDelaySubtraction && (
                                            <span className='inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-600 px-2 py-[2px] rounded-md font-medium'>
                                                <span className='w-[5px] h-[5px] rounded-full bg-orange-400' />
                                                Resta demora
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-md font-medium ${
                                            typeof item.nameDishe === 'string'
                                                ? 'bg-violet-50 text-violet-600'
                                                : 'bg-teal-50 text-teal-600'
                                        }`}>
                                            {typeof item.nameDishe === 'string' ? 'Genérico' : 'Detallado'}
                                        </span>
                                    </div>

                                    {/* Tiempos límite */}
                                    {item.timeLimit && (
                                        <div className='flex gap-2'>
                                            <div className='flex-1 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 text-center'>
                                                <p className='text-[9px] text-yellow-500 uppercase font-semibold tracking-wide'>Diurno</p>
                                                <p className='text-xs font-bold text-yellow-700 font-mono'>{item.timeLimit.day || '—'}</p>
                                            </div>
                                            <div className='flex-1 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-center'>
                                                <p className='text-[9px] text-indigo-500 uppercase font-semibold tracking-wide'>Nocturno</p>
                                                <p className='text-xs font-bold text-indigo-700 font-mono'>{item.timeLimit.night || '—'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Acciones */}
                                    <div className='flex gap-2 pt-1 border-t border-gray-100'>
                                        <button
                                            onClick={() => handdlerClickGetDish(item._id)}
                                            className='flex-1 flex items-center justify-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors'
                                        >
                                            <Image src='/ico/edit/edit.svg' alt='editar' width={14} height={14} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                dispatch(setConfigModal({
                                                    title: 'Aviso',
                                                    description: '¿Seguro de eliminar este plato?',
                                                    modalOpen: true,
                                                    type: 'warning',
                                                    isCallback: () => deleteDishItem(item._id),
                                                }));
                                            }}
                                            className='flex items-center justify-center gap-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg py-2 px-4 transition-colors'
                                        >
                                            <Image src='/ico/icons8-basura-26.png' alt='eliminar' width={14} height={14} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className='text-center text-gray-400 mt-10 text-sm'>
                        {filter
                            ? `No se encontraron platos para "${filter}".`
                            : 'No hay platos registrados en este establecimiento.'}
                    </p>
                )}
            </main>

            {/* ── Modal: Formulario crear/editar plato ──────────────────── */}
            {showFormBoolean && (
                <WindowFormLayaut close={closeForm}>
                    <FormDish establishment={state} pushData={pushData} close={closeForm} putData={refPutData.current} />
                </WindowFormLayaut>
            )}

            {/* ── Modal: Clonar platos de otro establecimiento ──────────── */}
            {openFormCloneConfigDishState && (
                <WindowFormLayaut close={closeOpenFormCloneConfigDish}>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden'>
                        <div className='bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4'>
                            <h2 className='text-white text-base font-bold'>Clonar platos</h2>
                            <p className='text-emerald-100 text-xs mt-1'>Selecciona un establecimiento para copiar sus platos</p>
                        </div>
                        <div className='p-6'>
                            <InputBorderBlue
                                textLabel='Establecimiento origen'
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
                        </div>
                    </div>
                </WindowFormLayaut>
            )}
        </>
    );
}


/* ── StatPill ─────────────────────────────────────────────────────────────────
 * Tarjeta de métrica compacta para el encabezado.
 * ────────────────────────────────────────────────────────────────────────── */
const PILL_COLORS = {
    emerald: { wrap: 'bg-emerald-50 border-emerald-200', val: 'text-emerald-700', lbl: 'text-emerald-600' },
    amber:   { wrap: 'bg-amber-50 border-amber-200',     val: 'text-amber-700',   lbl: 'text-amber-600'   },
    sky:     { wrap: 'bg-sky-50 border-sky-200',          val: 'text-sky-700',     lbl: 'text-sky-600'     },
    pink:    { wrap: 'bg-pink-50 border-pink-200',        val: 'text-pink-700',    lbl: 'text-pink-600'    },
    gray:    { wrap: 'bg-gray-50 border-gray-200',        val: 'text-gray-700',    lbl: 'text-gray-500'    },
};

function StatPill({ value, label, color = 'emerald' }) {
    const c = PILL_COLORS[color] ?? PILL_COLORS.emerald;
    return (
        <div className={`border rounded-lg px-4 py-3 text-center min-w-[100px] ${c.wrap}`}>
            <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
            <p className={`text-[10px] mt-1 ${c.lbl}`}>{label}</p>
        </div>
    );
}