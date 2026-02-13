'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { addDays, subDays, eachDayOfInterval, format, isSameDay, parseISO, getDay ,isBefore, startOfDay} from 'date-fns';

import CreatUser from '@/components/forms/CreateUser';

import * as yup from 'yup';
import { es } from 'date-fns/locale';
import { userById, fetchUserData } from '@/libs/ajaxClient/user.fecth';
import { Label, TextInput, Checkbox, Select  } from 'flowbite-react';



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
    const [editingUser, setEditingUser] = useState(null);


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

                        {editingUser && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="w-full max-w-xl p-4">
                                    <UserEditForm 
                                        initialData={editingUser} 
                                        onSave={() => {}}
                                        onCancel={() => setEditingUser(null)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- BODY (USUARIOS) --- */}
                        <div>
                            {userData.map((user) => (
                                <UserList key={user._id} user={user} daysRange={daysRange} onEditClick={(u) => setEditingUser(u)} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function UserList({ user, daysRange, onEditClick }) {


    const [userState, setUserState] = useState(null);


    useEffect(() => {   
        if (!user._id) {
            console.error('ID de usuario no disponible:', user);
            return;
        }
        userById(user._id)
            .then(data => {
                setUserState(data.result);
            })
            .catch(error => {
                console.error(`Error al obtener datos del usuario ${user.id}:`, error);
            }); 
    }, [user._id]);



    const remplazeUrl = (url) => {
        if(!url) return null;

        return 'https://amazona365.ddns.net:3006' +  url.split('https://amazona365.ddns.net')[1]
    };


    return (
        <div className='flex border-b border-gray-300 hover:bg-gray-50 transition-colors'>

            {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
            <div className='relative sticky left-0 z-10 w-48 min-w-[12rem] bg-white border-r border-gray-300 p-2 flex items-center flex-col gap-2'>
                <div className='w-full flex items-center gap-3'>

                    <div className={`w-10 h-10 rounded-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600`}>
                        <img className='w-full h-full object-contain' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                        
                        {/*user.name.charAt(0)*/}
                    </div>
                    
                    <div>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.name}</p>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.surName}</p>
                    </div>
                    <button 
                        onClick={() => onEditClick(userState)}
                        className='absolute right-[10px] pointer'                        >
                        <span className="text-[10px] text-[#001fff] font-bold">EDITAR</span>
                    </button>
                </div>
                <p className='text-xs text-gray-500'>{userState?.jobInformation?.position || 'Sin definir'}</p>
            </div>

            {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
            {daysRange.map((day) => {
                const today = startOfDay(new Date());
                const currentCellDate = startOfDay(day.dateObj);


                const isPast = isBefore(currentCellDate, today); // ¿Ya pasó?
                const isToday = isSameDay(currentCellDate, today); // ¿Es hoy?
                const isFuture = !isPast && !isToday; // ¿Es un día futuro?
                // const data = getCellData(user.id, day.dateObj);
                // 1. Obtenemos el número del día actual de la celda (0-6)
                const currentDayNumber = getDay(day.dateObj);

                // 2. Obtenemos los días libres del usuario (asegurando que sea un array)
                // Si aún no ha cargado userState, asumimos array vacío []
                const restDays = userState?.workSchedule?.restDays || [];
               
                let isRestDay = restDays[currentDayNumber] ? true : false; // TOCA EL DÍA LIBRE
                const isWeekend = day.dayName === 'dom' || day.dayName === 'sáb';
   

                if(isPast) return(
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 h-20 p-1 border-r border-gray-300  flex items-center justify-center 
                            ${day.isToday ? 'bg-blue-50/20' : ''}`}
                    >
    
                            <div className={`w-full h-full flex items-center justify-center bg-red-400 rounded-md'`}>
                             
                                <span className='text-black text-[10px] font-bold'>FALTA</span>
                             
                             </div>
                
                    </div>
                );
                

                return (
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 h-20 p-1 border-r border-gray-300 flex items-center justify-center 
                            ${day.isToday ? 'bg-blue-50/20' : ''}`}
                    >
    
                            <div className={`w-full h-full flex items-center justify-center ${isRestDay ? 'bg-stripes rounded-md' : ''}`}>
                                {isRestDay ? (
                                    <span className='text-green-600 text-[10px] font-bold'>LIBRE</span>
                                ) : (
                                    /* 3. Día laborable normal sin info aún */
                                    <span className='text-gray-500 text-[12px]'>Guardia</span>
                                )}
                            </div>
                
                    </div>
                );
            })}
        </div>
    );
}








function UserEditForm({ initialData, onSave, onCancel }) {
    // Control de secciones basado en si los datos existen en initialData

    const  [ dataUser , setDataUser] = useState(initialData);

    const [hasJobInfo, setHasJobInfo] = useState(!!initialData?.jobInformation);
    const [hasSchedule, setHasSchedule] = useState(!!initialData?.workSchedule);

    
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm();
 
    // 💡 IMPORTANTE: Resetear el formulario cuando cambie initialData

    useEffect(() => {
        if (initialData) {
            reset(initialData);
            setHasJobInfo(!!initialData.jobInformation);
            setHasSchedule(!!initialData.workSchedule);
        }
    }, [initialData, reset]);


    const onSubmit = (data) => {
        console.log(data);
    };

    return (
       <div className='bg-white p-6 rounded-xl shadow-2xl border'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold'>Editar Perfil: {initialData?.name}</h2>
                <button onClick={onCancel} className='text-gray-400 hover:text-red-500'>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-h-[70vh] overflow-y-auto px-2'>
                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Datos personales</h3>
                    {/* Sección de Cédula de Identidad */}
                    <div className='w-full'>
                        <div className='w-full'>
                            <Label 
                                htmlFor='dni' 
                                value='Cédula de Identidad' 
                                color='gray'
                            >CI</Label>
                            <TextInput 
                                id='dni'
                                type='number' 
                                color={errors.dni ? 'failure' : 'gray'} 
                                sizing='sm' 
                                placeholder='Ej: 12345678' 
                                // Conexión con useForm y Yup
                                {...register('dni')}
                                // Muestra el error de validación si existe
                                helperText={errors.dni?.message && (
                                    <span className='font-medium text-red-500'>
                                        {errors.dni.message}
                                    </span>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className='w-full flex gap-[.5rem]'>
                    <div className='w-[50%]'>
                        <Label 
                            htmlFor='name' 
                            value='Cédula de Identidad' 
                            color='info'
                        >Primer nombre</Label>

                        <TextInput 
                            id='name'
                            type='text' 
                            color={errors.name ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Jaun' 
                            // Conexión con useForm y Yup
                            {...register('name')}
                            // Muestra el error de validación si existe
                            helperText={errors.name?.message && (
                                <span className='font-medium text-red-500'>
                                    {errors.name.message}
                                </span>
                            )}
                        />
                    </div>
                    <div className='w-[50%]'>
                        <Label 
                            htmlFor='surName' 
                            value='Primer apellido' 
                            color='info'
                        >Primer apellido</Label>

                        <TextInput 
                            id='name'
                            type='text' 
                            color={errors.surName ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Sanches' 
                            // Conexión con useForm y Yup
                            {...register('surName')}
                            // Muestra el error de validación si existe
                            helperText={errors.surName?.message && (
                                <span className='font-medium text-red-500'>
                                    {errors.surName.message}
                                </span>
                            )}
                        />
                    </div>

                    
                </div>
                <div className='w-[100%]'>
                        <Label 
                            htmlFor='email' 
                            value='email' 
                            color='info'
                        >Coreo</Label>

                        <TextInput 
                            id='email'
                            type='email' 
                            color={errors.email ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Jaun' 
                            // Conexión con useForm y Yup
                            {...register('email')}
                            // Muestra el error de validación si existe
                            helperText={errors.email?.message && (
                                <span className='font-medium text-red-500'>
                                    {errors.email.message}
                                </span>
                            )}
                        />
                    </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Información Laboral</h3>
            
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Departamento */}
                        <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='department' value='Departamento' />
                        </div>
                        <Select 
                            id='department' 
                            {...register('jobInformation.department')}
                            color={errors.jobInformation?.department ? 'failure' : 'gray'}
                        >
                            <option value=''>Selecciona un departamento</option>
                            <option className='text-[#000000]' value='Operaciones'>Operaciones</option>
                            <option className='text-[#000000]' value='Sistemas y desarrollo'>Sistemas y desarrollo</option>
                            <option className='text-[#000000]' value='Reportes'>Reportes</option>
                            <option className='text-[#000000]' value='Recursos Humanos'>Recursos Humanos</option>
                        </Select>
                        {errors.jobInformation?.department && (
                            <p className='text-red-500 text-xs mt-1'>{errors.jobInformation.department.message}</p>
                        )}
                        </div>

                        {/* Puesto / Cargo */}
                        <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='position' value='Puesto' />
                        </div>
                        <Select 
                            id='position' 
                            {...register('jobInformation.position')}
                            color={errors.jobInformation?.position ? 'failure' : 'gray'}
                        >
                            <option className='text-[#000000]' value=''>Selecciona un puesto</option>
                            <option className='text-[#000000]' value='Gerente'>Gerente</option>
                            <option className='text-[#000000]' value='Subgerente'>Subgerente</option>
                            <option className='text-[#000000]' value='Coordinador'>Coordinador</option>
                            <option className='text-[#000000]' value='Operador senior'>Operador senior</option>
                            <option className='text-[#000000]' value='Operador experto'>Operador experto</option>
                            <option className='text-[#000000]' value='Operador'>Operador</option>
                            <option className='text-[#000000]' value='Analista de sistemas'>Analista de sistemas</option>
                            <option className='text-[#000000]' value='Analista de reportes'>Analista de reportes</option>
                            <option className='text-[#000000]' value='Analista de RRHH'>Analista de RRHH</option>
                        </Select>
                        {errors.jobInformation?.position && (
                            <p className='text-red-500 text-xs mt-1'>{errors.jobInformation.position.message}</p>
                        )}
                        </div>
                    </div>
                </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Horario de Trabajo</h3>
                    
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* Tipo de Turno */}
                        <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='shiftType' value='Tipo de Turno' />
                        </div>
                        <Select 
                            id='shiftType' 
                            {...register('workSchedule.shiftType')}
                            color={errors.workSchedule?.shiftType ? 'failure' : 'gray'}
                        >
                            <option className='text-[#000000]' value='Diurno'>Diurno</option>
                            <option className='text-[#000000]' value='Nocturno'>Nocturno</option>
                        </Select>
                        </div>

                        {/* Hora de Entrada */}
                        <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='startTime' value='Hora de Entrada' />
                        </div>
                        <TextInput 
                            id='startTime' 
                            type='time' 
                            {...register('workSchedule.startTime')}
                            color={errors.workSchedule?.startTime ? 'failure' : 'gray'}
                            helperText={errors.workSchedule?.startTime?.message}
                        />
                        </div>

                        {/* Hora de Salida */}
                        <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='endTime' value='Hora de Salida' />
                        </div>
                        <TextInput 
                            id='endTime' 
                            type='time' 
                            {...register('workSchedule.endTime')}
                            color={errors.workSchedule?.endTime ? 'failure' : 'gray'}
                            helperText={errors.workSchedule?.endTime?.message}
                        />
                    </div>
                </div>

                
            
                

                {/* Días de Descanso (Array de números) */}
                <div className='mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Días libres</h3>
                    <Label value='Días de Descanso (Selecciona de 1 a 3 días)' className='mb-2 block' />
                        <div className='flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                                <div key={day} className='flex items-center gap-2'>
                                    <Checkbox 
                                        id={`day-${index}`} 
                                        // Registramos la posición específica
                                        {...register(`workSchedule.restDays.${index}`)} 
                                        // ¡IMPORTANTE!: Quitamos la propiedad value
                                    />
                                    <Label htmlFor={`day-${index}`} color='grey'>{day}</Label>
                                </div>
                            ))}
                        </div>
                        {errors.workSchedule?.restDays && (
                        <p className='text-red-500 text-xs mt-2 font-medium'>
                            {errors.workSchedule.restDays.message}
                        </p>
                        )}
                    </div>
                </div>
                                    

                <div className='w-full'>

                    <div className='flex items-center justify-center gap-2'>
                        <Checkbox id='agree' {...register('inabilited')} />
                        <Label htmlFor='agree' className='flex' color='gray'>
                            Inhabilitar usuario
                        </Label> 
                    </div>
                </div>

                {/* ... Resto de tus inputs irían aquí siguiendo el mismo patrón ... */}

                {/* Footer del Formulario - Botones de acción */}
                <div className='flex gap-3 pt-6 sticky bottom-0 bg-white border-t border-gray-100 mt-4'>
                    <button 
                        type='button' 
                        onClick={onCancel} 
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancelar
                    </button>
                    <button 
                        type='submit' 
                        className='flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all'
                    >
                        Actualizar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}