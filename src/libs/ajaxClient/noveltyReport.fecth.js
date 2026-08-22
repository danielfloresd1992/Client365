import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * Conteo de novedades del DÍA OPERATIVO (08:00 → 07:00), agrupado por
 * franquicia → local. GET /noveltyReport/today (misma fuente de verdad que
 * el PDF del reporte).
 *
 * @param {{ category?: string, bonusCategory?: string }} [filtros]
 *        Opcionales y combinables. Sin ellos devuelve el reporte completo,
 *        que es el mismo que se manda al grupo.
 * @returns data cruda del endpoint: { franchises, totals, ... }
 */
export const getNoveltyReportToday = async ({ category, bonusCategory } = {}) => {
    try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (bonusCategory) params.set('bonusCategory', bonusCategory);

        const query = params.toString();
        const response = await axiosInstance.get(`/noveltyReport/today${query ? `?${query}` : ''}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Variante aplanada para paneles en vivo (dashboard, AlertInputLive):
 * { byId: { idLocal → {total, positivas, negativas, ignoradas, enviadas,
 *                      dvr, status} },
 *   totals, status, dvr }
 *
 * `status` reparte los locales en 'reportaron' | 'sinReportar' | 'sinConexion',
 * y `dvr` resume el estado de las cámaras del día. Los dos vienen CONTADOS del
 * servidor: el criterio de qué es "no reportó" —un local con el DVR caído no lo
 * es, porque no podía monitorearse— tiene que ser uno solo, y vive allá.
 *
 * Se devuelven aunque el servidor todavía no los mande: mientras api_jarvis365
 * no esté desplegado llegan en `null`, y las filas sin `dvr`. La vista lo trata
 * como "no hay caídas", que es exactamente lo que se veía antes.
 *
 * @param {{ category?: string, bonusCategory?: string }} [filtros]
 */
export const getDayCountsByLocal = async (filtros = {}) => {
    const data = await getNoveltyReportToday(filtros);
    const byId = {};
    (data?.franchises ?? []).forEach(franchise => {
        (franchise.locals ?? []).forEach(local => {
            if (local.idLocal) byId[local.idLocal] = local;
        });
    });
    return {
        byId,
        totals: data?.totals ?? null,
        status: data?.status ?? null,
        dvr: data?.dvr ?? null,
    };
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


/**
 * Las alertas de un establecimiento en el día operativo, en versión corta.
 *
 * GET /noveltie/establecimiento/id=:id/dia=:dia — `dia = '0'` es hoy.
 *
 * Trae lo justo para una lista: qué alerta fue, a qué hora y cómo quedó la
 * validación. La ficha completa de una novedad tiene otro endpoint.
 *
 * Usa el MISMO día operativo (08:00 → 07:00) que los conteos de la fila, así
 * que la lista y el número que se ve al lado siempre coinciden.
 *
 * @param {{ idLocal: string, dia?: string }} params  `dia` en formato YYYY-MM-DD
 * @returns {Promise<{ resumen: { total, aprobadas, rechazadas, sinValidar }, alertas: Array }>}
 */
export const getNoveltiesOfLocalByDay = async ({ idLocal, dia = '0' } = {}) => {
    const response = await axiosInstance.get(
        `/noveltie/establecimiento/id=${encodeURIComponent(idLocal)}/dia=${encodeURIComponent(dia)}`,
    );
    return response.data;
};
