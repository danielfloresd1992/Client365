import { useState, useEffect, useImperativeHandle, forwardRef, useContext, useMemo } from 'react';
import { myUserContext } from '@/contexts/userContext';
import { isSameDay, getDay, isBefore, startOfDay } from 'date-fns';
import { getAttendanceByDate } from '@/libs/ajaxClient/user.fecth';
import { useInView } from 'react-intersection-observer';

//import socket from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import { continuousColorLegendClasses } from '@mui/x-charts';

const attendanceCache = new Map();
const attendanceRequestCache = new Map();


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
        return url;
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

                    <div className={`min-w-[50px] w-[50px] h-[50px] rounded-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm border border-gray-200 ml-2 overflow-hidden`} title={dataSessionState?.dataSession?.name === 'Sorielis' && userState?.name === 'Sorielis' ? 'Te quiero mucho💝' : userState?.dni}>
                        <img className='w-full h-full object-cover' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 py-2">
                        <p className='font-black text-[15px] md:text-[16px] text-gray-900 leading-tight truncate'>{userState?.name}</p>
                        <p className='font-bold text-[12px] md:text-[13px] text-gray-600 leading-tight truncate'>{userState?.surName}</p>
                        <p className='text-[10px] md:text-[11px] font-bold text-gray-400 mt-1 truncate uppercase tracking-widest'>{userState?.jobInformation?.position || 'Sin definir'}</p>
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
                            scheduleByDay={userState?.workSchedule?.scheduleByDay}
                        />
                    </div>
                );
            })}
        </div>
    );
});





function AttendanceCell({ user, dni, dateObj, scheduleByDay }) {
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
    const dayConfig = scheduleByDay?.[String(currentDayNumber)] || null;


    // Función para formatear hora a Venezuela (UTC-4) - Formato 24H más compacto e interpretable visualmente
    const formatTimeVE = (dateStr) => {
        if (!dateStr) return "--:--";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
            timeZone: 'America/Caracas'
        }).format(date);
    };


    const requestDateISO = useMemo(() => {
        const date = new Date(dateObj);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }, [dateObj]);

    const attendanceCacheKey = `${dni}-${requestDateISO}`;
    const eventNameForSocket = `${requestDateISO}-${user.email}`;


    // Socket: escucha eventos para TODAS las fechas (no solo hoy).
    // Cuando el admin guarda un scheduleOverride desde el formulario grupal,
    // el backend emite un evento por cada celda afectada.
    useEffect(() => {
        const handdlerEventSocket = data => {
            const record = data?.finalRecord || null;
            attendanceCache.set(attendanceCacheKey, record);

            // Mostrar datos si hay checkIn O si hay un scheduleOverride asignado
            if (record?.checkIn || record?.scheduleOverride?.workType) {
                setStatus('data');
                setAttendanceData(record);
                return;
            }

            setStatus('empty');
            setAttendanceData(null);
        };

        socket.on(eventNameForSocket, handdlerEventSocket);
        return () => {
            socket.off(eventNameForSocket, handdlerEventSocket);
        };
    }, [attendanceCacheKey, eventNameForSocket]);





    // Fetch: se activa para TODAS las fechas visibles (pasadas, hoy y futuras)
    // porque cualquier celda puede tener un scheduleOverride guardado.
    useEffect(() => {
        if (!inView) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                setStatus('loading');

                if (attendanceCache.has(attendanceCacheKey)) {
                    const cachedData = attendanceCache.get(attendanceCacheKey);
                    if (!isMounted) return;

                    if (cachedData?.checkIn || cachedData?.scheduleOverride?.workType) {
                        setAttendanceData(cachedData);
                        setStatus('data');
                    } else {
                        setAttendanceData(null);
                        setStatus('empty');
                    }
                    return;
                }

                let requestPromise = attendanceRequestCache.get(attendanceCacheKey);
                if (!requestPromise) {
                    requestPromise = getAttendanceByDate(dni, requestDateISO)
                        .then(response => response?.data || null)
                        .catch(() => null)
                        .finally(() => {
                            attendanceRequestCache.delete(attendanceCacheKey);
                        });

                    attendanceRequestCache.set(attendanceCacheKey, requestPromise);
                }

                const data = await requestPromise;
                attendanceCache.set(attendanceCacheKey, data);

                if (!isMounted) return;

                if (data?.checkIn || data?.scheduleOverride?.workType) {
                    setAttendanceData(data);
                    setStatus('data');
                } else {
                    setAttendanceData(null);
                    setStatus('empty');
                }
            } catch (error) {
                if (!isMounted) return;
                setStatus('empty');
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [attendanceCacheKey, dni, inView, isPast, isToday, requestDateISO]);

    if (attendanceData?.scheduleOverride) {
        console.log(attendanceData)
        console.log(attendanceData?.scheduleOverride);
    }

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

    const override = attendanceData?.scheduleOverride;
    const isLate = attendanceData?.isLate //llegada tarde

    const shiftOverride = override?.shift

    const shiftDefault = dayConfig?.shift;
    const isRestDayDefault = dayConfig?.workType === 'descanso';

    const isRestDayOverride = override?.workType === 'descanso';
    const typeDay = override?.workType;
    const isRestDay = dayConfig?.workType === 'descanso';
    const isNocturno = false;


    const overrideTooltip = attendanceData?.scheduleOverride?.workType
        ? (() => {
            const last = attendanceData.scheduleOverride.modifiedBy?.slice(-1)?.[0];
            const adminName = last?.user?.name
                ? `${last.user.name} ${last.user.surName || ''}`.trim()
                : 'Admin';
            const modDate = last?.date
                ? new Date(last.date).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })
                : '';
            return `Regla: ${attendanceData.scheduleOverride.workType.toUpperCase()}\nModificado por: ${adminName}\n${modDate}`;
        })()
        : '';



    const latesText = <div className='text-[9px] text-red-600 text-center font-black uppercase mt-1 tracking-widest leading-none'>Tarde</div>



    const returFreeDay = (override = false) => {
        return (
            <div className='w-full h-full flex justify-center items-center flex-col bg-green-400'>
                <span className="text-white text-[12px] font-black uppercase tracking-wider text-">LIBRE</span>
                {override && <span className="text-[10px] text-white font-bold mt-0.5">✦ Agisnado</span>}
            </div>
        );
    }


    const InOut = (checkIn, checkOut, isExtra = false) => {
        return (
            <div className="flex flex-col gap-0.5 max-w-[85px] mx-auto w-full text-[11px]">
                <div className={`flex justify-between items-center rounded px-1.5 border ${isExtra ? 'bg-indigo-50/60 border-indigo-200' : 'bg-teal-50/60 border-teal-200'}`}>
                    <span className={`text-[9px] font-bold ${isExtra ? 'text-indigo-500' : 'text-teal-500'}`}>E</span>
                    <span className="text-gray-700 font-extrabold text-[12px]">{checkIn || '--:--'}</span>
                </div>
                <div className={`flex justify-between items-center rounded px-1.5 border ${isExtra ? 'bg-indigo-50/60 border-indigo-200' : 'bg-teal-50/60 border-teal-200'}`}>
                    <span className={`text-[9px] font-bold ${isExtra ? 'text-indigo-500' : 'text-teal-500'}`}>S</span>
                    <span className="text-gray-700 font-extrabold text-[12px]">{checkOut || '--:--'}</span>
                </div>
            </div>
        )
    }



    const returnEmpyt = () => {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300 rounded-md cursor-help">
                <span className="text-gray text-[10px] uppercase tracking-wider text-center">Sin configurar</span>
            </div>
        );
    };

    //19 478 095


    const markedHour = (config) => {

        console.log(override);

        if (dayConfig?.workType === 'descanso') return returFreeDay();
        if (!dayConfig) return returnEmpyt();

        return !config?.checkIn ?
            (
                <>
                    <div className='flex justify-between items-center border-b border-gray-100 pb-0.5 text-[11px] font-semibold'>
                        <span className={isNocturno ? 'text-indigo-500' : 'text-blue-600'}>E</span>
                        <span className='text-gray-700 font-bold'>{dayConfig?.startTime || '--:--'}</span>
                    </div>
                    <div className='flex justify-between items-center pt-0.5 text-[11px] font-semibold'>
                        <span className={isNocturno ? 'text-indigo-500' : 'text-orange-600'}>S</span>
                        <span className='text-gray-700 font-bold'>{dayConfig?.endTime || '--:--'}</span>
                    </div>
                </>
            )
            :
            (
                <div className="flex flex-col gap-1 w-full max-w-[85px] mx-auto">

                    <div className="flex justify-between items-center bg-gray-50/80 rounded px-1.5 shadow-sm border border-gray-100">
                        <span className="text-[10px] font-black text-emerald-600 tracking-tighter">IN</span>
                        <span className="text-[13px] md:text-[14px] text-gray-800 font-extrabold tracking-tight">{formatTimeVE(config?.checkIn)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50/80 rounded px-1.5 shadow-sm border border-gray-100">
                        <span className="text-[10px] font-black text-orange-500 tracking-tighter">OUT</span>
                        <span className="text-[13px] md:text-[14px] text-gray-800 font-extrabold tracking-tight">{config?.checkOut ? formatTimeVE(config?.checkOut) : '--'}</span>
                    </div>
                    {isNocturno && (
                        <span className='text-[8px] text-slate-500 font-medium mt-0.5 text-center'>🌙 Nocturno</span>
                    )}
                    
                </div>
            );
    };







    const preMarkedHour = (data) => {

        const isExtra = data.override?.workType === 'extra';

        console.log(data.override);

        if (data.override?.workType === 'descanso') {
            return returFreeDay(true);
        }

        const checkIn = data.checkIn ? formatTimeVE(data.checkIn) : override?.startTime;
        const checkOut = data.checkOut ? formatTimeVE(data.checkOut) : override?.endTime;

        return (
            <>
                <div className={`text-[9px] font-black uppercase tracking-widest text-center mb-0.5 ${isExtra ? 'text-[#ffe600] bg-[#000]' : 'text-teal-600'}`}>
                    {isExtra ? '✦ EXTRA' : '✦ LABORAL'}
                </div>
                {InOut(checkIn, checkOut, isExtra)}
            </>
        )
    };







    return (
        <div ref={ref}
            onDoubleClick={() => {
                console.log(attendanceData);
                console.log(override);
            }}
            title={overrideTooltip}
            className={`w-full h-full flex flex-col justify-center ${isToday ? 'bg-blue-50/30' : ''} ${overrideTooltip ? 'cursor-help' : ''}`}
            style={attendanceData?.isLate ? { backgroundColor: '#ffdbdb' } : null}
        >
            {
                isPast && status === 'empty' ?
                    <div ref={ref} title='No hay registro' className='w-full h-full flex items-center justify-center bg-gray-100 rounded-md'>
                        <span className='text-gray-400 text-[11px] italic'>Sin registro</span>
                    </div>
                    :

                    override ? preMarkedHour(attendanceData) : markedHour(attendanceData)
            }
            {isLate && latesText}
        </div>
    );

}// 26 749 038