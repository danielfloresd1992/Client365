import { useState, useEffect, useImperativeHandle, forwardRef, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import useContextMenuPosition from '@/hook/useContextMenuPosition';
import ContextMenu from '@/components/ContextMenu';
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



    // Context menu state
    const {
        position: contextMenuPosition,
        handleContextMenu,
        closeMenu: closeContextMenu
    } = useContextMenuPosition();



    const [contextMenuUser, setContextMenuUser] = useState(null);

    // Handler para click derecho
    const onUserContextMenu = (e) => {
        handleContextMenu(e);
        setContextMenuUser(user);
    };


    if (user.workSchedule.outForkSchedule) return null;



    return (
        <>
            <div
                className='flex border-b border-gray-300 bg-white hover:bg-gray-50 transition-colors select-none'
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={onUserContextMenu}
            >

                {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
                <div className='sticky left-0 z-10 w-48 min-w-[12rem] bg-white border-r border-gray-300 flex items-center flex-col gap-2'>
                    <div className='w-full flex items-center gap-3'>

                        <div className={`min-w-[56px] w-[50px] h-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm border border-gray-200 overflow-hidden`} title={dataSessionState?.dataSession?.name === 'Sorielis' && userState?.name === 'Sorielis' ? 'Eres marron!' : userState?.dni}>
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

            <ContextMenu
                position={contextMenuPosition}
                open={!!contextMenuPosition}
                onClose={closeContextMenu}
            >
                <div className='flex flex-col'>
                    <button
                        className='text-left px-4 py-2 hover:bg-gray-100 rounded'
                        onClick={() => {
                            closeContextMenu();
                            onEditClick?.(contextMenuUser);
                        }}
                    >
                        Editar usuario
                    </button>
                    <button
                        className='text-left px-4 py-2 hover:bg-gray-100 rounded'
                        onClick={() => {
                            closeContextMenu();
                            onOpenDynamicSchedule?.({ user: contextMenuUser, mode: 'view' });
                        }}
                    >
                        Ver horario
                    </button>
                </div>
            </ContextMenu>
        </>
    );
});





function AttendanceCell({ user, dni, dateObj, scheduleByDay }) {
    const { ref, inView } = useInView({
        threshold: .05,
        triggerOnce: true
    });

    const [status, setStatus] = useState('initial');
    const [attendanceData, setAttendanceData] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [imageZoom, setImageZoom] = useState(null);
    const closeTimeoutRef = useRef(null);

    const handleOpenDetails = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (attendanceData?.checkIn) {
            setShowDetails(true);
        }
    };

    const handleCloseDetails = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
            setShowDetails(false);
            closeTimeoutRef.current = null;
        }, 400);
    };

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


    const extraHtml = <div className='bg-black'>
        <div className='text-[10px] font-black uppercase tracking-widest text-center mb-0.5 text-[#ffe600]'>✦ EXTRA</div>
    </div>


    const returFreeDay = (override = false) => {
        return (
            <div className='w-full h-full flex justify-center items-center flex-col bg-[#a4efd3]'>
                <span className="text-[12px] font-black uppercase tracking-wider text-[#313131]">LIBRE</span>
                {override && <span className="text-[10px] text-black font-bold mt-0.5">✦ Agisnado</span>}
            </div>
        );
    }


    const InOut = (checkIn, checkOut, isExtra = false) => {
        return (
            <div className="flex flex-col gap-0.5 max-w-[85px] mx-auto w-full text-[11px]">
                <div className={`flex justify-between items-center rounded`}>
                    <span className="text-gray-700 font-extrabold text-[12px]">{checkIn || '--:--'}</span>
                    -
                    <span className="text-gray-700 font-extrabold text-[12px]">{checkOut || '--:--'}</span>
                </div>
            </div>
        )
    }



    const returnEmpyt = () => {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 cursor-help">
                <span className="text-gray text-[10px] tracking-wider text-center">Sin registros</span>
            </div>
        );
    };


    const returnLack = () => {
        return(
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f00] cursor-help">
                <span className="text-white font-bold text-[13px] tracking-wider text-center">Falta</span>
            </div>
        );
    }


    //19 478 095


    const markedHour = (config, toDay) => {

        const configOverride = config?.scheduleOverride
        const extra = config?.scheduleOverride?.workType === 'extra';
        const dayFree = config?.scheduleOverride?.workType === 'descanso' || dayConfig?.workType === 'descanso';
        const lackOfWork = config?.scheduleOverride?.workType === 'falta'
        const laboral = config?.scheduleOverride?.workType === 'laboral'
        const startTime = config?.scheduleOverride?.startTime || dayConfig?.startTime;
        const endTime = config?.scheduleOverride?.endTime || dayConfig?.endTime;

        if (lackOfWork) return returnLack();

        if (dayFree && !extra && !laboral) return returFreeDay();
        if (!config?.checkIn && !config?.checkOut && !config && !toDay) return returnEmpyt();

        return !config?.checkIn ?
            (
                <>
                    <div className={`text-[10px] font-black uppercase tracking-widest text-center mb-0.5 text-teal-600`}>
                        Guardia
                    </div>
                    <div className='flex justify-center items-center pt-0.5 text-[11px] font-semibold'>
                        <span className='text-gray-700 font-bold'>{startTime || '--:--'}</span>
                        -
                        <span className='text-gray-700 font-bold'>{endTime || '--:--'}</span>
                    </div>
                </>
            )
            :
            (
                <div className="flex flex-col gap-1 w-full max-w-[85px] mx-auto" style={{ backgroundColor: extra ? '#dddddd' : 'transparent' }}>
                    {
                        config?.checkIn && extra && extraHtml
                    }
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
                    {isLate && latesText}
                </div>
            );
    };







    const preMarkedHour = (attendanceData, dayConfig) => {

        const extra = attendanceData?.scheduleOverride?.workType === 'extra';
        const laboral = attendanceData?.scheduleOverride?.workType === 'laboral';
        const dayFree = attendanceData?.scheduleOverride?.workType === 'descanso' || dayConfig?.workType === 'descanso';
        const startTime = attendanceData?.scheduleOverride?.startTime || dayConfig?.startTime;
        const checkEnd = attendanceData?.scheduleOverride?.endTime || dayConfig?.endTime;



        if (dayFree &&  !extra && !laboral) return returFreeDay();


        return (
            <>
                <div
                    onClick={() => {
                        console.error(attendanceData)
                        console.error(dayConfig)
                   } }
                    className={`text-[10px] font-black uppercase tracking-widest text-center mb-0.5 ${extra ? 'text-[#ffe600] bg-[#000]' : 'text-teal-600'}`}>
                    {extra ? '✦ EXTRA' : '✦ Guardia'}
                </div>
                {InOut(startTime, checkEnd, extra)}
            </>
        )
    };

    const calculateWorkDuration = () => {
        if (!attendanceData?.checkIn || !attendanceData?.checkOut) return null;
        const checkIn = new Date(attendanceData.checkIn);
        const checkOut = new Date(attendanceData.checkOut);
        const diffMs = checkOut - checkIn;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getStatusColor = () => {
        if (attendanceData?.status === 'presente') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        if (attendanceData?.isLate) return 'bg-red-50 border-red-200 text-red-700';
        if (attendanceData?.status === 'falta') return 'bg-red-50 border-red-200 text-red-700';
        if (attendanceData?.isJustified) return 'bg-blue-50 border-blue-200 text-blue-700';
        return 'bg-gray-50 border-gray-200 text-gray-700';
    };

    const getStatusLabel = () => {
        if (attendanceData?.status === 'presente') return '✓ Presente';
        if (attendanceData?.isLate) return '⚠️ Llegada Tarde';
        if (attendanceData?.status === 'falta') return '✗ Falta';
        if (attendanceData?.isJustified) return '✓ Justificado';
        return 'Sin estado';
    };

    const DetailPopover = ({ onMouseEnter, onMouseLeave }) => {
        if (!showDetails || !attendanceData?.checkIn) return null;

        const checkInTime = attendanceData?.checkIn ? new Date(attendanceData.checkIn).toLocaleString('es-VE', {
            timeZone: 'America/Caracas',
            timeStyle: 'short'
        }) : 'N/A';

        const checkOutTime = attendanceData?.checkOut ? new Date(attendanceData.checkOut).toLocaleString('es-VE', {
            timeZone: 'America/Caracas',
            timeStyle: 'short'
        }) : 'N/A';

        const images = attendanceData?.imageReference || [];
        const workDuration = calculateWorkDuration();

        const content = (
            <div
                className='fixed inset-0 z-[999] flex items-center justify-center p-4'
                onClick={() => setShowDetails(false)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={{ pointerEvents: 'none' }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className='bg-white rounded-xl shadow-2xl border border-gray-300 p-6 max-w-md w-full'
                    style={{ animation: 'slideUp 0.3s ease-out', pointerEvents: 'auto' }}
                >
                    {/* Header */}
                    <div className='flex justify-between items-start mb-4'>
                        <div>
                            <h3 className='text-base font-bold text-gray-900'>{user?.name} {user?.surName}</h3>
                            <p className='text-xs text-gray-500 mt-1'>DNI: {user?.dni}</p>
                        </div>
                        <button
                            onClick={() => setShowDetails(false)}
                            className='text-gray-400 hover:text-gray-600 text-2xl leading-none'
                        >
                            ×
                        </button>
                    </div>

                    <div className='space-y-3'>
                        {/* Info Quick */}
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div className='bg-gray-50 p-2 rounded'>
                                <p className='text-gray-600 font-semibold'>Depto</p>
                                <p className='font-bold text-gray-900'>{user?.jobInformation?.department || 'N/A'}</p>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                                <p className='text-gray-600 font-semibold'>Puesto</p>
                                <p className='font-bold text-gray-900'>{user?.jobInformation?.position || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Estado Badge */}
                        <div className={`p-2 rounded text-xs font-semibold ${getStatusColor()}`}>
                            {getStatusLabel()}
                        </div>

                        {/* Check In */}
                        <div className='bg-emerald-50 p-3 rounded border border-emerald-200'>
                            <p className='text-xs text-emerald-700 font-semibold mb-1'>ENTRADA</p>
                            <p className='text-sm text-emerald-900 font-bold'>{checkInTime}</p>
                            {images?.[0] && (
                                <img
                                    src={images[0]}
                                    alt='entrada'
                                    className='w-full h-32 object-cover rounded mt-2 cursor-pointer hover:opacity-80'
                                    onClick={() => setImageZoom(images[0])}
                                    onError={(e) => e.target.src = '/ico/icons8-usuario-masculino-en-círculo-96.png'}
                                />
                            )}
                        </div>

                        {/* Check Out */}
                        <div className='bg-orange-50 p-3 rounded border border-orange-200'>
                            <p className='text-xs text-orange-700 font-semibold mb-1'>SALIDA</p>
                            <p className='text-sm text-orange-900 font-bold'>{checkOutTime}</p>
                            {images?.[1] && (
                                <img
                                    src={images[1]}
                                    alt='salida'
                                    className='w-full h-32 object-cover rounded mt-2 cursor-pointer hover:opacity-80'
                                    onClick={() => setImageZoom(images[1])}
                                    onError={(e) => e.target.src = '/ico/icons8-usuario-masculino-en-círculo-96.png'}
                                />
                            )}
                        </div>

                        {/* Duración */}
                        {workDuration && (
                            <div className='bg-purple-50 p-2 rounded border border-purple-200 text-xs'>
                                <p className='text-purple-600 font-semibold'>Duración: <span className='text-purple-900'>{workDuration}</span></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Zoom */}
                {imageZoom && (
                    <div
                        className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4'
                        onClick={() => setImageZoom(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className='relative max-w-2xl w-full'
                        >
                            <img
                                src={imageZoom}
                                alt='zoom'
                                className='w-full h-auto rounded-lg'
                                onError={(e) => e.target.src = '/ico/icons8-usuario-masculino-en-círculo-96.png'}
                            />
                            <button
                                onClick={() => setImageZoom(null)}
                                className='absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2'
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}</style>
            </div>
        );

        return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
    };



    return (
        <>
            <div ref={ref}
                onClick={() => {
                    console.log(attendanceData);
                    console.log(dayConfig);
                }}
                onMouseEnter={handleOpenDetails}
                onMouseLeave={handleCloseDetails}
                title={overrideTooltip}
                className={`relative w-full h-full flex flex-col justify-center ${isToday ? 'bg-blue-50/30' : ''} ${overrideTooltip ? 'cursor-help' : ''} ${attendanceData?.checkIn ? 'cursor-pointer' : ''}`}
                style={attendanceData?.isLate ? { backgroundColor: '#ffdbdb' } : null}
            >
                <div style={{ pointerEvents: 'none' }} className='w-full h-full flex flex-col justify-center'>
                    {
                        isToday || isPast ?
                        markedHour(attendanceData, isToday)
                            :
                        preMarkedHour(attendanceData, dayConfig)
                    }
                </div>
            </div>
            {showDetails && <DetailPopover onMouseEnter={handleOpenDetails} onMouseLeave={handleCloseDetails} />}
        </>
    );

}// 26 749 038