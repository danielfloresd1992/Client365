/**
 * Cómo se leen las reglas en pantalla.
 *
 * Son funciones puras y viven aparte porque las usan los dos paneles: el que
 * asigna reglas a las alertas y el que las edita. Sin esto, "4x1" se formatearía
 * distinto en cada lado y nadie sabría si son la misma cosa.
 */

/** Turnos, con los mismos nombres que usa el servidor. */
export const TURNOS = [
    { key: 'day', label: 'Diurno' },
    { key: 'night', label: 'Nocturno' },
];


/**
 * Cuánto vale UNA alerta de esta regla, en el turno dado.
 *
 * Es el número que se congela en cada novedad y el que se suma al corte. Una
 * regla de 4 alertas por bono deja 0,25 en cada una: seis alertas suman 1,5 y
 * las que sobran del grupo NO se pierden.
 */
export const bonusPerAlert = (regla, turno = 'day') => {
    const requeridas = Math.max(1, Number(regla?.alertsRequired) || 1);
    const otorga = Number(regla?.bonusAwarded?.[turno]);
    return (Number.isFinite(otorga) ? otorga : 0) / requeridas;
};


/** Un número de bonos como se lee acá: coma decimal y sin ceros de relleno. */
export const formatBonus = (n) => {
    const numero = Number(n);
    if (!Number.isFinite(numero)) return '—';
    return numero.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};


/**
 * La regla en palabras, como la escribe el reglamento.
 *
 * Se dice con las dos formas —"4 alertas = 1 bono" y "cada una 0,25"— porque el
 * reglamento habla en la primera y el corte cuenta con la segunda; mostrar solo
 * una obliga a traducir de memoria.
 */
export const formulaLabel = (regla, turno = 'day') => {
    const requeridas = Math.max(1, Number(regla?.alertsRequired) || 1);
    const otorga = Number(regla?.bonusAwarded?.[turno]) || 0;

    if (requeridas === 1) {
        return `1 alerta = ${formatBonus(otorga)} bono${otorga === 1 ? '' : 's'}`;
    }
    return `${requeridas} alertas = ${formatBonus(otorga)} bono${otorga === 1 ? '' : 's'}`;
};


/** ¿Los dos turnos pagan lo mismo? Decide si hace falta mostrarlos separados. */
export const mismoEnAmbosTurnos = (regla) =>
    Number(regla?.bonusAwarded?.day) === Number(regla?.bonusAwarded?.night);


/**
 * Dónde aplica la regla, en una línea.
 *
 * @param catalogo { franchises, locals } para poder nombrarlos en vez de
 *                 mostrar ObjectIds, que no le dicen nada a nadie.
 */
export const scopeLabel = (regla, catalogo = { franchises: [], locals: [] }) => {
    const alcance = regla?.scope;
    if (!alcance || alcance.mode === 'all') return 'En todos los establecimientos';

    const nombre = (lista, id) => lista.find(x => String(x._id) === String(id))?.name;

    const nombres = [
        ...(alcance.franchises || []).map(id => nombre(catalogo.franchises, id)),
        ...(alcance.locals || []).map(id => nombre(catalogo.locals, id)),
    ].filter(Boolean);

    if (nombres.length === 0) return alcance.mode === 'only' ? 'Sin alcance definido' : 'En todos los establecimientos';

    const prefijo = alcance.mode === 'only' ? 'Solo' : 'Todos menos';
    // Más de tres nombres no entran en una línea y dejan de ser legibles.
    const texto = nombres.length > 3
        ? `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`
        : nombres.join(', ');

    return `${prefijo} ${texto}`;
};


/** Una regla vacía, la que abre el formulario al crear. */
export const reglaNueva = () => ({
    name: '',
    description: '',
    regulationCode: '',
    alertsRequired: 1,
    bonusAwarded: { day: 1, night: 1 },
    scope: { mode: 'all', franchises: [], locals: [] },
    overrides: [],
    active: true,
});


/**
 * Una regla del servidor, lista para el formulario.
 *
 * Las viejas pueden no traer `scope` ni `overrides` —se agregaron después— y un
 * campo del formulario no puede arrancar en `undefined` sin volverse no
 * controlado a mitad de camino.
 */
export const reglaParaFormulario = (regla) => ({
    ...regla,
    description: regla.description || '',
    regulationCode: regla.regulationCode || '',
    alertsRequired: regla.alertsRequired ?? 1,
    bonusAwarded: {
        day: regla.bonusAwarded?.day ?? 1,
        night: regla.bonusAwarded?.night ?? 1,
    },
    scope: {
        mode: regla.scope?.mode || 'all',
        franchises: regla.scope?.franchises || [],
        locals: regla.scope?.locals || [],
    },
    overrides: (regla.overrides || []).map(o => ({
        franchise: o.franchise || null,
        local: o.local || null,
        alertsRequired: o.alertsRequired ?? 1,
        bonusAwarded: { day: o.bonusAwarded?.day ?? 1, night: o.bonusAwarded?.night ?? 1 },
        note: o.note || '',
    })),
});
