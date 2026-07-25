'use client';
import { useState, useEffect, useMemo } from 'react';

/**
 * Modal "Cambiar horario del mes siguiente".
 *
 * Formulario de patrón semanal (lunes a domingo): lo configurado en cada día
 * se aplica a TODOS esos días del MES SIGUIENTE como overrides POR FECHA
 * (endpoint grupal /user/schedule/dynamic/group). La regla semanal por defecto
 * del usuario NO se toca, así el mes en curso y los días pasados quedan
 * intactos — que es justo el problema que esto resuelve.
 *
 * Cada fila viene prellenada con la regla semanal actual; solo los días con la
 * casilla "Cambiar" marcada generan overrides. onSave(updates) la maneja el
 * padre (agrega userId/dni y guarda); onCancel cierra sin guardar.
 */

const WEEKDAYS = [
    { num: 1, label: 'Lunes' },
    { num: 2, label: 'Martes' },
    { num: 3, label: 'Miercoles' },
    { num: 4, label: 'Jueves' },
    { num: 5, label: 'Viernes' },
    { num: 6, label: 'Sabado' },
    { num: 0, label: 'Domingo' },
];

const WORK_TYPES = [
    { value: 'laboral', label: 'Laboral' },
    { value: 'extra', label: 'Extra' },
    { value: 'descanso', label: 'Descanso' },
    { value: 'permiso', label: 'Permiso' },
    { value: 'vacaciones', label: 'Vacaciones' },
];

// Tipos sin horario de entrada/salida (mismo criterio del backend)
const NO_TIME_TYPES = ['descanso', 'permiso', 'vacaciones', 'falta'];

export default function UserNextMonthScheduleForm({ user, onCancel = () => {}, onSave = () => {} }) {

    // Mes siguiente respecto a hoy
    const base = new Date();
    const nextMonthFirst = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const monthLabel = nextMonthFirst.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

    // Config por día de la semana, prellenada con la regla semanal actual
    const [days, setDays] = useState(() => {
        const map = {};
        for (const { num } of WEEKDAYS) {
            const rule = user?.workSchedule?.scheduleByDay?.[String(num)] || null;
            map[num] = {
                enabled: false,
                workType: rule?.workType || 'laboral',
                shift: rule?.shift || user?.workSchedule?.shiftType || 'Diurno',
                startTime: rule?.startTime || '08:00',
                endTime: rule?.endTime || '17:00',
            };
        }
        return map;
    });
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const patchDay = (num, patch) => setDays(prev => ({ ...prev, [num]: { ...prev[num], ...patch } }));

    // Fechas del mes siguiente cuyos días de semana están habilitados
    const targetDates = useMemo(() => {
        const dates = [];
        const month = nextMonthFirst.getMonth();
        for (let d = new Date(nextMonthFirst); d.getMonth() === month; d.setDate(d.getDate() + 1)) {
            if (days[d.getDay()]?.enabled) dates.push(new Date(d));
        }
        return dates;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);

    // El permiso exige justificación (el backend la valida como obligatoria)
    const needsNote = Object.values(days).some(c => c.enabled && c.workType === 'permiso');
    const canSave = !saving && targetDates.length > 0 && (!needsNote || note.trim().length > 0);

    // Cerrar con Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setSaving(true);
        try {
            const updates = targetDates.map(dateObj => {
                const cfg = days[dateObj.getDay()];
                const noTime = NO_TIME_TYPES.includes(cfg.workType);
                const midnight = new Date(dateObj);
                midnight.setHours(0, 0, 0, 0);
                return {
                    date: midnight.toISOString(),
                    workType: cfg.workType,
                    shift: noTime ? null : cfg.shift,
                    startTime: noTime ? null : cfg.startTime,
                    endTime: noTime ? null : cfg.endTime,
                    note: note.trim() || `Horario de ${monthLabel} (patron semanal)`,
                };
            });
            await onSave(updates);
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <div
            className='fixed inset-0 z-[1005] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
            onClick={onCancel}
        >
            <div
                className='bg-white rounded-xl shadow-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className='px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                            <line x1='16' y1='2' x2='16' y2='6'></line>
                            <line x1='8' y1='2' x2='8' y2='6'></line>
                            <line x1='3' y1='10' x2='21' y2='10'></line>
                        </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-sm font-bold text-gray-800 leading-tight'>Cambiar horario del mes siguiente</h2>
                        <p className='text-[11px] text-gray-500 truncate'>
                            {user?.name} {user?.surName} · {monthLabel}
                        </p>
                    </div>
                    <span className='text-[9px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 bg-emerald-100 text-emerald-700'>
                        {monthLabel.split(' ')[0]}
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
                <form onSubmit={handleSubmit} className='p-4 flex flex-col gap-3 overflow-y-auto'>

                    <p className='text-[11px] text-gray-500 leading-snug'>
                        Lo configurado en cada dia se aplica a <b>todos esos dias de {monthLabel}</b> como
                        cambios por fecha. El horario por defecto y el mes en curso <b>no se modifican</b>.
                    </p>

                    {/* Encabezados de columnas */}
                    <div className='grid grid-cols-[86px_1fr_1fr_1fr_1fr] gap-2 items-center text-[9.5px] font-bold text-gray-400 uppercase tracking-wide px-1'>
                        <span>Cambiar</span>
                        <span>Jornada</span>
                        <span>Turno</span>
                        <span>Entrada</span>
                        <span>Salida</span>
                    </div>

                    {/* Una fila por día de la semana */}
                    {WEEKDAYS.map(({ num, label }) => {
                        const cfg = days[num];
                        const noTime = NO_TIME_TYPES.includes(cfg.workType);
                        return (
                            <div key={num} className={`grid grid-cols-[86px_1fr_1fr_1fr_1fr] gap-2 items-center rounded-lg border px-1 py-1.5 ${cfg.enabled ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
                                <label className='flex items-center gap-1.5 cursor-pointer pl-1'>
                                    <input
                                        type='checkbox'
                                        checked={cfg.enabled}
                                        onChange={(e) => patchDay(num, { enabled: e.target.checked })}
                                        className='cursor-pointer accent-emerald-600'
                                    />
                                    <span className={`text-[12px] font-semibold ${cfg.enabled ? 'text-emerald-700' : 'text-gray-500'}`}>{label}</span>
                                </label>

                                <select
                                    value={cfg.workType}
                                    disabled={!cfg.enabled}
                                    onChange={(e) => patchDay(num, { workType: e.target.value })}
                                    className='border rounded-md px-1.5 py-1 text-[12px] bg-white disabled:bg-gray-100 disabled:text-gray-400'
                                >
                                    {WORK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>

                                <select
                                    value={cfg.shift}
                                    disabled={!cfg.enabled || noTime}
                                    onChange={(e) => patchDay(num, { shift: e.target.value })}
                                    className='border rounded-md px-1.5 py-1 text-[12px] bg-white disabled:bg-gray-100 disabled:text-gray-400'
                                >
                                    <option value='Diurno'>Diurno</option>
                                    <option value='Nocturno'>Nocturno</option>
                                </select>

                                <input
                                    type='time'
                                    value={cfg.startTime}
                                    disabled={!cfg.enabled || noTime}
                                    onChange={(e) => patchDay(num, { startTime: e.target.value })}
                                    className='border rounded-md px-1.5 py-1 text-[12px] bg-white disabled:bg-gray-100 disabled:text-gray-400'
                                />
                                <input
                                    type='time'
                                    value={cfg.endTime}
                                    disabled={!cfg.enabled || noTime}
                                    onChange={(e) => patchDay(num, { endTime: e.target.value })}
                                    className='border rounded-md px-1.5 py-1 text-[12px] bg-white disabled:bg-gray-100 disabled:text-gray-400'
                                />
                            </div>
                        );
                    })}

                    {/* Nota (obligatoria si hay algún permiso) */}
                    <div className='flex flex-col gap-1'>
                        <label className='text-[11px] font-semibold text-gray-600'>
                            Nota {needsNote ? <span className='text-red-500'>(obligatoria: hay dias de permiso)</span> : '(opcional)'}
                        </label>
                        <input
                            type='text'
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={`Horario de ${monthLabel} (patron semanal)`}
                            className='border rounded-md px-2 py-1.5 text-[12px]'
                        />
                    </div>

                    {/* Resumen + acciones */}
                    <div className='flex items-center justify-between gap-3 pt-2 border-t'>
                        <p className='text-[11.5px] text-gray-600 tabular-nums'>
                            Se aplicara a <b>{targetDates.length}</b> dia{targetDates.length !== 1 ? 's' : ''} de <b>{monthLabel}</b>
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={onCancel}
                                className='btn-neutral btn-sm'
                            >
                                Cancelar
                            </button>
                            <button
                                type='submit'
                                disabled={!canSave}
                                className='btn-primary btn-sm'
                            >
                                {saving ? 'Guardando…' : 'Aplicar al mes siguiente'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
