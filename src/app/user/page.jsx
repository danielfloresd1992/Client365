'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { addDays, subDays, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { userById, fetchUserData } from '@/libs/ajaxClient/user.fecth';


// --- 1. TU FUNCIÓN GENERADORA DE FECHAS (INTACTA) ---
const generate30DayRange = (baseDate) => {
    const startDate = subDays(baseDate, 15);
    const endDate = addDays(baseDate, 15);
    const range = eachDayOfInterval({ start: startDate, end: endDate });

    return range.map(date => ({
        fullDateISO: date.toISOString(),
        dayNumber: format(date, 'd'),
        dayName: format(date, 'eee', { locale: es }),
        monthName: format(date, 'MMM', { locale: es }),
        dateObj: date, // Guardo el objeto fecha para comparaciones fáciles
        isToday: isSameDay(date, new Date())
    }));
};


// --- 2. DATOS MOCK (Simulando tu Base de Datos) ---
const MOCK_USERS = [
    { id: 1, name: 'Daniel Flores', role: 'Dev' },
    { id: 2, name: 'Ana Pérez', role: 'Gerente' },
    { id: 3, name: 'Carlos Ruiz', role: 'Operador' },
];

// Simulamos registros de asistencia/horario
// Clave compuesta: "userId-YYYY-MM-DD" para búsqueda rápida O(1)
const MOCK_SCHEDULE = {
    '1-2026-02-10': { type: 'Tarde', time: '08:15', color: 'bg-orange-100 text-orange-700' },
    '1-2026-02-11': { type: 'Asistió', time: '08:00', color: 'bg-green-100 text-green-700' },
    '1-2026-02-12': { type: 'Guardia', time: '24h', color: 'bg-purple-100 text-purple-700' },
    '2-2026-02-10': { type: 'Asistió', time: '07:55', color: 'bg-green-100 text-green-700' },
    '3-2026-02-13': { type: 'Falta', time: '-', color: 'bg-red-100 text-red-700' },
};



export default function UserScheduler() {



    const [pivotDate, setPivotDate] = useState(new Date());
    const daysRange = useMemo(() => generate30DayRange(pivotDate), [pivotDate]);
    const [userData, setUserData] = useState([]); // Estado para almacenar datos de usuario reales
    const todayRef = useRef(null);


    // --- FUNCIÓN PARA BUSCAR DATOS EN LA CELDA ---
    const getCellData = (userId, dateObj) => {
        // Formateamos la fecha actual del loop para ver si coincide con nuestro "Diccionario" de datos
        const dateKey = format(dateObj, 'yyyy-MM-dd');
        const recordKey = `${userId}-${dateKey}`;
        return MOCK_SCHEDULE[recordKey];
    };



    useEffect(() => {
        const timer = setTimeout(() => {
            if (todayRef.current) {
                todayRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }, 100); // 100ms de espera para asegurar que el DOM esté listo

        return () => clearTimeout(timer);
    }, [daysRange]);



    useEffect(() => {
        fetchUserData()
            .then(data => {
                console.log('Datos de usuario obtenidos:', data);
                console.log(data)
                setUserData(data.result);
                // Aquí podrías actualizar tu estado con los datos reales en lugar de los MOCK
            })
            .catch(error => {
                console.error('Error al obtener datos de usuario:', error);
            });
    }, [pivotDate]); // Re-fetch cuando cambie la fecha pivote



    return (
        <div className='w-full h-full p-6 bg-gray-50'>
            <div className='flex h-[100px] justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Horario Operacional</h1>
                <div className='space-x-2'>
                    <button onClick={() => setPivotDate(subDays(pivotDate, 15))} className='px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50'>Anterior</button>
                    <button onClick={() => setPivotDate(new Date())} className='px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700'>Hoy</button>
                    <button onClick={() => setPivotDate(addDays(pivotDate, 15))} className='px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50'>Siguiente</button>
                </div>
            </div>

            {/* --- CONTENEDOR DE LA TABLA (SCROLL) --- */}
            <div className='h-[calc(100%-100px)] bg-white rounded-xl shadow-lg border overflow-hidden'>
                <div className='w-full h-full overflow-scroll'>

                    {/* Usamos 'min-w-max' para que la tabla se expanda horizontalmente lo necesario */}
                    <div className='inline-block min-w-full align-middle'>
                        <div className='sticky top-0 z-20 bg-white border-b border-gray-200' id='header'>

                            {/* --- HEADER (FECHAS) --- */}
                            <div className='flex'>
                                {/* Espacio vacío arriba de la columna de nombres (Sticky) */}
                                <div className='sticky left-0 z-20 w-48 min-w-[12rem] bg-white border-r border-gray-200 p-4 font-bold text-gray-500'>
                                    Empleados
                                </div>

                                {/* Renderizado de los Días */}
                                {daysRange.map((day) => {

                                    return (
                                        <div
                                            key={day.fullDateISO}
                                            className={`flex-shrink-0 w-24 text-center p-2 border-r border-gray-100 ${day.isToday ? 'bg-blue-700' : ''}`}
                                            id={day.isToday ? 'isToDayNow' : 'null'}
                                            ref={day.isToday ? todayRef : null}
                                            title={day.isToday ? "Hoy" : format(day.dateObj, 'PPP', { locale: es })}
                                        >
                                            <div className={`text-xs uppercase font-bold ${day.dayName === 'dom' || day.dayName === 'sáb' ? 'text-red-400' : 'text-gray-400'}`}>
                                                {day.monthName}
                                            </div>
                                            <div className={`font-bold text-lg ${day.isToday ? 'text-white' : 'text-gray-800'}`}>
                                                {day.dayNumber}
                                            </div>
                                            <div className={`text-xs uppercase font-bold ${day.dayName === 'dom' || day.dayName === 'sáb' ? 'text-red-400' : 'text-gray-400'}`}>
                                                {day.dayName}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- BODY (USUARIOS) --- */}
                        <div>
                            {userData.map((user) => (
                                <UserList key={user._id} user={user} daysRange={daysRange} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function UserList({ user, daysRange }) {


    const [userState, setUserState] = useState(null);
    console.log(user._id);


    useEffect(() => {   
        if (!user._id) {
            console.error('ID de usuario no disponible:', user);
            return;
        }
        userById(user._id)
            .then(data => {
                console.log(`Datos del usuario ${user._id} obtenidos:`, data);   
                setUserState(data.result);
            })
            .catch(error => {
                console.error(`Error al obtener datos del usuario ${user.id}:`, error);
            }); 
    }, [user._id]);


    console.log(userState);



    return (
        <div className='flex border-b border-gray-100 hover:bg-gray-50 transition-colors'>

            {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
            <div className='sticky left-0 z-10 w-48 min-w-[12rem] bg-white border-r border-gray-200 p-2 flex items-center flex-col gap-2'>
                <div className='w-full flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600'>
                        <img className='w-full h-full' src={userState?.img || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                        {/*user.name.charAt(0)*/}
                    </div>
                    <div>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.name}</p>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.surName}</p>
                    </div>
                </div>
                <p className='text-xs text-gray-500'>{userState?.jobInformation?.position || 'Sin definir'}</p>
            </div>

            {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
            {daysRange.map((day) => {

                // const data = getCellData(user.id, day.dateObj);
                const isWeekend = day.dayName === 'dom' || day.dayName === 'sáb';
                const data = null;


                return (
                    <div
                        key={`${user}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 h-20 p-1 border-r border-gray-100 flex items-center justify-center ${day.isToday ? 'bg-blue-50/30' : ''}`}
                    >
                        {/* Lógica de renderizado de celda */}
                        {data ? (
                            <div className={`w-full h-full rounded-md flex flex-col items-center justify-center text-xs gap-1 ${data.color}`}>
                                <span className='font-bold'>{data.type}</span>
                                <span>{data.time}</span>
                            </div>
                        ) : (
                            // Celda vacía (Fin de semana o sin registro)
                            <div className='w-full h-full flex items-center justify-center'>
                                {isWeekend ? (
                                    <span className='text-gray-200 text-xs'>-</span>
                                ) : (
                                    <span className='text-gray-300 text-[10px]'>Sin info</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}