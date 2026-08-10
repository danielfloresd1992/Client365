'use client';

import { useState, useMemo, useEffect, useRef, useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { addMonths, subMonths, eachDayOfInterval, format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Assets & Components
import UserEditForm from './assets/user.update.form';
import UserList, { AttendanceSummaryRow } from './assets/user.list';
import UserDynamicScheduleForm from './assets/user.dynamic.schedule.form';
import UserGroupDynamicScheduleForm from './assets/user.group.dynamic.schedule.form';



// Contexto de sesión (admin logueado)
import { myUserContext } from '@/contexts/userContext';

// network
import { fetchUserData, userById, updateUserByRrhh, saveGroupDynamicSchedule } from '@/libs/ajaxClient/user.fecth';
import useSubmitLock from '@/hook/useSubmitLock';



const DEPARTMENTS = ['Operaciones', 'Recursos Humanos', 'Reportes', 'Sistemas y desarrollo', 'Sin definir'];
const COLORS_DEPARTMENTS = [
    { name: 'Operaciones', diurno: '#abf8fd', nocturno: "#c1c2fd" },
    { name: 'Recursos Humanos', diurno: '#b0facc', nocturno: "#fffab8" },
    { name: 'Sistemas y desarrollo', diurno: '#ffbfe2', nocturno: "#c2d5ff" },
    { name: 'Reportes', diurno: '#fdaeae', nocturno: "#fdc5ff" },
    { name: 'Sin definir', diurno: '#bbbbbb', nocturno: "#bbb" },
];
// Mantener sincronizado con POSITION_ENUM del backend (user.schema.js/user.model.js).
// El orden define la prioridad de ordenamiento en la grilla.
const POSITIONS = ['Gerente', 'Subgerente', 'Coordinador', 'Supervisor', 'Operador senior', 'Operador experto', 'Operador', 'Verificador', 'Auditor de datos', 'Analista de sistemas', 'Analista de reportes', 'Analista de auditoria', 'Analista de RRHH'];
const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';

// Usuarios visibles en la grilla (los outForkSchedule no se renderizan)
const visibleUsers = (list) => (Array.isArray(list) ? list.filter(u => !u?.workSchedule?.outForkSchedule) : []);

// Total de usuarios visibles en un grupo de turno ({default, total, [detalle]: []})
const countVisibleInShift = (sub) => Object.entries(sub || {})
    .filter(([key]) => key !== 'total')
    .reduce((acc, [, list]) => acc + visibleUsers(list).length, 0);

// Iconos SVG de Lupa para el Zoom
const ZoomOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);

const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);



export default function UserScheduler() {


    const dispatch = useDispatch();
    const { dataSessionState } = useContext(myUserContext);
    // Cerrojo contra el doble submit de los guardados de esta página. Ver
    // useSubmitLock: va por ref porque el estado no se actualiza a tiempo para
    // frenar el segundo clic de un doble clic.
    const { run: runLocked } = useSubmitLock();

    const [pivotDate, setPivotDate] = useState(new Date());
    const [userData, setUserData] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [dynamicScheduleConfig, setDynamicScheduleConfig] = useState(null);
    const [groupScheduleConfig, setGroupScheduleConfig] = useState(null);
    const [zoomPercent, setZoomPercent] = useState(80);
    const [selectedCellsByUser, setSelectedCellsByUser] = useState({});
    const [dragSelection, setDragSelection] = useState({
        active: false,
        action: null,
        visited: {}
    });
    const [isLoading, setIsLoading] = useState(false);

    // Grupos (departamento-turno) colapsados: solo muestran sus resúmenes.
    // Se persiste en localStorage para recordar la preferencia del usuario.
    const [collapsedGroups, setCollapsedGroups] = useState({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem('userSchedulerCollapsedGroups');
            if (saved) setCollapsedGroups(JSON.parse(saved));

            // Zoom guardado de la sesión anterior (con clamp por seguridad)
            const savedZoom = Number(localStorage.getItem('userSchedulerZoom'));
            if (savedZoom) setZoomPercent(Math.min(100, Math.max(50, savedZoom)));
        } catch (error) {
            console.error('No se pudo leer las preferencias guardadas:', error);
        }
    }, []);

    const toggleGroupCollapse = (groupKey) => {
        setCollapsedGroups(prev => {
            const next = { ...prev, [groupKey]: !prev[groupKey] };
            try {
                localStorage.setItem('userSchedulerCollapsedGroups', JSON.stringify(next));
            } catch (error) {
                console.error('No se pudo guardar el estado de grupos colapsados:', error);
            }
            return next;
        });
    };

    const tableRef = useRef(null);

    const todayRef = useRef(null);
    const userRefs = useRef({});


    const currentMonthLabel = useMemo(() => {
        const label = format(pivotDate, 'MMM yyyy', { locale: es });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, [pivotDate]);



    // 1. Memoized Date Range
    const daysRange = useMemo(() => {
        const startDate = startOfMonth(pivotDate);
        const endDate = endOfMonth(pivotDate);
        const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
        return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
            fullDateISO: date.toISOString(),
            dayNumber: format(date, 'd'),
            dayName: format(date, 'eee', { locale: es }),
            monthName: format(date, 'MMM', { locale: es }),
            // Nombres completos para el header (Julio / Domingo)
            monthFull: capitalize(format(date, 'MMMM', { locale: es })),
            dayFull: capitalize(format(date, 'EEEE', { locale: es })),
            dateObj: date,
            isToday: isSameDay(date, new Date())
        }));
    }, [pivotDate]);




    // 2. Optimized Data Fetching
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await fetchUserData();
                const basicUsers = data.result || [];

                // Optimization: Only fetch if necessary, or ask backend for bulk data
                const fullUsersData = await Promise.all(
                    basicUsers.map(u => userById(u._id).then(res => res.result))
                );
                setUserData(fullUsersData);
            } catch (error) {
                console.error('Error loading users:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); // Removed pivotDate from dependency to prevent refetching on horizontal scroll





    // 3. Memoized Grouping & Sorting Logic
    const processedUsers = useMemo(() => {
        const result = {};

        DEPARTMENTS.forEach(dept => {
            // Filter users for this department
            const deptUsers = userData.filter(u => (u.jobInformation?.department || 'Sin definir') === dept);

            if (deptUsers.length === 0) return;

            result[dept] = {
                diurno: {
                    default: [],
                    total: 0
                },
                nocturno: {
                    default: [],
                    total: 0
                },
                'sin definir': {
                    default: [],
                    total: 0
                }
            };

            // Orden por antigüedad: los más antiguos primero, los más nuevos al
            // final; a igual fecha de creación, desempata la jerarquía del cargo
            const sortedByPosition = [...deptUsers].sort((a, b) => {
                const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
                const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
                if (dateA !== dateB) return dateA - dateB;
                const posA = POSITIONS.indexOf(a.jobInformation?.position);
                const posB = POSITIONS.indexOf(b.jobInformation?.position);
                return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
            });

            // Group into shifts
            sortedByPosition.forEach(user => {
                const shift = user.workSchedule?.shiftType?.toLowerCase() || 'sin definir';
                if (result[dept][shift]) {

                    const datail = user.jobInformation?.detail

                    if (!datail || datail === '') {
                        result[dept][shift].default.push(user);
                    }
                    else {
                        if (result[dept][shift][datail]) result[dept][shift][datail].push(user);
                        else result[dept][shift][datail] = [user];
                    }
                } else {
                    result[dept]['sin definir']['default'].push(user);
                }
                result[dept][shift].total = result[dept][shift].total + 1;
            });
        });

        return result;
    }, [userData]);

    const selectedGroupStats = useMemo(() => {
        const selectedEntries = Object.entries(selectedCellsByUser)
            .map(([userId, dateMap]) => [userId, Object.keys(dateMap || {}).filter((dateISO) => !!dateMap?.[dateISO])])
            .filter(([, dates]) => dates.length > 0);

        const totalUsers = selectedEntries.length;
        const totalCells = selectedEntries.reduce((acc, [, dates]) => acc + dates.length, 0);

        return {
            hasSelection: totalCells > 0,
            totalUsers,
            totalCells,
            selectedEntries,
        };
    }, [selectedCellsByUser]);



    const selectedUsersForGroupEdition = useMemo(() => {
        if (!selectedGroupStats.hasSelection) return [];
        const usersById = userData.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
        }, {});

        return selectedGroupStats.selectedEntries
            .map(([userId, dates]) => {
                const user = usersById[userId];
                if (!user) return null;

                return {
                    userId,
                    user,
                    dates,
                };
            })
            .filter(Boolean);
    }, [selectedGroupStats, userData]);




    const handleUpdateUser = (id, data) => runLocked(async () => {
        try {
            const response = await updateUserByRrhh(id, data);
            const updatedUser = response.userUpdate;

            setUserData(prev => prev.map(u => u._id === id ? updatedUser : u));
            setEditingUser(null);

            dispatch(setConfigModal({
                type: 'successfull',
                title: 'Actualizado',
                description: 'Usuario actualizado correctamente',
                modalOpen: true,
            }));
        } 
        catch(error){
            console.error('Error actualizando usuario:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo actualizar',
                description: error?.response?.data?.message
                    ? String(error.response.data.message)
                    : 'Hubo un problema al guardar los cambios. Intenta nuevamente.',
                modalOpen: true,
            }));
        }
    }, 'updateUser');



    const handleSaveDynamicSchedule = async (data) => {
        console.log('Dynamic schedule payload:', data);
        setDynamicScheduleConfig(null);

        dispatch(setConfigModal({
            type: 'successfull',
            title: 'Configuración guardada',
            description: 'Horario dinámico preparado para envío al servidor',
            modalOpen: true,
        }));
    };


    
    const handleSaveGroupDynamicSchedule = (payload) => runLocked(async () => {
        try {
            // Inyectar el ID del admin logueado para auditoría (modifiedBy)
            const adminUserId = dataSessionState?.dataSession?._id;
            await saveGroupDynamicSchedule({ ...payload, adminUserId });
            setGroupScheduleConfig(null);
            setSelectedCellsByUser({});

            dispatch(setConfigModal({
                type: 'successfull',
                title: 'Horario actualizado',
                description: 'Se guardaron los cambios del grupo en el servidor',
                modalOpen: true,
            }));
        } catch (error) {
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo guardar',
                description: 'Hubo un problema al guardar el horario grupal. Intenta nuevamente.',
                modalOpen: true,
            }));
        }
    }, 'groupSchedule');



    const handleZoomStep = (delta) => {
        setZoomPercent((prev) => {
            const next = Math.min(100, Math.max(50, prev + delta));
            try {
                localStorage.setItem('userSchedulerZoom', String(next));
            } catch (error) {
                console.error('No se pudo guardar el zoom:', error);
            }
            return next;
        });
    };

    const handleOpenDynamicSchedule = ({ user, dateObj, mode, selectedDates = [] }) => {
        if (!user) return;

        setDynamicScheduleConfig({
            user,
            mode,
            dateObj: dateObj || null,
            selectedDates
        });
    };

    const handleStartDragSelection = (userId, dateISO, mouseButton) => {
        if (mouseButton !== 0) return;

        const userMap = selectedCellsByUser[userId] || {};
        const isCurrentlySelected = !!userMap[dateISO];
        const action = isCurrentlySelected ? 'deselect' : 'select';

        setDragSelection({
            active: true,
            action,
            visited: { [`${userId}-${dateISO}`]: true }
        });

        setSelectedCellsByUser(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [dateISO]: action === 'select'
            }
        }));
    };

    const handleDragOverCell = (userId, dateISO) => {
        if (!dragSelection.active || !dragSelection.action) return;
        const cellKey = `${userId}-${dateISO}`;
        if (dragSelection.visited[cellKey]) return;

        setDragSelection(prev => ({
            ...prev,
            visited: {
                ...prev.visited,
                [cellKey]: true
            }
        }));

        setSelectedCellsByUser(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [dateISO]: dragSelection.action === 'select'
            }
        }));
    };

    const handleEndDragSelection = () => {
        if (!dragSelection.active) return;

        setDragSelection({
            active: false,
            action: null,
            visited: {}
        });
    };

    const getSelectedDatesForUser = (userId) => {
        const map = selectedCellsByUser[userId] || {};
        return Object.keys(map).filter(key => map[key]);
    };

    const handleClearSelectedDatesForUser = (userId) => {
        setSelectedCellsByUser(prev => ({
            ...prev,
            [userId]: {}
        }));
    };

    const handleEditSelectedGroup = () => {
        // Guard en JS: solo administradores pueden editar horarios en grupo
        if (dataSessionState?.dataSession?.admin !== true) return;
        if (!selectedGroupStats.hasSelection) {
            return;
        }

        setGroupScheduleConfig({
            selectedUsers: selectedUsersForGroupEdition,
            totalCells: selectedGroupStats.totalCells,
            totalUsers: selectedGroupStats.totalUsers,
        });
    };


    // ── Apertura desde una notificación ───────────────────────────────
    // La campana enlaza a /user?userId=<id>&date=YYYY-MM-DD. Al llegar así, el
    // horario se posiciona en ese mes, baja hasta el empleado y lo resalta unos
    // segundos, para que quien viene a resolver una solicitud no tenga que
    // buscarlo entre setenta y seis filas.
    //
    // Se lee de window.location y no con useSearchParams a propósito: ese hook
    // obliga a envolver la página en un Suspense para el prerenderizado, y acá
    // no aporta nada porque la página ya es de cliente.
    const openTargetRef = useRef(null);   // { userId, date } pendiente de resaltar

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const dateParam = params.get('date');
        if (!userId && !dateParam) return;

        if (dateParam) {
            const fecha = new Date(`${dateParam}T00:00:00`);
            if (!Number.isNaN(fecha.getTime())) setPivotDate(fecha);
        }
        // Se guarda para resaltar cuando las filas ya estén montadas: en este
        // punto userRefs todavía está vacío.
        openTargetRef.current = { userId, date: dateParam };
    }, []);

    // Resalta al empleado en cuanto su fila existe. Se toca la clase del nodo
    // directamente porque ya tenemos su ref: hacerlo con estado obligaría a
    // pasar la marca por toda la jerarquía de la grilla para un efecto que dura
    // cuatro segundos.
    useEffect(() => {
        const objetivo = openTargetRef.current;
        if (!objetivo?.userId || userData.length === 0) return;

        const fila = userRefs.current?.[objetivo.userId];
        if (!fila) return;

        openTargetRef.current = null;
        fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fila.classList.add('jarvis-row-highlight');
        const id = setTimeout(() => fila.classList.remove('jarvis-row-highlight'), 4000);
        return () => clearTimeout(id);
    }, [userData, daysRange]);


    // 4. Smooth Scroll to Today
    useEffect(() => {
        // Si se viene desde una notificación, manda ese destino y no "hoy".
        if (openTargetRef.current) return;
        if (todayRef.current) {
            todayRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [daysRange]);

    useEffect(() => {
        if (!dragSelection.active) return;

        window.addEventListener('mouseup', handleEndDragSelection);
        return () => window.removeEventListener('mouseup', handleEndDragSelection);
    }, [dragSelection.active]);




    const handdlerContexrMenu = e => {
        e.preventDefault();
        console.log("Click derecho detectado");
    };




    return (
        <div className='w-full h-full p-6 bg-gray-50 flex flex-col'>

            <div className='flex flex-col gap-3 mb-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm border'>

                {/* SECCIÓN TÍTULO: Se centra en móvil/tablet, se alinea a la izquierda en desktop */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='text-left'>
                        <h1 className='text-lg sm:text-xl font-bold text-gray-800 leading-tight'>Horario Operacional</h1>
                        <p className='text-xs text-gray-500'>Gestión de turnos y personal</p>
                    </div>

                    {/* SECCIÓN CONTROLES: Agrupa Zoom y Botones */}
                    <div className='w-full sm:w-auto overflow-x-auto pb-1 scrollbar-hide'>
                        <div className='inline-flex items-center gap-2 sm:gap-3 min-w-max'>

                            {/* Control de Zoom */}
                            <div className='flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-8'>
                                <button
                                    type='button'
                                    onClick={() => handleZoomStep(-10)}
                                    className='h-full px-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors flex items-center justify-center'
                                    aria-label='Reducir zoom'
                                >
                                    <ZoomOutIcon />
                                </button>
                                <div className='h-4 w-[1px] bg-gray-200'></div>
                                <span className='text-[11px] font-semibold text-gray-700 min-w-[45px] text-center select-none'>
                                    {zoomPercent}%
                                </span>
                                <div className='h-4 w-[1px] bg-gray-200'></div>
                                <button
                                    type='button'
                                    onClick={() => handleZoomStep(10)}
                                    className='h-full px-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors flex items-center justify-center'
                                    aria-label='Aumentar zoom'
                                >
                                    <ZoomInIcon />
                                </button>
                            </div>

                            {/* Control de Fecha */}
                            <div className='flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-8'>
                                <button
                                    onClick={() => setPivotDate(subMonths(pivotDate, 1))}
                                    className='h-full px-2.5 sm:px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors font-medium'
                                    aria-label='Mes anterior'
                                >
                                    Ant.
                                </button>
                                <div className='h-4 w-[1px] bg-gray-200'></div>
                                <div className='px-2 sm:px-3 text-xs font-bold text-gray-800 flex items-center justify-center min-w-[80px] sm:min-w-[90px] select-none capitalize'>
                                    {currentMonthLabel}
                                </div>
                                <div className='h-4 w-[1px] bg-gray-200'></div>
                                <button
                                    onClick={() => setPivotDate(addMonths(pivotDate, 1))}
                                    className='h-full px-2.5 sm:px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors font-medium'
                                    aria-label='Mes siguiente'
                                >
                                    Sig.
                                </button>
                            </div>

                            {/* Botón Hoy */}
                            <button
                                onClick={() => setPivotDate(new Date())}
                                className='btn-primary btn-sm h-8 py-0'
                            >
                                Hoy
                            </button>

                            {/* Botón Editar Grupo — visible solo para administradores */}
                            {dataSessionState?.dataSession?.admin === true && (
                                <>
                                    <div className='hidden sm:block h-6 w-[1px] bg-gray-300 ml-1'></div>

                                    <button
                                        onClick={handleEditSelectedGroup}
                                        disabled={!selectedGroupStats.hasSelection}
                                        className='btn-primary btn-sm h-8 py-0 sm:ml-1'
                                    >
                                        <span className='text-white'>Editar grupo</span>
                                        {selectedGroupStats.hasSelection && (
                                            <span className='bg-white/30 text-white rounded-full px-1.5 py-0.5 text-[10px]'>
                                                {selectedGroupStats.totalCells}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>



            <div className='flex-1 bg-white rounded-xl shadow-lg border overflow-hidden'>
                <div className='h-full overflow-auto'>

                    <div className='inline-block min-w-full align-middle' ref={tableRef} style={{ zoom: zoomPercent / 100 }}>

                        {/* HEADER */}
                        <div className='sticky top-0 z-30 bg-white border-b'>
                            <div className='flex'>
                                <div className='sticky left-0 z-40 w-48 min-w-[12rem] bg-gray-50 border-r p-4 font-bold text-gray-600'>
                                    Empleados
                                </div>
                                {daysRange.map((day) => (
                                    <div
                                        key={day.fullDateISO}
                                        ref={day.isToday ? todayRef : null}
                                        className={`flex-shrink-0 w-24 text-center p-2 border-r transition-colors ${day.isToday ? 'bg-blue-50 shadow-[inset_3px_0_0_#3b82f6,inset_-3px_0_0_#3b82f6,inset_0_3px_0_#3b82f6]' : ''}`}
                                    >
                                        <div className='text-[12px] font-bold text-gray-500 leading-tight'>
                                            {day.monthFull}
                                        </div>
                                        <div className={`text-lg font-bold leading-tight ${day.isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {day.dayNumber}
                                        </div>
                                        <div className={`text-[12px] font-bold leading-tight ${['sáb', 'dom'].includes(day.dayName) ? 'text-red-500' : 'text-gray-500'}`}>
                                            {day.dayFull}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>



                        {/* BODY */}
                        <div className='divide-y divide-gray-100'
                            onContextMenu={handdlerContexrMenu}
                        >
                            {Object.entries(processedUsers).map(([dept, shifts]) => {
                                return (
                                    <div key={dept} className="bg-white">
                                        {Object.entries(shifts).map((category) => {

                                            const [shift, subcategorys] = category;
                                            const color = shift ? COLORS_DEPARTMENTS.filter(config => config.name === dept)[0][shift] : 'red'
                                            const groupKey = `${dept}-${shift}`;
                                            const isCollapsed = !!collapsedGroups[groupKey];
                                            // No renderizar grupos sin empleados visibles (p. ej. vacíos o solo outForkSchedule)
                                            return countVisibleInShift(subcategorys) > 0 && (
                                                <div key={groupKey}
                                                    className='rounded-xl border-2 border-gray-300 overflow-clip mb-3'
                                                    style={{
                                                        backgroundColor: color
                                                    }}
                                                >

                                                    {/* Sticky Section Header */}
                                                    <div
                                                        className='sticky left-0 top-[69px] w-fit rounded-br-lg z-20 bg-gray-100 px-4 py-1 border-y text-[13px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-2'
                                                        style={{
                                                            backgroundColor: color
                                                        }}
                                                    >
                                                        {/* Toggle al inicio: colapsa los operadores dejando solo los resúmenes */}
                                                        <button
                                                            type='button'
                                                            onClick={() => toggleGroupCollapse(groupKey)}
                                                            aria-expanded={!isCollapsed}
                                                            title={isCollapsed ? 'Mostrar operadores' : 'Ocultar operadores'}
                                                            className='w-6 h-6 flex items-center justify-center rounded-md bg-white/60 border border-black/10 text-gray-700 hover:bg-white transition-colors flex-shrink-0'
                                                        >
                                                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className={`w-3.5 h-3.5 transition-transform duration-200 motion-reduce:transition-none ${isCollapsed ? '-rotate-90' : ''}`}>
                                                                <polyline points='6 9 12 15 18 9'></polyline>
                                                            </svg>
                                                        </button>
                                                        <span>{dept} — <span className="text-emerald-700">{shift}</span></span>
                                                    </div>
                                                    {
                                                        Object.entries(subcategorys).map(([subcategory, listUser]) => {
                                                            return (
                                                                <div key={`${dept}-${shift}-${subcategory}`}>
                                                                    <div
                                                                        className='sticky left-0 w-fit rounded-r-md z-10 bg-gray-100 px-4 py-1 border-y text-xs font-bold text-gray-500 uppercase tracking-wider'
                                                                        style={{
                                                                            backgroundColor: '#ddd',
                                                                            color: 'black',
                                                                            display: isCollapsed || subcategory.toLowerCase() === 'default' || subcategory.toLowerCase() === 'total' ? 'none' : 'block'
                                                                        }}
                                                                    >
                                                                        {subcategory}
                                                                    </div>
                                                                    {
                                                                        !isCollapsed && listUser.length > 0 && listUser.map(user => {

                                                                            return (
                                                                                <UserList
                                                                                    key={user._id}
                                                                                    user={user}
                                                                                    daysRange={daysRange}
                                                                                    onEditClick={setEditingUser}
                                                                                    onOpenDynamicSchedule={handleOpenDynamicSchedule}
                                                                                    selectedDateMap={selectedCellsByUser[user._id] || {}}
                                                                                    selectedDates={getSelectedDatesForUser(user._id)}
                                                                                    isDraggingSelection={dragSelection.active}
                                                                                    onStartDragSelection={(dateISO, mouseButton) => handleStartDragSelection(user._id, dateISO, mouseButton)}
                                                                                    onDragOverCell={(dateISO) => handleDragOverCell(user._id, dateISO)}
                                                                                    onClearSelectedDates={() => handleClearSelectedDatesForUser(user._id)}
                                                                                    ref={(el) => (userRefs.current[user._id] = el)}
                                                                                />
                                                                            )
                                                                        })
                                                                    }

                                                                    {/* Resumen de la subcategoría (la lista sin detalle es la "principal") */}
                                                                    {visibleUsers(listUser).length > 0 && (
                                                                        <AttendanceSummaryRow
                                                                            label={subcategory === 'default' ? 'Lista principal' : subcategory}
                                                                            users={visibleUsers(listUser)}
                                                                            daysRange={daysRange}
                                                                            tone='sub'
                                                                        />
                                                                    )}
                                                                </div>
                                                            )

                                                        })
                                                    }

                                                    {/* Resumen del turno — solo si hay más de una lista (evita duplicar la "Lista principal") */}
                                                    {Object.entries(subcategorys).filter(([k, l]) => k !== 'total' && visibleUsers(l).length > 0).length > 1 && (
                                                        <AttendanceSummaryRow
                                                            label={`Total ${shift}`}
                                                            users={visibleUsers(Object.entries(subcategorys).filter(([k]) => k !== 'total').flatMap(([, l]) => (Array.isArray(l) ? l : [])))}
                                                            daysRange={daysRange}
                                                            tone='shift'
                                                        />
                                                    )}
                                                </div>
                                            )

                                        })}

                                        {/* Resumen del departamento — solo si hay más de un turno con gente visible */}
                                        {Object.values(shifts).filter(sub => countVisibleInShift(sub) > 0).length > 1 && (
                                            <AttendanceSummaryRow
                                                label={`Total ${dept}`}
                                                users={visibleUsers(Object.values(shifts).flatMap(sub => Object.entries(sub).filter(([k]) => k !== 'total').flatMap(([, l]) => (Array.isArray(l) ? l : []))))}
                                                daysRange={daysRange}
                                                tone='dept'
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal remains same but use conditional rendering carefully */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <UserEditForm
                        initialData={editingUser}
                        onSave={handleUpdateUser}
                        onCancel={() => setEditingUser(null)}
                        departmentList={DEPARTMENTS}
                        positionList={POSITIONS}
                    />
                </div>
            )}

            {dynamicScheduleConfig?.user && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <UserDynamicScheduleForm
                        user={dynamicScheduleConfig.user}
                        mode={dynamicScheduleConfig.mode}
                        initialDate={dynamicScheduleConfig.dateObj}
                        initialSelectedDates={dynamicScheduleConfig.selectedDates}
                        onSave={handleSaveDynamicSchedule}
                        onCancel={() => setDynamicScheduleConfig(null)}
                    />
                </div>
            )}

            {groupScheduleConfig?.selectedUsers?.length > 0 && (
                <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <UserGroupDynamicScheduleForm
                        selectedUsers={groupScheduleConfig.selectedUsers}
                        totalCells={groupScheduleConfig.totalCells}
                        totalUsers={groupScheduleConfig.totalUsers}
                        onSave={handleSaveGroupDynamicSchedule}
                        onCancel={() => setGroupScheduleConfig(null)}
                    />
                </div>
            )}
        </div>
    );
}
