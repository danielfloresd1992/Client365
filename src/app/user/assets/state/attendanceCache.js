'use client';

// ══════════════════════════════════════════════════════════════════════
// CACHÉ DE ASISTENCIA DE LA GRILLA
// ══════════════════════════════════════════════════════════════════════
// Lo que ya se cargó de cada celda, compartido por toda la grilla.
//
// Es un almacén de MÓDULO y no un contexto de React a propósito: la grilla
// monta más de dos mil celdas y cada una escribe lo suyo. Con un contexto,
// cada llegada por socket repintaría el árbol entero.
//
// Dos mapas con papeles distintos:
//   attendanceCache        → el dato ya recibido, por `dni-fechaISO`
//   attendanceRequestCache → la petición EN VUELO, para que dos celdas que
//                            piden lo mismo no disparen dos veces
//
// Y un pub/sub aparte, porque las filas de resumen cuentan sobre la caché y
// tienen que recontar cuando las celdas escriben.

export const attendanceCache = new Map();
export const attendanceRequestCache = new Map();

/** Lectura suelta, p. ej. para precargar el formulario grupal. */
export const getCachedAttendance = (dni, dateISO) => attendanceCache.get(`${dni}-${dateISO}`);


const attendanceCacheListeners = new Set();
let attendanceCacheNotifyPending = false;

/**
 * Avisa que la caché cambió, agrupando los avisos.
 *
 * Con debounce porque al abrir un mes se llenan cientos de celdas casi a la
 * vez: sin agrupar, cada una obligaría a recontar todas las filas de resumen.
 */
export const notifyAttendanceCacheChange = () => {
    if (attendanceCacheNotifyPending) return;
    attendanceCacheNotifyPending = true;
    setTimeout(() => {
        attendanceCacheNotifyPending = false;
        attendanceCacheListeners.forEach((listener) => listener());
    }, 300);
};

/** Suscribe un repintado a los cambios de la caché. Devuelve la baja. */
export const subscribeAttendanceCache = (listener) => {
    attendanceCacheListeners.add(listener);
    return () => attendanceCacheListeners.delete(listener);
};
