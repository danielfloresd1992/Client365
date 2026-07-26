'use client';
import { useEffect, useMemo, useState } from 'react';
import { getTodayRoster } from '@/libs/ajaxClient/user.fecth';
import { toMinutes, fmtHour } from '@/libs/time/operationalDay';

/*
 * Riel "Vienen hoy" del panel analítico: la ficha del personal que le toca
 * laborar HOY según el horario EFECTIVO que resuelve el backend
 * (GET /user/roster/today: override por fecha > regla semanal > defecto),
 * con marcaje real, roles del día y RETARDOS (attendance.isLate, calculado
 * por el backend al marcar entrada).
 *
 * Organización: secciones por DEPARTAMENTO y, dentro, por TURNO (☀️ diurno /
 * 🌙 nocturno). En cada tarjeta: estado contra el reloj vivo (en turno con
 * progreso, por llegar, salió) y "⏰ llegó tarde" en rosa cuando aplica.
 *
 * Se refresca solo: cada 5 minutos y al volver a la pestaña. Recibe `now`
 * del reloj del panel.
 */

const REFRESH_MS = 5 * 60 * 1000;

// Campanita de rol del día (misma iconografía que la grilla de /user)
function RoleBell({ label, className }) {
    return (
        <span title={label} className={`shrink-0 flex items-center gap-0.5 text-white text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded ${className}`}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='w-2.5 h-2.5'>
                <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
            </svg>
            {label}
        </span>
    );
}

// Avatar: foto si existe, iniciales si no (o si la foto falla)
function UserAvatar({ name, img, active }) {
    const [broken, setBroken] = useState(false);
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (img && !broken) {
        return (
            <img
                src={img}
                alt={name}
                onError={() => setBroken(true)}
                className={`w-9 h-9 shrink-0 rounded-full object-cover border-2 ${active ? 'border-[#29c50c]' : 'border-gray-200'}`}
            />
        );
    }
    return (
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black border-2 ${active ? 'bg-[#29c50c] border-[#29c50c] text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
            {initials}
        </span>
    );
}

function PersonCard({ p }) {
    return (
        <div className={`rounded-lg border px-2.5 py-2 ${p.late ? 'border-rose-200 bg-rose-50/60' : p.state === 'turno' ? 'border-emerald-200 bg-emerald-50/60' : p.state === 'salio' ? 'border-gray-100 bg-gray-50/60' : 'border-gray-100 bg-white'}`}>
            <div className='flex items-center gap-2.5'>
                <UserAvatar name={p.fullName} img={p.img} active={p.state === 'turno' && !p.late} />
                <span className='min-w-0 leading-tight flex-1'>
                    <span className='flex items-center gap-1'>
                        <span className={`text-[12px] font-semibold truncate ${p.state === 'salio' ? 'text-gray-400' : 'text-gray-700'}`} title={p.fullName}>{p.fullName}</span>
                        {p.onDuty && <RoleBell label='Turno' className='bg-blue-700' />}
                        {p.auxiliary && <RoleBell label='Auxiliar' className='bg-red-600' />}
                    </span>
                    <span className='block text-[10.5px] tabular-nums text-gray-400 truncate'>
                        {p.startTime && p.endTime ? `${p.startTime}–${p.endTime}` : 'sin horas definidas'}
                        {p.workType === 'extra' && <span className='text-green-700 font-bold'> · extra</span>}
                        {p.group ? ` · ${p.group}` : ''}
                    </span>
                </span>
            </div>

            {/* Línea de estado: marcaje real primero, la franja como contexto */}
            <div className='mt-1 flex items-center gap-1.5 flex-wrap'>
                {p.late && (
                    <span className='text-[10px] font-black text-rose-600 whitespace-nowrap'>⏰ llegó tarde{p.checkInLabel ? ` · entró ${p.checkInLabel}` : ''}</span>
                )}
                {p.state === 'turno' && (
                    <>
                        {!p.late && (
                            <span className='text-[10px] font-bold text-emerald-700 whitespace-nowrap'>
                                {p.checkInLabel ? `✓ entró ${p.checkInLabel}` : '⚠ en horario, sin marcar'}
                            </span>
                        )}
                        {p.progress !== null && (
                            <>
                                <span className={`relative flex-1 h-[5px] rounded-full overflow-hidden min-w-[50px] ${p.late ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                    <span className={`absolute inset-y-0 left-0 rounded-full ${p.late ? 'bg-rose-400' : 'bg-[#29c50c]'}`} style={{ width: `${p.progress}%` }} />
                                </span>
                                <span className={`text-[9px] font-bold tabular-nums ${p.late ? 'text-rose-600' : 'text-emerald-700'}`}>{p.progress}%</span>
                            </>
                        )}
                    </>
                )}
                {p.state === 'porLlegar' && (
                    <span className='text-[10px] font-semibold text-gray-500'>llega a las {p.startTime ?? '—'}</span>
                )}
                {p.state === 'salio' && (
                    <span className='text-[10px] font-semibold text-gray-400'>
                        salió {p.checkOutLabel ?? ''}{!p.late && p.checkInLabel ? ` · entró ${p.checkInLabel}` : ''}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function OperationsToday({ now }) {

    const [roster, setRoster] = useState(null);      // null = cargando

    useEffect(() => {
        let alive = true;
        const load = () => {
            getTodayRoster()
                .then(data => { if (alive) setRoster(Array.isArray(data?.roster) ? data.roster : []); })
                .catch(err => {
                    console.error('Roster del día:', err?.message ?? err);
                    if (alive) setRoster(prev => prev ?? []);
                });
        };
        load();
        const timer = setInterval(load, REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            alive = false;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    // Estado operativo por persona + agrupación DEPARTAMENTO → TURNO
    const { sections, stats } = useMemo(() => {
        const stats = { total: 0, enTurno: 0, tarde: 0 };
        if (!roster) return { sections: [], stats };
        const minuteNow = now ? now.getHours() * 60 + now.getMinutes() : null;

        const people = [];
        for (const r of roster) {
            if (!r.comes) continue;

            const start = toMinutes(r.startTime);
            const end = toMinutes(r.endTime);
            let inWindow = false;
            let progress = null;
            if (minuteNow !== null && start !== null && end !== null) {
                const span = end <= start ? (end + 1440 - start) : (end - start);
                let elapsed = minuteNow - start;
                if (elapsed < 0) elapsed += 1440;
                inWindow = elapsed >= 0 && elapsed < span;
                if (inWindow && span > 0) progress = Math.round((elapsed / span) * 100);
            }

            let state;
            if (r.checkOut) state = 'salio';
            else if (r.checkIn || inWindow) state = 'turno';
            else state = 'porLlegar';

            stats.total++;
            if (state === 'turno') stats.enTurno++;
            if (r.late) stats.tarde++;

            people.push({
                ...r,
                state,
                progress: state === 'turno' ? progress : null,
                fullName: `${r.name} ${r.surName}`.trim(),
                checkInLabel: fmtHour(r.checkIn),
                checkOutLabel: fmtHour(r.checkOut),
                startMin: start ?? 9999,
            });
        }

        // Departamento → turno; dentro: roles del día primero, luego grupo,
        // hora de entrada y nombre
        const roleRank = (p) => (p.onDuty ? 0 : p.auxiliary ? 1 : 2);
        const cmpNullable = (a, b) => {
            if (!a && !b) return 0;
            if (!a) return 1;
            if (!b) return -1;
            return a.localeCompare(b, 'es');
        };
        people.sort((a, b) =>
            roleRank(a) - roleRank(b)
            || cmpNullable(a.group, b.group)
            || a.startMin - b.startMin
            || a.fullName.localeCompare(b.fullName, 'es'));

        const byDept = new Map();
        for (const p of people) {
            const dept = p.department || 'Sin departamento';
            if (!byDept.has(dept)) byDept.set(dept, { Diurno: [], Nocturno: [] });
            byDept.get(dept)[p.shift === 'Nocturno' ? 'Nocturno' : 'Diurno'].push(p);
        }

        const sections = [...byDept.entries()]
            .sort((a, b) => {
                if (a[0] === 'Sin departamento') return 1;
                if (b[0] === 'Sin departamento') return -1;
                return a[0].localeCompare(b[0], 'es');
            })
            .map(([dept, shifts]) => ({ dept, shifts }));

        return { sections, stats };
    }, [roster, now]);

    return (
        <>
            <div className='shrink-0 px-4 pt-2 pb-1.5 border-b border-gray-100'>
                <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>Vienen hoy</h2>
                <div className='flex items-center gap-1.5 pt-1 flex-wrap'>
                    <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums'>{stats.enTurno} en turno</span>
                    <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 tabular-nums'>{stats.total} hoy</span>
                    {stats.tarde > 0 && (
                        <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 tabular-nums'>⏰ {stats.tarde} tarde</span>
                    )}
                </div>
            </div>

            <div className='flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-3'>
                {roster === null && (
                    <div className='flex flex-col gap-1.5 animate-pulse' aria-hidden='true'>
                        {Array.from({ length: 5 }, (_, i) => <div key={i} className='h-[52px] rounded-lg bg-gray-100' />)}
                    </div>
                )}

                {sections.map(({ dept, shifts }) => (
                    <div key={dept} className='flex flex-col gap-1.5'>
                        <h3 className='text-[10px] font-black uppercase tracking-wider text-gray-600 border-b border-gray-100 pb-1'>
                            {dept} · {shifts.Diurno.length + shifts.Nocturno.length}
                        </h3>
                        {['Diurno', 'Nocturno'].map(shift => shifts[shift].length > 0 && (
                            <div key={shift} className='flex flex-col gap-1.5'>
                                <h4 className='text-[9.5px] font-bold uppercase tracking-wider text-gray-400'>
                                    {shift === 'Nocturno' ? '🌙' : '☀️'} {shift} · {shifts[shift].length}
                                </h4>
                                {shifts[shift].map(p => <PersonCard key={p.userId} p={p} />)}
                            </div>
                        ))}
                    </div>
                ))}

                {roster !== null && stats.total === 0 && (
                    <p className='py-6 text-center text-xs text-gray-400'>Nadie tiene jornada hoy.</p>
                )}
            </div>
        </>
    );
}
