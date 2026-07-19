'use client';
import { useState, useEffect } from 'react';

/**
 * Modal compacto para asignar una jornada sobre una fecha desde el menú
 * contextual de la grilla. Modos:
 *   - laboral / extra: horario de entrada/salida + turno
 *   - permiso: comentario OBLIGATORIO que justifique el permiso
 *   - vacaciones: rango desde→hasta (genera un documento por cada día)
 *
 * onSave(payload) la maneja el padre (guarda vía el endpoint grupal);
 * onCancel cierra sin guardar.
 */
const MODE_CONFIG = {
    laboral: {
        title: 'Asignar guardia',
        badge: 'Guardia',
        badgeClass: 'bg-emerald-100 text-emerald-700',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    extra: {
        title: 'Marcar día extra',
        badge: 'Extra',
        badgeClass: 'bg-green-100 text-green-800',
        buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    permiso: {
        title: 'Asignar permiso',
        badge: 'Permiso',
        badgeClass: 'bg-yellow-100 text-yellow-800',
        buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
    },
    vacaciones: {
        title: 'Asignar vacaciones',
        badge: 'Vacaciones',
        badgeClass: 'bg-cyan-100 text-cyan-800',
        buttonClass: 'bg-cyan-600 hover:bg-cyan-700',
    },
    guardia: {
        title: 'Designar encargado de turno',
        badge: 'Turno',
        badgeClass: 'bg-blue-100 text-blue-800',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
};

// Fecha local → valor de <input type='date'> (YYYY-MM-DD)
const toInputDate = (value) => {
    const date = new Date(value);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
};

export default function UserDayAssignForm({ user, dateObj, mode = 'laboral', onSave = () => {}, onCancel = () => {} }) {

    const dayNumber = dateObj ? String(new Date(dateObj).getDay()) : null;
    const dayRule = dayNumber != null ? user?.workSchedule?.scheduleByDay?.[dayNumber] : null;

    const isTimed = mode === 'laboral' || mode === 'extra' || mode === 'guardia';
    const isPermiso = mode === 'permiso';
    const isVacaciones = mode === 'vacaciones';

    const [startTime, setStartTime] = useState(dayRule?.startTime || '08:00');
    const [endTime, setEndTime] = useState(dayRule?.endTime || '17:00');
    const [shift, setShift] = useState(dayRule?.shift || user?.workSchedule?.shiftType || 'Diurno');
    const [note, setNote] = useState('');
    const [fromDate, setFromDate] = useState(dateObj ? toInputDate(dateObj) : '');
    const [toDate, setToDate] = useState(dateObj ? toInputDate(dateObj) : '');
    const [saving, setSaving] = useState(false);

    const config = MODE_CONFIG[mode] || MODE_CONFIG.laboral;

    const canSave = !saving && (
        (isTimed && Boolean(startTime && endTime)) ||
        (isPermiso && note.trim().length > 0) ||
        (isVacaciones && Boolean(fromDate && toDate) && fromDate <= toDate)
    );

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canSave) return;
        setSaving(true);
        try {
            await onSave({
                workType: mode,
                shift: isTimed ? shift : null,
                startTime: isTimed ? startTime : null,
                endTime: isTimed ? endTime : null,
                note: note.trim() || null,
                from: isVacaciones ? fromDate : null,
                to: isVacaciones ? toDate : null,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className='fixed inset-0 z-[1005] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
            onClick={onCancel}
        >
            <div
                className='bg-white rounded-xl shadow-2xl border w-full max-w-sm flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className='px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <circle cx='12' cy='12' r='10'></circle>
                            <polyline points='12 6 12 12 16 14'></polyline>
                        </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-sm font-bold text-gray-800 leading-tight'>{config.title}</h2>
                        <p className='text-[11px] text-gray-500 truncate'>
                            {user?.name} {user?.surName}
                            {!isVacaciones && dateObj && ` · ${new Date(dateObj).toLocaleDateString('es-VE')}`}
                        </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 ${config.badgeClass}`}>
                        {config.badge}
                    </span>
                    <button
                        type='button'
                        onClick={onCancel}
                        aria-label='Cerrar'
                        className='text-gray-400 hover:text-red-500 text-xl leading-none px-1 transition-colors'
                    >
                        ✕
                    </button>
                </div>

                {/* ── Cuerpo ── */}
                <form onSubmit={handleSubmit} className='p-4 flex flex-col gap-3'>

                    {/* Horario + turno (guardia / extra) */}
                    {isTimed && (
                        <>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='assign-start' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                        Hora de entrada
                                    </label>
                                    <input
                                        id='assign-start'
                                        type='time'
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className='h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                                    />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='assign-end' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                        Hora de salida
                                    </label>
                                    <input
                                        id='assign-end'
                                        type='time'
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className='h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                                    />
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label htmlFor='assign-shift' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                    Turno
                                </label>
                                <select
                                    id='assign-shift'
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className='h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                                >
                                    <option value='Diurno'>☀ Diurno</option>
                                    <option value='Nocturno'>🌙 Nocturno</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Rango de fechas (vacaciones) */}
                    {isVacaciones && (
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='assign-from' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                    Desde
                                </label>
                                <input
                                    id='assign-from'
                                    type='date'
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className='h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                                />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='assign-to' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                    Hasta
                                </label>
                                <input
                                    id='assign-to'
                                    type='date'
                                    value={toDate}
                                    min={fromDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className='h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                                />
                            </div>
                        </div>
                    )}

                    {/* Comentario: obligatorio en permiso, opcional en vacaciones */}
                    {(isPermiso || isVacaciones) && (
                        <div className='flex flex-col gap-1'>
                            <label htmlFor='assign-note' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                                Comentario {isPermiso ? <span className='text-red-500'>*</span> : '(opcional)'}
                            </label>
                            <textarea
                                id='assign-note'
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={500}
                                rows={3}
                                placeholder={isPermiso ? 'Motivo del permiso (obligatorio)...' : 'Nota sobre las vacaciones...'}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 placeholder:text-gray-400'
                            />
                            {isPermiso && !note.trim() && (
                                <p className='text-[10px] text-red-500'>El permiso requiere un comentario que lo justifique.</p>
                            )}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className='flex gap-3 pt-3 border-t border-gray-100 mt-1'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                        >
                            Cancelar
                        </button>
                        <button
                            type='submit'
                            disabled={!canSave}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonClass}`}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
