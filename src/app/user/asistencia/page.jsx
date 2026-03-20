'use client';

/**
 * Página /user/asistencia
 *
 * Tiene dos modos de consulta accesibles mediante tabs:
 *
 *  1. "Reporte Individual" — consulta de un empleado en un rango de fechas.
 *     Muestra cards de resumen, tabla paginada de asistencias y exporta PDF.
 *
 *  2. "Reporte Global" — consolida a TODOS los empleados activos en un rango
 *     de fechas con sus totales de retardos (semana / finde) y días extra.
 *     Usa un único endpoint de agregación MongoDB para no saturar el servidor.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Fuse from 'fuse.js';
import {
    fetchUserData,
    userById,
    getAttendanceReport,
    getGlobalAttendanceReport
} from '@/libs/ajaxClient/user.fecth';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const ROWS_PER_PAGE = 10;

/** Nombres abreviados de días (índice = getUTCDay()) */
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES COMPARTIDAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formatea un string de fecha ISO a hora local Venezuela (UTC-4, 24 h).
 * @param {string|null} dateStr
 * @returns {string} "HH:mm" o "--:--" si no hay valor
 */
function formatTimeVE(dateStr) {
    if (!dateStr) return '--:--';
    return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Caracas'
    }).format(new Date(dateStr));
}

/**
 * Convierte minutos totales a cadena legible "Xh Ym" / "Xh" / "Ymin".
 * Devuelve null si el valor es 0 o negativo.
 * @param {number} totalMin
 * @returns {string|null}
 */
function formatMinutes(totalMin) {
    if (!totalMin || totalMin <= 0) return null;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Calcula y formatea la duración entre checkIn y checkOut como "Xh YYm".
 * Devuelve null si alguno de los dos falta.
 * @param {string|null} checkIn
 * @param {string|null} checkOut
 * @returns {string|null}
 */
function formatWorked(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    const ms = new Date(checkOut) - new Date(checkIn);
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Calcula minutos trabajados entre checkIn y checkOut.
 * @returns {number} 0 si falta alguno de los dos
 */
function calcWorkedMinutes(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.floor((new Date(checkOut) - new Date(checkIn)) / 60000));
}

/**
 * Calcula minutos extras = max(0, trabajados - programados).
 * @param {number} workedMin - Minutos realmente trabajados
 * @param {string|null} startTime - "HH:mm" de entrada programada
 * @param {string|null} endTime   - "HH:mm" de salida programada
 * @returns {number}
 */
function calcExtraMinutes(workedMin, startTime, endTime) {
    if (!startTime || !endTime || workedMin <= 0) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, workedMin - ((eh * 60 + em) - (sh * 60 + sm)));
}

/**
 * Calcula los minutos de retardo de un checkIn respecto al startTime programado.
 * Convierte el checkIn a hora Venezuela (UTC-4) antes de comparar.
 * @param {string|null} checkInStr - ISO Date string del checkIn
 * @param {string|null} startTime  - "HH:mm" de entrada programada (hora VE)
 * @returns {number} minutos de retardo (0 si no hay retardo)
 */
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

/**
 * Construye una cadena con el horario base del empleado a partir de scheduleByDay.
 * Ejemplo resultado: "Lun–Vie · 08:00 – 17:00"
 * @param {Object|null} scheduleByDay - Mapa de reglas por día
 * @param {string|null} shiftType     - "Diurno" | "Nocturno"
 * @returns {string}
 */
function getBaseScheduleLabel(scheduleByDay, shiftType) {
    if (!scheduleByDay) return shiftType || 'Sin definir';
    const workingDays = [];
    const times = new Set();
    // Tipos que no tienen horario de entrada/salida — se excluyen del resumen de horas
    const noTimeTypes = new Set(['descanso', 'permiso', 'vacaciones', 'falta']);
    for (let d = 0; d <= 6; d++) {
        const rule = scheduleByDay[String(d)];
        if (rule && !noTimeTypes.has(rule.workType) && rule.startTime) {
            workingDays.push(DAY_NAMES[d]);
            if (rule.endTime) times.add(`${rule.startTime} – ${rule.endTime}`);
        }
    }
    const timeStr = times.size === 1 ? ` · ${[...times][0]}` : '';
    return workingDays.length > 0 ? `${workingDays.join('–')}${timeStr}` : (shiftType || 'Sin definir');
}

// ═══════════════════════════════════════════════════════════════════════════
// LÓGICA REPORTE INDIVIDUAL — construcción de lista de días
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construye la lista completa de días a mostrar en la tabla del reporte individual.
 *
 * Para cada día en [period.from, period.to] decide si mostrarlo o no:
 *  - Se muestra si ES día laboral (según scheduleByDay del empleado) O si tiene
 *    un registro de asistencia (por ejemplo, un sábado trabajado como "extra").
 *  - Los días de descanso sin registro se omiten para no inflar la tabla.
 *
 * Por cada día calcula: status, workedMin, extraMin, lateMin, tipo, nota.
 *
 * @param {{ records, user, period }|null} reportData - Respuesta del endpoint individual
 * @returns {Array<DayEntry>}
 */
function buildDayList(reportData) {
    if (!reportData) return [];
    const { records, user, period } = reportData;

    // Mapa fecha ISO → registro de asistencia para búsqueda O(1)
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
        const dow = cur.getUTCDay(); // 0=Dom … 6=Sáb
        const dayRule = scheduleByDay[String(dow)] || null;
        const override = record?.scheduleOverride;

        // Tipo de jornada efectivo: override > regla del día > default 'laboral'
        const effectiveWorkType = override?.workType || dayRule?.workType || 'laboral';
        const isWorkingDay = effectiveWorkType !== 'descanso';

        // Solo incluir días laborales o días con registro explícito (ej: extra en finde)
        if (isWorkingDay || record) {
            const startTime = override?.startTime || dayRule?.startTime || null;
            const endTime   = override?.endTime   || dayRule?.endTime   || null;
            const workedMin = calcWorkedMinutes(record?.checkIn, record?.checkOut);
            const extraMin  = record?.checkIn ? calcExtraMinutes(workedMin, startTime, endTime) : 0;

            // Determinar status visible
            let status;
            if (record?.checkIn) {
                if (record.isExtraDay || effectiveWorkType === 'extra') status = 'Franco tr.';
                else if (record.isLate) status = 'Retardo';
                else status = 'Presente';
            } else if (effectiveWorkType === 'descanso') {
                status = 'Descanso';
            } else if (effectiveWorkType === 'permiso') {
                // Permiso autorizado: no se marca ausente aunque no haya checkIn
                status = 'Permiso';
            } else if (effectiveWorkType === 'vacaciones') {
                // Período vacacional: se muestra como estado propio
                status = 'Vacaciones';
            } else if (effectiveWorkType === 'falta') {
                // Falta pre-registrada: ausencia sin justificación documentada
                status = 'Falta';
            } else if (record?.status === 'ausente') {
                status = 'Ausente';
            } else {
                // Sin registro: pasado = Ausente, futuro/hoy = Pendiente
                const cellDay = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
                status = isBefore(cellDay, today) ? 'Ausente' : 'Pendiente';
            }

            // Etiqueta del tipo de jornada para la columna "Tipo"
            let tipo = 'Laboral';
            if (effectiveWorkType === 'extra' || record?.isExtraDay) tipo = 'Franco trab.';
            else if (effectiveWorkType === 'descanso')   tipo = 'Descanso';
            else if (effectiveWorkType === 'permiso')    tipo = 'Permiso';
            else if (effectiveWorkType === 'vacaciones') tipo = 'Vacaciones';
            else if (effectiveWorkType === 'falta')      tipo = 'Falta';

            // Nota del admin (adminNotes del registro, o último mensaje del override)
            const noteText = record?.adminNotes
                || override?.note?.[override.note.length - 1]?.message
                || null;

            const lateMin = status === 'Retardo'
                ? calcLateMinutes(record?.checkIn, startTime)
                : 0;

            days.push({ date: new Date(cur), record: record || null, startTime, endTime, effectiveWorkType, status, workedMin, extraMin, lateMin, tipo, noteText });
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERADORES DE HTML PARA VENTANA DE IMPRESIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construye el HTML completo del reporte INDIVIDUAL para impresión/PDF.
 * Se abre en una ventana nueva que lanza window.print() automáticamente.
 * Diseño inspirado en el PDF de referencia CORP365/Amazonas365.
 *
 * @param {{ user, summary, period }} reportData
 * @param {Array<DayEntry>} dayList  - Lista construida por buildDayList()
 * @param {string}          logoUrl  - URL absoluta del logo (window.location.origin + ruta)
 * @returns {string} HTML completo como string
 */
function buildIndividualPrintHTML(reportData, dayList, logoUrl) {
    const { user, summary, period } = reportData;
    const gen = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' });
    const fromStr = new Date(period.from).toLocaleDateString('es-VE', { timeZone: 'UTC' });
    const toStr   = new Date(period.to).toLocaleDateString('es-VE', { timeZone: 'UTC' });
    const schedLabel = getBaseScheduleLabel(user.workSchedule?.scheduleByDay, user.workSchedule?.shiftType);
    const totalMin = dayList.reduce((a, d) => a + d.workedMin, 0);

    // Color por status para las celdas de la tabla
    const sColor = s => ({
        'Presente': '#2e7d32', 'Retardo': '#e65100',
        'Ausente': '#b71c1c', 'Franco tr.': '#1565c0'
    }[s] || '#999');

    // Filas de la tabla de detalle
    const rows = dayList.map(d => {
        const dateStr = d.date.toLocaleDateString('es-VE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
            + ' ' + DAY_NAMES[d.date.getUTCDay()];
        const horario = d.startTime && d.endTime ? `${d.startTime}–${d.endTime}` : '—';
        const worked  = formatWorked(d.record?.checkIn, d.record?.checkOut) || '0h 00m';
        const extras  = d.extraMin > 0 ? `+${formatMinutes(d.extraMin)}` : '—';
        const retardo = d.lateMin  > 0 ? `+${d.lateMin}m` : '—';
        return `<tr>
          <td>${dateStr}</td>
          <td style="color:${sColor(d.status)};font-weight:700">${d.status}</td>
          <td>${d.record?.checkIn  ? formatTimeVE(d.record.checkIn)  : '—'}</td>
          <td>${d.record?.checkOut ? formatTimeVE(d.record.checkOut) : '—'}</td>
          <td>${horario}</td>
          <td>${d.record?.checkIn ? worked : '0h 00m'}</td>
          <td style="color:${d.extraMin > 0 ? '#2e7d32' : '#bbb'};font-weight:${d.extraMin > 0 ? 700 : 400}">${extras}</td>
          <td style="color:${d.lateMin  > 0 ? '#e65100' : '#bbb'};font-weight:${d.lateMin  > 0 ? 700 : 400}">${retardo}</td>
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
  <div>
    <!-- Logo Amazonas 365 embebido por URL absoluta para funcionar en ventana nueva -->
    <img src="${logoUrl}" alt="Amazonas 365" style="height:38px;width:auto;display:block;margin-bottom:2px" />
    <div class="corp-sub">Gestión de Recursos Humanos</div>
  </div>
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
  <div class="ti"><div class="tl">Total horas trabajadas</div><div class="tv" style="color:#2e7d32">${Math.floor(totalMin/60)}h ${String(totalMin%60).padStart(2,'0')}m</div></div>
  <div class="ti"><div class="tl">Total horas extras</div><div class="tv" style="color:#2e7d32">${formatMinutes(summary.extraMinutes) || '0min'}</div></div>
  <div class="ti"><div class="tl">Total retardos</div><div class="tv" style="color:#e65100">${formatMinutes(summary.lateMinutes) || '0min'}</div></div>
  <div class="ti"><div class="tl">Horas esperadas</div><div class="tv">${Math.floor(summary.expectedMinutes/60)}h ${String(summary.expectedMinutes%60).padStart(2,'0')}m</div></div>
</div>
<div class="foot">Amazonas 365 · Gestión de Recursos Humanos · Documento confidencial</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
}

/**
 * Construye el HTML completo del reporte GLOBAL para impresión/PDF.
 * Genera una tabla con todos los empleados y sus totales consolidados.
 * El PDF se orienta en LANDSCAPE para que quepan todas las columnas.
 *
 * @param {{ totals, period, employees[] }} globalData - Respuesta del endpoint global
 * @param {string} searchFilter - Texto de filtro activo (se anota en el PDF)
 * @param {string} logoUrl      - URL absoluta del logo Amazonas 365
 * @returns {string} HTML completo como string
 */
function buildGlobalPrintHTML(globalData, searchFilter, logoUrl) {
    const { totals, period, employees } = globalData;
    const gen = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' });
    const fromStr = new Date(period.from).toLocaleDateString('es-VE', { timeZone: 'UTC' });
    const toStr   = new Date(period.to).toLocaleDateString('es-VE', { timeZone: 'UTC' });

    // Filtrar en PDF igual que en la tabla de pantalla
    const filtered = searchFilter.trim()
        ? employees.filter(e =>
            `${e.name} ${e.surName}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
            (e.dni || '').includes(searchFilter) ||
            (e.jobInformation?.department || '').toLowerCase().includes(searchFilter.toLowerCase())
          )
        : employees;

    // Helpers de color para celdas numéricas
    const lateColor  = n => n > 0 ? 'color:#b71c1c;font-weight:700' : 'color:#bbb';
    const extraColor = n => n > 0 ? 'color:#1565c0;font-weight:700' : 'color:#bbb';
    const faltaColor = n => n > 0 ? 'color:#c62828;font-weight:700' : 'color:#bbb';

    // Agrupar por departamento para separar secciones en el PDF
    const byDept = {};
    filtered.forEach(e => {
        const dept = e.jobInformation?.department || 'Sin departamento';
        if (!byDept[dept]) byDept[dept] = [];
        byDept[dept].push(e);
    });

    // Construir filas agrupadas con encabezados de departamento.
    // Los empleados inactivos se marcan con "(Inactivo)" junto al nombre.
    let rows = '';
    let rowIndex = 0;
    Object.entries(byDept).forEach(([dept, emps]) => {
        // Fila separadora de departamento (agrupa visualmente en el PDF)
        rows += `<tr><td colspan="9" style="background:#e8f5e9;font-weight:700;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#2e7d32;padding:4px 6px;border-bottom:1px solid #c8e6c9">${dept}</td></tr>`;
        emps.forEach(e => {
            rowIndex++;
            // Filas alternas para facilitar lectura horizontal
            const bg       = rowIndex % 2 === 0 ? 'background:#fafafa' : 'background:#fff';
            const inactTag = e.inabilited ? ' <span style="color:#e53935;font-size:7.5px;font-weight:700">(Inactivo)</span>' : '';
            const falta    = e.faltaCount || 0;
            // Las 4 columnas numéricas van centradas
            rows += `<tr style="${bg}">
              <td style="text-align:center;color:#999;font-size:9px">${rowIndex}</td>
              <td style="font-weight:600">${e.surName}, ${e.name}${inactTag}</td>
              <td style="color:#555">${e.dni || '—'}</td>
              <td style="color:#555">${dept}</td>
              <td style="color:#555">${e.jobInformation?.position || '—'}</td>
              <td style="text-align:center;${lateColor(e.lateWeekday)}">${e.lateWeekday}</td>
              <td style="text-align:center;${lateColor(e.lateWeekend)}">${e.lateWeekend}</td>
              <td style="text-align:center;${extraColor(e.extraDays)}">${e.extraDays}</td>
              <td style="text-align:center;${faltaColor(falta)}">${falta}</td>
            </tr>`;
        });
    });

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Reporte Global – ${fromStr} al ${toStr}</title>
<style>
  /* ── Reset ─────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Página: landscape A4, márgenes generosos para que el borde
        de la tabla no quede pegado al corte de papel ────────────────── */
  @page { size: A4 landscape; margin: 12mm 14mm; }

  /* ── Cuerpo: sin padding en pantalla para que @page domine en print ─ */
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #222;
    padding: 14px;          /* solo se ve en pantalla, @page lo elimina en print */
    background: #fff;
  }

  /* ── Encabezado ─────────────────────────────────────────────────────── */
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #4CAF50;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .corp-sub { font-size: 9px; color: #555; margin-top: 3px; }
  .rt h2    { font-size: 13px; font-weight: 700; text-align: right; }
  .rt p     { font-size: 9px; color: #666; margin-top: 2px; text-align: right; }

  /* ── Cards de resumen ───────────────────────────────────────────────── */
  .sg {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .card {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 6px 8px;
    text-align: center;
    min-width: 0;           /* evita que flex desborde */
  }
  .cv   { font-size: 15px; font-weight: 900; }
  .cv.g { color: #2e7d32; }
  .cv.r { color: #b71c1c; }
  .cv.b { color: #1565c0; }
  .cl   { font-size: 7.5px; color: #777; text-transform: uppercase; margin-top: 2px; }
  .cs   { font-size: 7px; color: #aaa; margin-top: 1px; }

  /* ── Tabla: layout fixed garantiza que las columnas no desborden
        el ancho de la página impresa. Los anchos de <th> son la guía. ── */
  .wrap {
    width: 100%;
    overflow: hidden;       /* recuadro completo: sin overflow en pantalla */
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;    /* columnas respetan los anchos declarados en <th> */
  }
  thead { background: #f0f0f0; }
  th {
    font-weight: 700;
    padding: 5px 5px;
    border-bottom: 2px solid #ccc;
    border-right: 1px solid #ccc;
    font-size: 8.5px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  th:last-child { border-right: none; }
  td {
    padding: 4px 5px;
    border-bottom: 1px solid #eee;
    border-right: 1px solid #eee;
    font-size: 9.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  td:last-child { border-right: none; }
  tbody tr:last-child td { border-bottom: none; }

  /* ── Pie ─────────────────────────────────────────────────────────────── */
  .foot {
    text-align: center;
    font-size: 8px;
    color: #aaa;
    margin-top: 12px;
    border-top: 1px solid #eee;
    padding-top: 6px;
  }

  /* ── Solo en print: quitar padding del body (ya lo controla @page) ─── */
  @media print { body { padding: 0; } }
</style>
</head><body>

<!-- Encabezado con logo y título -->
<div class="hdr">
  <div>
    <img src="${logoUrl}" alt="Amazonas 365" style="height:34px;width:auto;display:block;margin-bottom:2px" />
    <div class="corp-sub">Gestión de Recursos Humanos</div>
  </div>
  <div class="rt">
    <h2>Reporte Global de Asistencia</h2>
    <p>Período: ${fromStr} – ${toStr}</p>
    <p>Generado: ${gen}</p>
    ${searchFilter ? `<p style="color:#e65100">Filtrado: "${searchFilter}"</p>` : ''}
  </div>
</div>

<!-- Cards de resumen -->
<div class="sg">
  <div class="card"><div class="cv">${totals.totalEmployees}</div><div class="cl">Empleados</div><div class="cs">${totals.activeEmployees} activos · ${totals.inactiveEmployees} inactivos</div></div>
  <div class="card"><div class="cv r">${totals.totalLateWeekday}</div><div class="cl">Retardos sem.</div></div>
  <div class="card"><div class="cv r">${totals.totalLateWeekend}</div><div class="cl">Retardos finde</div></div>
  <div class="card"><div class="cv b">${totals.totalExtraDays}</div><div class="cl">Días extra</div></div>
  <div class="card"><div class="cv g">${totals.totalPresent}</div><div class="cl">Presencias</div></div>
  <div class="card"><div class="cv r">${totals.totalFalta}</div><div class="cl">Total faltas</div></div>
</div>

<!-- Tabla con recuadro completo (div.wrap controla el borde exterior) -->
<div class="wrap">
  <table>
    <thead>
      <tr>
        <!-- Anchos fijos que suman ~100% del área útil landscape A4 (~267mm) -->
        <th style="width:4%">#</th>
        <th style="width:22%">Apellido, Nombre</th>
        <th style="width:11%">Cédula</th>
        <th style="width:22%">Departamento</th>
        <th style="width:18%">Cargo</th>
        <th style="width:7%;text-align:center;color:#b71c1c">Ret. Sem.</th>
        <th style="width:7%;text-align:center;color:#e65100">Ret. Finde</th>
        <th style="width:5%;text-align:center;color:#1565c0">Extra</th>
        <th style="width:4%;text-align:center;color:#c62828">Faltas</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>

<div class="foot">Amazonas 365 · Gestión de Recursos Humanos · Documento confidencial · ${filtered.length} empleados mostrados</div>
<script>window.onload = () => window.print();</script>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES REUTILIZABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Badge de estado con punto de color y texto.
 * @param {{ status: string }} props
 */
function StatusBadge({ status }) {
    const map = {
        'Presente':    { dot: 'bg-green-500',   tx: 'text-green-700 font-semibold' },
        'Retardo':     { dot: 'bg-amber-500',   tx: 'text-amber-600 font-bold'     },
        'Ausente':     { dot: 'bg-red-500',     tx: 'text-red-600 font-bold'       },
        'Franco tr.':  { dot: 'bg-blue-500',    tx: 'text-blue-600 font-semibold'  },
        'Descanso':    { dot: 'bg-gray-300',    tx: 'text-gray-400'                },
        'Pendiente':   { dot: 'bg-gray-300',    tx: 'text-gray-400 italic'         },
        // Nuevos estados correspondientes a los workTypes extendidos
        'Permiso':     { dot: 'bg-purple-400',  tx: 'text-purple-600 font-semibold'},
        'Vacaciones':  { dot: 'bg-cyan-400',    tx: 'text-cyan-600 font-semibold'  },
        'Falta':       { dot: 'bg-red-400',     tx: 'text-red-500 font-bold italic'},
    };
    const c = map[status] || map['Pendiente'];
    return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <span className={`text-[11px] ${c.tx}`}>{status}</span>
        </span>
    );
}

/**
 * Card de resumen con valor grande, etiqueta y sub-texto.
 */
function SummaryCard({ value, label, sub, color }) {
    const colors = { green: 'text-emerald-600', amber: 'text-amber-500', red: 'text-red-500', gray: 'text-gray-700', blue: 'text-blue-600' };
    return (
        <div className='bg-white rounded-xl border shadow-sm p-4 text-center'>
            <p className={`text-3xl font-black leading-none ${colors[color] || colors.gray}`}>{value}</p>
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-2'>{label}</p>
            <p className='text-[10px] text-gray-400 mt-0.5'>{sub}</p>
        </div>
    );
}

/**
 * Botón de paginación: número, flecha o puntos suspensivos.
 */
function PageBtn({ children, onClick, disabled, active }) {
    return (
        <button onClick={onClick} disabled={disabled}
            className={`w-7 h-7 rounded text-xs font-semibold transition-colors
                ${active   ? 'bg-emerald-600 text-white' : ''}
                ${!active && !disabled ? 'text-gray-600 hover:bg-gray-100' : ''}
                ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}`}>
            {children}
        </button>
    );
}

/**
 * Celda del footer de totales en la tabla individual.
 */
function FooterCell({ label, value, green, amber }) {
    const color = green ? 'text-emerald-600' : amber ? 'text-amber-500' : 'text-gray-700';
    return (
        <div className='px-4 py-3 border-r last:border-r-0'>
            <p className='text-[10px] text-gray-400 uppercase tracking-wider'>{label}</p>
            <p className={`text-base font-black mt-0.5 ${color}`}>{value}</p>
        </div>
    );
}

/**
 * Fila de la tabla individual con todos los datos del día.
 */
function AttendanceRow({ day }) {
    const horario  = day.startTime && day.endTime ? `${day.startTime}–${day.endTime}` : '—';
    const worked   = day.record?.checkIn ? (formatWorked(day.record.checkIn, day.record.checkOut) || '—') : '—';
    const extraTx  = day.extraMin > 0 ? `+${formatMinutes(day.extraMin)}` : '—';
    const retardoTx = day.lateMin > 0 ? `+${day.lateMin}m` : '—';
    const dateStr  = day.date.toLocaleDateString('es-VE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
    const rowBg = day.status === 'Retardo' ? 'bg-amber-50/50' : day.status === 'Ausente' ? 'bg-red-50/30' : '';
    return (
        <tr className={`hover:bg-gray-50/70 transition-colors ${rowBg}`}>
            <td className='px-3 py-2 whitespace-nowrap'>
                <span className='text-[12px] font-medium text-gray-700'>{dateStr}</span>
                <span className='text-[11px] text-gray-400 ml-1'>{DAY_NAMES[day.date.getUTCDay()]}</span>
            </td>
            <td className='px-3 py-2'><StatusBadge status={day.status} /></td>
            <td className='px-3 py-2 text-[12px] font-bold text-gray-700 whitespace-nowrap'>{day.record?.checkIn  ? formatTimeVE(day.record.checkIn)  : '—'}</td>
            <td className='px-3 py-2 text-[12px] font-bold text-gray-700 whitespace-nowrap'>{day.record?.checkOut ? formatTimeVE(day.record.checkOut) : '—'}</td>
            <td className='px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap'>{horario}</td>
            <td className='px-3 py-2 text-[12px] text-gray-700 whitespace-nowrap'>{worked}</td>
            <td className={`px-3 py-2 text-[12px] font-bold whitespace-nowrap ${day.extraMin > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{extraTx}</td>
            <td className={`px-3 py-2 text-[12px] font-bold whitespace-nowrap ${day.lateMin  > 0 ? 'text-amber-600'   : 'text-gray-300'}`}>{retardoTx}</td>
            <td className='px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap'>{day.tipo}</td>
            <td className='px-3 py-2 text-[11px] text-gray-400 max-w-[130px] truncate'>{day.noteText || '—'}</td>
        </tr>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN — REPORTE INDIVIDUAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sección completa del reporte individual de asistencia.
 * Incluye: selector de empleado, rango de fechas, cards de resumen,
 * tabla paginada con totales y botón de exportar PDF.
 *
 * @param {{ allUsers: Array, loadingUsers: boolean }} props
 */
function IndividualReportSection({ allUsers, loadingUsers }) {
    const [searchQuery,   setSearchQuery]   = useState('');
    const [selectedUser,  setSelectedUser]  = useState(null);
    const [showDropdown,  setShowDropdown]  = useState(false);
    const [fromDate,      setFromDate]      = useState('');
    const [toDate,        setToDate]        = useState('');
    const [reportData,    setReportData]    = useState(null);
    const [isLoading,     setIsLoading]     = useState(false);
    const [currentPage,   setCurrentPage]   = useState(1);
    const [error,         setError]         = useState(null);
    const dropdownRef = useRef(null);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const h = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Búsqueda fuzzy sobre la lista de usuarios cargados en el padre
    const fuse = useMemo(() => new Fuse(allUsers, {
        keys: ['name', 'surName', 'dni'], threshold: 0.35
    }), [allUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return allUsers.slice(0, 8);
        return fuse.search(searchQuery).map(r => r.item).slice(0, 8);
    }, [searchQuery, fuse, allUsers]);

    // Lista completa de días para la tabla (construida a partir de la respuesta de la API)
    const dayList = useMemo(() => buildDayList(reportData), [reportData]);

    // Paginación client-side sobre dayList
    const totalPages    = Math.max(1, Math.ceil(dayList.length / ROWS_PER_PAGE));
    const paginatedDays = useMemo(() => dayList.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE), [dayList, currentPage]);

    // Suma total de minutos trabajados para el footer
    const totalWorkedMin = useMemo(() => dayList.reduce((a, d) => a + d.workedMin, 0), [dayList]);

    const handleSelectUser = u => { setSelectedUser(u); setSearchQuery(''); setShowDropdown(false); setReportData(null); setCurrentPage(1); };

    /** Llama al endpoint individual y almacena la respuesta */
    const handleConsultar = async () => {
        if (!selectedUser || !fromDate || !toDate) return;
        setIsLoading(true); setError(null); setReportData(null); setCurrentPage(1);
        try {
            const data = await getAttendanceReport(selectedUser._id, fromDate, toDate);
            setReportData(data);
        } catch {
            setError('No se pudo obtener el reporte. Verifica la conexión e intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLimpiar = () => { setSelectedUser(null); setSearchQuery(''); setFromDate(''); setToDate(''); setReportData(null); setCurrentPage(1); setError(null); };

    /**
     * Abre el HTML de impresión del reporte individual en una ventana nueva.
     * Construye la URL absoluta del logo para que sea accesible desde about:blank.
     */
    const handleExportPDF = () => {
        if (!reportData) return;
        const logoUrl = window.location.origin + '/RBG-Logo-AMAZONAS%20365-Original.png';
        const win = window.open('', '_blank', 'width=1100,height=750');
        win.document.write(buildIndividualPrintHTML(reportData, dayList, logoUrl));
        win.document.close();
    };

    const { summary } = reportData || {};
    const scheduleLabel = reportData ? getBaseScheduleLabel(reportData.user.workSchedule?.scheduleByDay, reportData.user.workSchedule?.shiftType) : '';
    const initials = reportData ? `${reportData.user.name?.[0] || ''}${reportData.user.surName?.[0] || ''}`.toUpperCase() : '';
    const periodLabel = useMemo(() => {
        if (!reportData) return '';
        const fl = format(new Date(reportData.period.from), 'MMM yyyy', { locale: es });
        const tl = format(new Date(reportData.period.to),   'MMM yyyy', { locale: es });
        const lb = fl === tl ? fl : `${fl} – ${tl}`;
        return lb.charAt(0).toUpperCase() + lb.slice(1);
    }, [reportData]);

    return (
        <div className='flex flex-col gap-4'>

            {/* Barra de filtros */}
            <div className='bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-end gap-3'>

                {/* Selector de empleado con búsqueda fuzzy */}
                <div className='flex flex-col gap-1 min-w-[220px]' ref={dropdownRef}>
                    <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                        Empleado <span className='text-red-400'>*</span>
                    </label>
                    {selectedUser ? (
                        <div className='flex items-center gap-2 h-9 bg-gray-100 border border-gray-300 rounded-lg px-3'>
                            <span className='text-sm font-semibold text-gray-800 truncate flex-1 max-w-[170px]'>{selectedUser.name} {selectedUser.surName}</span>
                            <button onClick={() => { setSelectedUser(null); setReportData(null); }} className='text-gray-400 hover:text-red-500 text-lg leading-none flex-shrink-0 transition-colors' title='Quitar'>×</button>
                        </div>
                    ) : (
                        <div className='relative'>
                            <input type='text' placeholder={loadingUsers ? 'Cargando...' : 'Buscar por nombre o cédula'}
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                onFocus={() => setShowDropdown(true)}
                                className='w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'
                                disabled={loadingUsers} autoComplete='off' />
                            {showDropdown && filteredUsers.length > 0 && (
                                <div className='absolute z-50 top-full mt-1 w-[290px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden'>
                                    {filteredUsers.map(u => (
                                        <button key={u._id} onMouseDown={() => handleSelectUser(u)}
                                            className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 text-left transition-colors border-b border-gray-50 last:border-b-0'>
                                            <div className='w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                                                {u.img ? <img src={u.img} className='w-full h-full object-cover' alt='' />
                                                       : <span className='text-[11px] font-bold text-slate-600'>{u.name?.[0]}{u.surName?.[0]}</span>}
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

                {/* Fecha inicio */}
                <div className='flex flex-col gap-1'>
                    <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Desde</label>
                    <input type='date' value={fromDate} onChange={e => setFromDate(e.target.value)}
                        className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                </div>

                {/* Fecha fin */}
                <div className='flex flex-col gap-1'>
                    <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Hasta</label>
                    <input type='date' value={toDate} onChange={e => setToDate(e.target.value)}
                        className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                </div>

                <div className='flex gap-2 items-end'>
                    <button onClick={handleConsultar} disabled={!selectedUser || !fromDate || !toDate || isLoading}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition-all
                            ${selectedUser && fromDate && toDate && !isLoading
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                        </svg>
                        {isLoading ? 'Consultando...' : 'Consultar'}
                    </button>
                    <button onClick={handleLimpiar} className='h-9 px-4 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors'>Limpiar</button>
                    <button onClick={handleExportPDF} disabled={!reportData}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition-all
                            ${reportData ? 'bg-gray-800 text-white hover:bg-gray-700 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3'>{error}</div>}

            {/* Cargando */}
            {isLoading && (
                <div className='flex items-center justify-center py-16'>
                    <div className='flex flex-col items-center gap-3 text-gray-400'>
                        <div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin' />
                        <span className='text-sm'>Cargando reporte...</span>
                    </div>
                </div>
            )}

            {/* Estado vacío */}
            {!isLoading && !reportData && !error && (
                <div className='flex items-center justify-center py-16 text-center text-gray-400'>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className='text-sm font-semibold text-gray-500'>Selecciona un empleado y un rango de fechas</p>
                        <p className='text-xs text-gray-400 mt-1'>Luego haz click en Consultar</p>
                    </div>
                </div>
            )}

            {/* Resultado */}
            {!isLoading && reportData && (
                <>
                    {/* Cabecera del empleado */}
                    <div className='bg-white rounded-xl shadow-sm border px-4 py-3 flex items-center gap-4'>
                        <div className='w-9 h-9 rounded-full bg-emerald-100 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                            {reportData.user.img
                                ? <img src={reportData.user.img} className='w-full h-full object-cover' alt='' />
                                : <span className='text-sm font-black text-emerald-700'>{initials}</span>}
                        </div>
                        <div className='flex-1 flex flex-wrap items-center gap-x-3 gap-y-0.5'>
                            <span className='font-bold text-gray-800'>{reportData.user.name} {reportData.user.surName}</span>
                            <span className='text-sm text-gray-400'>{reportData.user.dni}</span>
                            <span className='text-sm text-gray-500'>{reportData.user.jobInformation?.department || 'Sin departamento'} · {reportData.user.jobInformation?.position || 'Sin cargo'}</span>
                        </div>
                        <div className='text-right text-xs text-gray-400 hidden sm:block whitespace-nowrap'>
                            <p className='font-semibold text-gray-600'>Turno {reportData.user.workSchedule?.shiftType || 'Sin definir'}</p>
                            <p>{scheduleLabel}</p>
                        </div>
                    </div>

                    {/* Cards de resumen */}
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                        <SummaryCard value={summary.totalWorkingDays} label='Días laborables'  sub='en el período'                                                           color='gray'  />
                        <SummaryCard value={summary.presentDays}      label='Días presentes'   sub={`${summary.attendanceRate}% asistencia`}                               color='green' />
                        <SummaryCard value={summary.lateDays}         label='Retardos'         sub={`${summary.justifiedLateDays} justificado${summary.justifiedLateDays !== 1 ? 's' : ''}`} color='amber' />
                        <SummaryCard value={formatMinutes(summary.extraMinutes) || '0min'} label='Horas extras' sub={`${dayList.filter(d => d.extraMin > 0).length} días con extra`} color='green' />
                        <SummaryCard value={summary.absentDays}       label='Ausencias'        sub='sin justificar'                                                        color='red'   />
                    </div>

                    {/* Tabla de detalle */}
                    <div className='bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden'>
                        <div className='flex items-center justify-between px-4 py-2.5 border-b'>
                            <p className='text-sm text-gray-500'>
                                <span className='font-bold text-gray-700'>{dayList.length} registros</span> · {periodLabel}
                            </p>
                        </div>
                        <div className='overflow-auto'>
                            <table className='min-w-full text-sm'>
                                <thead className='sticky top-0 bg-gray-50 z-10 border-b border-gray-200'>
                                    <tr>
                                        {['Fecha','Estado','Entrada','Salida','Horario','Trabajadas','Extras','Retardo','Tipo','Nota adm.'].map(h => (
                                            <th key={h} className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap'>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {paginatedDays.map((day, i) => <AttendanceRow key={i} day={day} />)}
                                    {paginatedDays.length === 0 && (
                                        <tr><td colSpan={10} className='text-center py-10 text-gray-400 text-sm'>No hay registros en este período</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className='border-t px-4 py-2 flex items-center justify-between bg-white'>
                                <span className='text-xs text-gray-400'>
                                    Mostrando {(currentPage-1)*ROWS_PER_PAGE+1}–{Math.min(currentPage*ROWS_PER_PAGE, dayList.length)} de {dayList.length}
                                </span>
                                <div className='flex items-center gap-1'>
                                    <PageBtn onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>‹</PageBtn>
                                    {Array.from({length:totalPages},(_,i)=>i+1)
                                        .filter(p=>p===1||p===totalPages||Math.abs(p-currentPage)<=1)
                                        .reduce((acc,p,idx,arr)=>{ if(idx>0&&p-arr[idx-1]>1)acc.push('…'); acc.push(p); return acc; },[])
                                        .map((p,i)=>p==='…'
                                            ? <span key={`d${i}`} className='px-1 text-gray-400 text-xs'>…</span>
                                            : <PageBtn key={p} onClick={()=>setCurrentPage(p)} active={p===currentPage}>{p}</PageBtn>
                                        )}
                                    <PageBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>›</PageBtn>
                                </div>
                            </div>
                        )}
                        {/* Totales footer */}
                        <div className='border-t grid grid-cols-2 sm:grid-cols-4 bg-gray-50 rounded-b-xl'>
                            <FooterCell label='Total horas trabajadas' value={`${Math.floor(totalWorkedMin/60)}h ${String(totalWorkedMin%60).padStart(2,'0')}m`} green />
                            <FooterCell label='Total horas extras'     value={formatMinutes(summary.extraMinutes) || '0min'} green />
                            <FooterCell label='Minutos de retardo'     value={formatMinutes(summary.lateMinutes)  || '0min'} amber />
                            <FooterCell label='Horas esperadas'        value={`${Math.floor(summary.expectedMinutes/60)}h ${String(summary.expectedMinutes%60).padStart(2,'0')}m`} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN — REPORTE GLOBAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sección del reporte global consolidado de todos los empleados.
 *
 * Estrategia para no saturar el servidor:
 *  - Una sola llamada al endpoint /user/attendance/global-report que internamente
 *    usa un MongoDB Aggregation Pipeline (1 round-trip a la DB).
 *  - El filtro de búsqueda en la tabla es puramente client-side (sin peticiones
 *    adicionales al servidor).
 *  - La paginación también es client-side sobre los datos ya recibidos.
 */
function GlobalReportSection() {
    const [fromDate,     setFromDate]     = useState('');
    const [toDate,       setToDate]       = useState('');
    const [globalData,   setGlobalData]   = useState(null);  // respuesta completa del endpoint
    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState(null);
    const [searchFilter, setSearchFilter] = useState('');    // filtro client-side
    const [currentPage,  setCurrentPage]  = useState(1);

    /** Llama al endpoint de agregación global */
    const handleConsultar = async () => {
        if (!fromDate || !toDate) return;
        setIsLoading(true); setError(null); setGlobalData(null); setCurrentPage(1); setSearchFilter('');
        try {
            const data = await getGlobalAttendanceReport(fromDate, toDate);
            setGlobalData(data);
        } catch {
            setError('No se pudo obtener el reporte global. Verifica la conexión e intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLimpiar = () => { setFromDate(''); setToDate(''); setGlobalData(null); setError(null); setSearchFilter(''); setCurrentPage(1); };

    /**
     * Abre el HTML del reporte global en una ventana nueva en orientación landscape.
     * Construye la URL absoluta del logo para que sea accesible desde about:blank.
     */
    const handleExportPDF = () => {
        if (!globalData) return;
        const logoUrl = window.location.origin + '/RBG-Logo-AMAZONAS%20365-Original.png';
        // Ventana más ancha para aprovechar el layout landscape
        const win = window.open('', '_blank', 'width=1200,height=750');
        win.document.write(buildGlobalPrintHTML(globalData, searchFilter, logoUrl));
        win.document.close();
    };

    // Filtro client-side: por nombre, cédula o departamento
    const filteredEmployees = useMemo(() => {
        if (!globalData?.employees) return [];
        const q = searchFilter.trim().toLowerCase();
        if (!q) return globalData.employees;
        return globalData.employees.filter(e =>
            `${e.name} ${e.surName}`.toLowerCase().includes(q) ||
            (e.dni || '').toLowerCase().includes(q) ||
            (e.jobInformation?.department || '').toLowerCase().includes(q)
        );
    }, [globalData, searchFilter]);

    // Paginación client-side sobre filteredEmployees
    const totalPages      = Math.max(1, Math.ceil(filteredEmployees.length / ROWS_PER_PAGE));
    const paginatedEmps   = useMemo(() => filteredEmployees.slice((currentPage-1)*ROWS_PER_PAGE, currentPage*ROWS_PER_PAGE), [filteredEmployees, currentPage]);

    // Resetear página al cambiar el filtro
    useEffect(() => { setCurrentPage(1); }, [searchFilter]);

    // Totales de los empleados filtrados (para las mini-cards de resumen).
    // Se recalculan cuando cambia el filtro de búsqueda (client-side).
    const filteredTotals = useMemo(() => ({
        lateWeekday: filteredEmployees.reduce((a, e) => a + e.lateWeekday,  0),
        lateWeekend: filteredEmployees.reduce((a, e) => a + e.lateWeekend,  0),
        extraDays:   filteredEmployees.reduce((a, e) => a + e.extraDays,    0),
        present:     filteredEmployees.reduce((a, e) => a + e.totalPresent, 0),
        // faltaCount: faltas pre-registradas acumuladas del conjunto visible
        faltaCount:  filteredEmployees.reduce((a, e) => a + (e.faltaCount || 0), 0),
    }), [filteredEmployees]);

    const periodLabel = useMemo(() => {
        if (!globalData) return '';
        const fl = format(new Date(globalData.period.from), 'MMM yyyy', { locale: es });
        const tl = format(new Date(globalData.period.to),   'MMM yyyy', { locale: es });
        const lb = fl === tl ? fl : `${fl} – ${tl}`;
        return lb.charAt(0).toUpperCase() + lb.slice(1);
    }, [globalData]);

    return (
        <div className='flex flex-col gap-4'>

            {/* Barra de filtros */}
            <div className='bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-end gap-3'>
                <div className='flex flex-col gap-1'>
                    <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Desde</label>
                    <input type='date' value={fromDate} onChange={e => setFromDate(e.target.value)}
                        className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                </div>
                <div className='flex flex-col gap-1'>
                    <label className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Hasta</label>
                    <input type='date' value={toDate} onChange={e => setToDate(e.target.value)}
                        className='h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400' />
                </div>
                <div className='flex gap-2 items-end'>
                    <button onClick={handleConsultar} disabled={!fromDate || !toDate || isLoading}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition-all
                            ${fromDate && toDate && !isLoading
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                        </svg>
                        {isLoading ? 'Consultando...' : 'Consultar'}
                    </button>
                    <button onClick={handleLimpiar} className='h-9 px-4 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors'>Limpiar</button>
                    <button onClick={handleExportPDF} disabled={!globalData}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition-all
                            ${globalData ? 'bg-gray-800 text-white hover:bg-gray-700 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3'>{error}</div>}

            {/* Cargando */}
            {isLoading && (
                <div className='flex items-center justify-center py-16'>
                    <div className='flex flex-col items-center gap-3 text-gray-400'>
                        <div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin' />
                        <span className='text-sm'>Generando reporte global...</span>
                        <span className='text-xs text-gray-300'>Consultando todos los empleados en un solo proceso</span>
                    </div>
                </div>
            )}

            {/* Estado vacío */}
            {!isLoading && !globalData && !error && (
                <div className='flex items-center justify-center py-16 text-center text-gray-400'>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className='text-sm font-semibold text-gray-500'>Selecciona un rango de fechas</p>
                        <p className='text-xs text-gray-400 mt-1'>Se consultarán todos los empleados activos en una sola operación</p>
                    </div>
                </div>
            )}

            {/* Resultado global */}
            {!isLoading && globalData && (
                <>
                    {/* Cards de resumen globales — 6 métricas */}
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                        {/* Total empleados con desglose activos/inactivos */}
                        <SummaryCard
                            value={globalData.totals.totalEmployees}
                            label='Empleados'
                            sub={`${globalData.totals.activeEmployees} activos · ${globalData.totals.inactiveEmployees} inactivos`}
                            color='gray'
                        />
                        <SummaryCard value={filteredTotals.lateWeekday} label='Ret. Semana'  sub='Lun – Vie'          color='red'   />
                        <SummaryCard value={filteredTotals.lateWeekend} label='Ret. Finde'   sub='Sáb – Dom'          color='amber' />
                        <SummaryCard value={filteredTotals.extraDays}   label='Días extra'   sub='franco trabajado'   color='blue'  />
                        <SummaryCard value={filteredTotals.present}     label='Presencias'   sub='total checkIns'     color='green' />
                        {/* Card de faltas totales: pre-registradas + ausentes orgánicos */}
                        <SummaryCard value={filteredTotals.faltaCount}  label='Faltas'       sub='ausencias totales'  color='red'   />
                    </div>

                    {/*
                     * Tabla de empleados — layout HORIZONTAL.
                     * overflow-x-auto permite scroll lateral para ver todas las columnas.
                     * min-w-max en la tabla garantiza que las columnas no se compriman.
                     */}
                    <div className='bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden'>

                        {/* Sub-header con contador y buscador */}
                        <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b'>
                            <p className='text-sm text-gray-500'>
                                <span className='font-bold text-gray-700'>{filteredEmployees.length} empleados</span>
                                {searchFilter && <span className='text-gray-400'> · filtrado</span>}
                                {' · '}{periodLabel}
                            </p>
                            {/* Búsqueda client-side: no genera peticiones al servidor */}
                            <input
                                type='text'
                                placeholder='Filtrar por nombre, cédula o depto...'
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value)}
                                className='h-8 w-64 border border-gray-200 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400'
                            />
                        </div>

                        {/* Scroll horizontal para mostrar todas las columnas sin comprimir */}
                        <div className='overflow-x-auto'>
                            <table className='min-w-max w-full text-sm'>
                                <thead className='sticky top-0 bg-gray-50 z-10 border-b border-gray-200'>
                                    <tr>
                                        <th className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10'>#</th>
                                        <th className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[200px]'>Nombre</th>
                                        <th className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[110px]'>Cédula</th>
                                        <th className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[160px]'>Departamento</th>
                                        <th className='px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[160px]'>Cargo</th>
                                        {/* Columnas de métricas con colores de alerta visual */}
                                        <th className='px-4 py-2.5 text-center text-[10px] font-bold text-red-400 uppercase tracking-wider whitespace-nowrap min-w-[110px]'>Ret. Semana</th>
                                        <th className='px-4 py-2.5 text-center text-[10px] font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]'>Ret. Finde</th>
                                        <th className='px-4 py-2.5 text-center text-[10px] font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]'>Días Extra</th>
                                        <th className='px-4 py-2.5 text-center text-[10px] font-bold text-emerald-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]'>Presencias</th>
                                        {/* Columna Faltas: workType='falta' pre-registrado O status='ausente' */}
                                        <th className='px-4 py-2.5 text-center text-[10px] font-bold text-rose-500 uppercase tracking-wider whitespace-nowrap min-w-[90px]'>Faltas</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {paginatedEmps.map((emp, idx) => (
                                        <GlobalEmployeeRow
                                            key={emp._id}
                                            emp={emp}
                                            index={(currentPage - 1) * ROWS_PER_PAGE + idx + 1}
                                        />
                                    ))}
                                    {paginatedEmps.length === 0 && (
                                        <tr><td colSpan={10} className='text-center py-10 text-gray-400 text-sm'>
                                            {searchFilter ? 'No hay empleados que coincidan con el filtro' : 'No hay datos para este período'}
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className='border-t px-4 py-2 flex items-center justify-between bg-white'>
                                <span className='text-xs text-gray-400'>
                                    Mostrando {(currentPage-1)*ROWS_PER_PAGE+1}–{Math.min(currentPage*ROWS_PER_PAGE, filteredEmployees.length)} de {filteredEmployees.length}
                                </span>
                                <div className='flex items-center gap-1'>
                                    <PageBtn onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>‹</PageBtn>
                                    {Array.from({length:totalPages},(_,i)=>i+1)
                                        .filter(p=>p===1||p===totalPages||Math.abs(p-currentPage)<=1)
                                        .reduce((acc,p,idx,arr)=>{ if(idx>0&&p-arr[idx-1]>1)acc.push('…'); acc.push(p); return acc; },[])
                                        .map((p,i)=>p==='…'
                                            ? <span key={`d${i}`} className='px-1 text-gray-400 text-xs'>…</span>
                                            : <PageBtn key={p} onClick={()=>setCurrentPage(p)} active={p===currentPage}>{p}</PageBtn>
                                        )}
                                    <PageBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>›</PageBtn>
                                </div>
                            </div>
                        )}

                        {/* Footer totales globales — incluye faltas */}
                        <div className='border-t grid grid-cols-3 sm:grid-cols-5 bg-gray-50 rounded-b-xl'>
                            <FooterCell label='Total empleados'   value={`${filteredEmployees.length}`} />
                            <FooterCell label='Ret. semana'       value={String(filteredTotals.lateWeekday)} amber />
                            <FooterCell label='Ret. finde'        value={String(filteredTotals.lateWeekend)} amber />
                            <FooterCell label='Días extra'        value={String(filteredTotals.extraDays)} green />
                            {/* Total de faltas pre-registradas del conjunto visible */}
                            <FooterCell label='Total faltas'      value={String(filteredTotals.faltaCount)} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Fila de empleado en la tabla del reporte global.
 *
 * Muestra:
 *  - Badge "Inactivo" en la celda de nombre si emp.inabilited === true.
 *  - Retardos semana/finde en rojo/naranja si > 0.
 *  - Días extra en azul si > 0.
 *  - Presencias en verde si > 0.
 *  - Faltas en rosa si > 0 (workType='falta' pre-registrado OR status='ausente').
 */
function GlobalEmployeeRow({ emp, index }) {
    const dept       = emp.jobInformation?.department || 'Sin departamento';
    const pos        = emp.jobInformation?.position   || '—';
    const isInactive = emp.inabilited === true;
    const falta      = emp.faltaCount || 0;

    return (
        <tr className={`hover:bg-gray-50/70 transition-colors ${isInactive ? 'opacity-60' : ''}`}>
            <td className='px-3 py-2.5 text-[11px] text-gray-400 text-center'>{index}</td>

            {/* Nombre + foto/iniciales + badge de inactivo */}
            <td className='px-3 py-2.5'>
                <div className='flex items-center gap-2'>
                    <div className='w-7 h-7 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center'>
                        {emp.img
                            ? <img src={emp.img} className='w-full h-full object-cover' alt='' />
                            : <span className='text-[10px] font-bold text-slate-500'>{emp.name?.[0]}{emp.surName?.[0]}</span>}
                    </div>
                    <div>
                        <p className='text-[12px] font-semibold text-gray-800 whitespace-nowrap'>
                            {emp.name} {emp.surName}
                        </p>
                        {/* Badge visible solo para empleados dados de baja */}
                        {isInactive && (
                            <span className='text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5'>
                                Inactivo
                            </span>
                        )}
                    </div>
                </div>
            </td>

            <td className='px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap'>{emp.dni || '—'}</td>
            <td className='px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap'>{dept}</td>
            <td className='px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap'>{pos}</td>

            {/* Retardos entre semana — rojo si > 0 */}
            <td className={`px-3 py-2.5 text-center text-[13px] font-black ${emp.lateWeekday > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                {emp.lateWeekday}
            </td>
            {/* Retardos fin de semana — naranja si > 0 */}
            <td className={`px-3 py-2.5 text-center text-[13px] font-black ${emp.lateWeekend > 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                {emp.lateWeekend}
            </td>
            {/* Días extra — azul si > 0 */}
            <td className={`px-3 py-2.5 text-center text-[13px] font-black ${emp.extraDays > 0 ? 'text-blue-500' : 'text-gray-300'}`}>
                {emp.extraDays}
            </td>
            {/* Presencias — verde si > 0 */}
            <td className={`px-3 py-2.5 text-center text-[13px] font-black ${emp.totalPresent > 0 ? 'text-emerald-500' : 'text-gray-300'}`}>
                {emp.totalPresent}
            </td>
            {/* Faltas totales (pre-registradas + ausencias orgánicas) — rosa si > 0 */}
            <td className={`px-3 py-2.5 text-center text-[13px] font-black ${falta > 0 ? 'text-rose-500' : 'text-gray-300'}`}>
                {falta}
            </td>
        </tr>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ DE LA PÁGINA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Página principal /user/asistencia.
 *
 * Gestiona:
 *  - La carga única de todos los usuarios (compartida con IndividualReportSection).
 *  - El estado del tab activo: 'individual' | 'global'.
 */
export default function AsistenciaPage() {
    // Usuarios cargados una sola vez y compartidos entre secciones
    const [allUsers,     setAllUsers]     = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Tab activo
    const [activeTab, setActiveTab] = useState('individual');

    // Carga inicial de usuarios para el selector del reporte individual
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchUserData();
                const ids  = data.result || [];
                // Promise.all: N peticiones en paralelo, más rápido que secuencial
                const full = await Promise.all(ids.map(u => userById(u._id).then(r => r.result)));
                setAllUsers(full.filter(Boolean));
            } catch (e) {
                console.error('Error cargando usuarios:', e);
            } finally {
                setLoadingUsers(false);
            }
        })();
    }, []);

    const tabs = [
        { id: 'individual', label: 'Reporte Individual', icon: '👤' },
        { id: 'global',     label: 'Reporte Global',     icon: '👥' },
    ];

    return (
        <div className='w-full h-full p-4 sm:p-6 bg-gray-50 flex flex-col gap-4 overflow-auto'>

            {/* ENCABEZADO DE LA PÁGINA — logo Amazonas 365 + título */}
            <div className='bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4'>
                {/*
                 * Logo servido directamente desde /public en Next.js.
                 * Se usa el nombre real del archivo con espacio codificado.
                 */}
                <img
                    src='/RBG-Logo-AMAZONAS%20365-Original.png'
                    alt='Amazonas 365'
                    className='h-9 w-auto object-contain flex-shrink-0'
                />
                <div>
                    <h1 className='text-lg font-bold text-gray-800'>Reportes de Asistencia</h1>
                    <p className='text-xs text-gray-500'>Consulta individual o consolidada de todos los empleados</p>
                </div>
            </div>

            {/* BARRA DE TABS */}
            <div className='flex gap-1 bg-white rounded-xl border shadow-sm p-1.5'>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-none justify-center sm:justify-start
                            ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* CONTENIDO DEL TAB ACTIVO */}
            {activeTab === 'individual' && (
                <IndividualReportSection allUsers={allUsers} loadingUsers={loadingUsers} />
            )}
            {activeTab === 'global' && (
                <GlobalReportSection />
            )}
        </div>
    );
}
