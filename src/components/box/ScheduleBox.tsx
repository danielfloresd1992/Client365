'use client';
import React, { useState, useRef } from 'react';
import { IScheduleProps } from '@/interfaces/ISchedule';
import BoxHours from '@/components/box/BoxHours';
import BoxButtonAddItem from '@/components/box/BoxButtonAddItem';
import Form from '@/components/box/Form';
import useDragCopy from '@/hook/useDragCopy';

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

const ScheduleBox: React.FC<IScheduleProps> = ({ idLocal, configLocalDate, deleteHour, addDataRequest, updateDataRequest, copyDayRequest }) => {

    const [openForm, setOpenForm] = useState<boolean>(false);
    // Rango en edición (null → el formulario abre en modo "nuevo")
    const [editItem, setEditItem] = useState<any>(null);
    const dayRef = useRef<number | undefined>(undefined);

    const openSetFormHook: (day: number) => void = (day) => {
        dayRef.current = day;
        setEditItem(null);
        setOpenForm(true);
    };

    // Abre el formulario precargado con un rango existente
    const openEditHook = (item: any) => {
        dayRef.current = Number(item.dayMonitoring);
        setEditItem(item);
        setOpenForm(true);
    };

    const closeSetFormHook: () => void = () => {
        dayRef.current = undefined;
        setEditItem(null);
        setOpenForm(false);
    };

    const pushDateDay: (dataForRequest: any) => void = dataForRequest => {
        if (editItem && updateDataRequest) {
            updateDataRequest(editItem.key, dataForRequest);   // reemplaza el rango original
        } else {
            addDataRequest(dataForRequest);
        }
        closeSetFormHook();
    };

    // ── Arrastrar un día configurado sobre otro para copiarlo ────────────────
    // La confirmación (modal global) y la persistencia las hace el padre en
    // copyDayRequest(diaOrigen, diaDestino). Solo se arrastran días con rangos.
    const dayHasRanges = (value: number) => configLocalDate.some(d => Number(d.dayMonitoring) === value);

    const { dragProps, dropProps, dragSource, overTarget, isDragging } = useDragCopy({
        onDropCopy: (source: number, target: number) => copyDayRequest?.(source, target),
        canDrop: (source: number, target: number) => source !== target && dayHasRanges(source),
    });

    const dndEnabled = Boolean(copyDayRequest);

    return (
        <>
            <div
                className='grid gap-3'
                style={{ gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))' }}
            >
                {DAYS.map(day => {
                    const ranges     = configLocalDate.filter(d => d.dayMonitoring === day.value);
                    const isSource   = isDragging && dragSource === day.value;
                    const isOverThis = overTarget === day.value;
                    return (
                        <div
                            key={day.value}
                            {...(dndEnabled ? dropProps(day.value) : {})}
                            className={`flex flex-col bg-white border rounded-xl overflow-hidden transition-shadow ${
                                isOverThis
                                    ? 'border-emerald-400 ring-2 ring-emerald-300/60 shadow-lg'
                                    : isSource
                                        ? 'border-emerald-300 opacity-60'
                                        : 'border-slate-200'
                            }`}
                            style={{ minHeight: '46vh' }}
                        >
                            <p
                                {...(dndEnabled ? dragProps(day.value, ranges.length > 0) : {})}
                                title={dndEnabled && ranges.length > 0 ? 'Arrastra esta cabecera sobre otro día para copiar su horario' : undefined}
                                className={`text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide py-2.5 bg-slate-50 border-b border-slate-200 select-none ${
                                    dndEnabled && ranges.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''
                                }`}
                            >
                                {day.label}
                            </p>

                            <div className='flex-1 flex flex-col items-center gap-2 p-2'>
                                {ranges.length > 0
                                    ? <BoxHours arr={ranges} deleteHour={deleteHour} onEdit={updateDataRequest ? openEditHook : undefined} />
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
                    initial={editItem}
                />
            )}
        </>
    );
};

export { ScheduleBox };