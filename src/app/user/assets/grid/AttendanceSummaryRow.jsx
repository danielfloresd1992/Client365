'use client';

import { useEffect, useReducer } from 'react';
import { startOfDay } from 'date-fns';
import { attendanceCache, subscribeAttendanceCache } from '../state/attendanceCache';

/**
 * Fila de resumen alineada a la grilla: la primera celda mide EXACTAMENTE lo
 * mismo que el recuadro foto+nombre (w-48) para no romper la sincronía, y
 * cada celda de día cuenta para esa fecha: disponibles (les toca laborar),
 * faltas y llegadas tarde. Considera el override del día si ya está en caché
 * (celdas cargadas / sockets) y si no, la regla semanal del usuario.
 */
const SUMMARY_NO_WORK_TYPES = ['descanso', 'permiso', 'vacaciones', 'falta'];
const SUMMARY_TONES = {
    sub: 'bg-white',
    shift: 'bg-gray-50',
    dept: 'bg-gray-100',
};
export default function AttendanceSummaryRow({ label, users, daysRange, tone = 'sub' }) {
    // Re-render cuando la caché de asistencia cambia
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    useEffect(() => {
        return subscribeAttendanceCache(forceUpdate);
    }, []);

    const toneClass = SUMMARY_TONES[tone] || SUMMARY_TONES.sub;

    const dayStats = (dateObj) => {
        const normalized = startOfDay(dateObj);
        const key = normalized.toISOString();
        const dow = String(normalized.getDay());
        let available = 0;
        let faltas = 0;
        let tardes = 0;
        users.forEach((u) => {
            const cached = attendanceCache.get(`${u.dni}-${key}`);
            const rule = u?.workSchedule?.scheduleByDay?.[dow];
            const type = cached?.scheduleOverride?.workType || rule?.workType || 'laboral';
            if (!SUMMARY_NO_WORK_TYPES.includes(type)) available++;
            if (type === 'falta' || cached?.status === 'ausente') faltas++;
            if (cached?.isLate) tardes++;
        });
        return { available, faltas, tardes };
    };

    const todayStats = dayStats(new Date());

    return (
        <div className={`flex border-b-2 border-gray-300 select-none ${toneClass}`}>
            {/* Celda sticky: mismo ancho que el recuadro foto+nombre de UserList */}
            <div className={`sticky left-0 z-10 w-48 min-w-[12rem] border-r border-gray-300 px-3 py-1.5 flex flex-col justify-center ${toneClass}`}>
                <p className='font-black text-[11px] text-gray-700 uppercase tracking-wider leading-tight truncate'>{label}</p>
                <div className='flex items-center gap-3 mt-1'>
                    <div className='flex items-baseline gap-1.5'>
                        <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Total</span>
                        <span className='text-xl font-black text-gray-900 leading-none'>{users.length}</span>
                    </div>
                    <div className='h-5 w-px bg-gray-300' />
                    <div className='flex items-baseline gap-1.5'>
                        <span className='text-[9px] font-black text-emerald-600 uppercase tracking-tighter'>Laboran hoy</span>
                        <span className='text-xl font-black text-emerald-600 leading-none'>{todayStats.available}</span>
                    </div>
                </div>
            </div>

            {/* Celdas por día: disponibles / faltas / tardes (layout tipo IN/OUT) */}
            {daysRange.map((day) => {
                const stats = dayStats(day.dateObj);
                return (
                    <div
                        key={day.fullDateISO}
                        className={`flex-shrink-0 w-24 border-r border-gray-300 px-1.5 py-1 flex flex-col justify-center gap-0.5 ${day.isToday ? 'bg-blue-50/40 shadow-[inset_3px_0_0_#3b82f6,inset_-3px_0_0_#3b82f6]' : ''}`}
                    >
                        <div className='flex justify-between items-center px-1.5 py-0.5 bg-emerald-100/80 border border-emerald-200 rounded'>
                            <span className='text-[9px] font-black text-emerald-700 uppercase tracking-tighter'>Disp</span>
                            <span className='text-[15px] font-black text-emerald-700 leading-none'>{stats.available}</span>
                        </div>
                        <div className='flex justify-between items-center px-1'>
                            <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Falta</span>
                            <span className={`text-[12px] font-extrabold ${stats.faltas > 0 ? 'text-red-600' : 'text-gray-300'}`}>{stats.faltas}</span>
                        </div>
                        <div className='flex justify-between items-center px-1'>
                            <span className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Tarde</span>
                            <span className={`text-[12px] font-extrabold ${stats.tardes > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{stats.tardes}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
