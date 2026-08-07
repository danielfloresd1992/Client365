// ══════════════════════════════════════════════════════════════════════
// HORAS EXTRAS — cálculo reutilizable (espejo de overtime.lib.js en la API)
// ══════════════════════════════════════════════════════════════════════
// Se usa en los tres lugares que necesitan el mismo número:
//   · la celda del horario (/user)
//   · el DetailPopover del día
//   · el reporte individual (/user/asistencia), acumulado por rango
//
// Los minutos NO viajan desde el servidor: se derivan de checkIn/checkOut y
// del turno del día. Así los registros anteriores a esta función también
// muestran sus horas extras, sin migrar nada. Del backend solo llega la
// DECISIÓN (aprobada / rechazada / quién y cuándo), que no se puede derivar.

// Jornada base por turno, en minutos. Pasado ese tiempo empieza la extra.
//   Diurno   →  9 h
//   Nocturno → 12 h (18:00 → 06:00)
export const BASE_MINUTES_BY_SHIFT = {
    Diurno: 9 * 60,
    Nocturno: 12 * 60,
};

const DEFAULT_SHIFT = 'Diurno';

// Por debajo de estos minutos no se considera hora extra, para que unos
// minutos de más al fichar la salida no generen una solicitud.
export const OVERTIME_GRACE_MINUTES = 15;


/** Minutos trabajados entre entrada y salida. Soporta turnos que cruzan la medianoche. */
export const workedMinutesOf = (record) => {
    if (!record?.checkIn || !record?.checkOut) return 0;
    const start = new Date(record.checkIn).getTime();
    const end = new Date(record.checkOut).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    return Math.floor((end - start) / 60000);
};


/** Jornada base del día, en minutos, según el turno efectivo. */
export const baseMinutesOf = (shift) => BASE_MINUTES_BY_SHIFT[shift] ?? BASE_MINUTES_BY_SHIFT[DEFAULT_SHIFT];


/**
 * Horas extras de UN día.
 * @param {object} record  documento de asistencia (necesita checkIn y checkOut)
 * @param {string} shift   turno efectivo del día ('Diurno' | 'Nocturno')
 * @returns {{ minutes, status, decidedBy, decidedAt, auto, note }}
 *          status: 'none' (sin excedente) | 'pending' | 'approved' | 'rejected'
 */
export function overtimeOfDay(record, shift = DEFAULT_SHIFT) {
    const worked = workedMinutesOf(record);
    const excess = Math.max(0, worked - baseMinutesOf(shift));
    const minutes = excess >= OVERTIME_GRACE_MINUTES ? excess : 0;

    // El estado sale ÚNICAMENTE de lo que guardó el backend. La aprobación
    // automática la resuelve jarvis_api al registrar la salida (según
    // workSchedule.autoApproveOvertime), no este cliente: inferirla acá haría
    // que la pantalla mostrara "aprobada" sobre un registro que en la base
    // sigue pendiente, y que al desactivar la opción esos días cambiaran solos.
    // Sin decisión del backend, el día se muestra POR APROBAR.
    return {
        minutes,
        status: minutes === 0 ? 'none' : (record?.overtime?.status || 'pending'),
        decidedBy: record?.overtime?.decidedBy ?? null,
        decidedAt: record?.overtime?.decidedAt ?? null,
        auto: Boolean(record?.overtime?.auto),
        note: record?.overtime?.note || '',
    };
}


/**
 * Acumulado por rango, desglosado por estado.
 * @param {Array<{record:object, shift:string}>} days
 */
export function accumulateOvertime(days = []) {
    const totals = {
        approvedMinutes: 0, pendingMinutes: 0, rejectedMinutes: 0, totalMinutes: 0,
        approvedDays: 0, pendingDays: 0, rejectedDays: 0,
    };

    days.forEach(({ record, shift }) => {
        const { minutes, status } = overtimeOfDay(record, shift);
        if (minutes === 0) return;

        totals.totalMinutes += minutes;
        if (status === 'approved') { totals.approvedMinutes += minutes; totals.approvedDays++; }
        else if (status === 'rejected') { totals.rejectedMinutes += minutes; totals.rejectedDays++; }
        else { totals.pendingMinutes += minutes; totals.pendingDays++; }
    });

    return totals;
}


/** "2h 30m" / "45min" / null si no hay nada. */
export const formatOvertime = (totalMin) => {
    if (!totalMin || totalMin <= 0) return null;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
};


/** Etiqueta legible del estado, para badges y textos. */
export const OVERTIME_LABEL = {
    pending: 'Por aprobar',
    approved: 'Aprobada',
    rejected: 'Rechazada',
};
