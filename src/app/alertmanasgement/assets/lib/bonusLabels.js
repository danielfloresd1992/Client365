// ══════════════════════════════════════════════════════════════════════
// EL SISTEMA DE BONIFICACIÓN, EN PALABRAS
// ══════════════════════════════════════════════════════════════════════
// Es un PUERTO de api_jarvis365/src/libs/bonus/bonusLabels.lib.js, y las dos
// copias tienen que decir lo mismo.
//
// No es duplicación por descuido: las dos hacen falta y en momentos distintos.
// El servidor redacta el texto que se GUARDA dentro de la notificación —una de
// hace seis meses tiene que seguir diciendo lo que dijo—; el cliente redacta el
// que se ve MIENTRAS se edita, antes de que exista nada que guardar. Ese
// segundo texto no puede venir del servidor porque todavía no se envió nada.
//
// Si se cambia la frase en un lado, hay que cambiarla en el otro. Están
// enlazadas por este comentario a propósito, para que quien toque una encuentre
// la otra.

/**
 * La proporción como la escribe el reglamento: "3x1", "1x2".
 * Se lee "tres alertas por un bono".
 *
 * Con acumulación y valor en 1 no devuelve nada: es el caso normal y ponerle
 * etiqueta lo haría parecer una excepción.
 */
export const ratioLabel = ({ bonusWorth = 1, accumulationRequired = 1 } = {}) => {
    if (accumulationRequired === 1 && bonusWorth === 1) return '';
    return `${accumulationRequired}x${bonusWorth}`;
};

/** "X1", "X2"… el multiplicador tal como se muestra. */
export const worthLabel = (bonusWorth) => `X${Number(bonusWorth) || 1}`;


/** Resumen en una línea del sistema de bonificación de una alerta. */
export const describeBonusSystem = (bonusSystem) => {
    if (!bonusSystem?.isEnabled) return 'Sin bonificación';

    const regla = bonusSystem.defaultRule || {};
    const marcas = bonusSystem.franchiseExceptions?.length || 0;
    const locales = bonusSystem.localExceptions?.length || 0;

    const proporcion = ratioLabel(regla);
    const conProporcion = proporcion ? ` (${proporcion})` : '';

    const base = regla.bonifies
        ? `Bonifica ${worthLabel(regla.bonusWorth)}${conProporcion} en todos los establecimientos`
        : 'No bonifica por defecto';

    // El sustantivo va en la PRIMERA parte y la siguiente lo da por dicho.
    // Si viviera solo en la de franquicia, una alerta sin excepciones de marca
    // diría "con 5 de establecimiento", que es una frase cortada.
    const partes = [];

    if (marcas) {
        partes.push(`${marcas} ${marcas === 1 ? 'excepción' : 'excepciones'} de franquicia`);
    }
    if (locales) {
        partes.push(partes.length
            ? `${locales} de establecimiento`
            : `${locales} ${locales === 1 ? 'excepción' : 'excepciones'} de establecimiento`);
    }

    return partes.length ? `${base}, con ${partes.join(' y ')}` : base;
};


/**
 * Cuánto vale un bono de esta alerta en puntos, por turno.
 * "0,20 diurno · 0,30 nocturno"
 */
export const pointValueLabel = (bonusSystem) => {
    const valores = bonusSystem?.defaultRule?.pointValue || {};
    const dia = Number(valores.day ?? 0.20).toFixed(2).replace('.', ',');
    const noche = Number(valores.night ?? 0.30).toFixed(2).replace('.', ',');
    return `${dia} diurno · ${noche} nocturno`;
};


/**
 * Cómo bonifica una excepción, respecto de la regla general.
 *
 * Solo nombra lo que de verdad cambia: una excepción que únicamente aparta el
 * valor no tiene por qué repetir la acumulación.
 */
export const describeException = (excepcion, defaultRule = {}) => {
    if (excepcion?.bonifies === false) return 'No bonifica acá';

    const partes = [];

    if (excepcion?.bonusWorth !== null && excepcion?.bonusWorth !== undefined
        && excepcion.bonusWorth !== defaultRule.bonusWorth) {
        partes.push(worthLabel(excepcion.bonusWorth));
    }

    if (excepcion?.accumulationRequired !== null && excepcion?.accumulationRequired !== undefined
        && excepcion.accumulationRequired !== defaultRule.accumulationRequired) {
        partes.push(`cada ${excepcion.accumulationRequired}`);
    }

    if (!partes.length) {
        // Estar en la lista sin apartarse en nada tiene sentido cuando la regla
        // general NO bonifica: la excepción es justamente que acá sí.
        return defaultRule.bonifies === false ? 'Bonifica acá' : 'Igual que la regla general';
    }

    return partes.join(' · ');
};


/** El valor por defecto del catálogo del reglamento: X1, X2, X3, X5. */
export const MULTIPLICADORES = [
    { valor: 1, texto: 'X1 — Alerta común' },
    { valor: 2, texto: 'X2 — Alerta resaltante' },
    { valor: 3, texto: 'X3 — Alerta no común' },
    { valor: 4, texto: 'X4 — Cuatro bonos' },
    { valor: 5, texto: 'X5 — Novedad de impacto' },
    { valor: 10, texto: 'X10 — Caso excepcional' },
];


/**
 * El sistema de bonificación de una alerta nueva.
 *
 * Nace APAGADO: crear una alerta y que empiece a pagar sin que nadie lo haya
 * decidido sería lo contrario de lo que se quiere.
 */
export const bonusSystemVacio = () => ({
    isEnabled: false,
    defaultRule: {
        bonifies: true,
        bonusWorth: 1,
        accumulationRequired: 1,
        pointValue: { day: 0.20, night: 0.30 },
        thresholdParams: null,
    },
    franchiseExceptions: [],
    localExceptions: [],
    regulationCode: '',
});
