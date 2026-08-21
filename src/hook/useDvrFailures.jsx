'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import {
    getActiveDvrFailures,
    getDvrFailureHistory,
    getDvrFailureStats,
} from '@/libs/ajaxClient/dvrFailure.fecth';

/**
 * Caídas de DVR: las de AHORA en vivo, y el historial del último mes.
 *
 * @param {{ days?: number, limit?: number }} [opciones]
 *        `days` cuántos días hacia atrás cubre el historial y el mapa (30).
 * @returns {{ active, stats, history, loading, error, reload }}
 *
 *
 * LO DE AHORA Y LO DE ANTES SE PIDEN DISTINTO, A PROPÓSITO
 *
 * `active` se repide entero en cada evento: son un puñado de filas y lo que
 * importa es que el minuto que llevan caídos esté al día. `stats` e `history`
 * cubren un mes y cambian poco, así que van con debounce — un rebote de DVR
 * dispararía tres consultas de un mes cada una para mover una celda.
 *
 * El reloj también cuenta: `elapsedMinutes` lo calcula el servidor al
 * responder, así que sin volver a preguntar se congelaría. Por eso hay un
 * refresco periódico de `active` aunque no llegue ningún evento.
 */
export default function useDvrFailures({ days = 30, limit = 200 } = {}) {

    const [active, setActive] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);

    /** YYYY-MM-DD de hace `days` días, y de hoy. */
    const rango = useCallback(() => {
        const hoy = new Date();
        const desde = new Date(hoy.getTime() - (days - 1) * 86_400_000);
        const iso = (f) => f.toISOString().slice(0, 10);
        return { from: iso(desde), to: iso(hoy) };
    }, [days]);

    const cargarActivas = useCallback(() => {
        return getActiveDvrFailures()
            .then(datos => { setActive(datos); setError(null); })
            .catch(err => {
                console.error('Caídas de DVR activas:', err?.message ?? err);
                // 404 mientras api_jarvis365 no esté desplegado: el recurso es
                // nuevo y el deploy es manual. Se muestra vacío, no roto.
                setActive({ total: 0, failures: [] });
                setError(err);
            });
    }, []);

    const cargarHistorial = useCallback(() => {
        const { from, to } = rango();
        return Promise.all([
            getDvrFailureStats({ from, to }),
            getDvrFailureHistory({ from, to, limit }),
        ])
            .then(([estadistica, historial]) => {
                setStats(estadistica);
                setHistory(historial);
            })
            .catch(err => {
                console.error('Historial de caídas de DVR:', err?.message ?? err);
                setStats({ totals: null, byLocal: [], byDay: [] });
                setHistory({ failures: [], total: 0 });
            });
    }, [rango, limit]);

    const reload = useCallback(() => {
        setLoading(true);
        return Promise.all([cargarActivas(), cargarHistorial()])
            .finally(() => setLoading(false));
    }, [cargarActivas, cargarHistorial]);

    useEffect(() => {
        reload();

        // El historial con debounce: cubre un mes y cambia poco.
        const historialConRetraso = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(cargarHistorial, 2000);
        };

        const onCambio = () => {
            cargarActivas();          // al instante: son pocas filas
            historialConRetraso();    // con calma: es un mes
        };

        socket.on('dvr-failure:down', onCambio);
        socket.on('dvr-failure:restored', onCambio);

        // Los nombres viejos siguen vivos mientras la aplicación instalada en
        // las estaciones no se actualice, y hoy es por ahí por donde entran casi
        // todas las caídas.
        socket.on('failed-connection', onCambio);
        socket.on('failed-connection-deleteItem', onCambio);

        // El minuto que llevan caídos lo calcula el servidor: sin volver a
        // preguntar, el contador se quedaría clavado en el de la primera carga.
        const reloj = setInterval(cargarActivas, 60_000);

        return () => {
            socket.off('dvr-failure:down', onCambio);
            socket.off('dvr-failure:restored', onCambio);
            socket.off('failed-connection', onCambio);
            socket.off('failed-connection-deleteItem', onCambio);
            clearInterval(reloj);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [reload, cargarActivas, cargarHistorial]);

    return { active, stats, history, loading, error, reload };
}
