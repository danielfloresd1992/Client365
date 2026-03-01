'use client';

import { useState, useMemo, useEffect, useRef, useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { addMonths, subMonths, eachDayOfInterval, format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Assets & Components
import UserEditForm from './assets/user.update.form';
import UserList from './assets/user.list';
import UserDynamicScheduleForm from './assets/user.dynamic.schedule.form';
import UserGroupDynamicScheduleForm from './assets/user.group.dynamic.schedule.form';



// Contexto de sesión (admin logueado)
import { myUserContext } from '@/contexts/userContext';

// network
import { fetchUserData, userById, updateUserByRrhh, saveGroupDynamicSchedule } from '@/libs/ajaxClient/user.fecth';



const DEPARTMENTS = ['Operaciones', 'Recursos Humanos', 'Reportes', 'Sistemas y desarrollo', 'Sin definir'];
const COLORS_DEPARTMENTS = [
    { name: 'Operaciones', diurno: '#abf8fd', nocturno: "#c1c2fd" },
    { name: 'Recursos Humanos', diurno: '#b0facc', nocturno: "#fffab8" },
    { name: 'Sistemas y desarrollo', diurno: '#ffbfe2', nocturno: "#c2d5ff" },
    { name: 'Reportes', diurno: '#fdaeae', nocturno: "#fdc5ff" },
    { name: 'Sin definir', diurno: '#bbbbbb', nocturno: "#bbb" },
];
const POSITIONS = ['Gerente', 'Subgerente', 'Coordinador', 'Operador senior', 'Operador experto', 'Operador', 'Analista de sistemas', 'Analista de reportes', 'Analista de RRHH'];
const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';

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
        return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
            fullDateISO: date.toISOString(),
            dayNumber: format(date, 'd'),
            dayName: format(date, 'eee', { locale: es }),
            monthName: format(date, 'MMM', { locale: es }),
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

            // Sort by Position Priority first
            const sortedByPosition = [...deptUsers].sort((a, b) => {
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




    const handleUpdateUser = async (id, data) => {
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
        } catch (error) {
            // ... your error handling logic ...
        }
    };

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

    const handleSaveGroupDynamicSchedule = async (payload) => {
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
    };



    const handleZoomStep = (delta) => {
        setZoomPercent((prev) => {
            const next = Math.min(100, Math.max(50, prev + delta));
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
        if (!selectedGroupStats.hasSelection) {
            return;
        }

        setGroupScheduleConfig({
            selectedUsers: selectedUsersForGroupEdition,
            totalCells: selectedGroupStats.totalCells,
            totalUsers: selectedGroupStats.totalUsers,
        });
    };


    // 4. Smooth Scroll to Today
    useEffect(() => {
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
                                className='h-8 px-3 sm:px-4 text-xs text-white rounded-lg shadow-sm transition-all font-medium hover:shadow-md hover:brightness-105 active:scale-95'
                                style={{ background: GREEN_THEME_GRADIENT }}
                            >
                                Hoy
                            </button>

                            <div className='hidden sm:block h-6 w-[1px] bg-gray-300 ml-1'></div>

                            {/* Botón Editar Grupo */}
                            <button
                                onClick={handleEditSelectedGroup}
                                disabled={!selectedGroupStats.hasSelection}
                                className={`h-8 px-3 sm:px-4 text-xs rounded-lg transition-all font-semibold sm:ml-1 flex items-center gap-1.5 ${selectedGroupStats.hasSelection
                                    ? 'text-white hover:brightness-105 hover:shadow-md active:scale-95 border-none'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                    }`}
                                style={selectedGroupStats.hasSelection ? { background: GREEN_THEME_GRADIENT } : undefined}
                            >
                                <span>Editar grupo</span>
                                {selectedGroupStats.hasSelection && (
                                    <span className='bg-white/30 text-white rounded-full px-1.5 py-0.5 text-[10px]'>
                                        {selectedGroupStats.totalCells}
                                    </span>
                                )}
                            </button>
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
                                        className={`flex-shrink-0 w-24 text-center p-2 border-r transition-colors ${day.isToday ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-500' : ''}`}
                                    >
                                        <div className={`text-[10px] uppercase font-bold ${['sáb', 'dom'].includes(day.dayName) ? 'text-red-500' : 'text-gray-400'}`}>
                                            {day.monthName} {day.dayName}
                                        </div>
                                        <div className={`text-lg font-bold ${day.isToday ? 'text-emerald-700' : 'text-gray-800'}`}>
                                            {day.dayNumber}
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
                                            return subcategorys.total > 0 && (
                                                <div key={`${dept}-${shift}`}
                                                    style={{
                                                        backgroundColor: color
                                                    }}
                                                >

                                                    {/* Sticky Section Header */}
                                                    <div
                                                        className='sticky left-0 top-[60px] w-[46%] z-10 bg-gray-100 px-4 py-1 border-y text-xs font-bold text-gray-500 uppercase tracking-wider'
                                                        style={{
                                                            backgroundColor: color
                                                        }}
                                                    >
                                                        {dept} — <span className="text-emerald-700">{shift}</span>
                                                    </div>
                                                    {
                                                        Object.entries(subcategorys).map(([subcategory, listUser]) => {
                                                            return (
                                                                <div key={`${dept}-${shift}-${subcategory}`}>
                                                                    <div
                                                                        className='sticky left-0 w-[46%] z-10 bg-gray-100 px-4 py-1 border-y text-xs font-bold text-gray-500 uppercase tracking-wider'
                                                                        style={{
                                                                            backgroundColor: '#ddd',
                                                                            color: 'black',
                                                                            display: subcategory.toLowerCase() === 'default' || subcategory.toLowerCase() === 'total' ? 'none' : 'block'
                                                                        }}
                                                                    >
                                                                        {subcategory}
                                                                    </div>
                                                                    {
                                                                        listUser.length > 0 && listUser.map(user => {

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
                                                                </div>
                                                            )

                                                        })
                                                    }
                                                </div>
                                            )

                                        })}
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