import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Estado ACTUAL del monitoreo por establecimiento (GET /monitoring/status):
 * qué locales están dentro de su ventana ahora y con qué tipos, más el flag
 * de silencio persistido (noveltyCheck.flagged). Sirve para SEMBRAR los
 * indicadores en vivo; los cambios posteriores llegan por los sockets
 * 'monitoring-start' / 'monitoring-end' / 'monitoring-silence(-clear)'.
 * @returns [{ idLocal, name, activeTypes, usingWinter, noveltyCheck, ... }]
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
