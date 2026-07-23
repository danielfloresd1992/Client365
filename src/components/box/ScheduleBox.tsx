'use client';
import React, { useState, useRef } from 'react';
import { IScheduleProps } from '@/interfaces/ISchedule';
import BoxHours from '@/components/box/BoxHours';
import BoxButtonAddItem from '@/components/box/BoxButtonAddItem';
import Form from '@/components/box/Form';

// Días de lunes a domingo (value = Date.getDay(): 0=Dom … 6=Sáb)
const DAYS = [
    { label: 'Lunes',     value: 1 },
    { label: 'Martes',    value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves',    value: 4 },
    { label: 'Viernes',   value: 5 },
    { label: 'Sábado',    value: 6 },
    { label: 'Domingo',   value: 0 },
];

const ScheduleBox: React.FC<IScheduleProps> = ({ idLocal, configLocalDate, deleteHour, addDataRequest }) => {

    const [openForm, setOpenForm] = useState<boolean>(false);
    const dayRef = useRef<number | undefined>(undefined);

    const openSetFormHook: (day: number) => void = (day) => {
        dayRef.current = day;
        setOpenForm(true);
    };

    const closeSetFormHook: () => void = () => {
        dayRef.current = undefined;
        setOpenForm(false);
    };

    const pushDateDay: (dataForRequest: any) => void = dataForRequest => {
        addDataRequest(dataForRequest);
        closeSetFormHook();
    };

    return (
        <>
            <div
                className='grid gap-3'
                style={{ gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))' }}
            >
                {DAYS.map(day => {
                    const ranges = configLocalDate.filter(d => d.dayMonitoring === day.value);
                    return (
                        <div
                            key={day.value}
                            className='flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden'
                            style={{ minHeight: '46vh' }}
                        >
                            <p className='text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide py-2.5 bg-slate-50 border-b border-slate-200'>
                                {day.label}
                            </p>

                            <div className='flex-1 flex flex-col items-center gap-2 p-2'>
                                {ranges.length > 0
                                    ? <BoxHours arr={ranges} deleteHour={deleteHour} />
                                    : <span className='text-[11px] text-slate-300 mt-3'>Sin horarios</span>
                                }
                            </div>

                            <BoxButtonAddItem day={day.value} openSetForm={openSetFormHook} />
                        </div>
                    );
                })}
            </div>

            {openForm && (
                <Form
                    close={closeSetFormHook}
                    idLocal={idLocal}
                    dayNumber={Number(dayRef.current)}
                    pushDateDay={pushDateDay}
                />
            )}
        </>
    );
};

export { ScheduleBox };