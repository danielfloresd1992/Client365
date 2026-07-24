'use client';
import React, { useState } from 'react';

interface Iprops {
    close: () => void,
    idLocal: string,
    dayNumber: number | undefined,
    pushDateDay: (day: Day) => void,
    /** Rango existente a editar; si viene, el formulario abre precargado. */
    initial?: Day | null,
}

interface Hours {
    start: string;
    end: string;
}

interface Day {
    key: string;
    hours: Hours;
    dayMonitoring: number | undefined;
    idLocal: string;
    type: 'analytical' | 'perimeter';
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TYPE_OPTIONS: { value: Day['type']; label: string }[] = [
    { value: 'analytical', label: 'Analítico' },
    { value: 'perimeter',  label: 'Perimetral' },
];


// "07:00:00" → "07:00" (el input type=time trabaja con HH:mm)
const asHHmm = (t?: string) => String(t ?? '').slice(0, 5);

export default function Form({ close, idLocal, dayNumber, pushDateDay, initial = null }: Iprops): JSX.Element {

    const isEdit = Boolean(initial);

    // dayNumber puede ser 0 (Domingo): validar por tipo, no por "truthy".
    const dn = Number(dayNumber);
    const hasDay = Number.isInteger(dn);

    const keyOf = (start: string, end: string, type: string) =>
        `${idLocal}-${start}-${end}-${type}-${hasDay ? DAYS[dn] : ''}`;

    const [day, setDay] = useState<Day>(() => {
        const start = asHHmm(initial?.hours?.start);
        const end   = asHHmm(initial?.hours?.end);
        const type  = initial?.type ?? 'analytical';
        return {
            dayMonitoring: hasDay ? dn : undefined,
            hours: { start, end },
            idLocal,
            type,
            key: keyOf(start, end, type),
        };
    });

    const patch = (next: { type?: Day['type']; start?: string; end?: string }) => {
        setDay(prev => {
            const hours = {
                start: next.start ?? prev.hours.start,
                end:   next.end   ?? prev.hours.end,
            };
            const type = next.type ?? prev.type;
            return { ...prev, hours, type, key: keyOf(hours.start, hours.end, type) };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        pushDateDay(day);
    };

    // ¿El rango cruza la medianoche? (fin ≤ inicio → corrido)
    const overnight =
        day.hours.start !== '' && day.hours.end !== '' && day.hours.end <= day.hours.start;

    return (
        <div
            className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4'
            onMouseDown={close}
        >
            <form
                onSubmit={handleSubmit}
                onMouseDown={e => e.stopPropagation()}
                className='w-[380px] max-w-[92vw] bg-white rounded-2xl shadow-2xl overflow-hidden'
            >
                {/* Cabecera */}
                <div className='px-5 py-4 border-b border-slate-200 bg-slate-50/70'>
                    <h3 className='text-base font-bold text-slate-800'>{isEdit ? 'Editar rango de monitoreo' : 'Nuevo rango de monitoreo'}</h3>
                    {hasDay && <p className='text-xs text-slate-500 mt-0.5'>{DAYS[dn]}</p>}
                </div>

                {/* Campos */}
                <div className='px-5 py-4 flex flex-col gap-4'>
                    <div className='grid grid-cols-2 gap-3'>
                        <label className='flex flex-col gap-1'>
                            <span className='text-xs font-semibold text-slate-600'>Inicio</span>
                            <input
                                type='time'
                                required
                                value={day.hours.start}
                                onChange={e => patch({ start: e.target.value })}
                                className='rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            />
                        </label>

                        <label className='flex flex-col gap-1'>
                            <span className='text-xs font-semibold text-slate-600'>Fin</span>
                            <input
                                type='time'
                                required
                                value={day.hours.end}
                                onChange={e => patch({ end: e.target.value })}
                                className='rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            />
                        </label>
                    </div>

                    {overnight && (
                        <p className='text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5'>
                            Horario corrido: cruza la medianoche y termina al día siguiente.
                        </p>
                    )}

                    <label className='flex flex-col gap-1'>
                        <span className='text-xs font-semibold text-slate-600'>Tipo de monitoreo</span>
                        <select
                            value={day.type}
                            onChange={e => patch({ type: e.target.value as Day['type'] })}
                            className='rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        >
                            {TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Pie: Cancelar + Guardar */}
                <div className='px-5 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end gap-2'>
                    <button
                        type='button'
                        onClick={close}
                        className='text-sm font-semibold text-slate-600 border border-slate-300 bg-white rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors'
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        className='text-sm font-semibold text-white bg-emerald-600 rounded-lg px-4 py-2 hover:bg-emerald-700 transition-colors'
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}