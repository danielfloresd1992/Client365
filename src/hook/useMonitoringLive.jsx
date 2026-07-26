'use client';
import { useEffect, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import { getMonitoringStatus } from '@/libs/ajaxClient/monitoring.fecth';

/**
 * Estado del monitoreo EN VIVO por establecimiento:
 *   · liveByLocal   { idLocal → [tipos activos] } — sembrado de
 *     /monitoring/status y mantenido por 'monitoring-start'/'monitoring-end'
 *   · silentByLocal { idLocal → true } — señalados por el corte de silencio;
 *     cada 'monitoring-silence' REEMPLAZA la lista (una vacía limpia todo) y
 *     'monitoring-silence-clear' apaga un local al instante cuando envía
 *   · lastEvent     último inicio/fin recibido (para la cinta del panel)
 */
export default function useMonitoringLive() {

    const [liveByLocal, setLiveByLocal] = useState({});
    const [silentByLocal, setSilentByLocal] = useState({});
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        getMonitoringStatus()
            .then(docs => {
                const map = {};
                const silent = {};
                docs.forEach(doc => {
                    map[doc.idLocal] = doc.activeTypes ?? [];
                    if (doc.noveltyCheck?.flagged) silent[doc.idLocal] = true;
                });
                setLiveByLocal(map);
                setSilentByLocal(silent);
            })
            .catch(err => console.error('Estado de monitoreo:', err?.message ?? err));

        const handleStart = (msm) => {
            setLiveByLocal(prev => {
                const types = new Set(prev[msm.idLocal] ?? []);
                types.add(msm.type);
                return { ...prev, [msm.idLocal]: [...types] };
            });
            setLastEvent({ kind: 'start', name: msm.name, typeLabel: msm.typeLabel ?? msm.type });
        };

        const handleEnd = (msm) => {
            setLiveByLocal(prev => {
                const types = (prev[msm.idLocal] ?? []).filter(t => t !== msm.type);
                return { ...prev, [msm.idLocal]: types };
            });
            setLastEvent({ kind: 'end', name: msm.name, typeLabel: msm.typeLabel ?? msm.type });
        };

        const handleSilence = (msm) => {
            const silent = {};
            (msm?.flagged ?? []).forEach(f => { silent[f.idLocal] = true; });
            setSilentByLocal(silent);
        };

        const handleSilenceClear = (msm) => {
            setSilentByLocal(prev => {
                if (!msm?.idLocal || !prev[msm.idLocal]) return prev;
                const next = { ...prev };
                delete next[msm.idLocal];
                return next;
            });
        };

        socket.on('monitoring-start', handleStart);
        socket.on('monitoring-end', handleEnd);
        socket.on('monitoring-silence', handleSilence);
        socket.on('monitoring-silence-clear', handleSilenceClear);

        return () => {
            socket.off('monitoring-start', handleStart);
            socket.off('monitoring-end', handleEnd);
            socket.off('monitoring-silence', handleSilence);
            socket.off('monitoring-silence-clear', handleSilenceClear);
        };
    }, []);

    return { liveByLocal, silentByLocal, lastEvent };
}
