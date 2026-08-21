import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Estado ACTUAL del monitoreo por establecimiento (GET /monitoring/status):
 * qué locales están dentro de su ventana ahora y con qué tipos, más el flag
 * de silencio persistido (noveltyCheck.flagged). Sirve para SEMBRAR los
 * indicadores en vivo; los cambios posteriores llegan por los sockets
 * 'monitoring-start' / 'monitoring-end' / 'monitoring-silence(-clear)'.
 * @returns [{ idLocal, name, activeTypes, usingWinter, noveltyCheck,
 *             silenceExempt, ... }]
 */
export const getMonitoringStatus = async () => {
    try {
        const response = await axiosInstance.get('/monitoring/status');
        return Array.isArray(response.data) ? response.data : [];
    }
    catch (error) {
        throw error;
    }
}


/**
 * Saca (o devuelve) un establecimiento de la lista "ESTABLECIMIENTOS SIN
 * REPORTAR AL GRUPO". PUT /monitoring/silence-exempt.
 *
 * SOLO ADMINISTRADORES — usuarios con `admin: true`. El backend lo exige
 * además del front: esconder el botón no es la medida, es la comodidad.
 *
 * Apaga SOLO ese aviso horario. El local sigue contando sus alertas, sigue
 * anunciando inicio y fin de monitoreo y sigue apareciendo si se le cae el DVR.
 *
 * El servidor emite `monitoring-silence-exempt` al guardar, así que todas las
 * salas de control abiertas se enteran sin recargar.
 *
 * @param {{ idLocal: string, active: boolean, reason?: string }} params
 */
export const setSilenceExempt = async ({ idLocal, active, reason } = {}) => {
    const response = await axiosInstance.put('/monitoring/silence-exempt', { idLocal, active, reason });
    return response.data;
}
