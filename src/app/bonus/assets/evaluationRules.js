/**
 * LAS REGLAS DE LA EVALUACIÓN DE MONITOREO.
 *
 * Traducidas tal cual de la hoja de cálculo, de la columna «Estatus» de
 * «Carga de evaluaciones»:
 *
 *     =IFS(
 *       AB3="",                            "",
 *       COUNTIF(D3,"*planificacion*")>0,   "N/A",
 *       ISTEXT(D3),                        "Reprobado",
 *       VLOOKUP(C3, Origen!D:E, 2)=TRUE,   IF(D3>=0.7,  "Aprobado","Reprobado"),
 *       AB3=1,                             IF(D3>=0.9,  "Aprobado","Reprobado"),
 *       AB3>=2,                            IF(D3>=0.75, "Aprobado","Reprobado"),
 *       TRUE,                              "Error")
 *
 * donde `AC3 = COUNTIF($C$3:$C1000, operador)` — cuántos locales cubre esa
 * persona en ese turno.
 *
 *
 * LO QUE ESTO SIGNIFICA, Y NO SE VE MIRANDO LA HOJA
 *
 * El umbral NO es una propiedad de la persona: SE DEDUCE de cuántos locales
 * cubrió ese turno. Quien cubre uno solo se le exige 90%; quien cubre dos o
 * más, 75%. La única marca que sí vive en la persona es «¿Entrenamiento?»,
 * en `Origen!D:E`, que baja la exigencia a 70%.
 *
 * Por eso los nombres que usa la hoja de Auditoría —EXPERTO, DOS LOCALES,
 * ENTRENAMIENTO— son etiquetas de una situación, no cargos. Un mismo operador
 * es «experto» un martes y «dos locales» un miércoles.
 *
 *
 * Y ES TODO O NADA. El porcentaje no escala el bono: lo habilita o lo anula
 * entero, y por turno separado. Un operador con 220 alertas en el diurno cobra
 * cero si su evaluación de ese turno quedó un punto abajo del umbral.
 */

export const TURNOS = [
    { key: 'day', label: 'Diurno' },
    { key: 'night', label: 'Nocturno' },
];

/** Los tres umbrales, con el nombre que les da la hoja de Auditoría. */
export const UMBRALES = {
    ENTRENAMIENTO: { minimo: 0.70, etiqueta: 'Entrenamiento' },
    DOS_LOCALES: { minimo: 0.75, etiqueta: 'Dos locales' },
    EXPERTO: { minimo: 0.90, etiqueta: 'Experto' },
};

export const ESTATUS = {
    APROBADO: 'aprobado',
    REPROBADO: 'reprobado',
    NO_APLICA: 'n/a',
    SIN_CARGAR: 'sin-cargar',
};


/**
 * Qué se le exige a un operador en un turno.
 *
 * @param {number}  localesCubiertos  cuántos locales tiene ese turno
 * @param {boolean} enEntrenamiento   la marca de `Origen!D:E`
 */
export const umbralDe = (localesCubiertos, enEntrenamiento = false) => {
    if (enEntrenamiento) return UMBRALES.ENTRENAMIENTO;
    return localesCubiertos >= 2 ? UMBRALES.DOS_LOCALES : UMBRALES.EXPERTO;
};


/**
 * El estatus de UNA evaluación.
 *
 * `valor` es lo que se escribió en «Porcentaje / Observación», y puede ser las
 * dos cosas: un número —el porcentaje— o un texto —una observación—. La hoja
 * distingue un solo caso especial de texto: si dice «planificación», la fila
 * no cuenta; cualquier otra observación reprueba.
 *
 * @param {number|string|null} valor
 * @param {number}  localesCubiertos
 * @param {boolean} enEntrenamiento
 */
export const estatusDe = (valor, localesCubiertos, enEntrenamiento = false) => {
    if (valor === null || valor === undefined || String(valor).trim() === '') {
        return { estatus: ESTATUS.SIN_CARGAR, umbral: null };
    }

    const umbral = umbralDe(localesCubiertos, enEntrenamiento);

    if (esObservacion(valor)) {
        return {
            estatus: /planificaci[oó]n/i.test(String(valor)) ? ESTATUS.NO_APLICA : ESTATUS.REPROBADO,
            umbral,
        };
    }

    const puntaje = comoPorcentaje(valor);
    return {
        estatus: puntaje >= umbral.minimo ? ESTATUS.APROBADO : ESTATUS.REPROBADO,
        umbral,
        puntaje,
    };
};


/** ¿Lo escrito es una observación y no un número? */
export const esObservacion = (valor) => {
    if (typeof valor === 'number') return false;
    const texto = String(valor ?? '').trim();
    if (!texto) return false;
    return !Number.isFinite(Number(texto.replace(',', '.').replace('%', '')));
};

/**
 * El porcentaje como fracción. Acepta las dos formas de escribirlo —`0,9` y
 * `90`— porque quien viene de la hoja escribe una y quien ve un porcentaje en
 * pantalla escribe la otra.
 */
export const comoPorcentaje = (valor) => {
    const n = Number(String(valor).replace(',', '.').replace('%', ''));
    if (!Number.isFinite(n)) return null;
    return n > 1 ? n / 100 : n;
};

/** Para mostrar: 0.9 → «90%». */
export const formatearPorcentaje = (fraccion) =>
    (fraccion === null || fraccion === undefined ? '—' : `${Math.round(fraccion * 100)}%`);


/**
 * Cuántos locales cubre cada operador en una lista de evaluaciones.
 *
 * Es el `COUNTIF` de la hoja, y es lo que decide el umbral de cada uno. Se
 * calcula sobre TODAS las filas del turno, no sobre las cargadas: alguien que
 * tiene dos locales asignados pero solo uno evaluado sigue siendo «dos
 * locales».
 *
 * @param {{ operador?: { _id: string } | null }[]} filas
 * @returns {Map<string, number>}
 */
export const contarLocalesPorOperador = (filas = []) => {
    const cuenta = new Map();
    for (const fila of filas) {
        const id = fila?.operador?._id;
        if (!id) continue;
        cuenta.set(String(id), (cuenta.get(String(id)) || 0) + 1);
    }
    return cuenta;
};
