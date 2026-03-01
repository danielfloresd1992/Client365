import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';

const WORK_MODE_OPTIONS = [
    { value: 'laboral', label: 'Día laboral' },
    { value: 'extra', label: 'Día extra' },
    { value: 'descanso', label: 'Descanso' },
];

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

                acc[key] = {
                    userId,
                    dni: user?.dni,
                    dateISO: dateKey,
                    workType: dayRule.workType || 'laboral',
                    shift: dayRule.shift || globalShift,
                    startTime: dayRule.startTime || '09:00',
                    endTime: dayRule.endTime || '18:00',
                };
            });

            return acc;
        }, {});
    }, [selectedUsers]);

    const [formByCell, setFormByCell] = useState(initialFormMap);
    const [isSaving, setIsSaving] = useState(false);

    const updateField = (key, field, value) => {
        setFormByCell((prev) => {
            const current = prev[key];
            if (!current) return prev;

            const next = {
                ...current,
                [field]: value,
            };

            if (field === 'workType' && value === 'descanso') {
                next.startTime = null;
                next.endTime = null;
            }

            if (field === 'workType' && value !== 'descanso') {
                next.startTime = current.startTime || '09:00';
                next.endTime = current.endTime || '18:00';
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
            userId: item.userId,
            dni: item.dni,
            date: item.dateISO,
            workType: item.workType,
            shift: item.shift || 'Diurno',
            startTime: item.workType === 'descanso' ? null : item.startTime,
            endTime: item.workType === 'descanso' ? null : item.endTime,
        }));

        const hasInvalidWorkingTime = updates.some((item) => {
            if(item.workType === 'descanso') return false;
            if (item.isRestDay) return false;
            return !item.startTime || !item.endTime;
        });

        if (hasInvalidWorkingTime) {
            alert('Todas las celdas de trabajo deben tener hora de entrada y salida.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ updates });
        } finally {
            setIsSaving(false);
        }
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
                                            const isRestDay = row?.workType === 'descanso';
                                            const isExtra = row?.workType === 'extra';

                                            return (
                                                <td key={key} className='border-r border-gray-200 px-2.5 py-2 align-middle bg-inherit'>
                                                    <div className={`flex flex-col gap-1.5 p-1.5 rounded-md border transition-colors ${isRestDay ? 'border-orange-200 bg-orange-50/80 shadow-[inset_0_1px_3px_rgba(251,146,60,0.1)]' :
                                                            isExtra ? 'border-indigo-200 bg-indigo-50/80 shadow-[inset_0_1px_3px_rgba(99,102,241,0.05)]' :
                                                                'border-emerald-200/60 bg-emerald-50/50 shadow-[inset_0_1px_3px_rgba(16,185,129,0.05)]'
                                                        }`}>

                                                        {/* Selector de Tipo de Turno estilo Badge */}
                                                        <div className="relative">
                                                            <select
                                                                value={row?.workType || 'laboral'}
                                                                onChange={(e) => updateField(key, 'workType', e.target.value)}
                                                                className={`w-full text-[11px] font-bold uppercase tracking-wider rounded px-2 py-1.5 appearance-none cursor-pointer outline-none transition-all ${isRestDay
                                                                        ? 'bg-orange-100/70 text-orange-700 hover:bg-orange-200/80'
                                                                        : isExtra
                                                                            ? 'bg-indigo-100/70 text-indigo-700 hover:bg-indigo-200/80'
                                                                            : 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-200/80'
                                                                    }`}
                                                            >
                                                                {WORK_MODE_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                            {/* Icono flecha personalizado */}
                                                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isRestDay ? 'text-orange-500' : isExtra ? 'text-indigo-500' : 'text-emerald-500'
                                                                }`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                            </div>
                                                        </div>

                                                        {/* Selector de Turno (Diurno/Nocturno) */}
                                                        {!isRestDay && (
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

                                                        {/* Panel de Horas Integrado */}
                                                        {!isRestDay ? (
                                                            <div className={`flex items-center justify-between bg-white border rounded px-1.5 min-h-[30px] shadow-sm focus-within:ring-2 focus-within:ring-offset-1 transition-all ${isExtra ? 'border-indigo-200 focus-within:ring-indigo-400 focus-within:border-indigo-400' : 'border-emerald-200/80 focus-within:ring-emerald-400 focus-within:border-emerald-400'
                                                                }`}>
                                                                <input
                                                                    type='time'
                                                                    value={row?.startTime || ''}
                                                                    onChange={(e) => updateField(key, 'startTime', e.target.value)}
                                                                    className='w-full text-[12px] font-semibold text-gray-700 bg-transparent text-center outline-none cursor-pointer'
                                                                    title="Hora de Entrada"
                                                                />

                                                                {/* Separador de flecha entre horas */}
                                                                <div className={`flex items-center justify-center px-0.5 ${isExtra ? 'text-indigo-300' : 'text-emerald-300'}`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                                </div>

                                                                <input
                                                                    type='time'
                                                                    value={row?.endTime || ''}
                                                                    onChange={(e) => updateField(key, 'endTime', e.target.value)}
                                                                    className='w-full text-[12px] font-semibold text-gray-700 bg-transparent text-center outline-none cursor-pointer'
                                                                    title="Hora de Salida"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className='flex items-center justify-center bg-orange-100/40 border border-orange-200/60 rounded py-1.5 min-h-[30px] shadow-sm'>
                                                                <span className='text-[10px] font-bold text-orange-500/80 uppercase flex items-center gap-1 select-none tracking-widest'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path></svg>
                                                                    Libre
                                                                </span>
                                                            </div>
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
                        className='px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50'
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        disabled={isSaving}
                        className='px-4 py-2 rounded-md text-white hover:brightness-95 disabled:opacity-60'
                        style={{ background: GREEN_THEME_GRADIENT }}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
