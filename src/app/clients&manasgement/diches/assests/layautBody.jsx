'use client';
/**
 * layautBody.jsx — /clients&manasgement/diches
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestión del menú de platos de un establecimiento.
 *
 *   <SharedAside>  → buscador + acciones (agregar / clonar / resetear)
 *   <main>         → tarjetas de resumen + grid de platos (DishCard)
 *   <WindowFormLayaut> → modal de creación/edición (FormDish) y de clonado
 *
 * El establecimiento (`state`) se carga con sus platos populados al montar.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector }                 from 'react-redux';
import { useSearchParams }                          from 'next/navigation';
import Image                                         from 'next/image';

import { setConfigModal }  from '@/store/slices/globalModal.js';
import InputBorderBlue     from '@/components/inpust/InputBorderBlue.jsx';
import LoandingData        from '@/components/loandingComponent/loanding';
import WindowFormLayaut    from '@/layaut/windowForForm';
import useAuthOnServer     from '@/hook/auth';
import useAxios            from '@/hook/useAxios';
import { useSingleFetch }  from '@/hook/ajax_hook/useFetch';
import FormDish            from './FormDish.tsx';
import SharedAside, {
    AsideSection,
    AsideActionButton,
    AsideSearchInput,
} from '../../assets/SharedAside';


/* ── Categorías de plato: etiqueta + color del badge ───────────────────────── */
const CATEGORY_MAP = {
    desserts_and_sweets: { label: 'Postres y dulces', color: 'bg-pink-100 text-pink-700' },
    drinks:              { label: 'Bebidas',          color: 'bg-sky-100 text-sky-700' },
    food:                { label: 'Aperitivos',       color: 'bg-amber-100 text-amber-700' },
};


export default function Layautbody() {

    /* ── Auth y helpers ────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user                 = dataSessionState?.dataSession;

    const dispatch          = useDispatch();
    const searchParams      = useSearchParams();
    const id                = searchParams.get('id');
    const { requestAction } = useAxios();
    const { fetchData }     = useSingleFetch(null, false);
    const selectEstablishment = useSelector(state => state.clients);

    /* ── Estado ────────────────────────────────────────────────────────────── */
    const [state,    setState]    = useState(null);   // establecimiento + platos
    const [filter,   setFilter]   = useState('');     // texto del buscador
    const [showForm, setShowForm] = useState(false);  // modal crear/editar plato
    const [showClone, setShowClone] = useState(false); // modal clonar platos

    const refPutData = useRef(null);   // plato a editar (null = creación)
    const searchRef  = useRef(null);


    /* ── Carga del establecimiento al montar ───────────────────────────────── */
    useEffect(() => { getStablishment(); }, []);

    const getStablishment = () => {
        requestAction({ url: `/local/id=${id}?populate=dishes`, action: 'GET' })
            .then(res => { if (res.status === 200) setState(res.data); })
            .catch(err => console.error(err));
    };


    /* ── Autorización: solo admins ejecutan acciones de escritura ──────────── */
    const validateAuthorization = useCallback(callback => {
        if (!user.admin) {
            dispatch(setConfigModal({
                title:      'Error',
                description:'No tienes autorización para ejecutar esta función',
                type:       'error',
                modalOpen:  true,
                isCallback: null,
            }));
        } else {
            callback();
        }
    }, [user]);


    /* ── Modal de plato (crear / editar) ───────────────────────────────────── */
    const openCreateForm = () => validateAuthorization(() => setShowForm(true));

    const closeForm = () => {
        refPutData.current = null;
        setShowForm(false);
    };

    const openEditForm = dishId => {
        fetchData({
            url: `/dishes/id=${dishId}`, method: 'get', autoGetDat: false,
            callback: response => {
                if (response?.data) {
                    refPutData.current = { ...response.data?.data, isPut: true, idLocalRef: state._id };
                }
                setShowForm(true);
            },
        });
    };


    /* ── Modal de clonado de platos ────────────────────────────────────────── */
    const closeClone = () => setShowClone(false);

    const askCloneDishConfiguration = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                modalOpen:   true,
                title:       'Aviso',
                description: '¿Seguro de clonar configuración de otro local o establecimiento?',
                type:        'warning',
                isCallback:  () => setShowClone(true),
            }));
        });
    };

    /** Clona los platos del establecimiento `originId` en el actual */
    const cloneDishConfiguration = originId => {
        requestAction({ url: `/local/id=${originId}`, action: 'GET' })
            .then(response => {
                if (response.status === 200 && response.data.dishes.length > 0) {
                    const bodyForRequest = state;
                    delete bodyForRequest.img;

                    requestAction({
                        url:    `/local/${state._id}?populate=dishes`,
                        action: 'PUT',
                        body:   { ...bodyForRequest, dishes: response.data.dishes },
                    })
                        .then(() => {
                            if (response.status === 200) {
                                dispatch(setConfigModal({
                                    title:      'Succesful',
                                    description:'El recurso fue clonado con exito',
                                    modalOpen:  true,
                                    callback:   null,
                                    type:       'successfull',
                                }));
                                getStablishment();
                            }
                        })
                        .catch(err => console.error(err))
                        .finally(() => closeClone());
                } else {
                    dispatch(setConfigModal({
                        title:      'Error',
                        description:'No existe recursos asociados al establecimineto selecionado',
                        modalOpen:  true,
                        callback:   null,
                        type:       'successfull',
                    }));
                }
            });
    };


    /* ── Eliminar un plato ─────────────────────────────────────────────────── */
    const askDeleteDish = dishId => {
        dispatch(setConfigModal({
            title:      'Aviso',
            description:'¿Seguro de eliminar este plato?',
            modalOpen:  true,
            type:       'warning',
            isCallback: () => deleteDish(dishId),
        }));
    };

    const deleteDish = dishId => {
        validateAuthorization(() => {
            requestAction({ url: `/dishes?id=${id}&dish=${dishId}`, action: 'DELETE' })
                .then(response => {
                    if (response.status === 200) {
                        dispatch(setConfigModal({
                            title:      'Succesful',
                            description:'El recurso fue eliminado con exito',
                            modalOpen:  true,
                            callback:   null,
                            type:       'successfull',
                        }));
                        setState({ ...state, dishes: state.dishes.filter(d => d._id !== dishId) });
                    }
                })
                .catch(err => console.error(err));
        });
    };


    /* ── Resetear el menú completo ─────────────────────────────────────────── */
    const askResetConfig = () => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                modalOpen:   true,
                title:       'Aviso',
                description: '¿Seguro de resetear configuración del establecimiento?',
                type:        'warning',
                isCallback:  () => resetConfig(),
            }));
        });
    };

    const resetConfig = () => {
        const bodyForRequest = { ...state };
        delete bodyForRequest.img;
        requestAction({ url: `/local/${state._id}?populate`, action: 'PUT', body: { ...bodyForRequest, dishes: [] } })
            .then(response => { if (response.status === 200) setState({ ...state, dishes: [] }); })
            .catch(err => console.error(err));
    };


    /** Añade un plato recién creado al estado local */
    const pushData = data => setState({ ...state, dishes: [...state.dishes, data.newDish] });


    /* ── Loading ───────────────────────────────────────────────────────────── */
    if (!state) return <LoandingData title='Cargando datos' />;


    /* ── Búsqueda y métricas ───────────────────────────────────────────────── */
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


    /* ── Render ────────────────────────────────────────────────────────────── */
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
                    <AsideActionButton icon='/ico/icons8-agregar-base-de-datos-50.png' label='Agregar plato' onClick={openCreateForm} />
                    <AsideActionButton icon='/ico/icons8-duplicación-50.png'            label='Clonar platos' onClick={askCloneDishConfiguration} />
                    <AsideActionButton icon='/ico/icons8-repetir-50.png'                label='Resetear menú' onClick={askResetConfig} />
                </AsideSection>
            </SharedAside>

            <main className='flex-1 h-full overflow-y-auto p-4 sm:p-6'>

                {/* Tarjetas de resumen */}
                <div className='flex flex-wrap gap-3 mb-5'>
                    <StatPill value={totalDishes}   label='Total platos' color='emerald' />
                    <StatPill value={totalFood}     label='Aperitivos'   color='amber'   />
                    <StatPill value={totalDrinks}   label='Bebidas'      color='sky'     />
                    <StatPill value={totalDesserts} label='Postres'      color='pink'    />
                    {filter && (
                        <StatPill value={filteredDishes?.length ?? 0} label={`"${filter}"`} color='gray' />
                    )}
                </div>

                {/* Grid de platos */}
                {filteredDishes?.length > 0 ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
                        {filteredDishes.map((item, index) => (
                            <DishCard
                                key={item._id || index}
                                item={item}
                                index={index}
                                onEdit={() => openEditForm(item._id)}
                                onDelete={() => askDeleteDish(item._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className='text-center text-slate-400 mt-10 text-sm'>
                        {filter
                            ? `No se encontraron platos para "${filter}".`
                            : 'No hay platos registrados en este establecimiento.'}
                    </p>
                )}
            </main>

            {/* Modal: crear / editar plato */}
            {showForm && (
                <WindowFormLayaut close={closeForm}>
                    <FormDish establishment={state} pushData={pushData} close={closeForm} putData={refPutData.current} />
                </WindowFormLayaut>
            )}

            {/* Modal: clonar platos de otro establecimiento */}
            {showClone && (
                <WindowFormLayaut close={closeClone}>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden'>
                        <div className='bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4'>
                            <h2 className='text-white text-base font-bold'>Clonar platos</h2>
                            <p className='text-emerald-100 text-xs mt-1'>Selecciona un establecimiento para copiar sus platos</p>
                        </div>
                        <div className='p-6'>
                            <InputBorderBlue
                                textLabel='Establecimiento origen'
                                type='select'
                                childSelect={selectEstablishment.map(item => ({ value: item._id, text: item.name }))}
                                eventChengue={value => cloneDishConfiguration(value)}
                            />
                        </div>
                    </div>
                </WindowFormLayaut>
            )}
        </>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * DishCard — Tarjeta de un plato: nombre, categoría, propiedades, tiempos y
 * acciones (editar / eliminar).
 * ─────────────────────────────────────────────────────────────────────────────
 */
function DishCard({ item, index, onEdit, onDelete }) {
    const cat = CATEGORY_MAP[item.category]
             ?? { label: item.category || 'Sin categoría', color: 'bg-slate-100 text-slate-600' };
    const isGeneric = typeof item.nameDishe === 'string';

    return (
        <div className='bg-white border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-slate-300/70 transition-all'>

            {/* Header: nombre + categoría */}
            <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                    <h3 className='text-[15px] font-semibold text-slate-800 truncate tracking-tight'>
                        {item.nameDishe || 'Sin nombre'}
                    </h3>
                    <span className={`inline-block mt-1 px-2 py-[2px] rounded-full text-[10px] font-semibold ${cat.color}`}>
                        {cat.label}
                    </span>
                </div>
                <span className='text-[10px] text-slate-400 font-mono shrink-0'>#{index + 1}</span>
            </div>

            {/* Propiedades */}
            <div className='flex flex-wrap gap-[6px]'>
                {item.allDay && <DishTag color='emerald' label='Todo el día' />}
                {item.requiresTableNumber && <DishTag color='blue' label='Nro. mesa' />}
                {item.showDelaySubtraction && <DishTag color='orange' label='Resta demora' />}
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-md font-medium ${
                    isGeneric ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-600'
                }`}>
                    {isGeneric ? 'Genérico' : 'Detallado'}
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
                    onClick={onEdit}
                    className='flex-1 flex items-center justify-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors'
                >
                    <Image src='/ico/edit/edit.svg' alt='editar' width={14} height={14} />
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className='flex items-center justify-center gap-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg py-2 px-4 transition-colors'
                >
                    <Image src='/ico/icons8-basura-26.png' alt='eliminar' width={14} height={14} />
                    Eliminar
                </button>
            </div>
        </div>
    );
}


/* ── DishTag — Etiqueta de propiedad con punto de color ─────────────────────── */
const TAG_COLORS = {
    emerald: { wrap: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
    blue:    { wrap: 'bg-blue-50 text-blue-600',       dot: 'bg-blue-400'    },
    orange:  { wrap: 'bg-orange-50 text-orange-600',   dot: 'bg-orange-400'  },
};

function DishTag({ color, label }) {
    const c = TAG_COLORS[color];
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-md font-medium ${c.wrap}`}>
            <span className={`w-[5px] h-[5px] rounded-full ${c.dot}`} />
            {label}
        </span>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * StatPill — Tarjeta de métrica compacta para el encabezado.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const PILL_COLORS = {
    emerald: { wrap: 'bg-emerald-50 ring-emerald-200', val: 'text-emerald-700', lbl: 'text-emerald-600' },
    amber:   { wrap: 'bg-amber-50 ring-amber-200',     val: 'text-amber-700',   lbl: 'text-amber-600'   },
    sky:     { wrap: 'bg-sky-50 ring-sky-200',          val: 'text-sky-700',     lbl: 'text-sky-600'     },
    pink:    { wrap: 'bg-pink-50 ring-pink-200',        val: 'text-pink-700',    lbl: 'text-pink-600'    },
    gray:    { wrap: 'bg-slate-50 ring-slate-200',      val: 'text-slate-700',   lbl: 'text-slate-500'   },
};

function StatPill({ value, label, color = 'emerald' }) {
    const c = PILL_COLORS[color] ?? PILL_COLORS.emerald;
    return (
        <div className={`ring-1 rounded-xl px-4 py-3 text-center min-w-[100px] ${c.wrap}`}>
            <p className={`text-2xl font-bold tabular-nums ${c.val}`}>{value}</p>
            <p className={`text-[11px] mt-1 font-medium ${c.lbl}`}>{label}</p>
        </div>
    );
}
