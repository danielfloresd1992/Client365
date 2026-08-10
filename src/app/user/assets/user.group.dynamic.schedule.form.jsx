import { useMemo, useState } from 'react';
import useSubmitLock from '@/hook/useSubmitLock';
import { format } from 'date-fns';
import { getCachedAttendance } from './user.list';
import { es } from 'date-fns/locale';

const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';

/**
 * Opciones de tipo de jornada disponibles para el formulario grupal.
 * Cada valor se almacena en scheduleOverride.workType (Attendance) y
 * en workSchedule.scheduleByDay[d].workType (User).
 *
 *  noTime: true  → los tipos sin horario (entrada/salida) ocultan los inputs de hora.
 */
const WORK_MODE_OPTIONS = [
    { value: 'laboral',    label: 'Día laboral',  noTime: false },
    { value: 'extra',      label: 'Día extra',    noTime: false },
    { value: 'descanso',   label: 'Descanso',     noTime: true  },
    { value: 'permiso',    label: 'Permiso',      noTime: true  },
    { value: 'vacaciones', label: 'Vacaciones',   noTime: true  },
    { value: 'falta',      label: 'Falta',        noTime: true  },
];

/**
 * Tipos de jornada que NO requieren hora de entrada/salida.
 * Se usa en la lógica de validación y al construir el payload de actualización.
 */
const NO_TIME_TYPES = new Set(['descanso', 'permiso', 'vacaciones', 'falta']);

const normalizeDateKey = (dateISO) => {
    const date = new Date(dateISO);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
};

export default function UserGroupDynamicScheduleForm({ selectedUsers = [], totalCells = 0, totalUsers = 0, onSave, onCancel }) {
    const initialFormMap = useMemo(() => {
        const allDates = Array.from(
            new Set(
                selectedUsers.flatMap((item) => (item.dates || []).map((dateISO) => normalizeDateKey(dateISO)))
            )
        );

        return selectedUsers.reduce((acc, item) => {
            const user = item.user;
            const userId = item.userId;
            const scheduleMap = user?.workSchedule?.scheduleByDay || {};
            const globalShift = user?.workSchedule?.shiftType || 'Diurno';
            const userDates = new Set((item.dates || []).map((dateISO) => normalizeDateKey(dateISO)));

            allDates.forEach((dateKey) => {
                const isSunday = new Date(dateKey).getDay() === 0;
                const isSelectedForUser = userDates.has(dateKey);

                if (!isSelectedForUser && !isSunday) return;

                const dayNumber = new Date(dateKey).getDay();
                const dayRule = scheduleMap[String(dayNumber)] || {};
                const key = `${userId}-${dateKey}`;

                // Si ya existe documento para ese día (celda cargada en la
                // grilla), pre-cargar su override y detectar jornada cerrada
                const cached = getCachedAttendance(user?.dni, dateKey);
                const override = cached?.scheduleOverride?.workType ? cached.scheduleOverride : null;
                const dayClosed = Boolean(cached?.checkIn && cached?.checkOut);

                acc[key] = {
                    userId,
                    dni: user?.dni,
                    dateISO: dateKey,
                    workType: override?.workType || dayRule.workType || 'laboral',
                    shift: override?.shift || dayRule.shift || globalShift,
                    startTime: override ? override.startTime : (dayRule.startTime || '09:00'),
                    endTime: override ? override.endTime : (dayRule.endTime || '18:00'),
                    note: '',
                    dayClosed,
                };
            });

            return acc;
        }, {});
    }, [selectedUsers]);

    const [formByCell, setFormByCell] = useState(initialFormMap);
    const [isSaving, setIsSaving] = useState(false);
    const { run: runLocked } = useSubmitLock();

    const updateField = (key, field, value) => {
        setFormByCell((prev) => {
            const current = prev[key];
            if (!current) return prev;

            // Jornada cerrada (entrada Y salida marcadas): no se puede pasar a
            // permiso/descanso ni editar el horario — sí a extra u otros
            if (current.dayClosed) {
                if (field === 'workType' && ['permiso', 'descanso'].includes(value)) return prev;
                if (field === 'startTime' || field === 'endTime') return prev;
            }

            const next = {
                ...current,
                [field]: value,
            };

            if (field === 'workType') {
                if (NO_TIME_TYPES.has(value)) {
                    // Tipos sin horario: limpiar horas para no enviar datos erróneos
                    next.startTime = null;
                    next.endTime = null;
                } else {
                    // Tipos con horario: restaurar valores previos o usar defaults
                    next.startTime = current.startTime || '09:00';
                    next.endTime   = current.endTime   || '18:00';
                }
            }

            return {
                ...prev,
                [key]: next,
            };
        });
    };

    const selectedDatesByUser = useMemo(() => {
        const sundayDates = new Set();

        selectedUsers.forEach((item) => {
            (item.dates || []).forEach((dateISO) => {
                const normalized = normalizeDateKey(dateISO);
                if (new Date(normalized).getDay() === 0) {
                    sundayDates.add(normalized);
                }
            });
        });

        return selectedUsers.reduce((acc, item) => {
            const userDates = new Set((item.dates || []).map((dateISO) => normalizeDateKey(dateISO)));

            sundayDates.forEach((dateISO) => userDates.add(dateISO));

            acc[item.userId] = userDates;
            return acc;
        }, {});
    }, [selectedUsers]);

    const allSelectedDates = useMemo(() => {
        const unique = new Set();
        selectedUsers.forEach((item) => {
            (item.dates || []).forEach((dateISO) => {
                unique.add(normalizeDateKey(dateISO));
            });
        });

        return Array.from(unique).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [selectedUsers]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const updates = Object.values(formByCell).map((item) => ({
            userId:    item.userId,
            dni:       item.dni,
            date:      item.dateISO,
            workType:  item.workType,
            shift:     item.shift || 'Diurno',
            // Los tipos sin horario envían null para no pisar horas existentes
            startTime: NO_TIME_TYPES.has(item.workType) ? null : item.startTime,
            endTime:   NO_TIME_TYPES.has(item.workType) ? null : item.endTime,
            note: item.note?.trim() || null,
        }));

        // Los permisos requieren comentario (el backend también lo exige)
        const missingPermisoNote = updates.some((item) => item.workType === 'permiso' && !item.note);
        if (missingPermisoNote) {
            alert('Todos los permisos deben llevar un comentario que los justifique.');
            return;
        }

        // Validar que los tipos con horario tengan entrada y salida definidas
        const hasInvalidWorkingTime = updates.some((item) => {
            if (NO_TIME_TYPES.has(item.workType)) return false;
            return !item.startTime || !item.endTime;
        });

        if (hasInvalidWorkingTime) {
            alert('Todas las celdas de trabajo deben tener hora de entrada y salida.');
            return;
        }

        // `disabled={isSaving}` no basta: en el mismo tick de un doble clic el
        // botón todavía no se re-renderizó deshabilitado. El cerrojo por ref sí
        // frena el segundo, y acá importa más que en ningún otro formulario:
        // este guarda TODAS las celdas seleccionadas de varios empleados a la
        // vez, así que duplicarlo escribiría el lote entero dos veces.
        await runLocked(async () => {
            setIsSaving(true);
            try {
                await onSave({ updates });
            } finally {
                setIsSaving(false);
            }
        });
    };

    return (
        <div className='bg-white w-full max-w-6xl max-h-[92vh] rounded-xl border shadow-xl flex flex-col'>
            <div className='px-5 py-4 border-b bg-gray-50 rounded-t-xl'>
                <div className='flex items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-lg font-bold text-gray-800'>Edición grupal de horario</h2>
                        <p className='text-sm text-gray-600'>Usuarios: {totalUsers} · Fechas seleccionadas: {totalCells}</p>
                    </div>
                    <button onClick={onCancel} type='button' className='px-2 py-1 text-gray-500 hover:text-red-600'>✕</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className='flex-1 min-h-0 flex flex-col gap-4 p-4'>
                <div className='flex-1 relative border border-gray-300 rounded-lg shadow-sm overflow-auto bg-gray-50'>
                    <table className='w-full border-collapse text-left bg-white'>
                        <thead className='bg-gray-100'>
                            <tr>
                                {/* Cabecera Operador - Fija Arriba e Izquierda */}
                                <th className='sticky top-0 left-0 z-30 bg-gray-200 border-b-2 border-r-2 border-gray-300 px-4 py-3 text-xs font-bold text-gray-700 min-w-[220px] shadow-[2px_2px_0px_rgba(0,0,0,0.05)]'>
                                    Operador
                                </th>

                                {/* Cabeceras Fechas - Fijas Arriba */}
                                {allSelectedDates.map((dateISO) => (
                                    <th key={dateISO} className='sticky top-0 z-20 bg-gray-100 border-b-2 border-r border-gray-300 px-3 py-3 min-w-[180px] text-center shadow-[0_2px_0px_rgba(0,0,0,0.05)]'>
                                        <div className='text-[12px] font-bold text-gray-800'>
                                            {format(new Date(dateISO), 'dd/MM/yyyy', { locale: es })}
                                        </div>
                                        <div className='text-[10px] text-gray-500 capitalize font-medium'>
                                            {format(new Date(dateISO), 'EEEE', { locale: es })}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-gray-100'>
                            {selectedUsers.map((item, index) => {
                                const user = item.user;
                                const userId = item.userId;
                                const userSelectedDates = selectedDatesByUser[userId] || new Set();
                                const isEven = index % 2 === 0;

                                return (
                                    <tr key={userId} className={`group transition-colors ${isEven ? 'bg-white hover:bg-emerald-50' : 'bg-slate-50 hover:bg-emerald-50'}`}>

                                        {/* Celda Operador - Fija Izquierda */}
                                        <td className={`sticky left-0 z-10 border-r-2 border-gray-300 px-4 py-3 align-middle shadow-[2px_0_0px_rgba(0,0,0,0.02)] transition-colors ${isEven ? 'bg-white group-hover:bg-emerald-50' : 'bg-slate-50 group-hover:bg-emerald-50'}`}>
                                            <div className="flex flex-col">
                                                <span className='text-[13px] font-bold text-gray-800 tracking-tight leading-snug'>{user?.name} {user?.surName}</span>
                                                <span className='text-[10.5px] text-gray-500 font-medium mt-0.5'>DNI: {user?.dni}</span>
                                            </div>
                                        </td>

                                        {/* Celdas Configurables */}
                                        {allSelectedDates.map((dateISO) => {
                                            const key = `${userId}-${dateISO}`;
                                            const isSelected = userSelectedDates.has(dateISO);

                                            if (!isSelected) {
                                                return (
                                                    <td key={key} className='border-r border-gray-200 px-3 py-2 bg-gray-200/30 group-hover:bg-transparent transition-colors'>
                                                        <div className='h-[68px] flex items-center justify-center text-[12px] font-medium text-gray-400'>—</div>
                                                    </td>
                                                );
                                            }

                                            const row = formByCell[key];
                                            const wt = row?.workType || 'laboral';
                                            const isNoTime = NO_TIME_TYPES.has(wt);

                                            /**
                                             * Paleta de colores por workType para el contenedor de celda,
                                             * el selector de tipo y el bloque de "sin horario".
                                             * Permite distinguir visualmente cada tipo de jornada.
                                             */
                                            const CELL_PALETTE = {
                                                laboral:    { border: 'border-emerald-200/60', bg: 'bg-emerald-50/50',   shadow: 'shadow-[inset_0_1px_3px_rgba(16,185,129,0.05)]',  selBg: 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-200/80', arrow: 'text-emerald-500', tagBg: 'bg-emerald-100/40 border-emerald-200/60', tagTx: 'text-emerald-500/80' },
                                                extra:      { border: 'border-indigo-200',     bg: 'bg-indigo-50/80',    shadow: 'shadow-[inset_0_1px_3px_rgba(99,102,241,0.05)]',   selBg: 'bg-indigo-100/70 text-indigo-700 hover:bg-indigo-200/80',   arrow: 'text-indigo-500',  tagBg: 'bg-indigo-100/40 border-indigo-200/60', tagTx: 'text-indigo-500/80' },
                                                descanso:   { border: 'border-orange-200',     bg: 'bg-orange-50/80',    shadow: 'shadow-[inset_0_1px_3px_rgba(251,146,60,0.1)]',    selBg: 'bg-orange-100/70 text-orange-700 hover:bg-orange-200/80',   arrow: 'text-orange-500',  tagBg: 'bg-orange-100/40 border-orange-200/60', tagTx: 'text-orange-500/80' },
                                                permiso:    { border: 'border-purple-200',     bg: 'bg-purple-50/80',    shadow: 'shadow-[inset_0_1px_3px_rgba(168,85,247,0.08)]',   selBg: 'bg-purple-100/70 text-purple-700 hover:bg-purple-200/80',   arrow: 'text-purple-500',  tagBg: 'bg-purple-100/40 border-purple-200/60', tagTx: 'text-purple-500/80' },
                                                vacaciones: { border: 'border-cyan-200',       bg: 'bg-cyan-50/80',      shadow: 'shadow-[inset_0_1px_3px_rgba(6,182,212,0.08)]',    selBg: 'bg-cyan-100/70 text-cyan-700 hover:bg-cyan-200/80',         arrow: 'text-cyan-500',    tagBg: 'bg-cyan-100/40 border-cyan-200/60',   tagTx: 'text-cyan-500/80' },
                                                falta:      { border: 'border-red-200',        bg: 'bg-red-50/80',       shadow: 'shadow-[inset_0_1px_3px_rgba(239,68,68,0.08)]',    selBg: 'bg-red-100/70 text-red-700 hover:bg-red-200/80',           arrow: 'text-red-500',     tagBg: 'bg-red-100/40 border-red-200/60',     tagTx: 'text-red-500/80' },
                                            };
                                            const pal = CELL_PALETTE[wt] || CELL_PALETTE.laboral;

                                            return (
                                                <td key={key} className='border-r border-gray-200 px-2.5 py-2 align-middle bg-inherit'>
                                                    <div className={`flex flex-col gap-1.5 p-1.5 rounded-md border transition-colors ${pal.border} ${pal.bg} ${pal.shadow}`}>

                                                        {/* ── Selector de tipo de jornada ── */}
                                                        <div className="relative">
                                                            <select
                                                                value={wt}
                                                                onChange={(e) => updateField(key, 'workType', e.target.value)}
                                                                className={`w-full text-[11px] font-bold uppercase tracking-wider rounded px-2 py-1.5 appearance-none cursor-pointer outline-none transition-all ${pal.selBg}`}
                                                            >
                                                                {WORK_MODE_OPTIONS.map((option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                        // Jornada cerrada: no puede pasar a permiso ni descanso
                                                                        disabled={row?.dayClosed && ['permiso', 'descanso'].includes(option.value)}
                                                                    >
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {/* Flecha del selector */}
                                                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${pal.arrow}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                            </div>
                                                        </div>

                                                        {/* Jornada cerrada: entrada y salida ya marcadas */}
                                                        {row?.dayClosed && (
                                                            <div className='text-[9px] font-black text-emerald-700 text-center uppercase tracking-wider'>
                                                                ✓ Jornada marcada
                                                            </div>
                                                        )}

                                                        {/* ── Selector de turno (solo si el tipo requiere horario) ── */}
                                                        {!isNoTime && (
                                                            <div className='relative'>
                                                                <select
                                                                    value={row?.shift || 'Diurno'}
                                                                    onChange={(e) => updateField(key, 'shift', e.target.value)}
                                                                    className={`w-full text-[10px] font-semibold rounded px-2 py-1 appearance-none cursor-pointer outline-none transition-all ${row?.shift === 'Nocturno'
                                                                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                                                                            : 'bg-sky-100/70 text-sky-700 hover:bg-sky-200/80'
                                                                        }`}
                                                                >
                                                                    <option value='Diurno'>☀ Diurno</option>
                                                                    <option value='Nocturno'>🌙 Nocturno</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* ── Panel de horas (solo tipos con horario) ── */}
                                                        {!isNoTime ? (
                                                            <div className={`flex items-center justify-between bg-white border rounded px-1.5 min-h-[30px] shadow-sm focus-within:ring-2 focus-within:ring-offset-1 transition-all ${wt === 'extra' ? 'border-indigo-200 focus-within:ring-indigo-400 focus-within:border-indigo-400' : 'border-emerald-200/80 focus-within:ring-emerald-400 focus-within:border-emerald-400'}`}>
                                                                <input
                                                                    type='time'
                                                                    value={row?.startTime || ''}
                                                                    onChange={(e) => updateField(key, 'startTime', e.target.value)}
                                                                    disabled={row?.dayClosed}
                                                                    className='w-full text-[12px] font-semibold text-gray-700 bg-transparent text-center outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                                                                    title={row?.dayClosed ? 'Jornada cerrada: horario no editable' : 'Hora de Entrada'}
                                                                />
                                                                <div className={`flex items-center justify-center px-0.5 ${wt === 'extra' ? 'text-indigo-300' : 'text-emerald-300'}`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                                </div>
                                                                <input
                                                                    type='time'
                                                                    value={row?.endTime || ''}
                                                                    onChange={(e) => updateField(key, 'endTime', e.target.value)}
                                                                    disabled={row?.dayClosed}
                                                                    className='w-full text-[12px] font-semibold text-gray-700 bg-transparent text-center outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                                                                    title={row?.dayClosed ? 'Jornada cerrada: horario no editable' : 'Hora de Salida'}
                                                                />
                                                            </div>
                                                        ) : (
                                                            /* Indicador visual para tipos sin horario */
                                                            <div className={`flex items-center justify-center border rounded py-1.5 min-h-[30px] shadow-sm ${pal.tagBg}`}>
                                                                <span className={`text-[10px] font-bold uppercase flex items-center gap-1 select-none tracking-widest ${pal.tagTx}`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path></svg>
                                                                    Sin horario
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Comentario obligatorio del permiso */}
                                                        {wt === 'permiso' && (
                                                            <textarea
                                                                value={row?.note || ''}
                                                                onChange={(e) => updateField(key, 'note', e.target.value)}
                                                                rows={2}
                                                                maxLength={500}
                                                                placeholder='Motivo del permiso (obligatorio)...'
                                                                className={`w-full text-[11px] border rounded px-1.5 py-1 resize-none bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-gray-400 ${row?.note?.trim() ? 'border-purple-200' : 'border-red-300'}`}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className='px-4 py-3 border-t bg-white flex items-center justify-end gap-3'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='btn-neutral btn-sm'
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        disabled={isSaving}
                        className='btn-primary btn-sm'
                    >
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
