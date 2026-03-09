import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Label, TextInput, Checkbox } from 'flowbite-react';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const GREEN_THEME_GRADIENT = 'linear-gradient(90deg, #29c50c 0%, #4e8300 45%, #6b7f47 100%)';




export default function UserDynamicScheduleForm({ user, onSave, onCancel, mode = 'range', initialDate = null, initialSelectedDates = [] }) {
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
    const [isRestDay, setIsRestDay] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            startTime: user?.workSchedule?.startTime || '09:00',
            endTime: user?.workSchedule?.endTime || '18:00',
        }
    });

    useEffect(() => {
        setSelectedDays(initialSelectedDays);
    }, [initialSelectedDays]);

    // Generar los próximos 30 días para seleccionar
    const upcomingDays = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(startOfDay(new Date()), i);
        return {
            dateObj: date,
            iso: date.toISOString(),
            label: format(date, 'dd/MM/yyyy (EEEE)', { locale: es })
        };
    });

    const toggleDay = (iso) => {
        setSelectedDays(prev =>
            prev.includes(iso)
                ? prev.filter(d => d !== iso)
                : [...prev, iso]
        );
    };

    const onSubmit = (data) => {
        if (selectedDays.length === 0) {
            alert("Debes seleccionar al menos un día");
            return;
        }

        const payload = {
            userId: user._id,
            dni: user.dni,
            days: selectedDays,
            isRestDay: isRestDay,
            startTime: isRestDay ? null : data.startTime,
            endTime: isRestDay ? null : data.endTime,
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

                    {mode === 'single' ? (
                        <div>
                            <h3 className='text-md font-semibold text-gray-700 mb-2'>1. Fecha seleccionada</h3>
                            <div className='p-3 border rounded-lg bg-gray-50 text-sm text-gray-700 font-semibold'>
                                {selectedDays[0] ? format(new Date(selectedDays[0]), 'dd/MM/yyyy (EEEE)', { locale: es }) : 'Sin fecha'}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>Se aplicará a la fecha de la celda seleccionada.</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className='text-md font-semibold text-gray-700 mb-2'>1. Selecciona los días</h3>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50'>
                                {upcomingDays.map(day => (
                                    <div key={day.iso} className='flex items-center gap-2'>
                                        <Checkbox
                                            id={`day-${day.iso}`}
                                            checked={selectedDays.includes(day.iso)}
                                            onChange={() => toggleDay(day.iso)}
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

                    {/* Configuración del Horario */}
                    <div className='border-t pt-4'>
                        <h3 className='text-md font-semibold text-gray-700 mb-4'>2. Configura el horario</h3>

                        <div className='flex items-center gap-2 mb-4'>
                            <Checkbox
                                id='isRestDay'
                                checked={isRestDay}
                                onChange={(e) => setIsRestDay(e.target.checked)}
                            />
                            <Label htmlFor='isRestDay' className='font-medium text-red-600'>
                                Marcar como Día Libre (Franco)
                            </Label>
                        </div>

                        {!isRestDay && (
                            <div className='grid grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-lg border border-emerald-100'>
                                <div>
                                    <div className='mb-2 block'>
                                        <Label htmlFor='startTime' value='Hora de Entrada' />
                                    </div>
                                    <TextInput
                                        id='startTime'
                                        type='time'
                                        {...register('startTime', { required: !isRestDay })}
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
                                        {...register('endTime', { required: !isRestDay })}
                                        color={errors.endTime ? 'failure' : 'gray'}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
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
