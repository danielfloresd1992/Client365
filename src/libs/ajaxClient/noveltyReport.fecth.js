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
