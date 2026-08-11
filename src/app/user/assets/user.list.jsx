import { useState, useEffect, useReducer, forwardRef, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import useContextMenuPosition from '@/hook/useContextMenuPosition';
import useSubmitLock from '@/hook/useSubmitLock';
import ContextMenu from '@/components/ContextMenu';
import UserScheduleCalendar from './user.schedule.calendar';
import UserCommentForm from './user.comment.form';
import UserDayAssignForm from './user.day.assign.form';
import UserNextMonthScheduleForm from './user.nextmonth.schedule.form';
import { myUserContext } from '@/contexts/userContext';
import { isSameDay, getDay, isBefore, startOfDay } from 'date-fns';
import { getAttendanceByDate, addAttendanceComment, saveGroupDynamicSchedule, setOnDutyGuard, setAuxiliaryRole, decideOvertime } from '@/libs/ajaxClient/user.fecth';
import { decideNotificationRequest, withdrawNotificationRequest } from '@/components/Notifications';
import { ensurePendingLoaded, subscribePending, pendingFor, clearPending, dayKeyOf } from './schedulePending';
import { getCellFocus, clearCellFocus, subscribeCellFocus } from './cellFocus';
import { overtimeOfDay, formatOvertime, OVERTIME_LABEL } from '@/libs/attendance/overtime';
import { useInView } from 'react-intersection-observer';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';

//import socket from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import { continuousColorLegendClasses } from '@mui/x-charts';

const attendanceCache = new Map();
const attendanceRequestCache = new Map();

// ── Notificador de cambios de la caché de asistencia ──────────────────
// Las filas de resumen leen la caché para contar por día; este mini pub/sub
// las re-renderiza (con debounce) cuando las celdas escriben datos.
// Acceso de solo lectura a la caché (p. ej. para pre-cargar el formulario grupal)
export const getCachedAttendance = (dni, dateISO) => attendanceCache.get(`${dni}-${dateISO}`);

// Miniatura optimizada: el backend redimensiona con ?w= (x2 para retina)
const thumbUrl = (url, width) => {
    if (!url) return url;
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
};

const attendanceCacheListeners = new Set();
let attendanceCacheNotifyPending = false;
const notifyAttendanceCacheChange = () => {
    if (attendanceCacheNotifyPending) return;
    attendanceCacheNotifyPending = true;
    setTimeout(() => {
        attendanceCacheNotifyPending = false;
        attendanceCacheListeners.forEach((listener) => listener());
    }, 300);
};

/**
 * Fila de resumen alineada a la grilla: la primera celda mide EXACTAMENTE lo
 * mismo que el recuadro foto+nombre (w-48) para no romper la sincronía, y
 * cada celda de día cuenta para esa fecha: disponibles (les toca laborar),
 * faltas y llegadas tarde. Considera el override del día si ya está en caché
 * (celdas cargadas / sockets) y si no, la regla semanal del usuario.
 */
const SUMMARY_NO_WORK_TYPES = ['descanso', 'permiso', 'vacaciones', 'falta'];
const SUMMARY_TONES = {
    sub: 'bg-white',
    shift: 'bg-gray-50',
    dept: 'bg-gray-100',
};
export function AttendanceSummaryRow({ label, users, daysRange, tone = 'sub' }) {
    // Re-render cuando la caché de asistencia cambia
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    useEffect(() => {
        attendanceCacheListeners.add(forceUpdate);
        return () => attendanceCacheListeners.delete(forceUpdate);
    }, []);

    const toneClass = SUMMARY_TONES[tone] || SUMMARY_TONES.sub;

    const dayStats = (dateObj) => {
        const normalized = startOfDay(dateObj);
        const key = normalized.toISOString();
        const dow = String(normalized.getDay());
        let available = 0;
        let faltas = 0;
        let tardes = 0;
        users.forEach((u) => {
            const cached = attendanceCache.get(`${u.dni}-${key}`);
            const rule = u?.workSchedule?.scheduleByDay?.[dow];
            const type = cached?.scheduleOverride?.workType || rule?.workType || 'laboral';
            if (!SUMMARY_NO_WORK_TYPES.includes(type)) available++;
            if (type === 'falta' || cached?.status === 'ausente') faltas++;
            if (cached?.isLate) tardes++;
        });
        return { available, faltas, tardes };
    };

    const todayStats = dayStats(new Date());

    return (
        <div className={`flex border-b-2 border-gray-300 select-none ${toneClass}`}>
            {/* Celda sticky: mismo ancho que el recuadro foto+nombre de UserList */}
            <div className={`sticky left-0 z-10 w-48 min-w-[12rem] border-r border-gray-300 px-3 py-1.5 flex flex-col justify-center ${toneClass}`}>
                <p className='font-black text-[11px] text-gray-700 uppercase tracking-wider leading-tight truncate'>{label}</p>
                <div className='flex items-center gap-3 mt-1'>
                    <div className='flex items-baseline gap-1.5'>
                        <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Total</span>
                        <span className='text-xl font-black text-gray-900 leading-none'>{users.length}</span>
                    </div>
                    <div className='h-5 w-px bg-gray-300' />
                    <div className='flex items-baseline gap-1.5'>
                        <span className='text-[9px] font-black text-emerald-600 uppercase tracking-tighter'>Laboran hoy</span>
                        <span className='text-xl font-black text-emerald-600 leading-none'>{todayStats.available}</span>
                    </div>
                </div>
            </div>

            {/* Celdas por día: disponibles / faltas / tardes (layout tipo IN/OUT) */}
            {daysRange.map((day) => {
                const stats = dayStats(day.dateObj);
                return (
                    <div
                        key={day.fullDateISO}
                        className={`flex-shrink-0 w-24 border-r border-gray-300 px-1.5 py-1 flex flex-col justify-center gap-0.5 ${day.isToday ? 'bg-blue-50/40 shadow-[inset_3px_0_0_#3b82f6,inset_-3px_0_0_#3b82f6]' : ''}`}
                    >
                        <div className='flex justify-between items-center px-1.5 py-0.5 bg-emerald-100/80 border border-emerald-200 rounded'>
                            <span className='text-[9px] font-black text-emerald-700 uppercase tracking-tighter'>Disp</span>
                            <span className='text-[15px] font-black text-emerald-700 leading-none'>{stats.available}</span>
                        </div>
                        <div className='flex justify-between items-center px-1'>
                            <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Falta</span>
                            <span className={`text-[12px] font-extrabold ${stats.faltas > 0 ? 'text-red-600' : 'text-gray-300'}`}>{stats.faltas}</span>
                        </div>
                        <div className='flex justify-between items-center px-1'>
                            <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Tarde</span>
                            <span className={`text-[12px] font-extrabold ${stats.tardes > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{stats.tardes}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Etiquetas en español para los campos de scheduleOverride en editedBy.change
const OVERRIDE_FIELD_LABELS = {
    workType: 'Tipo',
    shift: 'Turno',
    startTime: 'Entrada',
    endTime: 'Salida',
};

// ══════════════════════════════════════════════════════════════
// SISTEMA DE COLORES DE LA CELDA (fondos claros + texto con contraste)
// La jerarquía de aplicación vive en renderDaySchedule():
//   falta > extra > descanso > cambio de guardia > empleado nuevo > guardia
// ══════════════════════════════════════════════════════════════
const CELL_COLOR_SYSTEM = {
    falta:    { bg: 'bg-red-600',    text: 'text-white',      accent: 'text-red-100' },    // Rojo pleno: falta (texto blanco)
    extra:    { bg: 'bg-green-100',  text: 'text-green-900',  accent: 'text-green-700' },  // Verde: día extra
    cambio:   { bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'text-yellow-700' }, // Amarillo: cambio de guardia (override)
    descanso: { bg: 'bg-gray-200',   text: 'text-gray-700',   accent: 'text-gray-500' },   // Gris: descanso
    permiso:  { bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'text-yellow-700' }, // Amarillo: permiso (con comentario obligatorio)
    vacaciones: { bg: 'bg-cyan-100', text: 'text-cyan-900',   accent: 'text-cyan-700' },   // Cian: vacaciones
    nuevo:    { bg: 'bg-purple-200', text: 'text-purple-950', accent: 'text-purple-700' }, // Morado: empleado nuevo (el fondo real es el degradado continuo NEW_EMPLOYEE_BASE_RGB)
    guardia:  { bg: 'bg-white',      text: 'text-gray-800',   accent: 'text-teal-600' },   // Blanco: guardia por defecto (modelo user)
    // turno: { bg: 'bg-blue-900',  text: 'text-white',      accent: 'text-blue-200' },   // Azul oscuro: quien lleva el turno (futura implementación)
};

// Degradado CONTINUO de antigüedad: máxima intensidad el día 1 y
// desvanecimiento lineal hasta blanco a los 3 meses (90 días).
// Base: purple-800 (#6b21a8); la intensidad se aplica como alpha.
const NEW_EMPLOYEE_BASE_RGB = '107, 33, 168';
const NEW_EMPLOYEE_FADE_DAYS = 90;

// Foto de perfil en miniatura para la auditoría del popover
function MiniAvatar({ user }) {
    return (
        <div className='w-5 h-5 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
            {user?.img
                ? <img src={thumbUrl(user.img, 48)} className='w-full h-full object-cover' alt='' />
                : <span className='text-[8px] font-bold text-slate-600'>{user?.name?.[0] || 'A'}</span>}
        </div>
    );
}

/**
 * Input en línea para agregar comentarios desde el popover (estilo red social).
 * Componente a nivel de módulo con estado propio: así el tipeo no pierde el
 * foco cuando la celda re-renderiza. onSubmit(texto) debe devolver true si
 * guardó (para limpiar el input).
 */
function CommentComposer({ onSubmit, sending }) {
    const [text, setText] = useState('');
    const trimmed = text.trim();

    const handleSend = async () => {
        if (!trimmed || sending) return;
        const saved = await onSubmit(trimmed);
        if (saved) setText('');
    };

    return (
        <div className='flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/70'>
            <input
                type='text'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                maxLength={500}
                placeholder='Escribe un comentario...'
                disabled={sending}
                className='flex-1 h-8 bg-white border border-amber-200 rounded-full px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400 disabled:opacity-60'
            />
            <button
                type='button'
                onClick={handleSend}
                disabled={!trimmed || sending}
                aria-label='Enviar comentario'
                title='Enviar comentario'
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${trimmed && !sending
                    ? 'bg-[#f0a500] text-white hover:brightness-110 active:scale-95 shadow-sm'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
                {sending
                    ? <span className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    : (
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <path d='m22 2-7 20-4-9-9-4Z'></path>
                            <path d='M22 2 11 13'></path>
                        </svg>
                    )}
            </button>
        </div>
    );
}

// Helpers puros del popover (solo dependen del registro de asistencia)
function calculateWorkDuration(attendanceData) {
    if (!attendanceData?.checkIn || !attendanceData?.checkOut) return null;
    const checkIn = new Date(attendanceData.checkIn);
    const checkOut = new Date(attendanceData.checkOut);
    const diffMs = checkOut - checkIn;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function getStatusColor(attendanceData) {
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType === 'falta') return 'bg-red-50 border-red-200 text-red-700';
    // Override asignado sin marcaje: color según el tipo (mismo sistema de la celda)
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType) {
        const colors = {
            laboral: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            extra: 'bg-green-50 border-green-200 text-green-800',
            descanso: 'bg-gray-100 border-gray-300 text-gray-700',
            permiso: 'bg-purple-50 border-purple-200 text-purple-700',
            vacaciones: 'bg-cyan-50 border-cyan-200 text-cyan-700',
        };
        return colors[attendanceData.scheduleOverride.workType] || 'bg-gray-50 border-gray-200 text-gray-700';
    }
    if (attendanceData?.status === 'presente') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (attendanceData?.isLate) return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.status === 'falta') return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.isJustified) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
}

function getStatusLabel(attendanceData) {
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType === 'falta') return '✗ Falta asignada';
    // Override asignado sin marcaje: etiqueta según el tipo
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType) {
        const labels = {
            laboral: '✦ Guardia asignada',
            extra: '✦ Día extra asignado',
            descanso: '✦ Descanso asignado',
            permiso: '✦ Permiso asignado',
            vacaciones: '✦ Vacaciones asignadas',
        };
        return labels[attendanceData.scheduleOverride.workType] || '✦ Horario modificado';
    }
    if (attendanceData?.status === 'presente') return '✓ Presente';
    if (attendanceData?.isLate) return '⚠️ Llegada Tarde';
    if (attendanceData?.status === 'falta') return '✗ Falta';
    if (attendanceData?.isJustified) return '✓ Justificado';
    return 'Sin estado';
}

/**
 * Popover de detalles del día. Componente a NIVEL DE MÓDULO con identidad
 * estable: las actualizaciones por socket (p. ej. un comentario nuevo) solo
 * re-renderizan la lista en su lugar — sin desmontar el popover, sin repetir
 * la animación de entrada y sin perder el foco ni el borrador del composer.
 */
function DetailPopover({ attendanceData, user, onClose, onMouseEnter, onMouseLeave, onAddComment, sendingComment, scheduleByDay, dateObj, onDecideOvertime, decidingOvertime }) {
    const { dataSessionState } = useContext(myUserContext);
    const [imageZoom, setImageZoom] = useState(null);

    // Scroll de comentarios siempre anclado abajo (últimos visibles), tanto al
    // abrir como cuando llega un comentario nuevo por socket

    const commentsListRef = useRef(null);
    const commentCount = attendanceData?.comments?.length || 0;
    useEffect(() => {
        const list = commentsListRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [commentCount]);


    const hasOverrideInfo = Boolean(attendanceData?.scheduleOverride?.workType);
    const hasComments = attendanceData?.comments?.length > 0;

    // Unidades a descontar por retardo (discountUnits, calculadas al marcar
    // la entrada): visibles SOLO para Recursos Humanos. Los documentos
    // anteriores a la propiedad no la traen → el bloque no se muestra.
    const isHumanResources = dataSessionState?.dataSession?.jobInformation?.department === 'Recursos Humanos'; // futuras implementaciones
    const discountUnits = Number(attendanceData?.discountUnits) || 0;
    const showDiscountUnits =  discountUnits > 0;

    // ── Horas extras del día ──────────────────────────────────────────
    // Turno efectivo: override del día > regla semanal > turno global.
    // Los minutos se DERIVAN acá (no vienen del servidor), así los días
    // anteriores a esta función también los muestran sin migrar nada.
    const overtimeShift = attendanceData?.scheduleOverride?.shift
        || scheduleByDay?.[String(dateObj?.getDay?.())]?.shift
        || user?.workSchedule?.shiftType
        || 'Diurno';
    // El estado lo decide el backend: aprobación automática al registrar la
    // salida, o la decisión de un administrador. Si el registro no trae
    // ninguna, el día se muestra POR APROBAR.
    const overtime = overtimeOfDay(attendanceData, overtimeShift);
    const isAdmin = dataSessionState?.dataSession?.admin === true;
    const overtimeDecider = attendanceData?.overtime?.decidedBy;

    // APROBACIÓN PARCIAL: de las horas que generó el día, cuántas autoriza el
    // administrador. Arranca en el total (aprobar todo es el caso normal) y el
    // servidor rechaza cualquier cantidad mayor a la que el día generó.
    const [minutesToApprove, setMinutesToApprove] = useState(null);
    // Si ya se aprobó una parte, el control arranca en esa cantidad para poder
    // corregirla; si no, en el total.
    const chosenMinutes = minutesToApprove ?? (overtime.isPartial ? overtime.approvedMinutes : overtime.minutes);
    const chosenHours = Math.floor(chosenMinutes / 60);
    const chosenRest = chosenMinutes % 60;

    // Ajusta la cantidad manteniéndola entre 1 minuto y el excedente del día
    const clampMinutes = (value) => Math.max(1, Math.min(overtime.minutes, Math.round(value) || 0));
    const setHoursPart = (h) => setMinutesToApprove(clampMinutes((Number(h) || 0) * 60 + chosenRest));
    const setRestPart = (m) => setMinutesToApprove(clampMinutes(chosenHours * 60 + (Number(m) || 0)));

    if (!attendanceData?.checkIn && !hasOverrideInfo && !hasComments) return null;

    const checkInTime = attendanceData?.checkIn ? new Date(attendanceData.checkIn).toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        timeStyle: 'short'
    }) : 'N/A';

    const checkOutTime = attendanceData?.checkOut ? new Date(attendanceData.checkOut).toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        timeStyle: 'short'
    }) : 'N/A';

    const images = attendanceData?.imageReference || [];
    const workDuration = calculateWorkDuration(attendanceData);

    // El documento creado por el propio marcaje del empleado (bioJarvis) no
    // cuenta como creación administrativa: solo se muestra lo hecho desde
    // este frontend (creador distinto al empleado, ediciones, comentarios)
    const isSelfCreated = String(attendanceData?.createdBy?._id || '') === String(user?._id || '');
    const showCreator = Boolean(attendanceData?.createdBy?.name) && !isSelfCreated;

    // Cadena de responsables del documento: el creador y las últimas personas
    // (distintas, máx. 3) que lo modificaron, en orden cronológico
    const auditChain = (() => {
        const chain = [];
        if (showCreator) chain.push({ user: attendanceData.createdBy, role: 'Creó' });
        const seen = new Set();
        const editors = [];
        [...(attendanceData?.editedBy || [])].reverse().forEach((edit) => {
            const id = edit?.user?._id || edit?.user;
            if (!id || seen.has(String(id))) return;
            seen.add(String(id));
            editors.push({ user: edit.user, role: 'Modificó' });
        });
        chain.push(...editors.slice(0, 3).reverse());
        return chain;
    })();


    const content = (
        <div
            className='fixed inset-0 z-[999] flex items-center justify-center p-4'
            onClick={onClose}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            // Los eventos del portal burbujean por el árbol de REACT hasta la
            // celda de la grilla: sin esto, un click dentro del popover dispara
            // la selección por arrastre (onMouseDown de la celda) y el padre
            // re-renderiza.
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'none' }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className='bg-white rounded-xl shadow-2xl border border-gray-300 p-6 max-w-md w-full'
                style={{ animation: 'slideUp 0.3s ease-out', pointerEvents: 'auto' }}
            >
                {/* Header: foto + identidad + cierre */}
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                        {user?.img
                            ? <img src={thumbUrl(user.img, 96)} className='w-full h-full object-cover' alt='' />
                            : <span className='text-xs font-bold text-slate-600'>{user?.name?.[0]}{user?.surName?.[0]}</span>}
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h3 className='text-base font-bold text-gray-900 leading-tight truncate'>{user?.name} {user?.surName}</h3>
                        <p className='text-[11px] text-gray-500 truncate'>
                            {user?.dni || 'Sin cédula'} · {user?.jobInformation?.department || 'Sin depto'} · {user?.jobInformation?.position || 'Sin cargo'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0'
                    >
                        ×
                    </button>
                </div>

                <div className='space-y-3'>
                    {/* Estado + duración en una sola fila */}
                    <div className='flex items-center gap-2'>
                        <div className={`flex-1 px-2.5 py-1.5 rounded border text-xs font-semibold ${getStatusColor(attendanceData)}`}>
                            {getStatusLabel(attendanceData)}
                        </div>
                        {workDuration && (
                            <div className='px-2.5 py-1.5 rounded border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 whitespace-nowrap'>
                                {workDuration}
                            </div>
                        )}
                        {showDiscountUnits && (
                            <div
                                className='flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-rose-200 bg-rose-50 whitespace-nowrap'
                                title='Unidades a descontar por la llegada tarde de este día'
                            >
                                <span className='text-[10px] font-black uppercase tracking-wider text-rose-500'>
                                    Llegada tarde
                                </span>
                                <span className='text-xs font-bold text-rose-700'>
                                    −{discountUnits} {discountUnits === 1 ? 'unidad' : 'unidades'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Horas extras del día ──────────────────────────────
                        Solo aparece si el día generó excedente sobre la jornada
                        base (9h diurno / 12h nocturno). Los botones de decisión
                        son exclusivos de administradores; el backend lo vuelve
                        a exigir, así que ocultarlos es solo la guía visual. */}
                    {overtime.minutes > 0 && (
                        <div className={`rounded-lg border p-3 ${
                            overtime.status === 'approved' ? 'border-emerald-300 bg-emerald-50'
                            : overtime.status === 'rejected' ? 'border-red-300 bg-red-50'
                            : 'border-blue-300 bg-blue-50'
                        }`}>
                            <div className='flex items-center gap-2 mb-1.5'>
                                <p className='text-xs font-black uppercase tracking-wider text-gray-600'>Horas extras</p>
                                {/* Aprobada en parte: se muestra "1h de 3h" para que
                                    no se confunda lo autorizado con lo que generó el día */}
                                <span className={`ml-auto text-[15px] font-black ${
                                    overtime.status === 'approved' ? 'text-emerald-700'
                                    : overtime.status === 'rejected' ? 'text-red-600 line-through'
                                    : 'text-blue-700'
                                }`}>
                                    {overtime.isPartial
                                        ? <>{formatOvertime(overtime.approvedMinutes)}<span className='text-[11px] font-bold text-gray-500'>{` de ${formatOvertime(overtime.minutes)}`}</span></>
                                        : formatOvertime(overtime.minutes)}
                                </span>
                            </div>

                            <div className='flex items-center gap-2 flex-wrap'>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${
                                    overtime.status === 'approved' ? 'bg-emerald-600'
                                    : overtime.status === 'rejected' ? 'bg-red-600'
                                    : 'bg-blue-600'
                                }`}>
                                    {OVERTIME_LABEL[overtime.status]}
                                </span>

                                {/* Aviso de que no se autorizó el excedente completo */}
                                {overtime.isPartial && (
                                    <span className='text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300'>
                                        Parcial
                                    </span>
                                )}

                                {/* Quién decidió: automática por configuración, o el admin */}
                                {overtime.auto ? (
                                    <span className='text-[11px] text-gray-500'>automática por configuración</span>
                                ) : overtimeDecider?.name ? (
                                    <span className='flex items-center gap-1.5 text-[11px] text-gray-600'>
                                        <MiniAvatar user={overtimeDecider} />
                                        {`${overtimeDecider.name} ${overtimeDecider.surName || ''}`.trim()}
                                        {overtime.decidedAt && (
                                            <span className='text-gray-400'>
                                                {' · '}
                                                {new Date(overtime.decidedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        )}
                                    </span>
                                ) : null}
                            </div>

                            {/* Acciones del administrador. Solo se ofrece lo que
                                cambia algo: si ya está aprobada (a mano o de
                                forma automática) sobra el botón de aprobar, y
                                si está rechazada sobra el de rechazar. */}
                            {isAdmin && (
                                <>
                                    {/* Cuánto autorizar. Aparece si el día generó más de
                                        un minuto y queda algo que decidir: o no está
                                        aprobado, o lo está en parte y se puede corregir
                                        la cantidad sin tener que rechazarlo antes. */}
                                    {overtime.minutes > 1 && (overtime.status !== 'approved' || overtime.isPartial) && (
                                        <div className='flex items-center gap-1.5 mt-2.5 flex-wrap'>
                                            <span className='text-[10px] font-black uppercase tracking-wider text-gray-500'>Aprobar</span>

                                            <input
                                                type='number'
                                                min={0}
                                                max={Math.floor(overtime.minutes / 60)}
                                                value={chosenHours}
                                                disabled={decidingOvertime}
                                                onChange={e => setHoursPart(e.target.value)}
                                                className='w-11 h-6 px-1 text-center text-[12px] font-bold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#29c50c] disabled:opacity-60'
                                                aria-label='Horas a aprobar'
                                            />
                                            <span className='text-[11px] font-bold text-gray-500'>h</span>

                                            <input
                                                type='number'
                                                min={0}
                                                max={59}
                                                value={chosenRest}
                                                disabled={decidingOvertime}
                                                onChange={e => setRestPart(e.target.value)}
                                                className='w-11 h-6 px-1 text-center text-[12px] font-bold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#29c50c] disabled:opacity-60'
                                                aria-label='Minutos a aprobar'
                                            />
                                            <span className='text-[11px] font-bold text-gray-500'>m</span>

                                            {/* Vuelve al excedente completo */}
                                            {chosenMinutes !== overtime.minutes && (
                                                <button
                                                    type='button'
                                                    disabled={decidingOvertime}
                                                    onClick={() => setMinutesToApprove(null)}
                                                    className='text-[10px] font-bold text-[#1f9a08] underline underline-offset-2 hover:text-[#29c50c] disabled:opacity-60'
                                                >
                                                    todo ({formatOvertime(overtime.minutes)})
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className='flex gap-2 mt-2'>
                                        {/* Sobre un día ya aprobado solo se ofrece si la
                                            cantidad elegida cambia algo */}
                                        {(overtime.status !== 'approved' || chosenMinutes !== overtime.approvedMinutes) && (
                                            <button
                                                type='button'
                                                disabled={decidingOvertime}
                                                // Solo se manda la cantidad cuando NO es el total:
                                                // así el registro no queda atado a un excedente
                                                // que puede recalcularse si se corrige el marcaje.
                                                onClick={() => onDecideOvertime?.('approved', chosenMinutes === overtime.minutes ? null : chosenMinutes)}
                                                className='flex-1 px-2 py-1.5 rounded text-[11px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors disabled:opacity-60'
                                            >
                                                {decidingOvertime
                                                    ? 'Guardando…'
                                                    : `${overtime.status === 'approved' ? 'Cambiar a' : 'Aprobar'} ${formatOvertime(chosenMinutes) || ''}`.trim()}
                                            </button>
                                        )}
                                        {overtime.status !== 'rejected' && (
                                            <button
                                                type='button'
                                                disabled={decidingOvertime}
                                                onClick={() => onDecideOvertime?.('rejected')}
                                                className='flex-1 px-2 py-1.5 rounded text-[11px] font-bold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60'
                                            >
                                                {decidingOvertime ? 'Guardando…' : (overtime.auto ? 'Rechazar de todos modos' : 'Rechazar')}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Comentarios (destacados, a juego con la muesca dorada) ──
                        Visible con comentarios, o vacía para que un usuario super
                        pueda dejar el primero */}
                    {(attendanceData?.comments?.length > 0 || dataSessionState?.dataSession?.super === true) && (
                        <div className='rounded-lg border-2 border-amber-300 bg-amber-50 p-3'>
                            <div className='flex items-center gap-2 mb-2'>
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#b45309' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
                                    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                                </svg>
                                <p className='text-xs font-black uppercase tracking-wider text-amber-800'>Comentarios</p>
                                <span className='ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#f0a500] text-white text-[10px] font-black flex items-center justify-center'>
                                    {attendanceData?.comments?.length || 0}
                                </span>
                            </div>
                            {(attendanceData?.comments?.length > 0) ? (
                            <div ref={commentsListRef} className='space-y-2 max-h-44 overflow-y-auto pr-1'>
                                {attendanceData.comments.map((comment, i) => (
                                    <div key={i} className='flex items-start gap-2 bg-white/70 border border-amber-100 rounded-md px-2 py-1.5'>
                                        <MiniAvatar user={comment.user} />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-[11px] font-semibold text-gray-800'>
                                                {comment.user?.name
                                                    ? `${comment.user.name} ${comment.user.surName || ''}`.trim()
                                                    : 'Admin'}
                                                {comment.date && (
                                                    <span className='text-gray-400 font-normal'>
                                                        {' · '}
                                                        {new Date(comment.date).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                )}
                                            </p>
                                            <p className='text-xs text-gray-700 whitespace-pre-wrap break-words'>{comment.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <p className='text-[11px] italic text-amber-700/80'>Sin comentarios aún — deja el primero.</p>
                            )}

                            {/* Agregar comentario en línea (solo usuarios super) */}
                            {dataSessionState?.dataSession?.super === true && (
                                <CommentComposer onSubmit={onAddComment} sending={sendingComment} />
                            )}
                        </div>
                    )}

                    {/* Entrada / Salida lado a lado — solo con marcaje registrado */}
                    {attendanceData?.checkIn && (
                        <div className='grid grid-cols-2 gap-2'>
                            <div className='bg-emerald-50 p-2.5 rounded border border-emerald-200'>
                                <p className='text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-0.5'>Entrada</p>
                                <p className='text-sm text-emerald-900 font-bold'>{checkInTime}</p>
                                {images?.[0] && (
                                    <img
                                        src={images[0]}
                                        alt='entrada'
                                        className='w-full h-24 object-cover rounded mt-2 cursor-pointer hover:opacity-80'
                                        onClick={() => setImageZoom(images[0])}
                                        onError={(e) => e.target.src = '/ico/icons8-usuario-masculino-en-círculo-96.png'}
                                    />
                                )}
                            </div>

                            <div className='bg-orange-50 p-2.5 rounded border border-orange-200'>
                                <p className='text-[10px] text-orange-700 font-bold uppercase tracking-wider mb-0.5'>Salida</p>
                                <p className='text-sm text-orange-900 font-bold'>{checkOutTime}</p>
                                {images?.[1] && (
                                    <img
                                        src={images[1]}
                                        alt='salida'
                                        className='w-full h-24 object-cover rounded mt-2 cursor-pointer hover:opacity-80'
                                        onClick={() => setImageZoom(images[1])}
                                        onError={(e) => e.target.src = '/ico/icons8-usuario-masculino-en-círculo-96.png'}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Auditoría: quién creó el documento y quién lo editó (solo acciones del frontend) */}
                    {(showCreator || attendanceData?.editedBy?.length > 0) && (
                        <div className='bg-gray-50 p-3 rounded border border-gray-200 space-y-2'>
                            {/* Cadena de responsables (con más de un cambio): creador → últimos en modificar */}
                            {attendanceData?.editedBy?.length > 1 && auditChain.length > 1 && (
                                <div className='flex items-center gap-1 flex-wrap pb-2 border-b border-gray-200'>
                                    {auditChain.map((person, i) => (
                                        <div key={i} className='flex items-center gap-1'>
                                            {i > 0 && <span className='text-gray-300 text-[11px] font-bold'>→</span>}
                                            <div
                                                className='flex items-center gap-1.5 bg-white border border-gray-200 rounded-full pl-0.5 pr-2 py-0.5'
                                                title={person.role}
                                            >
                                                <MiniAvatar user={person.user} />
                                                <span className='text-[10px] font-semibold text-gray-700 max-w-[80px] truncate'>
                                                    {person.user?.name
                                                        ? `${person.user.name} ${person.user.surName || ''}`.trim()
                                                        : 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showCreator && (
                                <div className='flex items-center gap-2'>
                                    <MiniAvatar user={attendanceData.createdBy} />
                                    <p className='text-xs text-gray-600 truncate'>
                                        <span className='font-semibold'>Creado por:</span>{' '}
                                        {attendanceData.createdBy.name} {attendanceData.createdBy.surName || ''}
                                    </p>
                                </div>
                            )}
                            {[...(attendanceData?.editedBy || [])].slice(-3).reverse().map((edit, i) => (
                                <div key={i} className='flex items-center gap-2 flex-wrap'>
                                    <MiniAvatar user={edit.user} />
                                    <p className='text-xs text-gray-600'>
                                        <span className='font-semibold'>Editado por:</span>{' '}
                                        {edit.user?.name ? `${edit.user.name} ${edit.user.surName || ''}`.trim() : 'Admin'}
                                        {edit.date && (
                                            <span className='text-gray-400'>
                                                {' · '}
                                                {new Date(edit.date).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        )}
                                    </p>
                                    <span className='flex flex-wrap gap-1'>
                                        {(edit.change || []).map((change, idx) => {
                                            // Entradas nuevas: {field, from, to}. Antiguas: string con el campo.
                                            const isDetailed = change && typeof change === 'object';
                                            const field = isDetailed ? change.field : change;
                                            return (
                                                <span key={idx} className='bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px] font-semibold text-gray-500'>
                                                    {OVERRIDE_FIELD_LABELS[field] || field}
                                                    {isDetailed && (
                                                        <>
                                                            {': '}
                                                            <span className='text-gray-400 line-through'>{change.from ?? '—'}</span>
                                                            {' → '}
                                                            <span className='text-gray-700'>{change.to ?? '—'}</span>
                                                        </>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </span>
                                </div>
                            ))}
                            {attendanceData?.editedBy?.length > 3 && (
                                <p className='text-[10px] text-gray-400'>+{attendanceData.editedBy.length - 3} ediciones anteriores</p>
                            )}
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
}



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
    const dispatch = useDispatch();




    const remplazeUrl = (url) => {
        if (!url) return null;
        return url;
        return 'https://amazona365.ddns.net:3006' + url.split('https://amazona365.ddns.net')[1]
    };



    // La `ref` va al NODO de la fila (más abajo, en el contenedor).
    //
    // Antes había acá un useImperativeHandle que exponía { updateUserInList },
    // apuntando a una función vacía que nadie llamaba. El efecto real era que
    // `userRefs.current[id]` en /user no era un elemento sino ese objeto: al
    // llegar desde una notificación, `fila.scrollIntoView(...)` reventaba la
    // página entera con un error de cliente.


    // Cerrojo contra el doble submit de las acciones del menú contextual.
    // Cada acción usa su propia clave, así designar guardia no bloquea asignar
    // jornada. Ver useSubmitLock: el cerrojo es un ref porque el estado no se
    // actualiza a tiempo para frenar el segundo clic de un doble clic.
    const { run: runLocked } = useSubmitLock();



    // Context menu state
    const {
        position: contextMenuPosition,
        handleContextMenu,
        closeMenu: closeContextMenu
    } = useContextMenuPosition();



    const [contextMenuUser, setContextMenuUser] = useState(null);

    // Modal de calendario con el horario completo del operador
    const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);

    // Modal para agregar un comentario sobre el día de un operador
    const [showCommentForm, setShowCommentForm] = useState(false);
    // Modal del patrón semanal aplicado al MES SIGUIENTE (overrides por fecha)
    const [showNextMonthForm, setShowNextMonthForm] = useState(false);

    // Fecha de la celda donde ocurrió el click derecho (null si fue sobre el nombre)
    const [contextMenuDate, setContextMenuDate] = useState(null);

    // Modal para asignar guardia/extra sobre la fecha clickeada ('laboral' | 'extra' | null)
    const [assignFormMode, setAssignFormMode] = useState(null);

    // Handler para click derecho
    const onUserContextMenu = (e) => {
        handleContextMenu(e);
        setContextMenuUser(user);
        const cell = e.target?.closest?.('[data-dateiso]');
        setContextMenuDate(cell ? new Date(cell.getAttribute('data-dateiso')) : null);
    };

    // Info del día clickeado: tipo efectivo (override en caché > regla semanal),
    // si la jornada ya está cerrada (con hora de salida marcada) y si el
    // usuario tiene la guardia del día (onDuty) en esa fecha.
    const getMenuDayInfo = () => {
        if (!contextMenuDate) return { type: null, closed: false, onDuty: false, auxiliary: false };
        const normalized = new Date(contextMenuDate);
        normalized.setHours(0, 0, 0, 0);
        const cached = attendanceCache.get(`${userState?.dni}-${normalized.toISOString()}`);
        const rule = userState?.workSchedule?.scheduleByDay?.[String(normalized.getDay())];
        return {
            type: cached?.scheduleOverride?.workType || rule?.workType || 'laboral',
            closed: Boolean(cached?.checkOut),
            onDuty: Boolean(cached?.onDuty),
            auxiliary: Boolean(cached?.auxiliary),
        };
    };
    const { type: menuDayType, closed: menuDayClosed, onDuty: menuDayOnDuty, auxiliary: menuDayAuxiliary } = getMenuDayInfo();

    // Departamentos habilitados para la guardia del día (igual que el backend)
    const ONDUTY_DEPARTMENTS = ['Operaciones', 'Reportes', 'Sistemas y desarrollo'];
    const canHaveOnDuty = ONDUTY_DEPARTMENTS.includes(userState?.jobInformation?.department);

    // Designa o quita la guardia del día para la fecha clickeada.
    // Cada acción lleva su propia clave de cerrojo: designar guardia y designar
    // auxiliar son independientes y no tienen por qué bloquearse entre sí.
    const toggleOnDutyGuard = (onDuty) => runLocked(async () => {
        try {
            const dateObj = new Date(contextMenuDate);
            dateObj.setHours(0, 0, 0, 0);
            await setOnDutyGuard({
                userId: userState._id,
                dni: userState.dni,
                date: dateObj.toISOString(),
                onDuty,
            });
            // La celda se refresca sola por el evento socket del backend
            dispatch(setConfigModal({
                type: 'successfull',
                title: onDuty ? 'Encargado de turno designado' : 'Encargado de turno retirado',
                description: onDuty
                    ? `${userState?.name} queda como encargado de turno.`
                    : `${userState?.name} ya no es el encargado de turno.`,
                modalOpen: true,
            }));
            return true;
        } catch (error) {
            console.error('Error asignando guardia del día:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo asignar',
                description: error?.response?.data?.message || 'Hubo un problema al asignar la guardia. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'onDuty');

    // Designa o quita el auxiliar del día para la fecha clickeada
    const toggleAuxiliaryRole = (auxiliary) => runLocked(async () => {
        try {
            const dateObj = new Date(contextMenuDate);
            dateObj.setHours(0, 0, 0, 0);
            await setAuxiliaryRole({
                userId: userState._id,
                dni: userState.dni,
                date: dateObj.toISOString(),
                auxiliary,
            });
            // La celda se refresca sola por el evento socket del backend
            dispatch(setConfigModal({
                type: 'successfull',
                title: auxiliary ? 'Auxiliar designado' : 'Auxiliar retirado',
                description: auxiliary
                    ? `${userState?.name} queda como auxiliar del día.`
                    : `${userState?.name} ya no es auxiliar del día.`,
                modalOpen: true,
            }));
            return true;
        } catch (error) {
            console.error('Error asignando auxiliar del día:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo asignar',
                description: error?.response?.data?.message || 'Hubo un problema al asignar el auxiliar. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'auxiliary');

    // Guarda un override de jornada para la fecha clickeada (mismo endpoint que "Editar grupo")
    const saveDayOverride = (args) => runLocked(async () => {
        const { workType, shift = null, startTime = null, endTime = null, note = null, from = null, to = null } = args || {};
        try {
            // Fechas objetivo: rango completo para vacaciones (un documento por
            // día), o solo el día donde se hizo click derecho
            let dates = [];
            if (workType === 'vacaciones' && from && to) {
                const start = new Date(`${from}T00:00:00.000Z`);
                const end = new Date(`${to}T00:00:00.000Z`);
                const MAX_DAYS = 62;
                for (let d = new Date(start); d <= end && dates.length < MAX_DAYS; d.setUTCDate(d.getUTCDate() + 1)) {
                    dates.push(new Date(d).toISOString());
                }
                if (dates.length === 0) throw new Error('El rango de fechas de las vacaciones no es válido.');
            } else {
                const dateObj = new Date(contextMenuDate);
                dateObj.setHours(0, 0, 0, 0);
                dates = [dateObj.toISOString()];
            }

            const response = await saveGroupDynamicSchedule({
                updates: dates.map((dateISO) => ({
                    userId: userState._id,
                    dni: userState.dni,
                    date: dateISO,
                    workType,
                    shift,
                    startTime,
                    endTime,
                    note,
                })),
                adminUserId: dataSessionState?.dataSession?._id,
            });

            // El endpoint responde 200 aunque el item falle: revisar los errores
            const itemErrors = response?.data?.errors || [];
            if (itemErrors.length > 0) throw new Error(itemErrors[0]?.error || 'No se pudo guardar el horario');

            const DESCRIPTIONS = {
                descanso: 'Día marcado como descanso/libre.',
                laboral: 'Guardia asignada para la fecha.',
                extra: 'Día extra asignado para la fecha.',
                permiso: 'Permiso asignado con su comentario.',
                vacaciones: `Vacaciones asignadas (${dates.length} día${dates.length !== 1 ? 's' : ''}).`,
                falta: 'Día marcado como falta.',
            };
            dispatch(setConfigModal({
                type: 'successfull',
                title: 'Horario actualizado',
                description: DESCRIPTIONS[workType] || 'Cambio de horario guardado.',
                modalOpen: true,
            }));
            // La celda se refresca sola por el evento socket del backend
            return true;
        } catch (error) {
            console.error('Error asignando jornada:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo guardar',
                description: error?.response?.data?.message || error?.message || 'Hubo un problema al guardar el horario. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'dayOverride');


    if (user.workSchedule.outForkSchedule) return null;



    return (
        <>
            <div
                ref={ref}
                data-userid={user._id}
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
                            {userState?.createdOn && (
                                <p className='text-[9px] md:text-[10px] font-semibold text-gray-400 leading-tight truncate'>
                                    Ingreso: {new Date(userState.createdOn).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                        {/* Tuerca de edición — visible solo para administradores */}
                        {dataSessionState?.dataSession?.admin === true && (
                            <button
                                onClick={() => {
                                    onClearSelectedDates?.();
                                    onEditClick(userState);
                                }}
                                className='absolute top-[5px] right-[5px] pointer'>
                                <img className='w-[30px] opacity-30 hover:opacity-100' src='/ico/icons8-configuración-48.png' alt='config-ico-09' />
                            </button>
                        )}
                    </div>

                </div>

                {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
                {user && daysRange.map((day) => {
                    return (
                        <div
                            key={`${user._id}-${day.fullDateISO}`}
                            data-dateiso={day.fullDateISO}
                            /* Coordenadas de la celda para poder encontrarla desde
                               fuera: es como /user?userId=…&date=… la localiza al
                               llegar desde una notificación, sin tener que pasar una
                               ref por cada una de las más de dos mil celdas. */
                            data-userid={user._id}
                            data-daykey={dayKeyOf(day.dateObj)}
                            onMouseDown={(event) => onStartDragSelection?.(day.fullDateISO, event.button)}
                            onMouseEnter={() => onDragOverCell?.(day.fullDateISO)}
                            className={`flex-shrink-0 w-24 p-1 border-r border-gray-300 flex items-center justify-center cursor-pointer
                            ${day.isToday ? 'bg-blue-50/20 shadow-[inset_3px_0_0_#3b82f6,inset_-3px_0_0_#3b82f6]' : ''}
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
                    {/* Cabecera: empleado sobre el que se abrió el menú */}
                    <p className='px-3 pt-1.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[210px] border-b border-gray-100 mb-1'>
                        {contextMenuUser?.name} {contextMenuUser?.surName}
                    </p>

                    <button
                        role='menuitem'
                        className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                        onClick={() => {
                            closeContextMenu();
                            setShowScheduleCalendar(true);
                        }}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                            <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                            <line x1='16' y1='2' x2='16' y2='6'></line>
                            <line x1='8' y1='2' x2='8' y2='6'></line>
                            <line x1='3' y1='10' x2='21' y2='10'></line>
                        </svg>
                        Ver horario
                    </button>

                    <button
                        role='menuitem'
                        className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                        onClick={() => {
                            closeContextMenu();
                            onEditClick?.(contextMenuUser);
                        }}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                            <path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'></path>
                            <path d='m15 5 4 4'></path>
                        </svg>
                        Editar usuario
                    </button>

                    {/* Patrón semanal del mes siguiente — modifica: solo administradores */}
                    {dataSessionState?.dataSession?.admin === true && (
                        <button
                            role='menuitem'
                            className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                            onClick={() => {
                                closeContextMenu();

                                // Regla: sin cargo, departamento y horario por
                                // defecto no se puede proyectar el mes siguiente.
                                // 'Sin definir' cuenta como no establecido.
                                const position = userState?.jobInformation?.position;
                                const department = userState?.jobInformation?.department;
                                const scheduleByDay = userState?.workSchedule?.scheduleByDay || {};
                                const hasDefaultSchedule = Object.values(scheduleByDay)
                                    .some(rule => rule && (rule.workType || rule.startTime));

                                const missingValues = [];
                                if (!position || position === 'Sin definir') missingValues.push('el cargo');
                                if (!department || department === 'Sin definir') missingValues.push('el departamento');
                                if (!hasDefaultSchedule) missingValues.push('el horario por defecto');

                                if (missingValues.length > 0) {
                                    const listado = missingValues.length > 1
                                        ? `${missingValues.slice(0, -1).join(', ')} y ${missingValues.at(-1)}`
                                        : missingValues[0];
                                    dispatch(setConfigModal({
                                        type: 'error',
                                        title: 'Faltan datos del usuario',
                                        description: `Antes de modificar el mes siguiente debes establecer ${listado} de ${userState?.name} ${userState?.surName} desde "Editar usuario".`,
                                        modalOpen: true,
                                    }));
                                    return;
                                }

                                setShowNextMonthForm(true);
                            }}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                                <line x1='16' y1='2' x2='16' y2='6'></line>
                                <line x1='8' y1='2' x2='8' y2='6'></line>
                                <path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'></path>
                            </svg>
                            Cambiar horario del mes siguiente
                        </button>
                    )}

                    {/* Acciones de jornada (MODIFICAN el dia): solo administradores.
                        No aplican si la jornada ya cerro (checkOut). Comentarios aparte (super). */}
                    {dataSessionState?.dataSession?.admin === true && contextMenuDate && !menuDayClosed && (
                        <>
                            <div className='h-px bg-gray-100 my-1' />

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    saveDayOverride({ workType: 'descanso' });
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'></path>
                                </svg>
                                Marcar descanso
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    saveDayOverride({ workType: 'falta' });
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-400'>
                                    <circle cx='12' cy='12' r='10'></circle>
                                    <path d='m15 9-6 6'></path>
                                    <path d='m9 9 6 6'></path>
                                </svg>
                                Marcar falta
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('laboral');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <circle cx='12' cy='12' r='10'></circle>
                                    <polyline points='12 6 12 12 16 14'></polyline>
                                </svg>
                                Asignar guardia
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('permiso');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'></path>
                                    <path d='M14 2v4a2 2 0 0 0 2 2h4'></path>
                                    <path d='M10 9H8'></path>
                                    <path d='M16 13H8'></path>
                                    <path d='M16 17H8'></path>
                                </svg>
                                Asignar permiso
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('vacaciones');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <circle cx='12' cy='12' r='4'></circle>
                                    <path d='M12 2v2'></path>
                                    <path d='M12 20v2'></path>
                                    <path d='m4.93 4.93 1.41 1.41'></path>
                                    <path d='m17.66 17.66 1.41 1.41'></path>
                                    <path d='M2 12h2'></path>
                                    <path d='M20 12h2'></path>
                                    <path d='m6.34 17.66-1.41 1.41'></path>
                                    <path d='m19.07 4.93-1.41 1.41'></path>
                                </svg>
                                Asignar vacaciones
                            </button>

                            {/* Guardia del día — solo departamentos habilitados */}
                            {canHaveOnDuty && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        // Designar abre el formulario (horario + turno); quitar es directo
                                        if (menuDayOnDuty) toggleOnDutyGuard(false);
                                        else setAssignFormMode('guardia');
                                    }}
                                >
                                    {menuDayOnDuty ? (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-blue-500'>
                                            <path d='M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5'></path>
                                            <path d='M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                            <line x1='2' y1='2' x2='22' y2='22'></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-blue-500'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    )}
                                    {menuDayOnDuty ? 'Quitar encargado de turno' : 'Designar encargado de turno'}
                                </button>
                            )}

                            {/* Auxiliar del día — solo departamentos habilitados */}
                            {canHaveOnDuty && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        // Designar abre el formulario (horario + turno); quitar es directo
                                        if (menuDayAuxiliary) toggleAuxiliaryRole(false);
                                        else setAssignFormMode('auxiliar');
                                    }}
                                >
                                    {menuDayAuxiliary ? (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-500'>
                                            <path d='M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5'></path>
                                            <path d='M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                            <line x1='2' y1='2' x2='22' y2='22'></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-500'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    )}
                                    {menuDayAuxiliary ? 'Quitar auxiliar' : 'Designar auxiliar'}
                                </button>
                            )}

                            {/* Extra: solo cuando el día efectivo es libre/descanso */}
                            {menuDayType === 'descanso' && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        setAssignFormMode('extra');
                                    }}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon>
                                    </svg>
                                    Marcar extra
                                </button>
                            )}
                        </>
                    )}

                    {/* Solo usuarios super y con click derecho sobre una celda de día */}
                    {dataSessionState?.dataSession?.super === true && contextMenuDate && (
                        <button
                            role='menuitem'
                            className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                            onClick={() => {
                                closeContextMenu();
                                setShowCommentForm(true);
                            }}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                            </svg>
                            Agregar comentario
                        </button>
                    )}
                </div>
            </ContextMenu>

            {/* Calendario del horario del operador — portal para escapar del zoom de la grilla */}
            {showScheduleCalendar && typeof window !== 'undefined' && createPortal(
                <UserScheduleCalendar
                    user={userState}
                    onClose={() => setShowScheduleCalendar(false)}
                />,
                document.body
            )}

            {/* Formulario de comentario — guarda en el documento Attendance del día */}
            {showCommentForm && typeof window !== 'undefined' && createPortal(
                <UserCommentForm
                    user={userState}
                    dateObj={contextMenuDate}
                    onCancel={() => setShowCommentForm(false)}
                    onSave={(texto) => runLocked(async () => {
                        try {
                            await addAttendanceComment({
                                userId: userState._id,
                                dni: userState.dni,
                                date: contextMenuDate?.toISOString(),
                                message: texto,
                            });
                            // La celda se refresca sola por el evento socket del backend
                            setShowCommentForm(false);
                        } catch (error) {
                            console.error('Error guardando comentario:', error);
                            // Cerrar el formulario y avisar por el modal global
                            setShowCommentForm(false);
                            dispatch(setConfigModal({
                                type: 'error',
                                title: 'No se pudo guardar',
                                description: error?.response?.status === 403
                                    ? 'No tienes permisos para agregar comentarios (se requiere usuario super).'
                                    : (error?.response?.data?.message || 'Hubo un problema al guardar el comentario. Intenta nuevamente.'),
                                modalOpen: true,
                            }));
                        }
                    }, 'comment')}
                />,
                document.body
            )}

            {/* Patrón semanal → overrides por fecha en TODO el mes siguiente */}
            {showNextMonthForm && typeof window !== 'undefined' && createPortal(
                <UserNextMonthScheduleForm
                    user={userState}
                    onCancel={() => setShowNextMonthForm(false)}
                    onSave={(updates) => runLocked(async () => {
                        try {
                            const response = await saveGroupDynamicSchedule({
                                updates: updates.map(u => ({ ...u, userId: userState._id, dni: userState.dni })),
                                adminUserId: dataSessionState?.dataSession?._id,
                            });
                            const itemErrors = response?.data?.errors || [];
                            if (itemErrors.length > 0) throw new Error(itemErrors[0]?.error || 'No se pudo aplicar el horario');

                            setShowNextMonthForm(false);
                            dispatch(setConfigModal({
                                type: 'successfull',
                                title: 'Horario del mes siguiente aplicado',
                                description: `Se guardaron ${updates.length} día(s) como cambios por fecha. El horario por defecto y el mes en curso no se modificaron.`,
                                modalOpen: true,
                            }));
                            // Las celdas se refrescan solas por los eventos socket del backend
                        } catch (error) {
                            console.error('Error aplicando horario del mes siguiente:', error);
                            dispatch(setConfigModal({
                                type: 'error',
                                title: 'No se pudo aplicar',
                                description: error?.response?.status === 403
                                    ? 'No tienes permisos para modificar horarios (se requiere administrador).'
                                    : (error?.response?.data?.message || error?.message || 'Hubo un problema al guardar. Intenta nuevamente.'),
                                modalOpen: true,
                            }));
                        }
                    }, 'nextMonth')}
                />,
                document.body
            )}

            {/* Formulario para asignar guardia o día extra sobre la fecha clickeada */}
            {assignFormMode && typeof window !== 'undefined' && createPortal(
                <UserDayAssignForm
                    user={userState}
                    dateObj={contextMenuDate}
                    mode={assignFormMode}
                    onCancel={() => setAssignFormMode(null)}
                    onSave={async (payload) => {
                        // Roles del día (guardia/auxiliar): primero fija el horario
                        // laboral del día y luego designa el rol (el backend valida
                        // turno único por departamento)
                        if (payload.workType === 'guardia' || payload.workType === 'auxiliar') {
                            const savedSchedule = await saveDayOverride({
                                workType: 'laboral',
                                shift: payload.shift,
                                startTime: payload.startTime,
                                endTime: payload.endTime,
                            });
                            if (!savedSchedule) return;
                            const designated = payload.workType === 'guardia'
                                ? await toggleOnDutyGuard(true)
                                : await toggleAuxiliaryRole(true);
                            if (designated) setAssignFormMode(null);
                            return;
                        }
                        const saved = await saveDayOverride(payload);
                        if (saved) setAssignFormMode(null);
                    }}
                />,
                document.body
            )}
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