'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import { getDayCountsByLocal } from '@/libs/ajaxClient/noveltyReport.fecth';

/**
 * Conteos del día operativo EN VIVO: carga inicial + refetch con debounce
 * cuando el socket anuncia novedades nuevas o actualizadas
 * ('created_Alert' / 'document_updated' — crear, validar o enviar).
 *
 * Acepta los filtros del panel. Al cambiar cualquiera se vuelve a pedir el
 * conteo: el filtrado se resuelve en el servidor, porque el endpoint devuelve
 * totales ya agregados y no la lista de novedades que habría que recontar acá.
 *
 * @param {{ category?: string, bonusCategory?: string, debounceMs?: number }} [opciones]
 * @returns {{ byId, totals, status, dvr } | null}  null mientras carga; ante
 *          error del endpoint devuelve todo en null (no cuelga la UI).
 *
 *
 * CÁMARAS CAÍDAS — POR QUÉ ESE EVENTO NO ESPERA AL DEBOUNCE
 *
 * Las novedades entran a goteo y de a muchas: por eso su refetch se agrupa dos
 * segundos. Un DVR que se cae es lo contrario — pasa poco y hay que verlo YA,
 * porque es justo cuando alguien mira el panel para saber qué establecimiento
 * se quedó sin cámaras.
 *
 * Por eso `noveltyReport:dvr-changed` hace las dos cosas: parchea la fila en el
 * acto con lo que trae el evento, y además pide el conteo con el debounce de
 * siempre para que los totales se resincronicen. Lo primero es lo que se ve; lo
 * segundo, lo que corrige cualquier diferencia.
 */
export default function useDayCounts({ category, bonusCategory, debounceMs = 2000 } = {}) {

    const [dayCounts, setDayCounts] = useState(null);
    const timerRef = useRef(null);

    const load = useCallback(() => {
        getDayCountsByLocal({ category, bonusCategory })
            .then(setDayCounts)
            .catch(err => {
                console.error('Conteo de novedades del día:', err?.message ?? err);
                setDayCounts({ byId: {}, totals: null, status: null, dvr: null });
            });
    }, [category, bonusCategory]);

    useEffect(() => {
        load();

        const scheduleRefresh = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(load, debounceMs);
        };

        /**
         * Un establecimiento se quedó sin cámaras, o las recuperó.
         *
         * Se parchea SOLO esa fila y se recuentan los tres estados a partir de
         * `byId`, en vez de sumar y restar sobre el contador anterior: si dos
         * eventos del mismo local llegan seguidos —o si uno se pierde— los
         * incrementos quedan descuadrados y no hay forma de notarlo. Recontar
         * sobre el mapa entero es barato —son decenas de locales— y siempre da
         * el número que se ve en la lista.
         */
        const onDvrChanged = (evento) => {
            if (!evento?.idLocal) return;

            setDayCounts(prev => {
                const local = prev?.byId?.[evento.idLocal];

                // Un local que no está en el reporte de hoy no tiene horario de
                // monitoreo, así que tampoco tiene fila que parchear. Si resulta
                // que sí debía estar, el refetch lo resuelve.
                if (!local) return prev;

                const previo = local.dvr ?? {};

                const dvr = {
                    ...previo,
                    down: Boolean(evento.down),
                    failedAt: evento.failedAt ?? previo.failedAt ?? null,
                    failedAtLabel: evento.failedAtLabel ?? previo.failedAtLabel ?? null,
                    restoredAt: evento.restoredAt ?? null,
                    restoredAtLabel: evento.restoredAtLabel ?? null,
                    reportedByName: evento.reportedByName ?? previo.reportedByName ?? '',

                    // Al caerse es un episodio más; al volver, el mismo que ya
                    // estaba contado.
                    episodes: evento.down ? (previo.episodes ?? 0) + 1 : (previo.episodes ?? 1),

                    // Los minutos ciegos los sella el servidor al restablecer:
                    // mientras siga caído todavía no hay número que mostrar.
                    downtimeMinutes: evento.downtimeMinutes ?? previo.downtimeMinutes ?? 0,
                };

                // Al volver la conexión el local retoma su estado normal según
                // lo que haya reportado — y ese número esta fila ya lo tiene.
                // Por eso el servidor no manda el estado calculado.
                const status = dvr.down ? 'sinConexion'
                    : (local.total ?? 0) > 0 ? 'reportaron'
                        : 'sinReportar';

                const byId = { ...prev.byId, [evento.idLocal]: { ...local, dvr, status } };
                const filas = Object.values(byId);

                return {
                    ...prev,
                    byId,
                    status: {
                        reportaron: filas.filter(f => f.status === 'reportaron').length,
                        sinReportar: filas.filter(f => f.status === 'sinReportar').length,
                        sinConexion: filas.filter(f => f.status === 'sinConexion').length,
                    },
                    dvr: {
                        ...(prev.dvr ?? {}),
                        downNow: filas.filter(f => f.dvr?.down).length,
                        affectedToday: filas.filter(f => (f.dvr?.episodes ?? 0) > 0).length,
                    },
                };
            });

            // Y además se resincroniza: el parche de arriba es lo que se ve al
            // instante, pero los minutos ciegos y los totales los cuenta el
            // servidor.
            scheduleRefresh();
        };

        socket.on('created_Alert', scheduleRefresh);
        socket.on('document_updated', scheduleRefresh);
        socket.on('noveltyReport:dvr-changed', onDvrChanged);

        return () => {
            socket.off('created_Alert', scheduleRefresh);
            socket.off('document_updated', scheduleRefresh);
            socket.off('noveltyReport:dvr-changed', onDvrChanged);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [load, debounceMs]);

    return dayCounts;
}
