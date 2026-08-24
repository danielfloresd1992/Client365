/**
 * EFECTIVIDAD DE MONITOREO DE UN ESTABLECIMIENTO.
 *
 * Cruza dos cosas que el sistema ya tiene por separado:
 *
 *   su HORARIO      cuántas horas de monitoreo tiene programadas por semana
 *                   (schedule.model: rangos por día, 0=Dom … 6=Sáb)
 *   sus CAÍDAS      los episodios sin cámaras del período (dvr-failure)
 *
 * y responde: de las horas que DEBÍA estar monitoreado, ¿cuántas perdió por
 * fallas de conexión?
 *
 *
 * LA CUENTA QUE IMPORTA ES LA INTERSECCIÓN, no el tiempo caído total.
 * `downtimeMinutes` mide reloj corrido: un local que se cae a las 23:00 y
 * vuelve a las 08:00 estuvo nueve horas ciego, pero si su monitoreo era de
 * 12:00 a 23:00 no perdió NI UNA hora de monitoreo. Comparar el total contra
 * lo programado daría efectividades negativas y culparía a la madrugada.
 *
 *
 * ES UNA ESTIMACIÓN, Y LO DICE. El horario que se usa es el VIGENTE, aplicado
 * hacia atrás a todo el período: si el horario cambió hace tres meses, los
 * meses anteriores se miden con el de hoy. Para una lectura básica de
 * efectividad alcanza; para auditar un período viejo, no.
 *
 * Todo puro: fechas y aritmética. Sin red y sin estado.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
const MINUTO_MS = 60_000;


/** 'HH:mm' (o 'HH:mm:ss') → minutos del día, o null si no se puede leer. */
export const aMinutos = (hhmm) => {
    const [h, m] = String(hhmm ?? '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};


/**
 * Las ventanas de monitoreo por día de la semana.
 *
 * @param {object}  schedule  el documento de schedule.model del local
 * @param {boolean} isWinter  si rige el horario de invierno
 * @returns {Map<number, {ini: number, fin: number}[]>}
 *          día (0=Dom … 6=Sáb) → ventanas en minutos del día. Un rango que
 *          cruza la medianoche (end <= start) termina PASADAS las 24:00 —
 *          `fin` > 1440 — y sigue perteneciendo al día en que empezó, igual
 *          que en el resto del sistema.
 */
export const ventanasPorDia = (schedule, isWinter = false) => {
    const usaInvierno = Boolean(isWinter && schedule?.usesUsTimezone && schedule?.dayMonitoringWinter?.length);
    const rangos = (usaInvierno ? schedule.dayMonitoringWinter : schedule?.dayMonitoring) ?? [];

    const mapa = new Map();

    for (const rango of rangos) {
        const dia = Number(rango?.dayMonitoring);
        const ini = aMinutos(rango?.hours?.start);
        let fin = aMinutos(rango?.hours?.end);

        if (!Number.isFinite(dia) || ini === null || fin === null) continue;
        if (fin <= ini) fin += 1440;

        if (!mapa.has(dia)) mapa.set(dia, []);
        mapa.get(dia).push({ ini, fin });
    }

    return mapa;
};


/** Cuántos minutos de monitoreo hay programados en una semana. */
export const minutosSemanales = (ventanas) => {
    let total = 0;
    for (const rangos of ventanas.values()) {
        for (const r of rangos) total += r.fin - r.ini;
    }
    return total;
};


/**
 * Minutos sin cámaras DENTRO de las ventanas de monitoreo.
 *
 * Recorre cada episodio contra cada día que toca. El cursor arranca UN DÍA
 * ANTES del episodio a propósito: una ventana que cruza la medianoche
 * —miércoles 23:00 → 07:00— vive en el miércoles pero alcanza la madrugada
 * del jueves, y un episodio del jueves a las 02:00 la pisa.
 *
 * @param {Array}  episodios  [{ failedAt, restoredAt, active }]
 * @param {Map}    ventanas   lo que devuelve `ventanasPorDia`
 * @param {Date}   [ahora]    hasta dónde cuenta un episodio aún abierto
 */
export const minutosPerdidosEnVentana = (episodios = [], ventanas, ahora = new Date()) => {
    if (!ventanas || ventanas.size === 0) return 0;

    let totalMs = 0;

    for (const ep of episodios) {
        const t0 = new Date(ep.failedAt).getTime();
        const t1 = ep.restoredAt ? new Date(ep.restoredAt).getTime() : ahora.getTime();
        if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) continue;

        // Medianoche del día anterior al comienzo del episodio.
        const arranque = new Date(t0);
        arranque.setHours(0, 0, 0, 0);
        let cursor = arranque.getTime() - DIA_MS;

        while (cursor < t1) {
            const rangos = ventanas.get(new Date(cursor).getDay()) ?? [];

            for (const r of rangos) {
                const vIni = cursor + r.ini * MINUTO_MS;
                const vFin = cursor + r.fin * MINUTO_MS;

                const solape = Math.min(t1, vFin) - Math.max(t0, vIni);
                if (solape > 0) totalMs += solape;
            }

            cursor += DIA_MS;
        }
    }

    return Math.round(totalMs / MINUTO_MS);
};


/**
 * La estadística completa de un local en un período.
 *
 * @param {object}  args
 * @param {Array}   args.episodios  sus caídas del período
 * @param {object}  args.schedule   su documento de horario, o null
 * @param {boolean} args.isWinter
 * @param {number}  args.dias       cuántos días cubre el período
 * @param {Date}    [args.ahora]
 *
 * @returns {{
 *   sinHorario: boolean,
 *   programados: number,        minutos de monitoreo del período (estimados)
 *   perdidosEnVentana: number,  minutos sin cámaras DENTRO del horario
 *   perdidosTotales: number,    minutos sin cámaras de reloj corrido
 *   episodios: number,
 *   efectividad: number|null,   0..1, o null si no hay horario
 * }}
 */
export const efectividadDe = ({ episodios = [], schedule, isWinter = false, dias = 0, ahora = new Date() }) => {
    const ventanas = schedule ? ventanasPorDia(schedule, isWinter) : new Map();
    const semanales = minutosSemanales(ventanas);

    const perdidosTotales = episodios.reduce((suma, ep) => {
        if (typeof ep.downtimeMinutes === 'number') return suma + ep.downtimeMinutes;
        const t0 = new Date(ep.failedAt).getTime();
        if (!Number.isFinite(t0)) return suma;
        return suma + Math.max(0, Math.round((ahora.getTime() - t0) / MINUTO_MS));
    }, 0);

    if (semanales === 0) {
        return {
            sinHorario: true,
            programados: 0,
            perdidosEnVentana: 0,
            perdidosTotales,
            episodios: episodios.length,
            efectividad: null,
        };
    }

    const programados = Math.round((semanales * dias) / 7);
    const perdidosEnVentana = minutosPerdidosEnVentana(episodios, ventanas, ahora);

    return {
        sinHorario: false,
        programados,
        // Acotado a lo programado: la estimación semanal puede quedar corta en
        // un período con horario cambiado, y una pérdida mayor que el total
        // daría una efectividad negativa que no significa nada.
        perdidosEnVentana: Math.min(perdidosEnVentana, programados),
        perdidosTotales,
        episodios: episodios.length,
        efectividad: Math.max(0, 1 - perdidosEnVentana / programados),
    };
};

export default efectividadDe;
