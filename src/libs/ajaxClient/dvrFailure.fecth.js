import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/*
 * CAÍDAS DE CONEXIÓN CON EL DVR/NVR.
 *
 * Recurso `dvr-failure` de api_jarvis365. Un documento por EPISODIO: se abre
 * cuando el establecimiento se queda sin cámaras y se cierra cuando vuelven,
 * sellando cuánto estuvo ciego.
 *
 * Reemplaza al viejo `/failed`, que solo decía qué había caído en ese momento y
 * lo guardaba en memoria — sin historial y perdiéndolo todo al reiniciar.
 */


/**
 * GET /dvr-failure/active — los establecimientos sin cámaras AHORA.
 *
 * Cada uno trae `elapsedMinutes`, cuánto lleva caído, calculado al vuelo:
 * mientras el episodio siga abierto no hay una duración sellada.
 *
 * @returns {Promise<{ total: number, failures: Array }>}
 */
export const getActiveDvrFailures = async () => {
    const response = await axiosInstance.get('/dvr-failure/active');
    return response.data;
};


/**
 * GET /dvr-failure/history — el historial, con filtros y paginado.
 *
 * @param {{ from?: string, to?: string, local?: string, shift?: string,
 *           page?: number, limit?: number }} [filtros]
 *        `from`/`to` en YYYY-MM-DD. El servidor los compara contra el DÍA
 *        OPERATIVO, no contra la hora: pedir "el 20" trae la madrugada del 21,
 *        que operativamente es del 20.
 * @returns {Promise<{ page, limit, total, pages, failures: Array }>}
 */
export const getDvrFailureHistory = async (filtros = {}) => {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
        if (valor !== undefined && valor !== null && valor !== '') params.set(clave, String(valor));
    }
    const query = params.toString();
    const response = await axiosInstance.get(`/dvr-failure/history${query ? `?${query}` : ''}`);
    return response.data;
};


/**
 * GET /dvr-failure/stats — la estadística del rango.
 *
 * Dos cortes del mismo conjunto:
 *   byLocal  el ranking — qué establecimiento se cae más
 *   byDay    una fila por día operativo, que es lo que come el mapa de calor
 *
 * Los días SIN caídas no vienen en `byDay`: la agregación solo ve lo que
 * ocurrió, y es la vista la que arma la rejilla completa y pinta los huecos.
 *
 * @param {{ from?: string, to?: string, local?: string, shift?: string }} [filtros]
 * @returns {Promise<{ totals, byLocal: Array, byDay: Array }>}
 */
export const getDvrFailureStats = async (filtros = {}) => {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
        if (valor !== undefined && valor !== null && valor !== '') params.set(clave, String(valor));
    }
    const query = params.toString();
    const response = await axiosInstance.get(`/dvr-failure/stats${query ? `?${query}` : ''}`);
    return response.data;
};
