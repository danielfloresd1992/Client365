'use client';

import { useState, useEffect, useReducer, useContext, useMemo, useRef } from 'react';
import { isSameDay, getDay, isBefore, startOfDay } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import { useDispatch } from 'react-redux';

import useSubmitLock from '@/hook/useSubmitLock';
import { myUserContext } from '@/contexts/userContext';
import { setConfigModal } from '@/store/slices/globalModal';
import socket from '@/libs/socket/socketIo';
import { thumbUrl } from '@/libs/image';
import { overtimeOfDay, formatOvertime, OVERTIME_LABEL } from '@/libs/attendance/overtime';
import { getAttendanceByDate, addAttendanceComment, decideOvertime } from '@/libs/ajaxClient/user.fecth';
import { decideNotificationRequest, withdrawNotificationRequest } from '@/components/Notifications';

import DetailPopover from './DetailPopover';
import { CELL_COLOR_SYSTEM, NEW_EMPLOYEE_BASE_RGB, NEW_EMPLOYEE_FADE_DAYS } from './cellAppearance';
import { attendanceCache, attendanceRequestCache, notifyAttendanceCacheChange } from '../state/attendanceCache';
import { ensurePendingLoaded, subscribePending, pendingFor, clearPending, dayKeyOf } from '../state/schedulePending';
import { getCellFocus, clearCellFocus, subscribeCellFocus } from '../state/cellFocus';

/**
 * Una celda de la grilla: un empleado en un día.
 *
 * Carga su propio registro cuando entra en pantalla (useInView) y lo deja en
 * la caché compartida, para que dos celdas del mismo día no lo pidan dos veces.
 */
export default function AttendanceCell({ user, dni, dateObj, scheduleByDay }) {
    const { ref, inView } = useInView({
        threshold: .05,
        triggerOnce: true
    });

    const [status, setStatus] = useState('initial');
    const [attendanceData, setAttendanceData] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isDecidingOvertime, setIsDecidingOvertime] = useState(false);
    // Cerrojo por celda: cada una tiene sus propias acciones (comentar,
    // decidir horas extras) y no deben bloquearse entre celdas distintas.
    const { run: runLocked } = useSubmitLock();
    const closeTimeoutRef = useRef(null);
    const openTimeoutRef = useRef(null);
    const manuallyClosedRef = useRef(false);
    // Ficha anclada: se abrió desde una notificación y no se cierra sola.
    const pinnedRef = useRef(false);

    const HOVER_DELAY_MS = 1000;

    const handleOpenDetails = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (manuallyClosedRef.current) return;
        // Abre con marcaje registrado, cualquier override asignado (guardia,
        // cambio, descanso, falta...), comentarios o roles del día
        const hasOverrideInfo = Boolean(attendanceData?.scheduleOverride?.workType);
        const hasComments = attendanceData?.comments?.length > 0;
        const hasDayRole = Boolean(attendanceData?.onDuty || attendanceData?.auxiliary);
        if (!attendanceData?.checkIn && !hasOverrideInfo && !hasComments && !hasDayRole) return;
        if (showDetails) return;
        if (openTimeoutRef.current) return;

        setIsLoadingDetails(true);
        openTimeoutRef.current = setTimeout(() => {
            setIsLoadingDetails(false);
            setShowDetails(true);
            openTimeoutRef.current = null;
        }, HOVER_DELAY_MS);
    };


    const handleCloseDetails = () => {
        // Una ficha abierta desde una notificación NO se cierra al salir el
        // ratón. La de siempre es un tooltip: aparece al posarse y se va al
        // irse. Esta se abrió porque alguien vino a leer un comentario, y
        // cerrarse al primer movimiento la volvía imposible de leer. Se queda
        // hasta que la cierren con la equis.
        if (pinnedRef.current) return;

        if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = null;
            setIsLoadingDetails(false);
        }
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
            setShowDetails(false);
            closeTimeoutRef.current = null;
            manuallyClosedRef.current = false;
        }, 400);
    };



    const handleManualClose = () => {
        // Cerrar a mano suelta el anclaje: a partir de acá la celda vuelve a
        // comportarse como cualquier otra.
        pinnedRef.current = false;

        if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = null;
        }
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        manuallyClosedRef.current = true;
        setIsLoadingDetails(false);
        setShowDetails(false);
    };

    useEffect(() => {
        return () => {
            if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);


    // ── Llegada desde el aviso de un comentario ────────────────────────
    // /user?userId=…&date=…&detail=1 deja el recado en cellFocus; acá cada celda
    // mira si es para ella y despliega su ficha, que es donde está la nota.
    //
    // Se abre a mano y no por el camino del hover (handleOpenDetails) a
    // propósito: ese exige que ya haya datos cargados y espera un segundo, y
    // acá la celda puede estar recién apareciendo por el scroll. Al llegar los
    // datos la ficha se pinta sola, porque `showDetails` ya quedó en true.
    useEffect(() => {
        const atender = () => {
            const foco = getCellFocus();
            if (!foco?.openDetail) return;
            if (String(foco.userId) !== String(user._id)) return;
            if (foco.dayKey !== dayKeyOf(dateObj)) return;

            // Se consume el recado antes de abrir: si no, cualquier repintado
            // posterior de esta celda volvería a abrir la ficha que el usuario
            // acaba de cerrar.
            clearCellFocus();
            manuallyClosedRef.current = false;
            pinnedRef.current = true;
            setShowDetails(true);
        };

        // Se atiende ya —el recado pudo dejarse antes de que existiera esta
        // celda— y también al llegar uno nuevo.
        atender();
        return subscribeCellFocus(atender);
    }, [user._id, dateObj]);



    const today = startOfDay(new Date());
    const currentCellDate = startOfDay(dateObj);
    const isPast = isBefore(currentCellDate, today);
    const isToday = isSameDay(currentCellDate, today);

    // Días anteriores a la creación del empleado: no mostrar información
    const createdOnDay = user?.createdOn ? startOfDay(new Date(user.createdOn)) : null;
    const isBeforeCreation = Boolean(createdOnDay) && isBefore(currentCellDate, createdOnDay);

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

    // ── Composer de comentarios en línea (popover) ──
    const { dataSessionState } = useContext(myUserContext);
    const dispatch = useDispatch();
    const [isSendingComment, setIsSendingComment] = useState(false);

    // ── Solicitud de cambio de horario esperando decisión ──────────────
    // El mapa lo carga UNA vez toda la grilla y se actualiza por socket; acá
    // solo se mira si a ESTA celda le tocó, y se repinta cuando el mapa cambia.
    const [, refrescarPendiente] = useReducer((x) => x + 1, 0);
    const [resolviendoPendiente, setResolviendoPendiente] = useState(false);

    const sessionUserId = dataSessionState?.dataSession?._id;
    useEffect(() => {
        ensurePendingLoaded(sessionUserId);
        return subscribePending(refrescarPendiente);
    }, [sessionUserId]);

    const pendiente = pendingFor(user._id, dateObj);
    const esAdmin = dataSessionState?.dataSession?.admin === true;
    const esMio = Boolean(pendiente) && String(pendiente.requestedBy?.user || '') === String(dataSessionState?.dataSession?._id || '');

    // Un administrador decide; quien la pidió puede retirarla. Un `super`
    // mirando la solicitud de otro solo la ve, no la toca.
    const puedeDecidir = Boolean(pendiente) && esAdmin;
    const puedeRetirar = Boolean(pendiente) && esMio && !esAdmin;

    /**
     * Resuelve la solicitud desde la celda.
     *
     * Se limpia el mapa sin esperar al socket: el evento va a llegar, pero
     * quien acaba de pulsar el botón tiene que ver el resultado ya. Si la
     * petición falla se recarga, que es la única forma de saber cómo quedó.
     */
    const resolverPendiente = (accion) => runLocked(async () => {
        if (!pendiente?.notificationId) return;
        setResolviendoPendiente(true);
        try {
            if (accion === 'withdraw') {
                await withdrawNotificationRequest(pendiente.notificationId);
            } else {
                await decideNotificationRequest(pendiente.notificationId, accion);
            }
            clearPending(pendiente.notificationId);
        }
        catch (error) {
            const data = error?.response?.data;

            // 409 con `stale`: el horario se movió después de pedirse el
            // cambio. No se aprueba a ciegas — se cuenta y se deja decidir.
            if (data?.stale) {
                dispatch(setConfigModal({
                    type: 'warning',
                    title: 'El horario cambió',
                    description: `${data.message} Si aun así quieres aplicarlo, apruébalo desde la campana de notificaciones.`,
                    modalOpen: true,
                }));
            } else {
                dispatch(setConfigModal({
                    type: 'error',
                    title: 'No se pudo resolver',
                    description: data?.message || 'Hubo un problema con la solicitud. Intenta nuevamente.',
                    modalOpen: true,
                }));
                // Ya resuelta por otro, o error: el mapa quedó viejo.
                if (error?.response?.status === 409) clearPending(pendiente.notificationId);
            }
        }
        finally {
            setResolviendoPendiente(false);
        }
    }, 'pendiente');

    // El cerrojo va por REF (useSubmitLock): setIsSendingComment agenda un
    // re-render, no cambia la variable en el acto, así que un doble clic
    // disparaba dos comentarios idénticos. El estado se conserva solo para
    // deshabilitar el botón.
    const handleAddComment = (message) => runLocked(async () => {
        setIsSendingComment(true);
        try {
            await addAttendanceComment({ userId: user._id, dni, date: requestDateISO, message });
            // El backend emite el evento socket: el comentario llega en tiempo
            // real a todos los clientes con la grilla abierta (incluido este).
            return true;
        } catch (error) {
            console.error('Error guardando comentario:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo guardar',
                description: error?.response?.data?.message || 'Hubo un problema al guardar el comentario. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        } finally {
            setIsSendingComment(false);
        }
    }, 'comment');


    // Aprobar o rechazar las horas extras del día. Solo lo ve un admin; el
    // backend vuelve a exigirlo y deriva los minutos por su cuenta.
    //
    // `approvedMinutes` es la aprobación PARCIAL: de las horas que generó el
    // día, cuántas se autorizan. Va en null para aprobar el total. El servidor
    // valida la cantidad contra su propio cálculo, así que desde acá no se
    // puede aprobar más de lo que el día generó.
    // Misma razón que en el comentario: el cerrojo por ref frena el segundo
    // clic, que aquí duplicaría una decisión sobre horas extras.
    const handleDecideOvertime = (decision, approvedMinutes = null) => runLocked(async () => {
        setIsDecidingOvertime(true);
        try {
            await decideOvertime({
                userId: user._id,
                dni,
                date: requestDateISO,
                status: decision,
                ...(approvedMinutes !== null && { approvedMinutes })
            });
            // El backend emite el evento socket: la celda y el popover se
            // refrescan solos en todos los clientes.
            return true;
        } catch (error) {
            console.error('Error decidiendo horas extras:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo registrar',
                description: error?.response?.data?.message || 'Hubo un problema al decidir las horas extras. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        } finally {
            setIsDecidingOvertime(false);
        }
    }, 'overtime');


    // Socket: escucha eventos para TODAS las fechas (no solo hoy).
    // Cuando el admin guarda un scheduleOverride desde el formulario grupal,
    // el backend emite un evento por cada celda afectada.
    useEffect(() => {
        const handdlerEventSocket = data => {
            const record = data?.finalRecord || null;
            attendanceCache.set(attendanceCacheKey, record);
            notifyAttendanceCacheChange();

            // Mostrar datos si hay checkIn, scheduleOverride asignado o comentarios
            if (record?.checkIn || record?.scheduleOverride?.workType || record?.comments?.length > 0 || record?.onDuty || record?.auxiliary) {
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
        if (!inView || isBeforeCreation) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                setStatus('loading');

                if (attendanceCache.has(attendanceCacheKey)) {
                    const cachedData = attendanceCache.get(attendanceCacheKey);
                    if (!isMounted) return;

                    if (cachedData?.checkIn || cachedData?.scheduleOverride?.workType || cachedData?.comments?.length > 0 || cachedData?.onDuty || cachedData?.auxiliary) {
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
            notifyAttendanceCacheChange();

                if (!isMounted) return;

                if (data?.checkIn || data?.scheduleOverride?.workType || data?.comments?.length > 0 || data?.onDuty || data?.auxiliary) {
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
    }, [attendanceCacheKey, dni, inView, isBeforeCreation, isPast, isToday, requestDateISO]);




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

    // Empleado nuevo: menos de una semana desde su creación (color morado)
    // Días desde la creación del empleado → tramo del degradado morado (null si > 90)
    const employeeAgeDays = user?.createdOn ? Math.floor((Date.now() - new Date(user.createdOn).getTime()) / 86400000) : null;
    // Intensidad 1 → 0: día 1 al máximo, blanco a los 90 días
    const newEmployeeFade = (employeeAgeDays != null && employeeAgeDays >= 0 && employeeAgeDays < NEW_EMPLOYEE_FADE_DAYS)
        ? 1 - (employeeAgeDays / NEW_EMPLOYEE_FADE_DAYS)
        : 0;



    // La celda abre el popover si tiene marcaje, override asignado o comentarios
    const hasPopoverInfo = Boolean(
        attendanceData?.checkIn ||
        attendanceData?.scheduleOverride?.workType ||
        attendanceData?.comments?.length > 0 ||
        attendanceData?.onDuty ||
        attendanceData?.auxiliary
    );

    // Personas que tocaron el documento (creador, editores, comentaristas)
    // para las burbujas de la celda. Dedupe por persona; el primer rol gana.
    const cellPeople = (() => {
        if (!attendanceData) return [];
        const people = [];
        const seen = new Set();
        const pushPerson = (person, role) => {
            if (!person?.name) return; // solo refs populadas
            const id = String(person._id || `${person.name}-${person.surName}`);
            if (seen.has(id)) return;
            seen.add(id);
            people.push({ person, role });
        };
        // El marcaje propio (bioJarvis) crea el documento con createdBy = el
        // mismo empleado: eso NO cuenta como creación administrativa — solo
        // se muestran documentos creados/editados desde este frontend
        const isSelfCreated = String(attendanceData.createdBy?._id || '') === String(user?._id || '');
        if (!isSelfCreated) pushPerson(attendanceData.createdBy, 'Creado por');
        (attendanceData.editedBy || []).forEach((edit) => pushPerson(edit.user, 'Editado por'));
        (attendanceData.comments || []).forEach((comment) => pushPerson(comment.user, 'Comentó'));
        return people;
    })();


    // Horas extras del día para el distintivo de la celda. Misma función que
    // usan el popover y el reporte, con el turno efectivo del día y la
    // configuración de aprobación automática del usuario.
    const cellOvertimeShift = attendanceData?.scheduleOverride?.shift
        || scheduleByDay?.[String(dateObj.getDay())]?.shift
        || user?.workSchedule?.shiftType
        || 'Diurno';
    const cellOvertime = overtimeOfDay(attendanceData, cellOvertimeShift);



    /**
     * Render unificado de la celda (reemplaza a markedHour + preMarkedHour).
     *
     * La MISMA lógica cubre pasado, hoy y futuro: isToday/isPast solo deciden
     * si se muestran horas reales (marcaje) u horario programado.
     *
     * Jerarquía de color (CELL_COLOR_SYSTEM):
     *   falta > extra > descanso > cambio de guardia > empleado nuevo > guardia
     * Llegada tarde y falta llevan además borde rojo resaltado.
     */
    const renderDaySchedule = () => {
        // El empleado no existía en esta fecha: celda vacía, sin información
        if (isBeforeCreation) {
            return <div className='w-full h-full bg-gray-50' />;
        }

        const dayOverride = attendanceData?.scheduleOverride;
        const hasOverride = Boolean(dayOverride?.workType);
        const effectiveType = dayOverride?.workType || dayConfig?.workType || 'laboral';
        const startTime = dayOverride?.startTime || dayConfig?.startTime || null;
        const endTime = dayOverride?.endTime || dayConfig?.endTime || null;
        const hasCheckIn = Boolean(attendanceData?.checkIn);
        const isExtra = effectiveType === 'extra' || Boolean(attendanceData?.isExtraDay);
        const isFalta = effectiveType === 'falta';
        const isDescanso = effectiveType === 'descanso';
        const isLateArrival = Boolean(attendanceData?.isLate);

        // Jerarquía de color
        let colorKey = 'guardia';
        if (isFalta) colorKey = 'falta';
        else if (isExtra) colorKey = 'extra';
        else if (isDescanso) colorKey = 'descanso';
        else if (effectiveType === 'permiso') colorKey = 'permiso';
        else if (effectiveType === 'vacaciones') colorKey = 'vacaciones';
        else if (hasOverride) colorKey = 'cambio';
        else if (newEmployeeFade > 0) colorKey = 'nuevo';
        // Empleado nuevo con fondo aún oscuro: textos y rótulos en variantes claras
        const isDarkNuevo = colorKey === 'nuevo' && newEmployeeFade >= 0.6 && !isLateArrival;
        const color = colorKey === 'nuevo'
            ? (isDarkNuevo
                ? { bg: '', text: 'text-white', accent: 'text-purple-100' }
                : { bg: '', text: 'text-gray-800', accent: 'text-teal-600' })
            : CELL_COLOR_SYSTEM[colorKey];

        // Borde rojo resaltado: llegada tarde y falta. Si no, marca sutil de "hoy"
        // (el fondo del sistema de colores cubre el tinte azul que tenía el wrapper).
        const alertRing = (isLateArrival || isFalta)
            ? 'ring-2 ring-inset ring-red-500'
            : (isToday ? 'ring-2 ring-inset ring-blue-200' : '');

        let content = null;

        if (isFalta) {
            content = (
                <span className={`text-[13px] font-black uppercase tracking-wider text-center ${color.text}`}>Falta</span>
            );
        }
        else if (isDescanso && !hasCheckIn) {
            content = (
                <div className='text-center'>
                    <span className={`text-[12px] font-black uppercase tracking-wider ${color.text}`}>Libre</span>
                    {hasOverride && <div className={`text-[9px] font-bold mt-0.5 ${color.accent}`}>✦ Asignado</div>}
                </div>
            );
        }
        else if ((effectiveType === 'permiso' || effectiveType === 'vacaciones') && !hasCheckIn) {
            content = (
                <div className='text-center'>
                    <span className={`text-[12px] font-black uppercase tracking-wider ${color.text}`}>
                        {effectiveType === 'permiso' ? 'Permiso' : 'Vacaciones'}
                    </span>
                    {hasOverride && <div className={`text-[9px] font-bold mt-0.5 ${color.accent}`}>✦ Asignado</div>}
                </div>
            );
        }
        else if (hasCheckIn) {
            // Marcaje real (hoy o pasado)
            content = (
                <div className='flex flex-col gap-1 w-full max-w-[85px] mx-auto'>
                    {isExtra && (
                        <div className={`text-[10px] font-black uppercase tracking-widest text-center ${color.accent}`}>✦ EXTRA</div>
                    )}
                    <div className='flex justify-between items-center px-1.5'>
                        <span className={`text-[10px] font-black ${isDarkNuevo ? 'text-emerald-300' : 'text-emerald-600'} tracking-tighter`}>IN</span>
                        <span className={`text-[13px] md:text-[14px] font-extrabold tracking-tight ${color.text}`}>{formatTimeVE(attendanceData.checkIn)}</span>
                    </div>
                    <div className='flex justify-between items-center px-1.5'>
                        <span className={`text-[10px] font-black ${isDarkNuevo ? 'text-orange-300' : 'text-orange-500'} tracking-tighter`}>OUT</span>
                        <span className={`text-[13px] md:text-[14px] font-extrabold tracking-tight ${color.text}`}>{attendanceData?.checkOut ? formatTimeVE(attendanceData.checkOut) : '--'}</span>
                    </div>
                    {isLateArrival && (
                        <div className={`text-[9px] ${isDarkNuevo ? 'text-red-300' : 'text-red-600'} text-center font-black uppercase tracking-widest leading-none`}>Tarde</div>
                    )}
                </div>
            );
        }
        else if (isPast && !attendanceData) {
            content = <span className={`text-[10px] ${isDarkNuevo ? 'text-white/70' : 'text-gray-400'} text-center`}>Sin registros</span>;
        }
        else {
            // Hoy sin marcar todavía, o fecha futura → horario programado
            content = (
                <>
                    <div className={`text-[10px] font-black uppercase tracking-widest text-center mb-0.5 ${color.accent}`}>
                        {isExtra ? '✦ EXTRA' : '◆ Laboral'}
                    </div>
                    <div className={`flex justify-center items-center gap-1 pt-0.5 text-[11px] font-extrabold ${color.text}`}>
                        <span className={color.text}>{startTime || '--:--'}</span>
                        <span className={color.text}>-</span>
                        <span className={color.text}>{endTime || '--:--'}</span>
                    </div>
                </>
            );
        }

        return (
            <div
                className={`w-full h-full flex flex-col justify-center ${isLateArrival && !isFalta ? 'bg-rose-100' : color.bg} ${alertRing}`}
                // Degradado continuo de antigüedad: alpha del morado según los días
                style={colorKey === 'nuevo' && !isLateArrival
                    ? { backgroundColor: `rgba(${NEW_EMPLOYEE_BASE_RGB}, ${newEmployeeFade.toFixed(3)})` }
                    : undefined}
            >
                {content}
            </div>
        );
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
                className={`relative w-full h-full flex flex-col justify-center ${hasPopoverInfo ? 'cursor-pointer' : ''}`}
            >
                {/* Roles del día: campana azul (encargado de turno) y roja (auxiliar) */}
                {(attendanceData?.onDuty || attendanceData?.auxiliary) && (
                    <div className='absolute top-0 left-0 z-[2] pointer-events-none flex flex-col items-start'>
                        {attendanceData?.onDuty && (
                            <div className={`flex items-center gap-0.5 bg-blue-700 text-white text-[8px] font-black uppercase tracking-wider px-1 py-0.5 ${attendanceData?.auxiliary ? '' : 'rounded-br-md'}`}>
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                                    <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                </svg>
                                Turno
                            </div>
                        )}
                        {attendanceData?.auxiliary && (
                            <div className='flex items-center gap-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded-br-md'>
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                                    <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                </svg>
                                Auxiliar
                            </div>
                        )}
                    </div>
                )}

                {/* Marco dorado: el día tiene comentarios (borde + muescas en las 4 esquinas) */}
                {attendanceData?.comments?.length > 0 && (
                    <>
                        <div className='absolute inset-0 z-[1] pointer-events-none border-2 border-[#f0a500]' />
                        <div
                            className='absolute top-0 right-0 z-[1] pointer-events-none'
                            style={{ borderTop: '15px solid #f0a500', borderLeft: '15px solid transparent' }}
                        />
                        <div
                            className='absolute top-0 left-0 z-[1] pointer-events-none'
                            style={{ borderTop: '15px solid #f0a500', borderRight: '15px solid transparent' }}
                        />
                        <div
                            className='absolute bottom-0 right-0 z-[1] pointer-events-none'
                            style={{ borderBottom: '15px solid #f0a500', borderLeft: '15px solid transparent' }}
                        />
                        <div
                            className='absolute bottom-0 left-0 z-[1] pointer-events-none'
                            style={{ borderBottom: '15px solid #f0a500', borderRight: '15px solid transparent' }}
                        />
                    </>
                )}

                {/* Burbujas: fotos de quienes crearon/editaron/comentaron el documento */}
                {cellPeople.length > 0 && (
                    <div className='absolute top-0 right-0 z-[2] flex -space-x-1'>
                        {cellPeople.slice(0, 3).map(({ person, role }, i) => (
                            <div
                                key={i}
                                title={`${role} ${person.name} ${person.surName || ''}`.trim()}
                                className='w-6 h-6 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden flex items-center justify-center cursor-help'
                            >
                                {person.img
                                    ? <img src={thumbUrl(person.img, 64)} className='w-full h-full object-cover rounded-full' alt='' />
                                    : <span className='text-[8px] font-bold text-slate-600'>{person.name?.[0]}</span>}
                            </div>
                        ))}
                        {cellPeople.length > 3 && (
                            <div
                                title={cellPeople.slice(3).map(({ person, role }) => `${role} ${person.name} ${person.surName || ''}`.trim()).join('\n')}
                                className='w-6 h-6 rounded-full bg-gray-700 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-sm cursor-help'
                            >
                                +{cellPeople.length - 3}
                            </div>
                        )}
                    </div>
                )}
                <div style={{ pointerEvents: 'none' }} className='w-full h-full flex flex-col justify-center'>
                    {renderDaySchedule()}
                </div>

                {/* Reloj + "extra": el día generó horas extras. Verde cuando
                    están aprobadas (o el usuario las genera automáticamente),
                    azul mientras esperan decisión, gris si fueron rechazadas. */}
                {cellOvertime.minutes > 0 && (
                    <div
                        className='absolute bottom-0 left-0 right-0 z-[2] flex items-center justify-center gap-1'
                        style={{ pointerEvents: 'none' }}
                        title={cellOvertime.isPartial
                            ? `Horas extras: ${formatOvertime(cellOvertime.approvedMinutes)} aprobadas de ${formatOvertime(cellOvertime.minutes)} generadas`
                            : `Horas extras: ${formatOvertime(cellOvertime.minutes)} · ${OVERTIME_LABEL[cellOvertime.status]}`}
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
                            stroke={cellOvertime.status === 'approved' ? '#16a34a' : cellOvertime.status === 'rejected' ? '#dc2626' : '#2563eb'}
                            strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'
                            className='w-[11px] h-[11px] flex-shrink-0'
                        >
                            <circle cx='12' cy='12' r='10' />
                            <polyline points='12 6 12 12 16 14' />
                        </svg>
                        <span
                            className='text-[9px] font-black uppercase tracking-wider leading-none'
                            style={{ color: cellOvertime.status === 'approved' ? '#16a34a' : cellOvertime.status === 'rejected' ? '#dc2626' : '#2563eb' }}
                        >
                            extra
                        </span>
                    </div>
                )}

                {/* Solicitud de cambio esperando decisión.
                    Va encima de todo y con `pointerEvents` propio: el contenido
                    de la celda los tiene desactivados y el contenedor usa
                    mousedown para la selección por arrastre, así que sin esto el
                    clic en el botón seleccionaría la celda en vez de decidir. */}
                {pendiente && (
                    <div
                        className='absolute top-0 left-0 right-0 z-[4] flex items-center justify-between gap-0.5 px-1 py-[2px] bg-amber-400/95 border-b border-amber-500'
                        style={{ pointerEvents: 'auto' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => e.stopPropagation()}
                        title={`Cambio solicitado por ${pendiente.requestedBy?.name || ''} ${pendiente.requestedBy?.surName || ''}`.trim()
                            + (pendiente.slotCount > 1 ? ` · el lote toca ${pendiente.slotCount} celdas` : '')}
                    >
                        <span className='text-[8px] font-black uppercase tracking-tighter text-amber-900 leading-none truncate'>
                            {pendiente.slotCount > 1 ? `Pend. ×${pendiente.slotCount}` : 'Pend.'}
                        </span>

                        {(puedeDecidir || puedeRetirar) && (
                            <span className='flex items-center gap-0.5 flex-shrink-0'>
                                {puedeDecidir && (
                                    <button
                                        type='button'
                                        disabled={resolviendoPendiente}
                                        onClick={(e) => { e.stopPropagation(); resolverPendiente('approved'); }}
                                        title='Aceptar el cambio'
                                        className='w-[15px] h-[15px] rounded-sm bg-white/90 text-emerald-700 hover:bg-white hover:text-emerald-800 disabled:opacity-50 flex items-center justify-center leading-none font-black text-[10px]'
                                    >
                                        ✓
                                    </button>
                                )}
                                <button
                                    type='button'
                                    disabled={resolviendoPendiente}
                                    onClick={(e) => { e.stopPropagation(); resolverPendiente(puedeRetirar ? 'withdraw' : 'rejected'); }}
                                    title={puedeRetirar ? 'Retirar mi solicitud' : 'Cancelar el cambio'}
                                    className='w-[15px] h-[15px] rounded-sm bg-white/90 text-rose-700 hover:bg-white hover:text-rose-800 disabled:opacity-50 flex items-center justify-center leading-none font-black text-[10px]'
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {isLoadingDetails && (
                    <div
                        className='absolute top-1 right-1 z-[2] flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm border border-blue-200'
                        style={{ pointerEvents: 'none' }}
                    >
                        <div className='w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                        <span className='text-[9px] font-semibold text-blue-600'>Cargando</span>
                    </div>
                )}
            </div>
            {showDetails && (
                <DetailPopover
                    attendanceData={attendanceData}
                    user={user}
                    onClose={handleManualClose}
                    onMouseEnter={handleOpenDetails}
                    onMouseLeave={handleCloseDetails}
                    onAddComment={handleAddComment}
                    sendingComment={isSendingComment}
                    scheduleByDay={scheduleByDay}
                    dateObj={dateObj}
                    onDecideOvertime={handleDecideOvertime}
                    decidingOvertime={isDecidingOvertime}
                />
            )}
        </>
    );

}// 26 749 038