'use client';
import { useEffect, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import { getMonitoringStatus } from '@/libs/ajaxClient/monitoring.fecth';

/**
 * Estado del monitoreo EN VIVO por establecimiento:
 *   · liveByLocal   { idLocal → [tipos activos] } — sembrado de
 *     /monitoring/status y mantenido por 'monitoring-start'/'monitoring-end'
 *   · silentByLocal { idLocal → { lastSentAt } } — señalados por el corte de
 *     silencio (objeto truthy; lastSentAt = último envío al grupo, o null);
 *     cada 'monitoring-silence' REEMPLAZA la lista (una vacía limpia todo),
 *     'monitoring-silence-clear' apaga un local al instante cuando envía, y
 *     el FIN del monitoreo analítico de un local también lo apaga (fuera de
 *     su ventana no hay nada que reclamarle)
 *   · exemptByLocal { idLocal → { byName, at, reason } } — locales que un
 *     administrador sacó de la lista "sin reportar al grupo"; se siembra de
 *     /monitoring/status y lo mantiene 'monitoring-silence-exempt'
 *   · lastEvent     último inicio/fin recibido (para la cinta del panel)
 *
 * EXENTO NO ES SILENCIOSO, y por eso son dos mapas. El exento no dispara el
 * aviso horario, pero sigue en monitoreo, sigue contando alertas y sigue
 * avisando si se le cae el DVR: lo único que se apaga es esa lista.
 *
 * /monitoring/status calcula la verdad EN TIEMPO REAL desde el horario
 * (Schedules/MonitoringRange: dayMonitoring + start/end del día). Además de
 * la siembra al montar, se RE-SIEMBRA cada minuto y al volver a la pestaña:
 * si un evento de socket se perdió (red, watcher caído), el estado converge
 * solo con el horario y ningún aviso viejo sobrevive fuera de su ventana.
 */

const RESEED_MS = 60 * 1000;

export default function useMonitoringLive() {

    const [liveByLocal, setLiveByLocal] = useState({});
    const [silentByLocal, setSilentByLocal] = useState({});
    const [exemptByLocal, setExemptByLocal] = useState({});
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        let alive = true;

        // Siembra / re-siembra: REEMPLAZA ambos mapas con la verdad del
        // horario calculada por la api en este instante.
        const load = () => {
            getMonitoringStatus()
                .then(docs => {
                    if (!alive) return;
                    const map = {};
                    const silent = {};
                    const exempt = {};
                    docs.forEach(doc => {
                        map[doc.idLocal] = doc.activeTypes ?? [];
                        // silentByLocal[id] = { lastSentAt } — objeto truthy: los
                        // Boolean(silentByLocal[id]) existentes siguen valiendo, y
                        // el front puede leer cuándo fue el último envío al grupo.
                        if (doc.noveltyCheck?.flagged) silent[doc.idLocal] = { lastSentAt: doc.noveltyCheck?.lastSentAt ?? null };

                        if (doc.silenceExempt?.active) {
                            exempt[doc.idLocal] = {
                                byName: doc.silenceExempt.byName ?? '',
                                at: doc.silenceExempt.at ?? null,
                                reason: doc.silenceExempt.reason ?? '',
                            };
                        }
                    });
                    setLiveByLocal(map);
                    setSilentByLocal(silent);
                    setExemptByLocal(exempt);
                })
                .catch(err => console.error('Estado de monitoreo:', err?.message ?? err));
        };
        load();

        const handleStart = (msm) => {
            setLiveByLocal(prev => {
                const types = new Set(prev[msm.idLocal] ?? []);
                types.add(msm.type);
                return { ...prev, [msm.idLocal]: [...types] };
            });
            setLastEvent({ kind: 'start', name: msm.name, typeLabel: msm.typeLabel ?? msm.type, at: msm.at });
        };

        const handleEnd = (msm) => {
            setLiveByLocal(prev => {
                const types = (prev[msm.idLocal] ?? []).filter(t => t !== msm.type);
                return { ...prev, [msm.idLocal]: types };
            });
            // Terminó el monitoreo ANALÍTICO del local → su aviso de silencio
            // deja de tener sentido: se apaga al instante, sin esperar corte.
            if (msm.type === 'analytical') {
                setSilentByLocal(prev => {
                    if (!prev[msm.idLocal]) return prev;
                    const next = { ...prev };
                    delete next[msm.idLocal];
                    return next;
                });
            }
            setLastEvent({ kind: 'end', name: msm.name, typeLabel: msm.typeLabel ?? msm.type, at: msm.at });
        };

        const handleSilence = (msm) => {
            const silent = {};
            (msm?.flagged ?? []).forEach(f => { silent[f.idLocal] = { lastSentAt: f.lastSentAt ?? null }; });
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

        /**
         * Un administrador eximió (o devolvió) un local al corte de silencio.
         *
         * Al eximir se apaga además el aviso que tuviera puesto: si no, el local
         * quedaría en rojo hasta el corte siguiente y parecería que el botón no
         * hizo nada. Al devolverlo NO se lo señala — eso lo decide el corte.
         */
        const handleExempt = (msm) => {
            if (!msm?.idLocal) return;

            setExemptByLocal(prev => {
                const next = { ...prev };
                if (msm.active) {
                    next[msm.idLocal] = { byName: msm.byName ?? '', at: msm.at ?? null, reason: msm.reason ?? '' };
                }
                else {
                    delete next[msm.idLocal];
                }
                return next;
            });

            if (msm.active) {
                setSilentByLocal(prev => {
                    if (!prev[msm.idLocal]) return prev;
                    const next = { ...prev };
                    delete next[msm.idLocal];
                    return next;
                });
            }
        };

        socket.on('monitoring-start', handleStart);
        socket.on('monitoring-end', handleEnd);
        socket.on('monitoring-silence', handleSilence);
        socket.on('monitoring-silence-clear', handleSilenceClear);
        socket.on('monitoring-silence-exempt', handleExempt);

        const timer = setInterval(load, RESEED_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            alive = false;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            socket.off('monitoring-start', handleStart);
            socket.off('monitoring-end', handleEnd);
            socket.off('monitoring-silence', handleSilence);
            socket.off('monitoring-silence-clear', handleSilenceClear);
            socket.off('monitoring-silence-exempt', handleExempt);
        };
    }, []);

    return { liveByLocal, silentByLocal, exemptByLocal, lastEvent };
}
