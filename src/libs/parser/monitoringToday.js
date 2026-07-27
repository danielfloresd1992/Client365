import { AXIS_START, toMinutes, fmtAxisMinute, fmtInMinutes } from '@/libs/time/operationalDay';

/*
 * Parser PURO del horario de monitoreo de HOY: cruza los docs de schedule
 * con los locales activos y el "ahora", y devuelve los grupos por estado
 * operativo que consumen las vistas (LocalsOverview del dashboard):
 *
 *   { live: [...], upcoming: [...], done: [...] }
 *
 * Cada entrada: { id, name, state, stateLabel, ranges: [{label, type,
 * sAxis, eAxis}], liveTypes: ['analytical'|'perimeter'], silent, counts,
 * sortKey }. Sin efectos ni fetching: todo llega por parámetros, así es
 * testeable y reutilizable.
 */

export function buildScheduleGroups({
    schedules,        // docs de /schedule/all
    clients,          // locales del store (con isActive y name)
    isWinter,         // flag global de horario de invierno USA
    opDate,           // fecha del día operativo vigente (Date)
    minuteNowAxis,    // minuto actual sobre el eje operativo
    liveByLocal,      // { idLocal → [tipos activos] } según el watcher
    silentByLocal,    // { idLocal → true } señalados por el corte de silencio
    dayCounts,        // { byId } conteos del día por local
}) {
    const groups = { live: [], upcoming: [], done: [] };
    if (!opDate || !Array.isArray(clients)) return groups;
    const dow = opDate.getDay();
    const nameById = new Map(
        clients.filter(c => c?.isActive !== false).map(c => [String(c._id), c.name])
    );

    for (const doc of schedules) {
        const id = String(doc.idLocal);
        const name = nameById.get(id);
        if (!name) continue;

        const useWinter = Boolean(isWinter) && Boolean(doc.usesUsTimezone);
        const ranges = (useWinter ? doc.dayMonitoringWinter : doc.dayMonitoring) ?? [];

        // Rangos de HOY en minutos del eje operativo (los corridos cruzan medianoche)
        const todays = [];
        for (const r of ranges) {
            if (Number(r?.dayMonitoring) !== dow) continue;
            const s = toMinutes(r?.hours?.start);
            const e = toMinutes(r?.hours?.end);
            if (s === null || e === null) continue;
            const sAxis = s < AXIS_START ? s + 1440 : s;
            let eAxis = e <= s ? e + 1440 : e;
            if (eAxis <= AXIS_START) eAxis += 1440;
            todays.push({ label: `${fmtAxisMinute(s)}–${fmtAxisMinute(e)}`, type: r?.type || 'analytical', sAxis, eAxis });
        }
        if (todays.length === 0) continue;
        todays.sort((a, b) => a.sAxis - b.sAxis);

        // ¿Su monitoreo ANALÍTICO está dentro del rango (start–end) AHORA?
        // El aviso de silencio solo tiene sentido dentro de esa ventana: un
        // flag viejo de un local que ya cerró (o que aún no abre) se ignora.
        const inAnalyticalWindow = minuteNowAxis !== null
            && todays.some(r => r.type === 'analytical' && minuteNowAxis >= r.sAxis && minuteNowAxis < r.eAxis);

        // Estado: el watcher manda (punto en vivo); el horario da el contexto
        const watcherLive = (liveByLocal?.[id] ?? []).length > 0;

        // Tipos EN VIVO ahora ('analytical' | 'perimeter'): unión de lo que
        // dice el watcher y de los rangos del horario que cubren este minuto
        // (si un evento de socket se perdió, el horario sigue pintando bien).
        const liveTypes = new Set(liveByLocal?.[id] ?? []);
        if (minuteNowAxis !== null) {
            for (const r of todays) {
                if (minuteNowAxis >= r.sAxis && minuteNowAxis < r.eAxis) liveTypes.add(r.type);
            }
        }
        let state = 'done';
        let stateLabel = '';
        if (minuteNowAxis !== null) {
            const covering = todays.find(r => minuteNowAxis >= r.sAxis && minuteNowAxis < r.eAxis);
            const next = todays.find(r => r.sAxis > minuteNowAxis);
            if (covering || watcherLive) {
                state = 'live';
                stateLabel = covering ? `hasta las ${fmtAxisMinute(covering.eAxis)}` : 'en monitoreo';
            }
            else if (next) {
                state = 'upcoming';
                stateLabel = `abre ${fmtAxisMinute(next.sAxis)} · ${fmtInMinutes(next.sAxis - minuteNowAxis)}`;
            }
            else {
                state = 'done';
                stateLabel = `cerró a las ${fmtAxisMinute(Math.max(...todays.map(r => r.eAxis)))}`;
            }
        }

        groups[state].push({
            id, name, state, stateLabel,
            ranges: todays,
            liveTypes: [...liveTypes],
            silent: Boolean(silentByLocal?.[id])
                && (inAnalyticalWindow || (liveByLocal?.[id] ?? []).includes('analytical')),
            counts: dayCounts?.byId?.[id] ?? null,
            sortKey: state === 'live'
                ? Math.min(...todays.filter(r => minuteNowAxis >= r.sAxis && minuteNowAxis < r.eAxis).map(r => r.eAxis), Infinity)
                : state === 'upcoming'
                    ? Math.min(...todays.filter(r => r.sAxis > minuteNowAxis).map(r => r.sAxis))
                    : -Math.max(...todays.map(r => r.eAxis)),
        });
    }

    // En vivo: termina más pronto primero · Por abrir: abre más pronto
    // primero · Cerrados: el que cerró más tarde primero
    for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => a.sortKey - b.sortKey || a.name.localeCompare(b.name, 'es'));
    }
    return groups;
}
