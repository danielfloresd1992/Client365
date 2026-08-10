import axiosInstance from '@/libs/ajaxClient/axios.fetch';

// ══════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — capa de red
// ══════════════════════════════════════════════════════════════════════
// Vive junto al resto del módulo y no en libs/ajaxClient, que es donde están
// las demás peticiones del proyecto. Es una excepción deliberada: todo lo de
// notificaciones se mantiene en una sola carpeta, así se puede leer, mover o
// retirar el módulo entero sin ir a buscar piezas sueltas.
//
// El servidor decide qué le corresponde a cada usuario a partir de la sesión:
// desde acá nunca se envía a quién pertenece la consulta. Una notificación
// personal filtrada en el cliente ya viajó — el filtro tiene que estar antes.

/**
 * Página de notificaciones del usuario de la sesión, con su estado de lectura.
 * @param {{ page?: number, limit?: number }} [opts]
 */
export const getNotifications = async ({ page = 0, limit = 20 } = {}) => {
    const response = await axiosInstance.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
};

/** Cuántas le quedan sin leer. No trae documentos: solo el número. */
export const getUnreadCount = async () => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
};

/** Marca una como leída. Idempotente: llamarla dos veces no falla. */
export const markNotificationRead = async (id) => {
    const response = await axiosInstance.post(`/notifications/${id}/read`);
    return response.data;
};

/** Marca como leídas todas las que le corresponden al usuario. */
export const markAllNotificationsRead = async () => {
    const response = await axiosInstance.post('/notifications/read-all');
    return response.data;
};

/**
 * Resuelve una solicitud pendiente. Solo administradores.
 *
 * Al aprobar, el servidor aplica el cambio que guardó la solicitud: desde acá
 * NO se reenvía su contenido. Si viajara en la petición, quien aprueba podría
 * alterar lo que se solicitó.
 *
 * @param {string} id
 * @param {'approved'|'rejected'} decision
 * @param {string} [note] motivo, sobre todo al rechazar
 */
export const decideNotificationRequest = async (id, decision, note = '', force = false) => {
    const response = await axiosInstance.post(`/notifications/${id}/decide`, { decision, note, force });
    return response.data;
};

/**
 * Solicitudes de horario PENDIENTES, indexadas por celda (`userId|YYYY-MM-DD`).
 *
 * Es un mapa y no una lista porque la grilla pregunta "¿esta celda tiene algo
 * pendiente?" una vez por celda al pintar: con 76 personas por 31 días, recorrer
 * un arreglo en cada una sería trabajo de más por cada repintado.
 */
export const getSchedulePending = async () => {
    const response = await axiosInstance.get('/notifications/schedule/pending');
    return response.data;
};

/**
 * Retira una solicitud propia. Distinto de rechazarla: rechazar lo hace un
 * administrador sobre un cambio ajeno; retirar lo hace quien lo pidió.
 */
export const withdrawNotificationRequest = async (id, note = '') => {
    const response = await axiosInstance.post(`/notifications/${id}/withdraw`, { note });
    return response.data;
};
