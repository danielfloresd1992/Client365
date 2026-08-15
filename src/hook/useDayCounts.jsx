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
 * @returns {{ byId, totals } | null}  null mientras carga; ante error del
 *          endpoint devuelve { byId: {}, totals: null } (no cuelga la UI).
 */
export default function useDayCounts({ category, bonusCategory, debounceMs = 2000 } = {}) {

    const [dayCounts, setDayCounts] = useState(null);
    const timerRef = useRef(null);

    const load = useCallback(() => {
        getDayCountsByLocal({ category, bonusCategory })
            .then(setDayCounts)
            .catch(err => {
                console.error('Conteo de novedades del día:', err?.message ?? err);
                setDayCounts({ byId: {}, totals: null });
            });
    }, [category, bonusCategory]);

    useEffect(() => {
        load();

        const scheduleRefresh = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(load, debounceMs);
        };

        socket.on('created_Alert', scheduleRefresh);
        socket.on('document_updated', scheduleRefresh);

        return () => {
            socket.off('created_Alert', scheduleRefresh);
            socket.off('document_updated', scheduleRefresh);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [load, debounceMs]);

    return dayCounts;
}
