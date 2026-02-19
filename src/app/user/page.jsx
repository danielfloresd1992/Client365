'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { addDays, subDays, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Assets & Components
import UserEditForm from './assets/user.update.form';
import UserList from './assets/user.list';
import { fetchUserData, userById, updateUserByRrhh } from '@/libs/ajaxClient/user.fecth';

const DEPARTMENTS = ['Operaciones', 'Recursos Humanos', 'Reportes', 'Sistemas y desarrollo', 'Sin definir'];
const COLORS_DEPARTMENTS = [
    { name: 'Operaciones', diurno: '#abf8fd', nocturno: "#cfd0ff" },
    { name: 'Recursos Humanos', diurno: '#b0facc', nocturno: "#fffab8" },
    { name: 'Sistemas y desarrollo', diurno: '#ffbfe2', nocturno: "#c2d5ff" },
    { name: 'Reportes', diurno: '#fdaeae', nocturno: "#fdc5ff" },
];
const POSITIONS = ['Gerente', 'Subgerente', 'Coordinador', 'Operador senior', 'Operador experto', 'Operador', 'Analista de sistemas', 'Analista de reportes', 'Analista de RRHH'];



export default function UserScheduler() {
    const dispatch = useDispatch();
    const [pivotDate, setPivotDate] = useState(new Date());
    const [userData, setUserData] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const tableRef = useRef(null);
    const inputZoomRef = useRef(null);

    const todayRef = useRef(null);
    const userRefs = useRef({});



    // 1. Memoized Date Range
    const daysRange = useMemo(() => {
        const startDate = subDays(pivotDate, 15);
        const endDate = addDays(pivotDate, 15);
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
                diurno: [],
                nocturno: [],
                'sin definir': []
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
                    result[dept][shift].push(user);
                } else {
                    result[dept]['sin definir'].push(user);
                }
            });
        });

        return result;
    }, [userData]);




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



    const handdlerInputZoom = e => {
        tableRef.current.style.zoom = e.target.value;
        inputZoomRef.current.textContent = `Zoom: ${e.target.value}%`;
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






    return (
        <div className='w-full h-full p-6 bg-gray-50 flex flex-col'>

            <div className='flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 lg:p-6 rounded-xl shadow-sm border'>

                {/* SECCIÓN TÍTULO: Se centra en móvil/tablet, se alinea a la izquierda en desktop */}
                <div className='text-center lg:text-left'>
                    <h1 className='text-xl md:text-2xl font-bold text-gray-800 leading-tight'>Horario Operacional</h1>
                    <p className='text-xs md:text-sm text-gray-500'>Gestión de turnos y personal</p>
                </div>

                {/* SECCIÓN CONTROLES: Agrupa Zoom y Botones */}
                <div className='flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto'>

                    {/* CONTROL DE ZOOM: Se expande si es necesario */}
                    <div className='flex items-center justify-between sm:justify-start gap-3 bg-gray-50 px-4 py-2 rounded-lg border w-full sm:w-auto'>
                        <span className='text-xs font-bold text-gray-600 whitespace-nowrap' ref={inputZoomRef}>
                            Zoom: 0%
                        </span>
                        <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.1"
                            onChange={handdlerInputZoom}
                            className="w-full sm:w-24 md:w-32 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    {/* GRUPO DE BOTONES: Ahora son más responsivos */}
                    <div className='flex gap-2 w-full sm:w-auto justify-center'>
                        <button
                            onClick={() => setPivotDate(subDays(pivotDate, 15))}
                            className='flex-1 sm:flex-none px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 shadow-sm transition-all'
                        >
                            Ant.
                        </button>
                        <button
                            onClick={() => setPivotDate(new Date())}
                            className='flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all font-medium'
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setPivotDate(addDays(pivotDate, 15))}
                            className='flex-1 sm:flex-none px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 shadow-sm transition-all'
                        >
                            Sig.
                        </button>
                    </div>

                </div>
            </div>



            <div className='flex-1 bg-white rounded-xl shadow-lg border overflow-hidden'>
                <div className='h-full overflow-auto'>

                    <div className='inline-block min-w-full align-middle' ref={tableRef} style={{ zoom: 0.8 }}>

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
                                        className={`flex-shrink-0 w-24 text-center p-2 border-r transition-colors ${day.isToday ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : ''}`}
                                    >
                                        <div className={`text-[10px] uppercase font-bold ${['sáb', 'dom'].includes(day.dayName) ? 'text-red-500' : 'text-gray-400'}`}>
                                            {day.monthName} {day.dayName}
                                        </div>
                                        <div className={`text-lg font-bold ${day.isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {day.dayNumber}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>




                        {/* BODY */}
                        <div className='divide-y divide-gray-100'>
                            {Object.entries(processedUsers).map(([dept, shifts]) => {
                                return (
                                    
                                    <div key={dept} className="bg-white">
                                        {Object.entries(shifts).map(([shift, users]) => {
                                            console.log(COLORS_DEPARTMENTS.filter(config => config.name === dept)[0])

                                            const color = shift ? COLORS_DEPARTMENTS.filter(config => config.name === dept)[0][shift] : 'red'
                                            return (
                                                users.length > 0 && (
                                                    <div key={`${dept}-${shift}`}>
                                                        {/* Sticky Section Header */}
                                                        <div
                                                            className='sticky left-0 top-[60px] w-[46%] z-10 bg-gray-100 px-4 py-1 border-y text-xs font-bold text-gray-500 uppercase tracking-wider'
                                                            style={{
                                                                backgroundColor: color
                                                            }}
                                                        >
                                                            {dept} — <span className="text-blue-600">{shift}</span>
                                                        </div>
                                                        {users.map(user => (
                                                            <UserList
                                                                key={user._id}
                                                                user={user}
                                                                daysRange={daysRange}
                                                                onEditClick={setEditingUser}
                                                                ref={(el) => (userRefs.current[user._id] = el)}
                                                            />
                                                        ))}
                                                    </div>
                                                )
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {
                console.log(editingUser)
            }
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
        </div>
    );
}