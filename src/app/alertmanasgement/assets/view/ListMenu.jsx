'use client';
import { useState, useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { FaBell, FaPlus, FaTags } from 'react-icons/fa';

import { getMenuAll, deleteMenu, lockMenu } from '../model/menu.model.js';
import { myUserContext } from '@/contexts/userContext';
import { setConfigModal } from '@/store/slices/globalModal.js';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { listaDeCategorias } from '../lib/categoryMeta.js';
import { iconOf } from '../lib/categoryIcons.js';
import { norm } from '../lib/format.js';

import SearchBar from './list/SearchBar.jsx';
import CategoryPills from './list/CategoryPills.jsx';
import CategoryGroup from './list/CategoryGroup.jsx';
import AlertCard from './list/AlertCard.jsx';
import ListSkeleton from './list/ListSkeleton.jsx';
import EmptyState from './list/EmptyState.jsx';
import CategoryManager from './categories/CategoryManager.jsx';

/**
 * Agrupa las alertas por categoría respetando el filtro activo.
 *
 * - Con 'all' se devuelven todas las categorías con contenido, más un grupo
 *   "Otras" para las categorías que no están en el catálogo.
 * - Con una categoría concreta, solo esa.
 *
 * El grupo "Otras" no sobra: `Menu.category` es texto libre, así que puede
 * haber alertas con una categoría que nunca se declaró. Sin ese grupo,
 * desaparecerían de la pantalla sin que nada lo indicara.
 */
function buildGroups(alerts, activeCategory, categorias) {
    const knownValues = new Set(categorias.map(c => c.value));

    const groups = categorias
        .map(c => ({ value: c.value, text: c.es, items: alerts.filter(a => a.category === c.value) }))
        .filter(g => g.items.length > 0)
        .filter(g => activeCategory === 'all' || g.value === activeCategory);

    if (activeCategory === 'all') {
        const others = alerts.filter(a => !knownValues.has(a.category));
        if (others.length > 0) groups.push({ value: '__otras', text: 'Otras', items: others });
    }

    return groups;
}

/**
 * Panel de gestión de alertas: cabecera (título, crear, buscador y filtros) y
 * lista agrupada por categoría.
 *
 * @param setMenu            - abre una alerta en el formulario (recibe su _id)
 * @param resetNoveltie      - limpia la alerta seleccionada en el contenedor
 * @param newMENU            - alerta recién creada (inserción optimista)
 * @param resetAddManuState  - limpia `newMENU` tras insertarla
 * @param onCreateNew        - abre el formulario en modo creación
 * @param expanded           - true → el panel ocupa todo el ancho
 * @param refreshKey         - cambia tras guardar para forzar el refetch
 * @param selectedId         - _id de la alerta abierta (se resalta en la lista)
 * @param locals             - establecimientos, para nombrar las excepciones
 * @param franchises         - franquicias, para lo mismo
 */
function ListMenu({
    setMenu,
    resetNoveltie,
    newMENU,
    resetAddManuState,
    onCreateNew = () => {},
    expanded = false,
    refreshKey = 0,
    selectedId = null,
    locals = [],
    franchises = [],
}) {

    const [arrayMenuAll, setArrayMenuAll] = useState([]);
    const [category, setCategory]         = useState('all');
    const [bonusCategory, setBonusCategory] = useState('all');
    const [searchTerm, setSearchTerm]     = useState('');
    const [loading, setLoading]           = useState(true);
    const [gestionAbierta, setGestionAbierta] = useState(false);
    const dispatch                        = useDispatch();

    // La lista se agrupa y se filtra por la categoría OPERATIVA, que es fija y
    // vive en el código (libs/alerts/categories.js). No se pide al servidor.
    const categorias = listaDeCategorias();

    // Lo que sí es administrable es el catálogo de BONIFICACIÓN, y es lo que
    // gestiona el botón "Cat. bonificación". Se piden TODAS, incluidas las
    // desactivadas: la pantalla de gestión necesita verlas para reactivarlas.
    const {
        categorias: categoriasDeBono,
        cargando: cargandoCategorias,
        sinCatalogo,
        catalogoVacio,
        recargar: recargarCategorias,
    } = useBonusCategories(true);

    // Solo los administradores (admin === true) ven el botón de bloqueo
    const { dataSessionState } = useContext(myUserContext);
    const isAdmin = dataSessionState?.dataSession?.admin === true;

    // Recarga la lista al cambiar de categoría, al crear una alerta o al guardar
    useEffect(() => {
        setLoading(true);
        getMenuAll(category, (err, { menuList }) => {
            setArrayMenuAll([...menuList]);
            setLoading(false);
        });
    }, [category, newMENU, refreshKey]);

    // Inserta la alerta recién creada en el estado local sin esperar al refetch
    useEffect(() => {
        if (Boolean(newMENU)) {
            setArrayMenuAll(prev => [...prev, newMENU]);
            resetAddManuState();
        }
    }, [newMENU]);

    // Quita el ítem del estado local una vez confirmada la eliminación
    const deleteMenuAllArray = id => {
        setArrayMenuAll(prev => prev.filter(menu => id !== menu._id));
        resetNoveltie();
    };

    // Bloquea o desbloquea la alerta (solo admins): con el bloqueo activo el
    // backend rechaza editarla y borrarla (423). El cambio se refleja al
    // instante en el estado local; en error se muestra el mensaje de la API.
    const toggleLock = (id, nextLocked) => {
        lockMenu(id, nextLocked, (err) => {
            if (err) {
                const text = err.response?.data?.message
                    || (err.response?.status === 403 ? 'Solo un administrador puede bloquear alertas.' : 'Ha ocurrido un error.');
                dispatch(setConfigModal({ modalOpen: true, title: 'Error', description: text, isCallback: null, type: 'error' }));
                return;
            }
            setArrayMenuAll(prev => prev.map(menu => (menu._id === id ? { ...menu, isLocked: nextLocked } : menu)));
        });
    };

    // Pide confirmación y elimina la alerta en el servidor
    const askDelete = id => {
        dispatch(setConfigModal({
            modalOpen:   true,
            title:       '¿Seguro que quieres eliminar este elemento?',
            description: '',
            isCallback:  () => {
                deleteMenu(id, (err) => {
                    if (err) {
                        const text =
                            err.response?.status === 401 ? 'Usuario no autenticado.'  :
                            err.response?.status === 403 ? 'Usuario no autorizado.'   :
                            'Ha ocurrido un error.';
                        dispatch(setConfigModal({ modalOpen: true, title: 'Error', description: text, isCallback: null, type: 'error' }));
                    } else {
                        dispatch(setConfigModal({ modalOpen: true, title: 'Eliminado', description: 'Alerta eliminada de la lista.', isCallback: null, type: 'successfull' }));
                        deleteMenuAllArray(id);
                    }
                });
            },
            type: 'warning'
        }));
    };

    // Filtro por título (es / en), sin distinguir mayúsculas ni acentos, y por
    // categoría de BONIFICACIÓN. Esta última se resuelve acá y no en el
    // servidor: `getMenuAll` filtra por la operativa, y la lista de alertas es
    // corta, así que no vale un viaje más.
    const query    = norm(searchTerm);
    const filtered = arrayMenuAll
        .filter(a => !query || norm(a.es).includes(query) || norm(a.en).includes(query))
        .filter(a => bonusCategory === 'all'
            || (bonusCategory === '__sin' ? !a.bonusCategory : a.bonusCategory === bonusCategory));

    const groups   = buildGroups(filtered, category, categorias);

    // Las pills ofrecen las categorías activas y, además, las desactivadas que
    // todavía tengan alertas: si no, esas alertas serían visibles en la lista
    // pero imposibles de filtrar.
    const pills = categorias.filter(c => c.active !== false || arrayMenuAll.some(a => a.category === c.value));

    // Mismo criterio para las de bonificación, más una pill "Sin bonificación":
    // saber qué alertas todavía no tienen uno asignado es justo lo que se
    // necesita mientras se está terminando de configurarlas.
    const pillsDeBono = categoriasDeBono.filter(c => c.active !== false || arrayMenuAll.some(a => a.bonusCategory === c.value));
    const hayAlertasSinBono = arrayMenuAll.some(a => !a.bonusCategory);

    // La apariencia de una categoría de bonificación viaja en su documento: se
    // crea desde la pantalla, así que no puede salir de un mapa fijo.
    const metaDeBono = item => ({
        Icon:  iconOf(item.icon),
        bg:    item.bg || '#fdf6e7',
        color: item.color || '#8a5a2b',
    });

    const showSkeleton = loading && arrayMenuAll.length === 0;

    return (
        <div
            className='contentStatic scrollthemeY'
            style={{
                width:         expanded ? '100%' : '50%',
                maxHeight:     'calc(100vh - 80px)',
                display:       'flex',
                flexDirection: 'column',
                overflow:      'hidden',
                borderRadius:  '18px',
                border:        '1px solid #e6dcc6',
                background:    'linear-gradient(180deg, #fdfbf5 0%, #f8f3e8 100%)',
                boxShadow:     '0 10px 30px rgba(31,154,8,0.07), 0 2px 8px rgba(0,0,0,0.05)',
                boxSizing:     'border-box',
            }}
        >
            {/* Franja superior de marca */}
            <div style={{ height: '4px', flexShrink: 0, background: 'linear-gradient(90deg, #29c50c, #6ba823)' }} />

            {/* ── Cabecera: título, crear, buscador y filtros ─────────────────── */}
            <div style={{
                flexShrink:    0,
                display:       'flex',
                flexDirection: 'column',
                gap:           '16px',
                padding:       '18px 16px 16px',
                background:    'rgba(255,255,255,0.55)',
                borderBottom:  '1px solid #e6dcc6',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                        <span style={{
                            width:          '34px',
                            height:         '34px',
                            borderRadius:   '10px',
                            flexShrink:     0,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            background:     'linear-gradient(135deg, #29c50c, #5cc41f)',
                            boxShadow:      '0 3px 10px rgba(41,197,12,0.28)',
                        }}>
                            <FaBell size={16} color='#fff' />
                        </span>

                        <span style={{ fontWeight: 800, fontSize: '16px', color: '#1f2937', whiteSpace: 'nowrap' }}>
                            Gestión de Alertas
                        </span>

                        <span style={{
                            background:   '#eef2e6',
                            color:        '#4d7c0f',
                            borderRadius: '999px',
                            fontSize:     '11px',
                            fontWeight:   700,
                            padding:      '2px 9px',
                            flexShrink:   0,
                        }}>
                            {arrayMenuAll.length}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                            type='button'
                            onClick={() => setGestionAbierta(true)}
                            title='Crear, editar o desactivar categorías'
                            style={{
                                display:      'inline-flex',
                                alignItems:   'center',
                                gap:          '6px',
                                padding:      '8px 13px',
                                borderRadius: '10px',
                                cursor:       'pointer',
                                fontWeight:   700,
                                fontSize:     '13px',
                                whiteSpace:   'nowrap',
                                color:        '#4b5563',
                                background:   '#fff',
                                border:       '1px solid #e6dcc6',
                            }}
                        >
                            <FaTags size={12} /> Cat. bonificación
                        </button>

                        <button
                            type='button'
                            onClick={() => onCreateNew()}
                            style={{
                                display:      'inline-flex',
                                alignItems:   'center',
                                gap:          '6px',
                                padding:      '8px 14px',
                                borderRadius: '10px',
                                border:       'none',
                                cursor:       'pointer',
                                fontWeight:   700,
                                fontSize:     '13px',
                                color:        '#fff',
                                whiteSpace:   'nowrap',
                                background:   'linear-gradient(135deg, #29c50c 0%, #1f9a08 100%)',
                                boxShadow:    '0 3px 10px rgba(41,197,12,0.30)',
                            }}
                        >
                            <FaPlus size={12} /> Nueva alerta
                        </button>
                    </div>
                </div>

                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onClear={() => setSearchTerm('')}
                />

                {/* Filtro por la categoría OPERATIVA: de qué se trata la alerta */}
                <CategoryPills
                    categories={pills}
                    active={category}
                    onSelect={setCategory}
                />

                {/* Filtro por la categoría de BONIFICACIÓN: con qué criterio
                    cuenta para el bono. Va en su propia fila porque es otra
                    dimensión, no más opciones de la misma: se combinan, y
                    mezclarlas haría creer que son excluyentes.

                    Solo aparece cuando hay catálogo; sin categorías creadas no
                    hay nada por lo que filtrar. */}
                {(pillsDeBono.length > 0 || (hayAlertasSinBono && categoriasDeBono.length > 0)) && (
                    <CategoryPills
                        categories={[
                            ...pillsDeBono,
                            ...(hayAlertasSinBono ? [{ value: '__sin', es: 'Sin bonificación', icon: 'bell', bg: '#f3f4f6', color: '#6b7280' }] : []),
                        ]}
                        active={bonusCategory}
                        onSelect={setBonusCategory}
                        resolveMeta={metaDeBono}
                        allLabel='Toda bonificación'
                    />
                )}
            </div>

            {/* ── Lista agrupada por categoría ────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '22px 16px 22px' }}>
                {showSkeleton && <ListSkeleton />}

                {!showSkeleton && groups.length === 0 && <EmptyState searchTerm={searchTerm} />}

                {!showSkeleton && groups.map(group => (
                    <CategoryGroup
                        key={group.value}
                        value={group.value}
                        text={group.text}
                        count={group.items.length}
                    >
                        {group.items.map((item, index) => (
                            <AlertCard
                                key={`${index}_${item._id}`}
                                item={item}
                                isSelected={Boolean(item._id) && item._id === selectedId}
                                onSelect={setMenu}
                                onDelete={askDelete}
                                isAdmin={isAdmin}
                                onToggleLock={toggleLock}
                            />
                        ))}
                    </CategoryGroup>
                ))}
            </div>

            {gestionAbierta && (
                <CategoryManager
                    categorias={categoriasDeBono}
                    cargando={cargandoCategorias}
                    sinCatalogo={sinCatalogo}
                    catalogoVacio={catalogoVacio}
                    onRecargar={recargarCategorias}
                    onCerrar={() => setGestionAbierta(false)}
                />
            )}
        </div>
    );
}

export { ListMenu };
