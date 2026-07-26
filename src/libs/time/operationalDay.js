/*
 * Helpers PUROS del DÍA OPERATIVO (08:00 → 07:00 del día siguiente).
 *
 * Convención del eje: minutos desde medianoche; la madrugada (00:00–07:59)
 * pertenece al día operativo ANTERIOR, así que en el eje se corre +1440.
 * Sin dependencias — reutilizables en cualquier componente o parser.
 */

// Minuto en que empieza el día operativo (08:00)
export const AXIS_START = 480;

/** "HH:mm" (o "HH:mm:ss") → minutos desde medianoche. null si es inválido. */
export const toMinutes = (hhmm) => {
    if (typeof hhmm !== 'string') return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
    return h * 60 + m;
};

/** Minuto del eje operativo (puede superar 1440) → etiqueta "HH:MM". */
export const fmtAxisMinute = (minute) => {
    const m = ((minute % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Minutos restantes → "en 45 min" / "en 2 h 10 min". */
export const fmtInMinutes = (minutes) => {
    if (minutes < 60) return `en ${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `en ${h} h ${m} min` : `en ${h} h`;
};

/** Date (o ISO) → "HH:MM" local es-VE. null si no es una fecha válida. */
export const fmtHour = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/** Fecha del día operativo vigente: antes de las 08:00 sigue siendo ayer. */
export const operationalDateOf = (now) => {
    if (!now) return null;
    const d = new Date(now);
    if (d.getHours() < 8) d.setDate(d.getDate() - 1);
    return d;
};

/** Minuto actual sobre el eje operativo (la madrugada corre +1440). */
export const minuteOnAxis = (now) => {
    if (!now) return null;
    const m = now.getHours() * 60 + now.getMinutes();
    return m < AXIS_START ? m + 1440 : m;
};
