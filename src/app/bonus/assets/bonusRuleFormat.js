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
 * Una regla vacía, la que abre el formulario al crear.
 *
 * Puede nacer con categoría: el «+ Regla» de una baldosa vacía ya la eligió —se
 * tocó el botón que está ADENTRO de esa categoría—, y abrir en blanco obligaría
 * a volver a elegir a mano lo que se acaba de decir. Sin argumento sigue siendo
 * la de siempre, la del botón de la barra, que no está adentro de ninguna.
 */
export const reglaNueva = (bonusCategory = null) => ({
    name: '',
    description: '',
    regulationCode: '',
    alertsRequired: 1,
    bonusAwarded: { day: 1, night: 1 },
    bonusCategory,
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
    bonusCategory: regla.bonusCategory || null,
    alertsRequired: regla.alertsRequired ?? 1,
    bonusAwarded: {
        day: regla.bonusAwarded?.day ?? 1,
        night: regla.bonusAwarded?.night ?? 1,
    },
    overrides: (regla.overrides || []).map(o => ({
        franchise: o.franchise || null,
        local: o.local || null,
        alertsRequired: o.alertsRequired ?? 1,
        bonusAwarded: { day: o.bonusAwarded?.day ?? 1, night: o.bonusAwarded?.night ?? 1 },
        note: o.note || '',
    })),
});


/**
 * Los nombres que un alcance enumera, ya resueltos contra el catálogo.
 *
 * Un alcance guarda ids; para mostrarlo hay que ir a buscar los nombres, y eso
 * lo necesitan tanto la caja del mapa como los mensajes que hablan de ella. Un
 * id sin nombre sale como «…»: significa que el establecimiento se dio de baja
 * después de asignarlo, y decirlo es mejor que mostrar un ObjectId.
 */
export const nombresDelAlcance = (scope, catalogo) => {
    const nombre = (lista, id) => (lista || []).find(x => String(x._id) === String(id))?.name || '…';
    return [
        ...(scope?.franchises || []).map(id => nombre(catalogo?.franchises, id)),
        ...(scope?.locals || []).map(id => nombre(catalogo?.locals, id)),
    ];
};


/** El alcance dicho como una frase, para meterlo en medio de un texto. */
export const describirAlcance = (scope, catalogo) => {
    const modo = scope?.mode || 'all';
    if (modo === 'all') return 'todos los establecimientos';

    const nombres = nombresDelAlcance(scope, catalogo);
    if (!nombres.length) return modo === 'only' ? 'ningún establecimiento' : 'todos los establecimientos';

    return `${modo === 'only' ? 'solo' : 'todos menos'} ${nombres.join(', ')}`;
};
