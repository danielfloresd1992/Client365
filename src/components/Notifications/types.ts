// Tipos compartidos del módulo de notificaciones.
//
// Estaban declarados dentro del panel, así que cada pieza que necesitara la
// forma de una notificación la volvía a escribir. Acá viven una sola vez.

export type NotificationScope = 'global' | 'personal' | 'admin';

/**
 * Familia visual. La declara la estrategia del backend y viaja en la
 * notificación: el cliente NO la deduce del `type`.
 *   schedule   → horario: guardia, permisos, cambios de jornada
 *   resource   → establecimientos y franquicias
 *   system     → anuncios de la plataforma
 *   attendance → el marcaje propio: entrada, salida, retardo, día extra
 *   comment    → una nota escrita sobre el día de otra persona
 */
export type NotificationFamily = 'schedule' | 'resource' | 'system' | 'attendance' | 'comment' | 'general';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'danger';
/**
 * 'withdrawn' es distinto de 'rejected': rechazar lo hace un administrador
 * sobre un cambio ajeno; retirar lo hace quien lo pidió, arrepintiéndose.
 */
export type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type Decision = 'approved' | 'rejected';

export interface NotificationPerson {
    name?: string;
    surName?: string;
    img?: string | null;
}

export interface NotificationResource {
    kind?: string;
    name?: string;
    /** Ruta del front para abrir el recurso desde la campana. */
    path?: string;
    img?: string | null;
}

export interface NotificationChange {
    field?: string;
    label?: string;
    from?: unknown;
    to?: unknown;
}

export interface NotificationRequest {
    status?: RequestStatus;
    decidedBy?: NotificationPerson | string | null;
    decidedAt?: string | null;
    note?: string;
}

/**
 * Datos del marcaje que viajan en `meta` de la familia `attendance`.
 * Los arma la estrategia del backend; acá solo se leen para pintarlos.
 */
export interface AttendanceMeta {
    kind?: 'checkIn' | 'checkOut';
    attendanceId?: string;
    /** Día operativo al que pertenece el marcaje. */
    date?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    shift?: string;
    /** Hora pautada, para contrastarla con la real. */
    startTime?: string | null;
    endTime?: string | null;
    isLate?: boolean;
    minutesLate?: number;
    discountUnits?: number;
    isExtraDay?: boolean;
    status?: string;
    workedMinutes?: number;
    workedLabel?: string;
    /** Foto tomada al marcar la entrada. */
    photoIn?: string | null;
    /** Foto tomada al marcar la salida; nula con la jornada abierta. */
    photoOut?: string | null;
    overtimeMinutes?: number;
    overtimeStatus?: string;
    overtimeApprovedMinutes?: number | null;
}

/**
 * Datos de un comentario del horario, en `meta` de la familia `comment`.
 * El texto de la nota NO va en el cuerpo de la notificación: se pinta aparte
 * como cita, para que el título se lea corrido por larga que sea.
 */
export interface CommentMeta {
    /** La nota tal cual la escribieron. */
    message?: string;
    /** Día del horario comentado, "YYYY-MM-DD". */
    dayKey?: string;
    /** El mismo día, ya legible. */
    dayLabel?: string;
    attendanceId?: string;
}

export interface Notification {
    _id: string;
    type?: string;
    /** Familia visual; decide cómo se pinta. La manda el backend. */
    family?: NotificationFamily;
    scope?: NotificationScope;
    level?: NotificationLevel;
    createdAt?: string;
    /** Estado de lectura de ESTE usuario; lo resuelve el servidor. */
    read?: boolean;

    /** Quién lo hizo. */
    actor?: NotificationPerson;
    /** El tercero afectado: de quién es el horario que se cambió. */
    target?: NotificationPerson;
    resource?: NotificationResource;
    changes?: NotificationChange[];
    request?: NotificationRequest;

    /**
     * Datos propios de la familia. Cada vista sabe leer los suyos y las demás
     * lo ignoran; por eso no está tipado como una unión cerrada.
     */
    meta?: AttendanceMeta | CommentMeta | Record<string, unknown> | null;
}

/** Resultado de aprobar o rechazar una solicitud. */
export interface DecideResult {
    ok: boolean;
    applied?: number;
    message?: string;
}
