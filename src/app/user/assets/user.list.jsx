import { useState, useEffect, useImperativeHandle, forwardRef, useContext } from 'react';
import { myUserContext } from '@/contexts/userContext';
import { isSameDay, getDay, isBefore, startOfDay } from 'date-fns';
import { getAttendanceByDate } from '@/libs/ajaxClient/user.fecth';
import { useInView } from 'react-intersection-observer';

//import socket from '@/libs/socket/socketIo_jarvis';


export default forwardRef(function UserList({
    user,
    daysRange,
    onEditClick,
    onOpenDynamicSchedule,
    selectedDateMap = {},
    isDraggingSelection = false,
    onStartDragSelection,
    onDragOverCell,
    onClearSelectedDates
}, ref) {


    const userState = user
    const { dataSessionState } = useContext(myUserContext);


    const remplazeUrl = (url) => {
        if (!url) return null;
        return 'https://amazona365.ddns.net:3006' + url.split('https://amazona365.ddns.net')[1]
    };



    const updateUser = user => {

    };






    useImperativeHandle(ref, () => ({
        updateUserInList: updateUser
    }));


    if (user.workSchedule.outForkSchedule) return null;


    return (
        <div className='flex border-b border-gray-300 bg-white hover:bg-gray-50 transition-colors select-none' onDragStart={(e) => e.preventDefault()}>

            {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
            <div className='sticky left-0 z-9 w-48 min-w-[12rem] bg-white border-r border-gray-300 flex items-center flex-col gap-2'>
                <div className='w-full flex items-center gap-3'>

                    <div className={`w-[60px] h-[65px] rounded-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600`} title={dataSessionState?.dataSession?.name === 'Sorielis' && userState?.name === 'Sorielis' ? 'Te quiero mucho💝' : userState?.dni}>
                        <img className='w-full h-full object-cover' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />

                        {/*user.name.charAt(0)*/}
                    </div>

                    <div>
                        <p className='text-xs font-semibold text-[16px] text-gray-800 truncate'>{userState?.name}</p>
                        <p className='text-xs font-semibold text-[12px] text-gray-800 truncate'>{userState?.surName}</p>
                        <p className='text-xs text-gray-500'>{userState?.jobInformation?.position || 'Sin definir'}</p>
                    </div>
                    <button
                        onClick={() => {
                            onClearSelectedDates?.();
                            onEditClick(userState);
                        }}
                        className='absolute top-[5px] right-[5px] pointer'>
                        <img className='w-[30px] opacity-30 hover:opacity-100' src='/ico/icons8-configuración-48.png' alt='config-ico-09' />
                    </button>
                </div>

            </div>

            {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
            {user && daysRange.map((day) => {
                return (
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        onMouseDown={(event) => onStartDragSelection?.(day.fullDateISO, event.button)}
                        onMouseEnter={() => onDragOverCell?.(day.fullDateISO)}
                        className={`flex-shrink-0 w-24 p-1 border-r border-gray-300 flex items-center justify-center cursor-pointer
                            ${day.isToday ? 'bg-blue-50/20' : ''}
                            ${selectedDateMap[day.fullDateISO] ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-100/70' : ''}`}
                    >
                        {/* Invocamos al hijo pasándole los datos necesarios */}
                        <AttendanceCell
                            user={user}
                            userId={user._id}
                            dni={user.dni}
                            dateObj={day.dateObj}
                            // Pasamos los días libres para que el hijo calcule si le toca
                            restDaysSchedule={userState?.workSchedule?.restDays}
                        />
                    </div>
                );
            })}
        </div>
    );
});





function AttendanceCell({ user, dni, dateObj, restDaysSchedule }) {
    const { ref, inView } = useInView({
        threshold: .05,
        triggerOnce: true
    });

    const [status, setStatus] = useState('initial');
    const [attendanceData, setAttendanceData] = useState(null);

    const today = startOfDay(new Date());
    const currentCellDate = startOfDay(dateObj);
    const isPast = isBefore(currentCellDate, today);
    const isToday = isSameDay(currentCellDate, today);

    const currentDayNumber = getDay(dateObj);
    const restDays = restDaysSchedule || [];
    const isRestDay = restDays[currentDayNumber] ? true : false;

    // Función para formatear hora a Venezuela (UTC-4)
    const formatTimeVE = (dateStr) => {
        if (!dateStr) return "---";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Caracas'
        }).format(date);
    };

    useEffect(() => {
        if (inView) {
            setStatus('loading');
            const fetchData = async () => {
                try {
                    // Generamos la fecha 00:00:00 LOCAL para que el toISOString 
                    // devuelva el T04:00:00.000Z que espera tu servidor
                    const d = new Date(dateObj);
                    d.setHours(0, 0, 0, 0);
                    const dateIso = d.toISOString();

                    const response = await getAttendanceByDate(dni, dateIso);
                    if (response && response.data) {
                        setAttendanceData(response.data);
                        setStatus('data');
                    } else {
                        setStatus('empty');
                    }
                } catch (error) {
                    setStatus('empty');
                }
            };
            fetchData();
        }
    }, [dni, dateObj, inView]);


    // 1. ESTADO CARGANDO (Barra de espera)
    if (status === 'loading') {
        return (
            <div ref={ref} className="w-full h-[50px] flex flex-col gap-1 justify-center items-center px-1">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-blue-500 animate-[loading_1.5s_infinite] origin-left"></div>
                </div>
                <span className="text-[10px] text-gray-400">Cargando...</span>
                <style jsx>{`
                    @keyframes loading {
                        0% { transform: scaleX(0); }
                        50% { transform: scaleX(0.5); }
                        100% { transform: scaleX(1); }
                    }
                `}</style>
            </div>
        );
    }

    // 2. SI HAY DATOS (Mostrar Entrada y Salida)
    if (status === 'data' && attendanceData?.checkIn) {
        return (
            <div ref={ref} className={`w-full h-full flex flex-col justify-center px-1 text-[11px] ${isToday ? 'bg-blue-50/30' : ''}`}
                style={attendanceData?.isLate ? {
                    backgroundColor: '#ffdbdb'
                } : null}
            >
                <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                    <span className="font-bold text-blue-600">E:</span>
                    <span className="text-gray-700 font-semibold">{formatTimeVE(attendanceData.checkIn)}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                    <span className="font-bold text-orange-600">S:</span>
                    <span className="text-gray-700 font-semibold">{formatTimeVE(attendanceData.checkOut)}</span>
                </div>
                {attendanceData.isLate && (
                    <div className="text-[9px] text-red-500 text-center font-bold text-[12px]">Retardo</div>
                )}
            </div>
        );
    }

    // 3. SIN REGISTRO (Días pasados)
    if (isPast && status === 'empty') {
        return (
            <div ref={ref} title='No hay registro' className='w-full h-full flex items-center justify-center bg-gray-100 rounded-md'>
                <span className='text-gray-400 text-[11px] italic'>Sin registro</span>
            </div>
        );
    }

    // 4. ESTADO POR DEFECTO (Libre o Guardia futuro)
    return (
        <div ref={ref} className={`w-full h-full flex items-center justify-center ${isRestDay ? 'bg-stripes rounded-md' : ''}`}>
            {isRestDay ? (
                <span className='text-green-600 text-[13px] font-bold'>LIBRE</span>
            ) : 
            (
                <div className={`w-full h-full flex flex-col justify-center px-1 text-[11px] ${isToday ? 'bg-blue-50/30' : ''}`}>
                    {
                        user?.workSchedule.startTime ? 
                            <>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                                    <span className="text-blue-600">Entrada:</span>
                                    <span className="text-gray-700 font-bold">{user?.workSchedule?.startTime || 'Sin definir'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-orange-600">Salida:</span>
                                    <span className="text-gray-700 font-bold">{user?.workSchedule?.endTime || 'Sin definir'}</span>
                                </div>
                            </>
                        :
                        <span className="text-gray-700 font-semibold">Sin definir</span>
                    }
                   
                </div>
            )}
        </div>
    );
}