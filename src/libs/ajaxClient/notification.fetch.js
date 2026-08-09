import axiosInstance from '@/libs/ajaxClient/axios.fetch';

// ══════════════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════════
// El servidor decide qué le corresponde a cada usuario a partir de la sesión:
// desde acá nunca se envía a quién pertenece la consulta. Una notificación
// personal filtrada en el cliente ya viajó — el filtro tiene que estar antes.

/**
 * Página de notificaciones que le corresponden al usuario de la sesión,
 * cada una con su estado de lectura.
 * @param {{ page?: number, limit?: number }} [opts]
 */
export const getNotifications = async ({ page = 0, limit = 20 } = {}) => {
    const response = await axiosInstance.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
};

/** Cuántas le quedan sin leer. Lo consulta la campana al montar. */
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
