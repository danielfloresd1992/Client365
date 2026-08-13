import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Conteo de novedades del DÍA OPERATIVO (08:00 → 07:00), agrupado por
 * franquicia → local. GET /noveltyReport/today (misma fuente de verdad que
 * el PDF del reporte).
 * @returns data cruda del endpoint: { franchises, totals, ... }
 */
export const getNoveltyReportToday = async () => {
    try {
        const response = await axiosInstance.get('/noveltyReport/today');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Variante aplanada para paneles en vivo (dashboard, AlertInputLive):
 * { byId: { idLocal → {total, positivas, negativas, ignoradas, enviadas} },
 *   totals }
 */
export const getDayCountsByLocal = async () => {
    const data = await getNoveltyReportToday();
    const byId = {};
    (data?.franchises ?? []).forEach(franchise => {
        (franchise.locals ?? []).forEach(local => {
            if (local.idLocal) byId[local.idLocal] = local;
        });
    });
    return { byId, totals: data?.totals ?? null };
}


/**
 * Novedades que REPORTÓ un usuario en un rango de fechas, para calcular su
 * bonificación. GET /novelties/by-user
 *
 * El día `until` entra completo: quien pide "del 1 al 15" espera que el 15
 * cuente. De eso se encarga el servidor.
 *
 * @param {{ userId: string, since?: string, until?: string }} params
 *        fechas en formato YYYY-MM-DD
 * @returns {Promise<{ resumen: { total, aprobadas, rechazadas, sinValidar }, novelties: Array }>}
 */
export const getNoveltiesByUser = async ({ userId, since, until } = {}) => {
    try {
        const params = new URLSearchParams({ userId });
        if (since) params.set('since', since);
        if (until) params.set('until', until);

        const response = await axiosInstance.get(`/novelties/by-user?${params.toString()}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};
