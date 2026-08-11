'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { myUserContext } from '@/contexts/userContext';
import { overtimeOfDay, formatOvertime, OVERTIME_LABEL } from '@/libs/attendance/overtime';
import { thumbUrl } from '@/libs/image';
import MiniAvatar from '@/components/MiniAvatar';
import CommentComposer from './CommentComposer';
import {
    OVERRIDE_FIELD_LABELS, calculateWorkDuration, getStatusColor, getStatusLabel,
} from './attendanceFormat';

/**
 * Popover de detalles del día. Componente a NIVEL DE MÓDULO con identidad
 * estable: las actualizaciones por socket (p. ej. un comentario nuevo) solo
 * re-renderizan la lista en su lugar — sin desmontar el popover, sin repetir
 * la animación de entrada y sin perder el foco ni el borrador del composer.
 */
export default function DetailPopover({ attendanceData, user, onClose, onMouseEnter, onMouseLeave, onAddComment, sendingComment, scheduleByDay, dateObj, onDecideOvertime, decidingOvertime }) {
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
