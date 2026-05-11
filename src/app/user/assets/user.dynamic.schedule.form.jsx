import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Label, TextInput } from 'flowbite-react';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';

/**
 * Tipos de jornada disponibles para el override individual de un día.
 * Coinciden con el enum workType de AttendanceSchema.scheduleOverride
 * y UserModel.workSchedule.scheduleByDay.
 *
 *  noTime: true  → el tipo no requiere hora de entrada/salida.
 *  color         → clases Tailwind para el badge del tipo seleccionado.
 */
const WORK_TYPE_OPTIONS = [
    { value: 'laboral',    label: 'Día laboral',  noTime: false, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'extra',      label: 'Día extra',    noTime: false, color: 'bg-indigo-100 text-indigo-700 border-indigo-300'   },
    { value: 'descanso',   label: 'Descanso',     noTime: true,  color: 'bg-orange-100 text-orange-700 border-orange-300'  },
    { value: 'permiso',    label: 'Permiso',      noTime: true,  color: 'bg-purple-100 text-purple-700 border-purple-300'  },
    { value: 'vacaciones', label: 'Vacaciones',   noTime: true,  color: 'bg-cyan-100 text-cyan-700 border-cyan-300'        },
    { value: 'falta',      label: 'Falta',        noTime: true,  color: 'bg-red-100 text-red-700 border-red-300'           },
];

/** Set rápido para verificar si un workType necesita horas */
const NO_TIME_TYPES = new Set(['descanso', 'permiso', 'vacaciones', 'falta']);


export default function UserDynamicScheduleForm({
    user,
    onSave,
    onCancel,
    mode = 'range',
    initialDate = null,
    initialSelectedDates = []
}) {

    const initialSelectedDays = useMemo(() => {
        if (mode === 'single' && initialDate) {
            const date = startOfDay(new Date(initialDate));
            return [date.toISOString()];
        }
        if (mode === 'selected' && initialSelectedDates.length > 0) {
            return initialSelectedDates;
        }
        return [];
    }, [initialDate, initialSelectedDates, mode]);

    const [selectedDays, setSelectedDays] = useState(initialSelectedDays);

    /**
     * workType controla qué tipo de jornada se asigna.
     * Reemplaza el antiguo boolean `isRestDay` para admitir los 6 estados posibles.
     */
    const [workType, setWorkType] = useState('laboral');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            startTime: user?.workSchedule?.startTime || '09:00',
            endTime:   user?.workSchedule?.endTime   || '18:00',
        }
    });

    useEffect(() => {
        setSelectedDays(initialSelectedDays);
    }, [initialSelectedDays]);

    // Próximos 30 días para el selector múltiple de fechas
    const upcomingDays = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(startOfDay(new Date()), i);
        return {
            dateObj: date,
            iso:     date.toISOString(),
            label:   format(date, 'dd/MM/yyyy (EEEE)', { locale: es })
        };
    });

    const toggleDay = (iso) => {
        setSelectedDays(prev =>
            prev.includes(iso)
                ? prev.filter(d => d !== iso)
                : [...prev, iso]
        );
    };

    /** El tipo actual requiere horas de entrada/salida */
    const needsTime = !NO_TIME_TYPES.has(workType);

    /** Metadatos del tipo seleccionado para el badge visual */
    const selectedOption = WORK_TYPE_OPTIONS.find(o => o.value === workType) || WORK_TYPE_OPTIONS[0];

    const onSubmit = (data) => {
        if (selectedDays.length === 0) {
            alert('Debes seleccionar al menos un día');
            return;
        }

        /**
         * Payload enviado al handler del padre.
         * Se usa `workType` en lugar de `isRestDay` para soportar los 6 estados.
         * Los tipos sin horario envían startTime/endTime como null.
         */
        const payload = {
            userId:    user._id,
            dni:       user.dni,
            days:      selectedDays,
            workType,
            startTime: needsTime ? data.startTime : null,
            endTime:   needsTime ? data.endTime   : null,
        };

        onSave(payload);
    };

    return (
        <div className='bg-white p-6 rounded-xl shadow-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold'>Horario Dinámico: {user?.name} {user?.surName}</h2>
                <button onClick={onCancel} className='text-gray-400 hover:text-red-500'>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col flex-1 overflow-hidden'>
                <div className='overflow-y-auto pr-2 space-y-6'>

                    {/* ── 1. Selector de fechas ── */}
                    {mode === 'single' ? (
                        <div>
                            <h3 className='text-md font-semibold text-gray-700 mb-2'>1. Fecha seleccionada</h3>
                            <div className='p-3 border rounded-lg bg-gray-50 text-sm text-gray-700 font-semibold'>
                                {selectedDays[0]
                                    ? format(new Date(selectedDays[0]), 'dd/MM/yyyy (EEEE)', { locale: es })
                                    : 'Sin fecha'}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>Se aplicará a la fecha de la celda seleccionada.</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className='text-md font-semibold text-gray-700 mb-2'>1. Selecciona los días</h3>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50'>
                                {upcomingDays.map(day => (
                                    <div key={day.iso} className='flex items-center gap-2'>
                                        <input
                                            type='checkbox'
                                            id={`day-${day.iso}`}
                                            checked={selectedDays.includes(day.iso)}
                                            onChange={() => toggleDay(day.iso)}
                                            className='rounded text-emerald-600 focus:ring-emerald-400'
                                        />
                                        <label htmlFor={`day-${day.iso}`} className='text-xs cursor-pointer text-[#000000]'>
                                            {day.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>Días seleccionados: {selectedDays.length}</p>
                        </div>
                    )}

                    {/* ── 2. Tipo de jornada ── */}
                    <div className='border-t pt-4'>
                        <h3 className='text-md font-semibold text-gray-700 mb-3'>2. Tipo de jornada</h3>

                        {/*
                         * Selector de workType en lugar del antiguo checkbox "Día Libre".
                         * Cada opción tiene su propio color para facilitar la identificación visual.
                         */}
                        <div className='grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4'>
                            {WORK_TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type='button'
                                    onClick={() => setWorkType(opt.value)}
                                    className={`py-2 px-1 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition-all
                                        ${workType === opt.value
                                            ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-sm scale-105`
                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Badge descriptivo del tipo seleccionado */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${selectedOption.color}`}>
                            <span className='w-1.5 h-1.5 rounded-full bg-current opacity-70' />
                            {selectedOption.noTime
                                ? `${selectedOption.label} — sin horario de entrada/salida`
                                : `${selectedOption.label} — requiere hora de entrada y salida`}
                        </div>

                        {/* ── Inputs de hora (solo si el tipo los requiere) ── */}
                        {needsTime && (
                            <div className='grid grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-lg border border-emerald-100'>
                                <div>
                                    <div className='mb-2 block'>
                                        <Label htmlFor='startTime' value='Hora de Entrada' />
                                    </div>
                                    <TextInput
                                        id='startTime'
                                        type='time'
                                        {...register('startTime', { required: needsTime })}
                                        color={errors.startTime ? 'failure' : 'gray'}
                                    />
                                </div>
                                <div>
                                    <div className='mb-2 block'>
                                        <Label htmlFor='endTime' value='Hora de Salida' />
                                    </div>
                                    <TextInput
                                        id='endTime'
                                        type='time'
                                        {...register('endTime', { required: needsTime })}
                                        color={errors.endTime ? 'failure' : 'gray'}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className='flex gap-3 pt-6 mt-auto border-t border-gray-100'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        className='flex-1 py-2 text-white rounded-md shadow-lg shadow-emerald-200 transition-all hover:brightness-95 disabled:opacity-50'
                        style={{ background: GREEN_THEME_GRADIENT }}
                        disabled={selectedDays.length === 0}
                    >
                        Guardar Horario Dinámico
                    </button>
                </div>
            </form>
        </div>
    );
}
