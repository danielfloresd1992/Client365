'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAttendanceReport } from '@/libs/ajaxClient/user.fecth';

const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Tipos de jornada que no llevan hora de entrada/salida */
const NO_TIME_TYPES = new Set(['descanso', 'permiso', 'vacaciones', 'falta']);

/** Paleta por workType — misma familia de colores que el formulario grupal */
const TYPE_STYLES = {
    laboral:    { badge: 'bg-emerald-100 text-emerald-700', cell: 'bg-white',        label: 'Laboral' },
    extra:      { badge: 'bg-indigo-100 text-indigo-700',   cell: 'bg-indigo-50/40', label: 'Extra' },
    descanso:   { badge: 'bg-orange-100 text-orange-700',   cell: 'bg-orange-50/40', label: 'Descanso' },
    permiso:    { badge: 'bg-purple-100 text-purple-700',   cell: 'bg-purple-50/40', label: 'Permiso' },
    vacaciones: { badge: 'bg-cyan-100 text-cyan-700',       cell: 'bg-cyan-50/40',   label: 'Vacaciones' },
    falta:      { badge: 'bg-red-100 text-red-700',         cell: 'bg-red-50/40',    label: 'Falta' },
};

/** Formatea un ISO date string a hora Venezuela (24h) */
const formatTimeVE = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Caracas'
    }).format(new Date(dateStr));
};

/**
 * Modal de solo lectura con el horario mensual completo de un operador.
 *
 * Muestra por día: la regla por defecto (workSchedule.scheduleByDay), el
 * override si el admin modificó ese día (scheduleOverride), el registro de
 * asistencia (entrada/salida, retardo, falta) y quién hizo cada modificación
 * (scheduleOverride.note). Toda la data del mes llega en UNA sola petición
 * (getAttendanceReport), no una por celda como en la grilla.
 */
export default function UserScheduleCalendar({ user, onClose }) {

    const [pivotDate, setPivotDate] = useState(new Date());
    const [reportData, setReportData] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const year = pivotDate.getFullYear();
    const month = pivotDate.getMonth();

    const loadMonth = useCallback(async () => {
        setStatus('loading');
        try {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const mm = String(month + 1).padStart(2, '0');
            const from = `${year}-${mm}-01`;
            const to = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`;
            const data = await getAttendanceReport(user._id, from, to);
            setReportData(data);
            setStatus('ready');
        } catch (error) {
            console.error('Error cargando horario del operador:', error);
            setStatus('error');
        }
    }, [user._id, year, month]);

    useEffect(() => { loadMonth(); }, [loadMonth]);

    // Mapa fecha UTC-midnight ISO → registro de asistencia
    const recordMap = useMemo(() => {
        const map = new Map();
        (reportData?.records || []).forEach(r => map.set(new Date(r.date).toISOString(), r));
        return map;
    }, [reportData]);

    const scheduleByDay = reportData?.user?.workSchedule?.scheduleByDay || null;

    // Celdas del calendario: nulls iniciales para alinear el día 1 con su columna
    const calendarCells = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const cells = Array.from({ length: firstDow }, () => null);
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push(new Date(Date.UTC(year, month, d)).toISOString());
        }
        return cells;
    }, [year, month]);

    const now = new Date();
    const todayKey = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();

    const monthLabel = useMemo(() => {
        const label = format(pivotDate, 'MMMM yyyy', { locale: es });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, [pivotDate]);

    const summary = reportData?.summary;

    const renderDayCell = (dayKey) => {
        const dayNumber = new Date(dayKey).getUTCDate();
        const dow = String(new Date(dayKey).getUTCDay());
        const rule = scheduleByDay?.[dow] || null;
        const record = recordMap.get(dayKey) || null;
        const override = record?.scheduleOverride?.workType ? record.scheduleOverride : null;

        const type = override?.workType || rule?.workType || 'laboral';
        const style = TYPE_STYLES[type] || TYPE_STYLES.laboral;
        const noTime = NO_TIME_TYPES.has(type);
        const startTime = override?.startTime || rule?.startTime || null;
        const endTime = override?.endTime || rule?.endTime || null;

        const isToday = dayKey === todayKey;
        const isPast = dayKey < todayKey;

        // Quién modificó este día (última nota del override)
        const lastNote = override?.note?.length ? override.note[override.note.length - 1] : null;
        const modifierName = lastNote?.user?.name
            ? `${lastNote.user.name} ${lastNote.user.surName || ''}`.trim()
            : (override ? 'Admin' : null);
        const modifierTooltip = lastNote
            ? `${lastNote.message || 'Cambio de horario'}\n${lastNote.date ? new Date(lastNote.date).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' }) : ''}`
            : '';

        // Estado de asistencia del día
        const isFalta = type === 'falta' || record?.status === 'ausente';
        const hasCheckIn = Boolean(record?.checkIn);

        // Fondo de la celda: falta (rojo) > llegada tarde (rosado, como la grilla) > color del tipo
        const cellBg = isFalta
            ? 'bg-red-200/70'
            : (record?.isLate ? 'bg-[#ffdbdb]' : style.cell);

        return (
            <div
                key={dayKey}
                className={`min-h-[92px] border-r border-b border-gray-200 [&:nth-child(7n)]:border-r-0 p-1.5 flex flex-col gap-1 ${cellBg} ${isToday ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
            >
                {/* Número de día + marca de modificado */}
                <div className='flex items-center justify-between'>
                    <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-700' : 'text-gray-600'}`}>{dayNumber}</span>
                    {override && (
                        <span className='text-[9px] font-black text-indigo-500' title='Día modificado por un administrador'>✦</span>
                    )}
                </div>

                {/* Tipo de jornada */}
                <span className={`self-start text-[9px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 ${style.badge}`}>
                    {style.label}
                </span>

                {/* Horario programado */}
                {!noTime && (startTime || endTime) && (
                    <span className='text-[10px] font-semibold text-gray-600'>
                        {startTime || '--:--'} – {endTime || '--:--'}
                    </span>
                )}

                {/* Asistencia real */}
                {hasCheckIn ? (
                    <div className='flex flex-col gap-0.5'>
                        <div className='flex items-center justify-between bg-white/80 border border-gray-100 rounded px-1'>
                            <span className='text-[8px] font-black text-emerald-600'>IN</span>
                            <span className='text-[10px] font-extrabold text-gray-800'>{formatTimeVE(record.checkIn)}</span>
                        </div>
                        <div className='flex items-center justify-between bg-white/80 border border-gray-100 rounded px-1'>
                            <span className='text-[8px] font-black text-orange-500'>OUT</span>
                            <span className='text-[10px] font-extrabold text-gray-800'>{record.checkOut ? formatTimeVE(record.checkOut) : '--'}</span>
                        </div>
                        {record.isLate && (
                            <span className='text-[8px] font-black uppercase tracking-widest text-red-600'>Tarde</span>
                        )}
                    </div>
                ) : isFalta ? (
                    <span className='text-[9px] font-black uppercase tracking-wider text-red-600'>{type === 'falta' ? 'Falta' : 'Ausente'}</span>
                ) : (isPast && !noTime) ? (
                    <span className='text-[9px] text-gray-400'>Sin registro</span>
                ) : null}

                {/* Quién modificó */}
                {modifierName && (
                    <span className='mt-auto text-[8.5px] text-gray-400 truncate cursor-help' title={modifierTooltip}>
                        por <span className='font-semibold text-gray-500'>{modifierName}</span>
                    </span>
                )}
            </div>
        );
    };

    return (
        <div
            className='fixed inset-0 z-[1005] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
            onClick={onClose}
        >
            <div
                className='bg-white rounded-xl shadow-2xl border w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden'
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className='px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3'>
                    <div className='w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                        {user?.img
                            ? <img src={user.img} className='w-full h-full object-cover' alt='' />
                            : <span className='text-[11px] font-bold text-slate-600'>{user?.name?.[0]}{user?.surName?.[0]}</span>}
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-sm font-bold text-gray-800 leading-tight truncate'>Horario: {user?.name} {user?.surName}</h2>
                        <p className='text-[11px] text-gray-500 truncate'>
                            {user?.dni || 'Sin cédula'} · {user?.jobInformation?.position || 'Sin cargo'} · Turno {user?.workSchedule?.shiftType || 'Sin definir'}
                        </p>
                    </div>

                    {/* Navegación de mes */}
                    <div className='flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-8'>
                        <button type='button' onClick={() => setPivotDate(subMonths(pivotDate, 1))} aria-label='Mes anterior'
                            className='h-full px-2.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors font-medium'>
                            Ant.
                        </button>
                        <div className='h-4 w-[1px] bg-gray-200'></div>
                        <div className='px-3 text-xs font-bold text-gray-800 min-w-[110px] text-center select-none'>{monthLabel}</div>
                        <div className='h-4 w-[1px] bg-gray-200'></div>
                        <button type='button' onClick={() => setPivotDate(addMonths(pivotDate, 1))} aria-label='Mes siguiente'
                            className='h-full px-2.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors font-medium'>
                            Sig.
                        </button>
                    </div>
                    <button type='button' onClick={() => setPivotDate(new Date())}
                        className='h-8 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors'>
                        Hoy
                    </button>
                    <button type='button' onClick={onClose} aria-label='Cerrar'
                        className='text-gray-400 hover:text-red-500 text-xl leading-none px-1 transition-colors'>
                        ✕
                    </button>
                </div>

                {/* ── Resumen del mes ── */}
                {status === 'ready' && summary && (
                    <div className='px-4 py-2 border-b flex flex-wrap items-center gap-2 text-[10px]'>
                        <span className='font-bold text-gray-500 uppercase tracking-wider'>Mes:</span>
                        <span className='bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold'>{summary.presentDays} presentes</span>
                        <span className='bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-semibold'>{summary.lateDays} retardos</span>
                        <span className='bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-semibold'>{summary.absentDays} ausencias</span>
                        <span className='bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 font-semibold'>{summary.totalWorkingDays} laborables</span>
                        <span className='ml-auto text-gray-400 flex items-center gap-1'>
                            <span className='text-indigo-500 font-black'>✦</span> = día modificado por un admin
                        </span>
                    </div>
                )}

                {/* ── Cuerpo ── */}
                <div className='flex-1 min-h-0 p-5 flex flex-col'>
                    {status === 'loading' && (
                        <div className='flex flex-col items-center justify-center gap-3 py-20 text-gray-400'>
                            <div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin' />
                            <span className='text-sm'>Cargando horario...</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
                            <p className='text-sm font-semibold text-gray-500'>No se pudo cargar el horario</p>
                            <button type='button' onClick={loadMonth}
                                className='h-8 px-4 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors'>
                                Reintentar
                            </button>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className='flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg'>
                            {/* Cabecera de días de la semana */}
                            <div className='grid grid-cols-7 border-b border-gray-200 bg-gray-50 sticky top-0 z-10'>
                                {DAY_HEADERS.map(day => (
                                    <div key={day} className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-center ${day === 'Dom' || day === 'Sáb' ? 'text-red-400' : 'text-gray-500'}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {/* Grilla de días */}
                            <div className='grid grid-cols-7'>
                                {calendarCells.map((dayKey, index) => dayKey
                                    ? renderDayCell(dayKey)
                                    : <div key={`empty-${index}`} className='min-h-[92px] border-r border-b border-gray-200 bg-gray-50/50 [&:nth-child(7n)]:border-r-0' />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
