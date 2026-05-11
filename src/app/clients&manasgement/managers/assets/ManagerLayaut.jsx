'use client';
/**
 * ManagerLayaut.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout principal de la página de Gestión de Gerentes.
 * Migra la vista Pug (crudManager) a React/Next.js siguiendo el mismo patrón
 * visual de las demás subrutas de /clients&manasgement (dishes, time_monitoring).
 *
 * Estructura:
 *   <AsideGreen>  → buscador por local + botones de acción
 *   <Section>     → tarjetas de resumen + tabla de gerentes
 *   <WindowFormLayaut> → modal de creación / edición (FormManager)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch }                              from 'react-redux';
import { setConfigModal }                           from '@/store/slices/globalModal.js';

import SharedAside, {
    AsideSection,
    AsideActionButton,
    AsideSearchInput,
}                       from '../../assets/SharedAside';
import Table            from '@/components/tablet_component/Table';
import WindowFormLayaut from '@/layaut/windowForForm';
import LoandingData     from '@/components/loandingComponent/loanding';
import Image            from 'next/image';

import useAuthOnServer from '@/hook/auth';
import useAxios        from '@/hook/useAxios';

import FormManager from './FormManager';


export default function ManagerLayaut() {

    /* ── Auth y helpers ────────────────────────────────────────────────────── */
    const { dataSessionState } = useAuthOnServer();
    const user                 = dataSessionState?.dataSession;
    const dispatch             = useDispatch();
    const { requestAction }    = useAxios();

    /* ── Estado local ──────────────────────────────────────────────────────── */
    const [managers, setManagers]           = useState(null);
    const [loading,  setLoading]            = useState(true);
    const [showForm, setShowForm]           = useState(false);
    const [editData, setEditData]           = useState(null);
    const [filterText, setFilterText]       = useState('');
    const [filterLocal, setFilterLocal]     = useState('');
    const [filterFranchise, setFilterFranchise] = useState('');

    const searchRef = useRef(null);


    /* ── Carga de gerentes al montar ───────────────────────────────────────── */
    useEffect(() => {
        fetchManagers();
    }, []);


    /**
     * fetchManagers
     * Llama a GET /managerlocal/alldata que devuelve los gerentes con
     * local, franchise y managerimg populados.
     */
    const fetchManagers = () => {
        setLoading(true);
        requestAction({ url: '/managerlocal/alldata', action: 'GET' })
            .then(res => {
                if (res.status === 200) setManagers(res.data);
            })
            .catch(err => console.error('Error al cargar gerentes:', err))
            .finally(() => setLoading(false));
    };


    /* ── Autorización: solo admins pueden crear / editar / eliminar ────────── */
    const validateAuthorization = useCallback(callback => {
        if (!user?.admin) {
            dispatch(setConfigModal({
                title:      'Sin autorización',
                description:'No tienes permisos para ejecutar esta acción',
                type:       'error',
                modalOpen:  true,
                isCallback: null,
            }));
        } else {
            callback();
        }
    }, [user]);


    /* ── Listas únicas de locales y franquicias (derivadas de los datos) ──── */
    const uniqueLocals = managers
        ? [...new Map(managers.filter(m => m.local?._id).map(m => [m.local._id, m.local.name])).entries()]
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const uniqueFranchises = managers
        ? [...new Map(managers.filter(m => m.franchise?._id).map(m => [m.franchise._id, m.franchise.name])).entries()]
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name))
        : [];

    /* ── Filtrado combinado ──────────────────────────────────────────────── */
    const handleSearch = e => setFilterText(e.target.value.toLowerCase());

    const filteredManagers = managers?.filter(m => {
        if (filterText) {
            const name      = (m.name || '').toLowerCase();
            const localName = (m.local?.name || m.localName || '').toLowerCase();
            if (!name.includes(filterText) && !localName.includes(filterText)) return false;
        }
        if (filterLocal && (m.local?._id !== filterLocal)) return false;
        if (filterFranchise && (m.franchise?._id !== filterFranchise)) return false;
        return true;
    });

    const hasActiveFilters = filterText || filterLocal || filterFranchise;

    const clearFilters = () => {
        setFilterText('');
        setFilterLocal('');
        setFilterFranchise('');
        if (searchRef.current) searchRef.current.value = '';
    };


    /* ── Abrir formulario de creación ──────────────────────────────────────── */
    const openCreateForm = () => {
        validateAuthorization(() => {
            setEditData(null);
            setShowForm(true);
        });
    };


    /**
     * openEditForm
     * Recibe el objeto completo del gerente y lo pasa al formulario
     * para pre-rellenar los campos.
     */
    const openEditForm = manager => {
        validateAuthorization(() => {
            setEditData(manager);
            setShowForm(true);
        });
    };


    /* ── Cerrar modal ──────────────────────────────────────────────────────── */
    const closeForm = () => {
        setEditData(null);
        setShowForm(false);
    };


    /* ── Confirmación y ejecución de eliminación ───────────────────────────── */
    const handleDelete = manager => {
        validateAuthorization(() => {
            dispatch(setConfigModal({
                modalOpen:   true,
                title:       'Confirmar eliminación',
                description: `¿Eliminar a ${manager.name || 'este gerente'} (${manager.burden})?`,
                type:        'warning',
                isCallback:  () => confirmDelete(manager._id),
            }));
        });
    };

    /**
     * confirmDelete
     * Llama a DELETE /managerlocal/:id y actualiza la lista local
     * sin necesidad de refrescar todos los datos del servidor.
     */
    const confirmDelete = id => {
        requestAction({ url: `/managerlocal/${id}`, action: 'DELETE' })
            .then(res => {
                if (res.status === 200) {
                    dispatch(setConfigModal({
                        title:      'Eliminado',
                        description:'Gerente eliminado correctamente',
                        modalOpen:  true,
                        type:       'successfull',
                        isCallback: null,
                    }));
                    // Actualización optimista: quita el registro de la lista local
                    setManagers(prev => prev.filter(m => m._id !== id));
                }
            })
            .catch(err => console.error('Error al eliminar gerente:', err));
    };


    /**
     * handleSave
     * Callback que recibe el formulario al guardar exitosamente.
     * - En edición: reemplaza el registro en la lista.
     * - En creación: recarga toda la lista para obtener datos populados.
     */
    const handleSave = (savedManager, isEdit) => {
        if (isEdit) {
            setManagers(prev =>
                prev.map(m => m._id === savedManager._id ? { ...m, ...savedManager } : m)
            );
        } else {
            fetchManagers(); // el nuevo registro necesita populate del server
        }
        closeForm();
    };


    /* ── Métricas resumen ──────────────────────────────────────────────────── */
    const totalManagers  = managers?.length          ?? 0;
    const totalActive    = managers?.filter(m => m.status === 'activo').length  ?? 0;
    const totalInactive  = managers?.filter(m => m.status !== 'activo').length  ?? 0;


    /* ── Render ────────────────────────────────────────────────────────────── */
    if (loading && !managers) return <LoandingData title='Cargando gerentes...' />;

    return (
        <>
            {/* ── ASIDE LATERAL (SharedAside unificado) ────────────────────── */}
            <SharedAside
                title='Gerentes'
                subtitle='Administrar gerentes por local'
                icon='/ico/userList/patient_list.svg'
                footerText={`${totalManagers} gerentes registrados`}
            >
                <AsideSection label='Buscar'>
                    <AsideSearchInput
                        placeholder='Nombre o local...'
                        onChange={handleSearch}
                        inputRef={searchRef}
                    />
                </AsideSection>

                <AsideSection label='Filtros'>
                    <AsideSelect
                        label='Establecimiento'
                        value={filterLocal}
                        onChange={e => setFilterLocal(e.target.value)}
                        options={uniqueLocals}
                    />
                    <AsideSelect
                        label='Franquicia'
                        value={filterFranchise}
                        onChange={e => setFilterFranchise(e.target.value)}
                        options={uniqueFranchises}
                    />
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className='w-full text-[11px] text-emerald-300/80 hover:text-white mt-1 transition-colors text-left px-1'
                        >
                            Limpiar filtros
                        </button>
                    )}
                </AsideSection>

                <AsideSection label='Acciones'>
                    <AsideActionButton
                        icon='/ico/añadir-50.png'
                        label='Agregar gerente'
                        onClick={openCreateForm}
                    />
                    <AsideActionButton
                        icon='/ico/icons8-repetir-50.png'
                        label='Actualizar lista'
                        onClick={fetchManagers}
                    />
                </AsideSection>
            </SharedAside>


            {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
            <main className='flex-1 h-full overflow-y-auto p-4 sm:p-6'>

                {/* Tarjetas de resumen */}
                <div className='flex flex-wrap gap-3 mb-5'>
                    <SummaryCard value={totalManagers} label='Total gerentes' color='emerald' />
                    <SummaryCard value={totalActive}   label='Activos'        color='blue'    />
                    <SummaryCard value={totalInactive} label='Inactivos'      color='red'     />
                    {hasActiveFilters && (
                        <SummaryCard
                            value={filteredManagers?.length ?? 0}
                            label='Resultados filtrados'
                            color='yellow'
                        />
                    )}
                </div>

                {/* Tabla de gerentes */}
                <Table dataHead={[
                    '#', 'Nombre', 'Cargo', 'Local asignado',
                    'Franquicia', 'Estado', 'Nro.', 'Característica', 'Acciones'
                ]}>
                    {filteredManagers?.map((manager, idx) => (
                        <tr key={manager._id}>

                            {/* # */}
                            <td className='text-gray-400 text-xs'>{idx + 1}</td>

                            {/* Nombre */}
                            <td className='font-semibold text-gray-800'>
                                {manager.name || <span className='text-gray-400 italic'>Sin nombre</span>}
                            </td>

                            {/* Cargo */}
                            <td>{manager.burden}</td>

                            {/* Local */}
                            <td>{manager.local?.name || manager.localName || '—'}</td>

                            {/* Franquicia */}
                            <td>{manager.franchise?.name || '—'}</td>

                            {/* Estado — badge de color */}
                            <td>
                                <span className={`
                                    inline-block px-2 py-[2px] rounded-full text-[11px] font-semibold
                                    ${manager.status === 'activo'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-600'}
                                `}>
                                    {manager.status}
                                </span>
                            </td>

                            {/* Número */}
                            <td>{manager.numberManager}</td>

                            {/* Característica (truncada con tooltip) */}
                            <td
                                className='max-w-[160px] truncate text-sm text-gray-600'
                                title={manager.characteristic}
                            >
                                {manager.characteristic}
                            </td>

                            {/* Acciones */}
                            <td>
                                <div className='flex gap-2 justify-center'>
                                    {/* Editar */}
                                    <button
                                        onClick={() => openEditForm(manager)}
                                        className='p-1 rounded hover:bg-blue-50 transition'
                                        title='Editar gerente'
                                    >
                                        <Image
                                            src='/ico/edit/edit.svg'
                                            alt='editar'
                                            width={18}
                                            height={18}
                                        />
                                    </button>

                                    {/* Eliminar */}
                                    <button
                                        onClick={() => handleDelete(manager)}
                                        className='p-1 rounded hover:bg-red-50 transition'
                                        title='Eliminar gerente'
                                    >
                                        <Image
                                            src='/ico/icons8-basura-26.png'
                                            alt='eliminar'
                                            width={18}
                                            height={18}
                                        />
                                    </button>
                                </div>
                            </td>

                        </tr>
                    ))}
                </Table>

                {/* Mensaje cuando el filtro no da resultados */}
                {filteredManagers?.length === 0 && (
                    <p className='text-center text-gray-400 mt-10 text-sm'>
                        {hasActiveFilters
                            ? 'No se encontraron gerentes con los filtros seleccionados.'
                            : 'No hay gerentes registrados.'}
                    </p>
                )}

            </main>


            {/* ── MODAL: FORMULARIO CREAR / EDITAR ─────────────────────────── */}
            {showForm && (
                <WindowFormLayaut close={closeForm}>
                    <FormManager
                        editData={editData}
                        onSave={handleSave}
                        close={closeForm}
                    />
                </WindowFormLayaut>
            )}
        </>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * SummaryCard
 * Tarjeta de métrica reutilizable para el encabezado del contenido principal.
 * Props:
 *   value  – número a mostrar en grande
 *   label  – texto descriptivo
 *   color  – 'emerald' | 'blue' | 'red' | 'yellow'
 * ─────────────────────────────────────────────────────────────────────────────
 */
const colorMap = {
    emerald: { wrap: 'bg-emerald-50 border-emerald-200', val: 'text-emerald-700', lbl: 'text-emerald-600' },
    blue:    { wrap: 'bg-blue-50 border-blue-200',       val: 'text-blue-700',    lbl: 'text-blue-600'    },
    red:     { wrap: 'bg-red-50 border-red-200',         val: 'text-red-700',     lbl: 'text-red-600'     },
    yellow:  { wrap: 'bg-yellow-50 border-yellow-200',   val: 'text-yellow-700',  lbl: 'text-yellow-600'  },
};

function SummaryCard({ value, label, color = 'emerald' }) {
    const c = colorMap[color] ?? colorMap.emerald;
    return (
        <div className={`border rounded-lg px-4 py-3 text-center min-w-[110px] ${c.wrap}`}>
            <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
            <p className={`text-xs mt-1 ${c.lbl}`}>{label}</p>
        </div>
    );
}


function AsideSelect({ label, value, onChange, options }) {
    return (
        <div className='mb-2'>
            <p className='text-[10px] text-emerald-300/60 mb-1 font-medium'>{label}</p>
            <select
                value={value}
                onChange={onChange}
                className='w-full bg-white/10 border border-white/10 rounded-lg px-3 py-[6px] text-xs text-white outline-none focus:border-emerald-400/50 transition-colors appearance-none cursor-pointer'
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
                <option value='' className='bg-[#1a3c2a] text-white'>Todos</option>
                {options.map(opt => (
                    <option key={opt.id} value={opt.id} className='bg-[#1a3c2a] text-white'>
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
