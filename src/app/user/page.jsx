'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { addDays, subDays, eachDayOfInterval, format, isSameDay, parseISO, getDay ,isBefore, startOfDay} from 'date-fns';

import CreatUser from '@/components/forms/CreateUser';

import UserEditForm from './assets/user.update.form';
import UserList from './assets/user.list';


import { es } from 'date-fns/locale';
import {  fetchUserData, userById,  updateUserByRrhh } from '@/libs/ajaxClient/user.fecth';

import { HiInformationCircle } from 'react-icons/hi';
import { Alert } from 'flowbite-react';





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


    const dispath = useDispatch();
    const [pivotDate, setPivotDate] = useState(new Date());
    const daysRange = useMemo(() => generate30DayRange(pivotDate), [pivotDate]);
    const [userData, setUserData] = useState([]); // Estado para almacenar datos de usuario reales
    
    const [editingUser, setEditingUser] = useState(null);
    const [errorHttpState, setErrorHttpState] = useState(null)
    const todayRef = useRef(null);
    const userRefs = useRef({});


    const departmentList = ['Operaciones', 'Recursos Humanos', 'Reportes', 'Sistemas y desarrollo', 'Sin definir'];
    const positionList = ['Gerente', 'Subgerente', 'Coordinador', 'Operador senior', 'Operador experto', 'Operador', 'Analista de sistemas', 'Analista de reportes', 'Analista de RRHH'];


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
            .then(async (data) => {
                // 1. Obtenemos los IDs básicos
                const basicUsers = data.result; 

                // 2. "Enriquecemos" los datos: Buscamos el detalle de cada uno
                // Usamos Promise.all para que las peticiones se hagan en paralelo (rápido)
                const fullUsersData = await Promise.all(
                    basicUsers.map(u => userById(u._id).then(res => res.result))
                );

                // 3. Guardamos todo el objeto completo en el estado
                setUserData(fullUsersData);
                
            })
            .catch(error => console.error('Error:', error));
    }, [pivotDate]);






    const handdlerPutUser = async (id, data) => {
        try {             
            const response = await updateUserByRrhh(id, data);
    
           
            if (userRefs.current[id]) {
                userRefs.current[id].updateUserInList(response.userUpdate);
            }
            
            const indexUser = userData.findIndex(user => user._id === data._id);
            const newData = [...userData];
            newData[indexUser] = response.userUpdate;
            setUserData(newData);

            setEditingUser(null);
            dispath(setConfigModal({
                type: 'successfull',
                title: 'Usuario actualizado',
                description: 'El susario se a actualizado datalladamente en el horario',
                modalOpen: true,
            }));
        } 
        catch (error) {
            console.log(error)    
            if(error?.response?.data?.status === 400 && error?.response?.data?.message){
                let message;
                if(Array.isArray(error?.response?.data?.message)) message = error?.response?.data?.message.join('\n')
                else message = 'Selecione todos los campos requeridos.';
                dispath(setConfigModal({
                    type: 'error',
                    title: 'Error en el fotmulario',
                    description: message,
                    modalOpen: true,
                }));
            }
            else if(error?.response?.data?.status === 401){
                dispath(setConfigModal({
                    type: 'warning',
                    title: 'Error',
                    description: 'Debe iniciar sessión para realizar esta petición.',
                    modalOpen: true,
                }));
            }
            else if(error?.response?.data?.status === 403){
                dispath(setConfigModal({
                    type: 'warning',
                    title: 'Error',
                    description: 'Sin permisos para relizar esta petición.',
                    modalOpen: true,
                }));
            }
        }
    }


    
    const orderUserByDepartment  = data => {
        const result = { };
    
        for(const iteration of departmentList) {
            for(let i = 0; i < data.length; i++){
                const user = data[i];
                if(user.jobInformation?.department !== iteration) continue;
                else if(!result[iteration]){ 
                    result[iteration] = {
                        diurno : [],
                        nocturno : [],
                        'sin definir' : []
                    };            
                }
                if(!user.workSchedule?.shiftType){
                    result[iteration]['sin definir'].push(user); 
                    continue; 
                }

                result[iteration][user.workSchedule?.shiftType.toLowerCase()].push(user);
            }
        }
        return result;
    };



    const dataOrderedByPosition = (data) => {
        let orderData = [];
        const withPosition = data.filter(user => user.jobInformation?.position === undefined || user.jobInformation?.position === null);
        positionList.forEach(position => {
            const result = data.filter(user =>  position === user.jobInformation?.position) ;
            orderData = [...orderData,...result];
        });
        return [...orderData, ...withPosition];
    };


    const userOrder = orderUserByDepartment(userData);


    

    return (
        <div className='w-full h-full p-6 bg-gray-50'>
            <div className='flex h-[60px] justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Horario Operacional</h1>
                <div className='space-x-2'>
                    <button onClick={() => setPivotDate(subDays(pivotDate, 15))} className='px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50'>Anterior</button>
                    <button onClick={() => setPivotDate(new Date())} className='px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700'>Hoy</button>
                    <button onClick={() => setPivotDate(addDays(pivotDate, 15))} className='px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50'>Siguiente</button>
                </div>
            </div>

            {/* --- CONTENEDOR DE LA TABLA (SCROLL) --- */}
            <div className='h-[calc(100%-60px)] bg-white rounded-xl shadow-lg border overflow-hidden'>
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
                            
                            {
                                Object.entries(userOrder).map(([key, value]) => {

                                    return(
                                        <div className='relative w-full h-full' key={key}>
                                            {
                                                Object.entries(value).map(([shift, users]) => {
                                                    console.log(shift, users);
                                                    if(users.length === 0) return null; 
                                                    return(
                                                        <div key={`${key}-${shift}`} className='relative'>

                                                            <div className='z-10 sticky top-[77px] left-0 bg-neutral-300 border-r border-gray-200 p-2'>
 
                                                            <p className='text-center font-[.8rem] text-white'>
                                                                {key} {shift}
                                                            </p>
                                                        </div>
                                                     
                                                           
                                                            {
                                                                dataOrderedByPosition(users).map((user) => (
                                                                    <UserList 
                                                                        key={user._id} 
                                                                        user={user} 
                                                                        daysRange={daysRange} 
                                                                        onEditClick={(user) => setEditingUser(user)}
                                                                        ref={(el) => (userRefs.current[user._id] = el)}
                                                                        departmentList={departmentList}
                                                                    />
                                                                ))
                                                            }
                                                        </div>
                                                    )
                                                    
                                                })
                                            }  
                                        </div>
                                        
                                    )
                                    
                                })
                            }
                        
                            {   

                                userOrder['sin definir'] && userOrder['sin definir'].map(user => 
                                    <UserList 
                                        key={user._id} 
                                        user={user} 
                                        daysRange={daysRange} 
                                        onEditClick={(user) => setEditingUser(user)}
                                        ref={(el) => (userRefs.current[user._id] = el)}
                                        departmentList={departmentList}
                                    />
                                )
                            }
                        </div>

                        {editingUser && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="w-full max-w-xl p-4">
                                    <UserEditForm 
                                        initialData={editingUser} 
                                        onSave={(id, data) => handdlerPutUser(id, data)}
                                        onCancel={() => setEditingUser(null)}
                                        departmentList={departmentList}
                                        positionList={positionList}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}



const exportToJson = (data, fileName = 'usuarios-asistencia.json') => {
  // 1. Convertir el array de objetos a un string JSON con formato (2 espacios)
  const jsonString = JSON.stringify(data, null, 2);

  // 2. Crear un Blob con el contenido y el tipo MIME correcto
  const blob = new Blob([jsonString], { type: 'application/json' });

  // 3. Crear una URL temporal para el Blob
  const url = window.URL.createObjectURL(blob);

  // 4. Crear un elemento <a> oculto para disparar la descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  // 5. Simular el click y limpiar
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url); // Importante para liberar memoria
};