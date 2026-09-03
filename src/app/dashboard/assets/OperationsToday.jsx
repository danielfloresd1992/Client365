'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import socket from '@/libs/socket/socketIo';
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
 * EN VIVO: cuando un empleado marca entrada/salida (o el admin le cambia el
 * horario o un rol del día), la api emite { finalRecord, user } por un canal
 * por-usuario-y-fecha cuyo nombre lleva el email. No reconstruimos ese nombre:
 * escuchamos con socket.onAny y filtramos por la FORMA del payload, luego
 * parcheamos la fila en sitio. Así la llegada, la salida y EL CONTEO (stats,
 * derivados del roster) se actualizan al instante, sin recargar todo.
 *
 * Fuera de eso se refresca solo: cada 5 minutos y al volver a la pestaña.
 * Recibe `now` del reloj del panel.
 */

const REFRESH_MS = 5 * 60 * 1000;

// Tipos de jornada con los que el empleado NO viene hoy (igual que el backend)
const NO_WORK_TYPES = ['descanso', 'vacaciones', 'permiso', 'falta'];

// Dos fechas de asistencia son "el mismo día" si comparten el YYYY-MM-DD:
// attendance guarda `date` a medianoche UTC del día civil, así que el prefijo
// de 10 caracteres basta y evita depender de la hora exacta serializada.
const sameCivilDate = (a, b) => String(a).slice(0, 10) === String(b).slice(0, 10);

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


// Chevron del acordeón (rota al abrir)
function Chevron({ open }) {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'
            className={`w-3.5 h-3.5 shrink-0 text-gray-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <polyline points='6 9 12 15 18 9'></polyline>
        </svg>
    );
}



export default function OperationsToday({ now }) {

    const [roster, setRoster] = useState(null);      // null = cargando
    // Acordeones de turno abiertos: { `${dept}|${shift}` → true }. Cerrados por defecto.
    const [openShifts, setOpenShifts] = useState({});
    // Día civil que se está mostrando (lo devuelve el roster). Se usa para
    // descartar eventos de asistencia de OTRAS fechas (p. ej. el admin edita
    // el horario de un día futuro) sin recalcular el reloj del cliente.
    const rosterDateRef = useRef(null);

    const toggleShift = (key) => setOpenShifts(prev => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        let alive = true;
        const load = () => {
            getTodayRoster()
                .then(data => {
                    if (!alive) return;
                    rosterDateRef.current = data?.date ?? null;
                    setRoster(Array.isArray(data?.roster) ? data.roster : []);
                })
                .catch(err => {
                    console.error('Roster del día:', err?.message ?? err);
                    if (alive) setRoster(prev => prev ?? []);
                });
        };
        load();

        // Marcaje en vivo. El payload de asistencia tiene forma { finalRecord,
        // user }; cualquier otro evento del socket (monitoreo, alertas, chat…)
        // no la cumple y se ignora. finalRecord es el doc de Attendance ⇒ trae
        // checkIn/checkOut/isLate/onDuty/auxiliary y, si hubo cambio de horario,
        // scheduleOverride. Parcheamos la fila del usuario y el useMemo recalcula
        // estado y conteos.
        const onAttendance = (_event, payload) => {
            const rec = payload?.finalRecord;
            const usr = payload?.user;
            if (!alive || !rec?._id || !usr?._id) return;
            // Solo el día que se muestra (ignora ediciones de otras fechas)
            if (rec.date && rosterDateRef.current && !sameCivilDate(rec.date, rosterDateRef.current)) return;

            const uid = String(rec.userId ?? usr._id);
            setRoster(prev => {
                if (!Array.isArray(prev)) return prev;
                const idx = prev.findIndex(p => String(p.userId) === uid);
                if (idx === -1) {
                    // Marcó alguien que no estaba en la ficha (p. ej. franco-
                    // trabajado sin regla del día): re-sincroniza para no perder
                    // su fila ni el conteo.
                    if (rec.checkIn) load();
                    return prev;
                }
                const next = prev.slice();
                const row = { ...next[idx] };
                row.checkIn = rec.checkIn ?? null;
                row.checkOut = rec.checkOut ?? null;
                row.late = Boolean(rec.isLate);
                row.onDuty = Boolean(rec.onDuty);
                row.auxiliary = Boolean(rec.auxiliary);
                // Cambio puntual de horario (override): actualiza jornada efectiva
                const ov = rec.scheduleOverride?.workType ? rec.scheduleOverride : null;
                if (ov) {
                    row.workType = ov.workType || row.workType;
                    row.shift = ov.shift || row.shift;
                    row.startTime = ov.startTime ?? row.startTime;
                    row.endTime = ov.endTime ?? row.endTime;
                    row.comes = !NO_WORK_TYPES.includes(row.workType);
                }
                next[idx] = row;
                return next;
            });
        };
        socket.onAny(onAttendance);

        const timer = setInterval(load, REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            alive = false;
            socket.offAny(onAttendance);
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

            // ¿Está dentro de su franja horaria ahora? (define el estado 'turno')
            const start = toMinutes(r.startTime);
            const end = toMinutes(r.endTime);
            let inWindow = false;
            if (minuteNow !== null && start !== null && end !== null) {
                const span = end <= start ? (end + 1440 - start) : (end - start);
                let elapsed = minuteNow - start;
                if (elapsed < 0) elapsed += 1440;
                inWindow = elapsed >= 0 && elapsed < span;
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
            <div className='shrink-0 px-4 max-lg:px-3 pt-2 pb-1.5 border-b border-gray-100'>
                <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>Vienen hoy</h2>
                <div className='flex items-center gap-1.5 pt-1 flex-wrap'>
                    <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 tabular-nums'><b className='font-black'>{stats.enTurno}</b> en turno</span>
                    <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-gray-300 text-gray-500 tabular-nums'><b className='font-black'>{stats.total}</b> hoy</span>
                    {stats.tarde > 0 && (
                        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-rose-300 text-rose-600 tabular-nums'>⏰ <b className='font-black'>{stats.tarde}</b> tarde</span>
                    )}
                </div>
            </div>

            <div className='lg:flex-1 lg:min-h-0 lg:overflow-y-auto px-3 py-2 flex flex-col gap-3'>
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
                        {['Diurno', 'Nocturno'].map(shift => {
                            const people = shifts[shift];
                            if (people.length === 0) return null;
                            const key = `${dept}|${shift}`;
                            const open = Boolean(openShifts[key]);
                            const enTurno = people.filter(p => p.state === 'turno').length;
                            const tarde = people.filter(p => p.late).length;
                            return (
                                <div key={shift} className='rounded-lg border border-gray-100 overflow-hidden'>
                                    {/* Cabecera-acordeón: resumen del turno + chevron */}
                                    <button
                                        type='button'
                                        onClick={() => toggleShift(key)}
                                        aria-expanded={open}
                                        className='group w-full flex items-center flex-wrap max-lg:flex-nowrap gap-x-2 gap-y-1 px-2.5 py-2 bg-gray-50/70 hover:bg-gray-100 transition-colors'
                                    >
                                        <span className='text-[11px] font-bold text-gray-600 whitespace-nowrap'>
                                            {shift === 'Nocturno' ? '🌙' : '☀️'} {shift}
                                        </span>
                                        <span className='flex items-center gap-1 ml-auto max-lg:flex-wrap max-lg:justify-end'>
                                            {enTurno > 0 && (
                                                <span className='text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 tabular-nums max-lg:whitespace-nowrap'>
                                                    <b className='text-[11px] font-black'>{enTurno}</b> en turno
                                                </span>
                                            )}
                                            {tarde > 0 && (
                                                <span className='text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full border border-rose-300 text-rose-600 tabular-nums max-lg:whitespace-nowrap' title='Llegaron tarde'>
                                                    ⏰ <b className='text-[11px] font-black'>{tarde}</b>
                                                </span>
                                            )}
                                            <span className='text-[11px] font-black px-1.5 py-0.5 rounded-full border border-gray-300 text-gray-700 tabular-nums min-w-[22px] text-center' title='Total del turno'>{people.length}</span>
                                        </span>
                                        <span className='w-5 h-5 shrink-0 flex items-center justify-center rounded-md bg-white border border-gray-400 group-hover:border-gray-500 group-hover:bg-gray-50 transition-colors'>
                                            <Chevron open={open} />
                                        </span>
                                    </button>
                                    {open && (
                                        <div className='flex flex-col gap-1.5 p-1.5'>
                                            {people.map(p => <PersonCard key={p.userId} p={p} />)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {roster !== null && stats.total === 0 && (
                    <p className='py-6 text-center text-xs text-gray-400'>Nadie tiene jornada hoy.</p>
                )}
            </div>
        </>
    );
}
