'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import { getDayCountsByLocal } from '@/libs/ajaxClient/noveltyReport.fecth';

/**
 * Conteos del día operativo EN VIVO: carga inicial + refetch con debounce
 * cuando el socket anuncia novedades nuevas o actualizadas
 * ('created_Alert' / 'document_updated' — crear, validar o enviar).
 *
 * @returns {{ byId, totals } | null}  null mientras carga; ante error del
 *          endpoint devuelve { byId: {}, totals: null } (no cuelga la UI).
 */
export default function useDayCounts(debounceMs = 2000) {

    const [dayCounts, setDayCounts] = useState(null);
    const timerRef = useRef(null);

    const load = useCallback(() => {
        getDayCountsByLocal()
            .then(setDayCounts)
            .catch(err => {
                console.error('Conteo de novedades del día:', err?.message ?? err);
                setDayCounts({ byId: {}, totals: null });
            });
    }, []);

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
