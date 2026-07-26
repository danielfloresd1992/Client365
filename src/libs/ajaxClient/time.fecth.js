import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Flag global del horario de invierno USA (recurso time): con true, los
 * locales con usesUsTimezone usan su horario alternativo (dayMonitoringWinter).
 */
export const getUsWinterActive = async () => {
    try {
        const response = await axiosInstance.get('/time');
        return Boolean(response.data?.usWinterActive);
    }
    catch (error) {
        throw error;
    }
}
