'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Fuse from 'fuse.js';
import { fetchUserData, userById, getAttendanceReport } from '@/libs/ajaxClient/user.fecth';

const ROWS_PER_PAGE = 10;
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeVE(dateStr) {
    if (!dateStr) return '--:--';
    return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Caracas'
    }).format(new Date(dateStr));
}

function formatMinutes(totalMin) {
    if (!totalMin || totalMin <= 0) return null;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatWorked(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    const ms = new Date(checkOut) - new Date(checkIn);
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
}

function calcWorkedMinutes(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.floor((new Date(checkOut) - new Date(checkIn)) / 60000));
}

function calcExtraMinutes(workedMin, startTime, endTime) {
    if (!startTime || !endTime || workedMin <= 0) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const scheduled = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(0, workedMin - scheduled);
}

function getBaseScheduleLabel(scheduleByDay, shiftType) {
    if (!scheduleByDay) return shiftType || 'Sin definir';
    const workingDays = [];
    const times = new Set();
    for (let d = 0; d <= 6; d++) {
        const rule = scheduleByDay[String(d)];
        if (rule && rule.workType !== 'descanso' && rule.startTime) {
            workingDays.push(DAY_NAMES[d]);
            if (rule.endTime) times.add(`${rule.startTime} – ${rule.endTime}`);
        }
    }
    const timeStr = times.size === 1 ? ` · ${[...times][0]}` : '';
    return workingDays.length > 0 ? `${workingDays.join('–')}${timeStr}` : (shiftType || 'Sin definir');
}

function calcLateMinutes(checkInStr, startTime) {
    if (!checkInStr || !startTime) return 0;
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date(checkInStr));
    const h = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const m = Number(parts.find(p => p.type === 'minute')?.value || 0);
    const [sh, sm] = startTime.split(':').map(Number);
    return Math.max(0, (h * 60 + m) - (sh * 60 + sm));
}

// ── Construcción del listado de días ────────────────────────────────────────

function buildDayList(reportData) {
    if (!reportData) return [];
    const { records, user, period } = reportData;

    const recordMap = new Map();
    records.forEach(r => recordMap.set(new Date(r.date).toISOString(), r));

    const scheduleByDay = user.workSchedule?.scheduleByDay || {};
    const today = startOfDay(new Date());
    const cur = new Date(period.from);
    const to = new Date(period.to);
    const days = [];

    while (cur <= to) {
        const key = cur.toISOString();
        const record = recordMap.get(key);
        const dow = cur.getUTCDay();
        const dayRule = scheduleByDay[String(dow)] || null;
        const override = record?.scheduleOverride;
        const effectiveWorkType = override?.workType || dayRule?.workType || 'laboral';
        const isWorkingDay = effectiveWorkType !== 'descanso';

        if (isWorkingDay || record) {
            const startTime = override?.startTime || dayRule?.startTime || null;
            const endTime = override?.endTime || dayRule?.endTime || null;
            const workedMin = calcWorkedMinutes(record?.checkIn, record?.checkOut);
            const extraMin = record?.checkIn ? calcExtraMinutes(workedMin, startTime, endTime) : 0;

            let status;
            if (record?.checkIn) {
                if (record.isExtraDay || effectiveWorkType === 'extra') status = 'Franco tr.';
                else if (record.isLate) status = 'Retardo';
                else status = 'Presente';
            } else if (override?.workType === 'descanso') {
                status = 'Descanso';
            } else if (record?.status === 'ausente') {
                status = 'Ausente';
            } else {
                const cellDay = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
                status = isBefore(cellDay, today) ? 'Ausente' : 'Pendiente';
            }

            let tipo = 'Laboral';
            if (effectiveWorkType === 'extra' || record?.isExtraDay) tipo = 'Franco trab.';
            else if (effectiveWorkType === 'descanso') tipo = 'Descanso';
            else if (effectiveWorkType === 'permiso') tipo = 'Permiso';
            else if (effectiveWorkType === 'vacaciones') tipo = 'Vacaciones';

            const noteText = record?.adminNotes || override?.note?.[override.note.length - 1]?.message || null;
            const lateMin = status === 'Retardo' ? calcLateMinutes(record?.checkIn, startTime) : 0;

            days.push({
                date: new Date(cur),
                record: record || null,
                startTime,
                endTime,
                effectiveWorkType,
                status,
                workedMin,
                extraMin,
                lateMin,
                tipo,
                noteText,
            });
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
}

// ── Generador HTML para ventana de impresión ─────────────────────────────

function buildPrintHTML(reportData, dayList) {
    const { user, summary, period } = reportData;
    const gen = new Date().toLocaleString('es-VE', {
        timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short'
    });
    const fromStr = new Date(period.from).toLocaleDateString('es-VE', { timeZone: 'UTC' });
    const toStr = new Date(period.to).toLocaleDateString('es-VE', { timeZone: 'UTC' });
    const schedLabel = getBaseScheduleLabel(user.workSchedule?.scheduleByDay, user.workSchedule?.shiftType);
    const totalMin = dayList.reduce((a, d) => a + d.workedMin, 0);

    const sColor = s => {
        if (s === 'Presente') return '#2e7d32';
        if (s === 'Retardo') return '#e65100';
        if (s === 'Ausente') return '#b71c1c';
        if (s === 'Franco tr.') return '#1565c0';
        return '#999';
    };

    const rows = dayList.map(d => {
        const dateStr = d.date.toLocaleDateString('es-VE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
            + ' ' + DAY_NAMES[d.date.getUTCDay()];
        const horario = d.startTime && d.endTime ? `${d.startTime}–${d.endTime}` : '—';
        const worked = formatWorked(d.record?.checkIn, d.record?.checkOut) || '0h 00m';
        const extras = d.extraMin > 0 ? `+${formatMinutes(d.extraMin)}` : '—';
        const retardo = d.lateMin > 0 ? `+${d.lateMin}m` : '—';
        return `<tr>
          <td>${dateStr}</td>
          <td style="color:${sColor(d.status)};font-weight:700">${d.status}</td>
          <td>${d.record?.checkIn ? formatTimeVE(d.record.checkIn) : '—'}</td>
          <td>${d.record?.checkOut ? formatTimeVE(d.record.checkOut) : '—'}</td>
          <td>${horario}</td>
          <td>${d.record?.checkIn ? worked : '0h 00m'}</td>
          <td style="color:${d.extraMin > 0 ? '#2e7d32' : '#bbb'};font-weight:${d.extraMin > 0 ? 700 : 400}">${extras}</td>
          <td style="color:${d.lateMin > 0 ? '#e65100' : '#bbb'};font-weight:${d.lateMin > 0 ? 700 : 400}">${retardo}</td>
          <td>${d.tipo}</td>
          <td style="color:#777">${d.noteText || '—'}</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Reporte Asistencia – ${user.name} ${user.surName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;color:#222;padding:18px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4CAF50;padding-bottom:10px;margin-bottom:14px}
.corp{font-size:19px;font-weight:900;color:#2e7d32}.corp-sub{font-size:9.5px;color:#555;margin-top:2px}
.rt h2{font-size:14px;font-weight:700;text-align:right}.rt p{font-size:9.5px;color:#666;margin-top:2px;text-align:right}
.sec{margin-bottom:12px}.sec-title{font-size:9.5px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:3px;margin-bottom:7px}
.emp{display:grid;grid-template-columns:1fr 1fr;gap:3px 18px}
.er{display:flex;gap:5px;font-size:10px}.el{color:#888;min-width:105px}.ev{font-weight:700}
.sg{display:flex;gap:6px;margin:12px 0}
.card{flex:1;border:1px solid #ddd;border-radius:5px;padding:7px 8px;text-align:center}
.cv{font-size:18px;font-weight:900}.cv.g{color:#2e7d32}.cv.a{color:#e65100}.cv.r{color:#b71c1c}
.cl{font-size:8px;color:#777;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}.cs{font-size:8px;color:#aaa;margin-top:1px}
table{width:100%;border-collapse:collapse}
th{background:#f0f0f0;font-weight:700;padding:5px 6px;border:1px solid #ccc;font-size:9.5px;text-align:left;white-space:nowrap}
td{padding:4px 6px;border:1px solid #ddd;font-size:10px;white-space:nowrap}
tr:nth-child(even) td{background:#fafafa}
.tot{display:flex;gap:6px;margin-top:9px;border-top:2px solid #e0e0e0;padding-top:8px}
.ti{flex:1;background:#f5f5f5;border-radius:4px;padding:6px 9px}
.tl{font-size:8.5px;color:#777;text-transform:uppercase}.tv{font-size:13px;font-weight:900;margin-top:2px}
.foot{text-align:center;font-size:8.5px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:7px}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head><body>
<div class="hdr">
  <div><div class="corp">Amazonas365</div><div class="corp-sub">Gestión de Recursos Humanos</div></div>
  <div class="rt"><h2>Reporte de Asistencia</h2><p>Período: ${fromStr} – ${toStr}</p><p>Generado: ${gen}</p></div>
</div>
<div class="sec">
  <div class="sec-title">Datos del Empleado</div>
  <div class="emp">
    <div class="er"><span class="el">Nombre completo</span><span class="ev">${user.name} ${user.surName}</span></div>
    <div class="er"><span class="el">Cédula / DNI</span><span class="ev">${user.dni || 'Sin registro'}</span></div>
    <div class="er"><span class="el">Departamento</span><span class="ev">${user.jobInformation?.department || 'Sin definir'}</span></div>
    <div class="er"><span class="el">Cargo</span><span class="ev">${user.jobInformation?.position || 'Sin definir'}</span></div>
    <div class="er"><span class="el">Turno</span><span class="ev">${user.workSchedule?.shiftType || 'Sin definir'}</span></div>
    <div class="er"><span class="el">Horario base</span><span class="ev">${schedLabel}</span></div>
  </div>
</div>
<div class="sec">
  <div class="sec-title">Resumen del Período</div>
  <div class="sg">
    <div class="card"><div class="cv">${summary.totalWorkingDays}</div><div class="cl">Días laborables</div><div class="cs">en el período</div></div>
    <div class="card"><div class="cv g">${summary.presentDays}</div><div class="cl">Días presentes</div><div class="cs">${summary.attendanceRate}% asistencia</div></div>
    <div class="card"><div class="cv a">${summary.lateDays}</div><div class="cl">Retardos</div><div class="cs">${summary.justifiedLateDays} justificado${summary.justifiedLateDays !== 1 ? 's' : ''}</div></div>
    <div class="card"><div class="cv g">${formatMinutes(summary.extraMinutes) || '0min'}</div><div class="cl">Horas extras</div><div class="cs">${dayList.filter(d => d.extraMin > 0).length} días con extra</div></div>
    <div class="card"><div class="cv r">${summary.absentDays}</div><div class="cl">Ausencias</div><div class="cs">sin justificar</div></div>
  </div>
</div>
<div class="sec">
  <div class="sec-title">Detalle de Asistencia</div>
  <table><thead><tr>
    <th>Fecha</th><th>Estado</th><th>Entrada</th><th>Salida</th>
    <th>Horario</th><th>Trabajadas</th><th>Extras</th><th>Retardo</th><th>Tipo</th><th>Nota</th>
  </tr></thead><tbody>${rows}</tbody></table>
</div>
<div class="tot">
  <div class="ti"><div class="tl">Total horas trabajadas</div><div class="tv" style="color:#2e7d32">${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, '0')}m</div></div>
  <div class="ti"><div class="tl">Total horas extras</div><div class="tv" style="color:#2e7d32">${formatMinutes(summary.extraMinutes) || '0min'}</div></div>
  <div class="ti"><div class="tl">Total retardos</div><div class="tv" style="color:#e65100">${formatMinutes(summary.lateMinutes) || '0min'}</div></div>
  <div class="ti"><div class="tl">Horas esperadas</div><div class="tv">${Math.floor(summary.expectedMinutes / 60)}h ${String(summary.expectedMinutes % 60).padStart(2, '0')}m</div></div>
</div>
<div class="foot">CORP365 · Gestión de Recursos Humanos · Documento confidencial</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        'Presente': { dot: 'bg-green-500', tx: 'text-green-700 font-semibold' },
        'Retardo': { dot: 'bg-amber-500', tx: 'text-amber-600 font-bold' },
        'Ausente': { dot: 'bg-red-500', tx: 'text-red-600 font-bold' },
        'Franco tr.': { dot: 'bg-blue-500', tx: 'text-blue-600 font-semibold' },
        'Descanso': { dot: 'bg-gray-300', tx: 'text-gray-400' },
        'Pendiente': { dot: 'bg-gray-300', tx: 'text-gray-400 italic' },
    };
    const c = map[status] || map['Pendiente'];
    return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <span className={`text-[11px] ${c.tx}`}>{status}</span>
        </span>
    );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function SummaryCard({ value, label, sub, color }) {
    const colors = { green: 'text-emerald-600', amber: 'text-amber-500', red: 'text-red-500', gray: 'text-gray-700' };
    return (
        <div className='bg-white rounded-xl border shadow-sm p-4 text-center'>
            <p className={`text-3xl font-black leading-none ${colors[color] || colors.gray}`}>{value}</p>
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-2'>{label}</p>
            <p className='text-[10px] text-gray-400 mt-0.5'>{sub}</p>
        </div>
    );
}

function PageBtn({ children, onClick, disabled, active }) {
    return (
        <button onClick={onClick} disabled={disabled}
            className={`w-7 h-7 rounded text-xs font-semibold transition-colors
                ${active ? 'bg-emerald-600 text-white' : ''}
                ${!active && !disabled ? 'text-gray-600 hover:bg-gray-100' : ''}
                ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}`}>
            {children}
        </button>
    );
}

function FooterCell({ label, value, green, amber }) {
    const color = green ? 'text-emerald-600' : amber ? 'text-amber-500' : 'text-gray-700';
    return (
        <div className='px-4 py-3 border-r last:border-r-0'>
            <p className='text-[10px] text-gray-400 uppercase tracking-wider'>{label}</p>
            <p className={`text-base font-black mt-0.5 ${color}`}>{value}</p>
        </div>
    );
}

function AttendanceRow({ day }) {
    const horario = day.startTime && day.endTime ? `${day.startTime}–${day.endTime}` : '—';
    const worked = day.record?.checkIn ? (formatWorked(day.record.checkIn, day.record.checkOut) || '—') : '—';
    const extraTx = day.extraMin > 0 ? `+${formatMinutes(day.extraMin)}` : '—';
    const retardoTx = day.lateMin > 0 ? `+${day.lateMin}m` : '—';
    const dateStr = day.date.toLocaleDateString('es-VE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
    const dayName = DAY_NAMES[day.date.getUTCDay()];

    const rowBg = day.status === 'Retardo' ? 'bg-amber-50/50' : day.status === 'Ausente' ? 'bg-red-50/30' : '';

    return (
        <tr className={`hover:bg-gray-50/70 transition-colors ${rowBg}`}>
            <td className='px-3 py-2 whitespace-nowrap'>
                <span className='text-[12px] font-medium text-gray-700'>{dateStr}</span>
                <span className='text-[11px] text-gray-400 ml-1'>{dayName}</span>
            </td>
            <td className='px-3 py-2'><StatusBadge status={day.status} /></td>
            <td className='px-3 py-2 text-[12px] font-bold text-gray-700 whitespace-nowrap'>
                {day.record?.checkIn ? formatTimeVE(day.record.checkIn) : '—'}
            </td>
            <td className='px-3 py-2 text-[12px] font-bold text-gray-700 whitespace-nowrap'>
                {day.record?.checkOut ? formatTimeVE(day.record.checkOut) : '—'}
            </td>
            <td className='px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap'>{horario}</td>
            <td className='px-3 py-2 text-[12px] text-gray-700 whitespace-nowrap'>{worked}</td>
            <td className={`px-3 py-2 text-[12px] font-bold whitespace-nowrap ${day.extraMin > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{extraTx}</td>
            <td className={`px-3 py-2 text-[12px] font-bold whitespace-nowrap ${day.lateMin > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{retardoTx}</td>
            <td className='px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap'>{day.tipo}</td>
            <td className='px-3 py-2 text-[11px] text-gray-400 max-w-[130px] truncate'>{day.noteText || '—'}</td>
        </tr>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function AsistenciaPage() {
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    // Cargar usuarios
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchUserData();
                const ids = data.result || [];
                const full = await Promise.all(ids.map(u => userById(u._id).then(r => r.result)));
                setAllUsers(full.filter(Boolean));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingUsers(false);
            }
        })();
    }, []);

    // Cerrar dropdown fuera
    useEffect(() => {
        const h = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Búsqueda fuzzy
    const fuse = useMemo(() => new Fuse(allUsers, {
        keys: ['name', 'surName', 'dni'], threshold: 0.35
    }), [allUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return allUsers.slice(0, 8);
        return fuse.search(searchQuery).map(r => r.item).slice(0, 8);
    }, [searchQuery, fuse, allUsers]);

    // Lista de días
    const dayList = useMemo(() => buildDayList(reportData), [reportData]);

    // Paginación
    const totalPages = Math.max(1, Math.ceil(dayList.length / ROWS_PER_PAGE));
    const paginatedDays = useMemo(() => {
        const s = (currentPage - 1) * ROWS_PER_PAGE;
        return dayList.slice(s, s + ROWS_PER_PAGE);
    }, [dayList, currentPage]);

    // Totales para el footer
    const totalWorkedMin = useMemo(() => dayList.reduce((a, d) => a + d.workedMin, 0), [dayList]);

    const handleSelectUser = u => {
        setSelectedUser(u);
        setSearchQuery('');
        setShowDropdown(false);
        setReportData(null);
        setCurrentPage(1);
    };

    const handleConsultar = async () => {
        if (!selectedUser || !fromDate || !toDate) return;
        setIsLoading(true);
        setError(null);
        setReportData(null);
        setCurrentPage(1);
        try {
            const data = await getAttendanceReport(selectedUser._id, fromDate, toDate);
            setReportData(data);
        } catch (e) {
            setError('No se pudo obtener el reporte. Verifica la conexión e intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLimpiar = () => {
        setSelectedUser(null);
        setSearchQuery('');
        setFromDate('');
        setToDate('');
        setReportData(null);
        setCurrentPage(1);
        setError(null);
    };

    const handleExportPDF = () => {
        if (!reportData) return;
        const win = window.open('', '_blank', 'width=1100,height=750');
        win.document.write(buildPrintHTML(reportData, dayList));
        win.document.close();
    };

    const { summary } = reportData || {};
    const scheduleLabel = reportData
        ? getBaseScheduleLabel(reportData.user.workSchedule?.scheduleByDay, reportData.user.workSchedule?.shiftType)
        : '';
    const initials = reportData
        ? `${reportData.user.name?.[0] || ''}${reportData.user.surName?.[0] || ''}`.toUpperCase()
        : '';
    const periodLabel = useMemo(() => {
        if (!reportData) return '';
        const from = new Date(reportData.period.from);
        const to = new Date(reportData.period.to);
        const fl = format(from, 'MMM yyyy', { locale: es });
        const tl = format(to, 'MMM yyyy', { locale: es });
        const label = fl === tl ? fl : `${fl} – ${tl}`;
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, [reportData]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className='w-full h-full p-4 sm:p-6 bg-gray-50 flex flex-col gap-4'>

            {/* HEADER */}
            <div className='bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between'>
                <div>
                    <h1 className='text-lg font-bold text-gray-800'>Reporte de asistencia</h1>
                    <p className='text-xs text-gray-500'>Consulta detallada por empleado y rango de fechas</p>
                </div>
                <button
                    onClick={handleExportPDF}
                    disabled={!reportData}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                        ${reportData ? 'bg-gray-800 text-white hover:bg-gray-700 active:scale-95 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                </button>
            </div>

            {/* FILTROS */}
            <div className='bg-white rounded-xl shadow-sm border p-4'>
                <div className='flex flex-wrap items-end gap-3'>

                    {/* Selector empleado */}
                    <div className='flex flex-col gap-1 min-w-[220px]' ref={dropdownRef}>
                        <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                            Empleado <span className='text-red-400'>*</span>
                        </label>
                        {selectedUser ? (
                            <div className='flex items-center gap-2 h-9 bg-gray-100 border border-gray-300 rounded-lg px-3'>
                                <span className='text-sm font-semibold text-gray-800 truncate flex-1 max-w-[170px]'>
                                    {selectedUser.name} {selectedUser.surName}
                                </span>
                                <button
                                    onClick={() => { setSelectedUser(null); setReportData(null); }}
                                    className='text-gray-400 hover:text-red-500 text-lg leading-none flex-shrink-0 transition-colors'
                                    title='Quitar selección'
                                >×</button>
                            </div>
                        ) : (
                            <div className='relative'>
                                <input
                                    type='text'
                                    placeholder={loadingUsers ? 'Cargando empleados...' : 'Buscar por nombre o cédula'}
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                    className='w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'
                                    disabled={loadingUsers}
                                    autoComplete='off'
                                />
                                {showDropdown && filteredUsers.length > 0 && (
                                    <div className='absolute z-50 top-full mt-1 w-[290px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden'>
                                        {filteredUsers.map(u => (
                                            <button
                                                key={u._id}
                                                onMouseDown={() => handleSelectUser(u)}
                                                className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 text-left transition-colors border-b border-gray-50 last:border-b-0'
                                            >
                                                <div className='w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                                                    {u.img
                                                        ? <img src={u.img} className='w-full h-full object-cover' alt='' />
                                                        : <span className='text-[11px] font-bold text-slate-600'>{u.name?.[0]}{u.surName?.[0]}</span>
                                                    }
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-semibold text-gray-800 truncate'>{u.name} {u.surName}</p>
                                                    <p className='text-[10px] text-gray-400 truncate'>{u.dni || 'Sin cédula'} · {u.jobInformation?.position || 'Sin cargo'}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desde */}
                    <div className='flex flex-col gap-1'>
                        <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Desde</label>
                        <input type='date' value={fromDate} onChange={e => setFromDate(e.target.value)}
                            className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                    </div>

                    {/* Hasta */}
                    <div className='flex flex-col gap-1'>
                        <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Hasta</label>
                        <input type='date' value={toDate} onChange={e => setToDate(e.target.value)}
                            className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                    </div>

                    {/* Botones */}
                    <div className='flex gap-2 items-end pb-0'>
                        <button
                            onClick={handleConsultar}
                            disabled={!selectedUser || !fromDate || !toDate || isLoading}
                            className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition-all
                                ${selectedUser && fromDate && toDate && !isLoading
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            {isLoading ? 'Consultando...' : 'Consultar'}
                        </button>
                        <button onClick={handleLimpiar}
                            className='h-9 px-4 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors'>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3'>
                    {error}
                </div>
            )}

            {/* LOADING */}
            {isLoading && (
                <div className='flex-1 flex items-center justify-center'>
                    <div className='flex flex-col items-center gap-3 text-gray-400'>
                        <div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin' />
                        <span className='text-sm'>Cargando reporte...</span>
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && !reportData && !error && (
                <div className='flex-1 flex items-center justify-center'>
                    <div className='text-center text-gray-400'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className='text-sm font-semibold text-gray-500'>Selecciona un empleado y un rango de fechas</p>
                        <p className='text-xs text-gray-400 mt-1'>Luego haz click en Consultar para ver el reporte</p>
                    </div>
                </div>
            )}

            {/* REPORTE */}
            {!isLoading && reportData && (
                <>
                    {/* Info empleado */}
                    <div className='bg-white rounded-xl shadow-sm border px-4 py-3 flex items-center gap-4'>
                        <div className='w-9 h-9 rounded-full bg-emerald-100 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                            {reportData.user.img
                                ? <img src={reportData.user.img} className='w-full h-full object-cover' alt='' />
                                : <span className='text-sm font-black text-emerald-700'>{initials}</span>}
                        </div>
                        <div className='flex-1 flex flex-wrap items-center gap-x-3 gap-y-0.5'>
                            <span className='font-bold text-gray-800'>{reportData.user.name} {reportData.user.surName}</span>
                            <span className='text-sm text-gray-400'>{reportData.user.dni}</span>
                            <span className='text-sm text-gray-500'>
                                {reportData.user.jobInformation?.department || 'Sin departamento'}
                                {' · '}
                                {reportData.user.jobInformation?.position || 'Sin cargo'}
                            </span>
                        </div>
                        <div className='text-right text-xs text-gray-400 hidden sm:block whitespace-nowrap'>
                            <p className='font-semibold text-gray-600'>Turno {reportData.user.workSchedule?.shiftType || 'Sin definir'}</p>
                            <p>{scheduleLabel}</p>
                        </div>
                    </div>

                    {/* CARDS de resumen */}
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                        <SummaryCard value={summary.totalWorkingDays} label='Días laborables' sub='en el período' color='gray' />
                        <SummaryCard value={summary.presentDays} label='Días presentes' sub={`${summary.attendanceRate}% asistencia`} color='green' />
                        <SummaryCard value={summary.lateDays} label='Retardos' sub={`${summary.justifiedLateDays} justificado${summary.justifiedLateDays !== 1 ? 's' : ''}`} color='amber' />
                        <SummaryCard value={formatMinutes(summary.extraMinutes) || '0min'} label='Horas extras' sub={`${dayList.filter(d => d.extraMin > 0).length} días con extra`} color='green' />
                        <SummaryCard value={summary.absentDays} label='Ausencias' sub='sin justificar' color='red' />
                    </div>

                    {/* TABLA */}
                    <div className='bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden'>

                        {/* Sub-header */}
                        <div className='flex items-center justify-between px-4 py-2.5 border-b'>
                            <p className='text-sm text-gray-500'>
                                <span className='font-bold text-gray-700'>{dayList.length} registros</span> · {periodLabel}
                            </p>
                            <button
                                onClick={handleExportPDF}
                                className='flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                            </button>
                        </div>

                        {/* Scroll horizontal */}
                        <div className='overflow-auto'>
                            <table className='min-w-full text-sm'>
                                <thead className='sticky top-0 bg-gray-50 z-10 border-b border-gray-200'>
                                    <tr>
                                        {['Fecha', 'Estado', 'Entrada', 'Salida', 'Horario', 'Trabajadas', 'Extras', 'Retardo', 'Tipo', 'Nota adm.'].map(h => (
                                            <th key={h} className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap'>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {paginatedDays.map((day, i) => <AttendanceRow key={i} day={day} />)}
                                    {paginatedDays.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className='text-center py-10 text-gray-400 text-sm'>
                                                No hay registros en este período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINACIÓN */}
                        {totalPages > 1 && (
                            <div className='border-t px-4 py-2 flex items-center justify-between bg-white'>
                                <span className='text-xs text-gray-400'>
                                    Mostrando {(currentPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(currentPage * ROWS_PER_PAGE, dayList.length)} de {dayList.length}
                                </span>
                                <div className='flex items-center gap-1'>
                                    <PageBtn onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</PageBtn>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce((acc, p, idx, arr) => {
                                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) => p === '…'
                                            ? <span key={`d${i}`} className='px-1 text-gray-400 text-xs'>…</span>
                                            : <PageBtn key={p} onClick={() => setCurrentPage(p)} active={p === currentPage}>{p}</PageBtn>
                                        )}
                                    <PageBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</PageBtn>
                                </div>
                            </div>
                        )}

                        {/* TOTALES */}
                        <div className='border-t grid grid-cols-2 sm:grid-cols-4 bg-gray-50 rounded-b-xl'>
                            <FooterCell label='Total horas trabajadas' value={`${Math.floor(totalWorkedMin / 60)}h ${String(totalWorkedMin % 60).padStart(2, '0')}m`} green />
                            <FooterCell label='Total horas extras' value={formatMinutes(summary.extraMinutes) || '0min'} green />
                            <FooterCell label='Minutos de retardo' value={formatMinutes(summary.lateMinutes) || '0min'} amber />
                            <FooterCell label='Horas esperadas' value={`${Math.floor(summary.expectedMinutes / 60)}h ${String(summary.expectedMinutes % 60).padStart(2, '0')}m`} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
