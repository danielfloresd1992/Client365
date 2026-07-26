import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Todos los horarios de monitoreo (GET /schedule/all): un doc por local con
 * sus rangos por día ({ idLocal, dayMonitoring, dayMonitoringWinter,
 * usesUsTimezone }).
 */
export const getAllMonitoringSchedules = async () => {
    try {
        const response = await axiosInstance.get('/schedule/all');
        return Array.isArray(response.data) ? response.data : [];
    }
    catch (error) {
        throw error;
    }
}
