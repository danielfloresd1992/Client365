import { useState, useEffect, useImperativeHandle, forwardRef, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import useContextMenuPosition from '@/hook/useContextMenuPosition';
import ContextMenu from '@/components/ContextMenu';
import UserScheduleCalendar from './user.schedule.calendar';
import UserCommentForm from './user.comment.form';
import { myUserContext } from '@/contexts/userContext';
import { isSameDay, getDay, isBefore, startOfDay } from 'date-fns';
import { getAttendanceByDate, addAttendanceComment } from '@/libs/ajaxClient/user.fecth';
import { useInView } from 'react-intersection-observer';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';

//import socket from '@/libs/socket/socketIo_jarvis';
import socket from '@/libs/socket/socketIo';
import { continuousColorLegendClasses } from '@mui/x-charts';

const attendanceCache = new Map();
const attendanceRequestCache = new Map();

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
    falta:    { bg: 'bg-red-100',    text: 'text-red-800',    accent: 'text-red-600' },    // Rojo: falta
    extra:    { bg: 'bg-green-100',  text: 'text-green-900',  accent: 'text-green-700' },  // Verde: día extra
    cambio:   { bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'text-yellow-700' }, // Amarillo: cambio de guardia (override)
    descanso: { bg: 'bg-gray-200',   text: 'text-gray-700',   accent: 'text-gray-500' },   // Gris: descanso
    nuevo:    { bg: 'bg-purple-200', text: 'text-purple-950', accent: 'text-purple-700' }, // Morado: empleado con < 1 semana
    guardia:  { bg: 'bg-white',      text: 'text-gray-800',   accent: 'text-teal-600' },   // Blanco: guardia por defecto (modelo user)
    // turno: { bg: 'bg-blue-900',  text: 'text-white',      accent: 'text-blue-200' },   // Azul oscuro: quien lleva el turno (futura implementación)
};

// Foto de perfil en miniatura para la auditoría del popover
function MiniAvatar({ user }) {
    return (
        <div className='w-5 h-5 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
            {user?.img
                ? <img src={user.img} className='w-full h-full object-cover' alt='' />
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
    if (attendanceData?.status === 'presente') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (attendanceData?.isLate) return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.status === 'falta') return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.isJustified) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
}

function getStatusLabel(attendanceData) {
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType === 'falta') return '✗ Falta asignada';
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
function DetailPopover({ attendanceData, user, onClose, onMouseEnter, onMouseLeave, onAddComment, sendingComment }) {
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

    const isFaltaRecord = attendanceData?.scheduleOverride?.workType === 'falta';
    const hasComments = attendanceData?.comments?.length > 0;
    if (!attendanceData?.checkIn && !isFaltaRecord && !hasComments) return null;

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
                            ? <img src={user.img} className='w-full h-full object-cover' alt='' />
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
                    </div>

                    {/* ── Comentarios (destacados, a juego con la muesca dorada) ── */}
                    {attendanceData?.comments?.length > 0 && (
                        <div className='rounded-lg border-2 border-amber-300 bg-amber-50 p-3'>
                            <div className='flex items-center gap-2 mb-2'>
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#b45309' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0'>
                                    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                                </svg>
                                <p className='text-xs font-black uppercase tracking-wider text-amber-800'>Comentarios</p>
                                <span className='ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#f0a500] text-white text-[10px] font-black flex items-center justify-center'>
                                    {attendanceData.comments.length}
                                </span>
                            </div>
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

                    {/* Auditoría: quién creó el documento y quién lo editó */}
                    {(attendanceData?.createdBy?.name || attendanceData?.editedBy?.length > 0) && (
                        <div className='bg-gray-50 p-3 rounded border border-gray-200 space-y-2'>
                            {attendanceData?.createdBy?.name && (
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

    // Modal de calendario con el horario completo del operador
    const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);

    // Modal para agregar un comentario sobre el día de un operador
    const [showCommentForm, setShowCommentForm] = useState(false);

    // Fecha de la celda donde ocurrió el click derecho (null si fue sobre el nombre)
    const [contextMenuDate, setContextMenuDate] = useState(null);

    // Handler para click derecho
    const onUserContextMenu = (e) => {
        handleContextMenu(e);
        setContextMenuUser(user);
        const cell = e.target?.closest?.('[data-dateiso]');
        setContextMenuDate(cell ? new Date(cell.getAttribute('data-dateiso')) : null);
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
                            data-dateiso={day.fullDateISO}
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
                    onSave={async (texto) => {
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
    const closeTimeoutRef = useRef(null);
    const openTimeoutRef = useRef(null);
    const manuallyClosedRef = useRef(false);

    const HOVER_DELAY_MS = 1000;

    const handleOpenDetails = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (manuallyClosedRef.current) return;
        // Abre con marcaje registrado, falta asignada o comentarios del día
        const isFaltaRecord = attendanceData?.scheduleOverride?.workType === 'falta';
        const hasComments = attendanceData?.comments?.length > 0;
        if (!attendanceData?.checkIn && !isFaltaRecord && !hasComments) return;
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

    const handleAddComment = async (message) => {
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
    };


    // Socket: escucha eventos para TODAS las fechas (no solo hoy).
    // Cuando el admin guarda un scheduleOverride desde el formulario grupal,
    // el backend emite un evento por cada celda afectada.
    useEffect(() => {
        const handdlerEventSocket = data => {
            const record = data?.finalRecord || null;
            attendanceCache.set(attendanceCacheKey, record);

            // Mostrar datos si hay checkIn, scheduleOverride asignado o comentarios
            if (record?.checkIn || record?.scheduleOverride?.workType || record?.comments?.length > 0) {
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

                    if (cachedData?.checkIn || cachedData?.scheduleOverride?.workType || cachedData?.comments?.length > 0) {
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

                if (data?.checkIn || data?.scheduleOverride?.workType || data?.comments?.length > 0) {
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
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const isNewEmployee = Boolean(user?.createdOn) && (Date.now() - new Date(user.createdOn).getTime()) < ONE_WEEK_MS;



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
        else if (hasOverride) colorKey = 'cambio';
        else if (isNewEmployee) colorKey = 'nuevo';

        const color = CELL_COLOR_SYSTEM[colorKey];

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
        else if (hasCheckIn) {
            // Marcaje real (hoy o pasado)
            content = (
                <div className='flex flex-col gap-1 w-full max-w-[85px] mx-auto'>
                    {isExtra && (
                        <div className={`text-[10px] font-black uppercase tracking-widest text-center ${color.accent}`}>✦ EXTRA</div>
                    )}
                    <div className='flex justify-between items-center px-1.5'>
                        <span className='text-[10px] font-black text-emerald-600 tracking-tighter'>IN</span>
                        <span className={`text-[13px] md:text-[14px] font-extrabold tracking-tight ${color.text}`}>{formatTimeVE(attendanceData.checkIn)}</span>
                    </div>
                    <div className='flex justify-between items-center px-1.5'>
                        <span className='text-[10px] font-black text-orange-500 tracking-tighter'>OUT</span>
                        <span className={`text-[13px] md:text-[14px] font-extrabold tracking-tight ${color.text}`}>{attendanceData?.checkOut ? formatTimeVE(attendanceData.checkOut) : '--'}</span>
                    </div>
                    {isLateArrival && (
                        <div className='text-[9px] text-red-600 text-center font-black uppercase tracking-widest leading-none'>Tarde</div>
                    )}
                </div>
            );
        }
        else if (isPast && !attendanceData) {
            content = <span className='text-[10px] text-gray-400 text-center'>Sin registros</span>;
        }
        else {
            // Hoy sin marcar todavía, o fecha futura → horario programado
            content = (
                <>
                    <div className={`text-[10px] font-black uppercase tracking-widest text-center mb-0.5 ${color.accent}`}>
                        {isExtra ? '✦ EXTRA' : '✦ Guardia'}
                    </div>
                    <div className={`flex justify-center items-center gap-1 pt-0.5 text-[11px] font-extrabold ${color.text}`}>
                        <span>{startTime || '--:--'}</span>
                        <span>-</span>
                        <span>{endTime || '--:--'}</span>
                    </div>
                </>
            );
        }

        return (
            <div className={`w-full h-full flex flex-col justify-center ${color.bg} ${alertRing}`}>
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
                title={overrideTooltip}
                className={`relative w-full h-full flex flex-col justify-center ${overrideTooltip ? 'cursor-help' : ''} ${attendanceData?.checkIn ? 'cursor-pointer' : ''}`}
            >
                {/* Muesca dorada: el día tiene uno o más comentarios */}
                {attendanceData?.comments?.length > 0 && (
                    <div
                        className='absolute top-0 right-0 z-10 pointer-events-none'
                        style={{ borderTop: '15px solid #f0a500', borderLeft: '15px solid transparent' }}
                    />
                )}
                <div style={{ pointerEvents: 'none' }} className='w-full h-full flex flex-col justify-center'>
                    {renderDaySchedule()}
                </div>

                {isLoadingDetails && (
                    <div
                        className='absolute top-1 right-1 z-20 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm border border-blue-200'
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
                />
            )}
        </>
    );

}// 26 749 038