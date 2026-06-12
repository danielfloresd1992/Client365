import { useState, useEffect } from 'react';
import useAxios from '@/hook/useAxios';


export default function ManagerItem({
    id: mgr, onEdit, draggable = false, isOver = false,
    onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}) {

    


    


    if (!mgr) return <li className='h-4 w-24 bg-slate-200/60 rounded animate-pulse' />;


    /* ── Estado del gerente ────────────────────────────────────────────────────
     * status debe ser booleano: true = activo, false = inactivo.
     * Si llega como string ('activo'/'inactivo') o indefinido, es un registro
     * antiguo que hay que migrar → se marca de forma visible.
     */
    const statusManagerIsBool = typeof mgr.status === 'boolean';
    const needsUpdate  = !statusManagerIsBool;
    const managerIsActive = mgr.status === true;



    // Fondo de la fila (prioridad: arrastre > pendiente de migrar > activo/inactivo)
    const dotColor = needsUpdate ? 'bg-amber-400' : managerIsActive ? 'bg-emerald-500' : 'bg-slate-400';
    const dragStyles = draggable ? 'hover:bg-blue-100 hover:ring-blue-200 cursor-grab active:cursor-grabbing hover:bg-blue200  active:ring-1 active:ring-blue-500' : ''


    const styleSatus = () => {
        if(isOver) return 'bg-blue-200 ring-1 ring-blue-500';
        if(needsUpdate) return 'bg-amber-200 ring-1 ring-amber-500';
        if(managerIsActive) return 'bg-green-200 ring-1 ring-green-500';
      
        return 'bg-red-200 ring-1 ring-red-500';
    };




    return (
        <li
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            title={draggable ? 'Arrastra para reordenar' : undefined}
            className={`
                group flex items-center gap-[6px] rounded-lg px-1.5 py-1 text-[13px] transition-colors
                ${styleSatus()}
                ${dragStyles}
            `}
        >
            {
                draggable ? 
                    <span className='shrink-0 text-slate-300 group-hover:text-slate-500 select-none leading-none text-[11px]'>⠿</span>
                : 
                    <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${dotColor}`} />
            }

            <p className={`truncate select-none ${managerIsActive || needsUpdate ? 'text-slate-700' : 'text-slate-400'}`}>
                <span className='font-medium'>{mgr?.burden}</span>
                {mgr.name && <span className='text-slate-500'> · {mgr.name}</span>}
            </p>

            {/* Lado derecho: aviso de migración (siempre visible) + editar (al hover) */}
            <div className='ml-auto flex items-center gap-1.5 shrink-0'>

                {/* Aviso: status en formato antiguo, hay que actualizar */}
                {needsUpdate && (
                    <span
                        title='El estado de este gerente está en formato antiguo. Edítalo y guárdalo para migrarlo a activo/inactivo.'
                        className='flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 ring-1 ring-amber-300 rounded-full px-1.5 py-[1px] cursor-help'
                    >
                        ⚠ Actualizar
                    </span>
                )}

                {/* Editar gerente — no debe iniciar arrastre */}
                {onEdit && (
                    <button
                        draggable={false}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => onEdit(mgr)}
                        title='Editar gerente'
                        className='text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 hover:text-blue-800 transition-opacity cursor-pointer'
                    >
                        Editar
                    </button>
                )}
            </div>
        </li>
    );
}
