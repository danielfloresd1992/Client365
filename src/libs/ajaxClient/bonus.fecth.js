import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/**
 * LAS DOS VARIABLES GLOBALES DEL SISTEMA DE BONIFICACIÓN.
 *
 *   pointValue    cuánto vale UN bono, en dólares
 *   exchangeRate  la tasa del BCV con la que se paga en bolívares
 *
 * Son globales, no por alerta: el reglamento las fija de forma general. Lo que
 * varía por alerta es la CANTIDAD de bonos que otorga, y eso vive en el
 * catálogo de alertas, cuando se rehaga.
 */


/**
 * Los valores vigentes. Los puede leer cualquiera con sesión.
 * @returns {{ pointValue, exchangeRate, updatedAt, updatedBy, configured }}
 *          `configured` en false = nunca se guardaron y vienen los de defecto.
 */
export const getBonusSettings = async () => {
    const response = await axiosInstance.get('/bonus/settings');
    return response.data;
};


/**
 * Cambia una o las dos. Solo administradores — el servidor responde 403 al resto.
 *
 * Acepta cambios parciales: mandar solo la tasa deja el valor del bono como
 * estaba, que es lo habitual porque la tasa cambia mucho más seguido.
 *
 * No recalcula nada hacia atrás: las novedades ya selladas conservan el valor
 * con el que se sellaron.
 *
 * @param {{ pointValue?: number, exchangeRate?: number }} cambios
 */
export const putBonusSettings = async (cambios) => {
    const response = await axiosInstance.put('/bonus/settings', cambios);
    return response.data;
};


/** El historial de cambios, del más reciente al más viejo. Solo admin. */
export const getBonusSettingsHistory = async () => {
    const response = await axiosInstance.get('/bonus/settings/history');
    return response.data;
};


// ══════════════════════════════════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════════════════════════════════
// Con qué criterio se agrupan las REGLAS en los cortes.
//
// Vivían en /menu/bonus-categories y categorizaban la alerta. Se mudaron acá con
// el resto del sistema: ahora categorizan la regla, que es donde el criterio de
// bonificación ya estaba definido.


/**
 * El catálogo.
 *
 * @param incluirInactivas - true para la pantalla de gestión, que necesita ver
 *                           las desactivadas para poder reactivarlas. El
 *                           selector las pide sin esto: ofrecer una categoría
 *                           dada de baja es justo lo que se quería evitar.
 */
export const getBonusCategories = async (incluirInactivas = false) => {
    const { data } = await axiosInstance.get(
        `/bonus/categories${incluirInactivas ? '?includeInactive=true' : ''}`,
    );
    return data?.categories || [];
};


/** Crea una categoría. La clave la deriva el servidor del nombre en español. */
export const createBonusCategory = async (body) => {
    const { data } = await axiosInstance.post('/bonus/categories', body);
    return data?.category;
};


/**
 * Edita etiquetas, apariencia, orden o el estado activo.
 *
 * La clave (`value`) no se manda nunca y el servidor no la acepta: es con lo que
 * las reglas apuntan a su categoría, y cambiarla las dejaría agrupando por algo
 * que no existe.
 */
export const updateBonusCategory = async (id, body) => {
    const { data } = await axiosInstance.put(`/bonus/categories/id=${id}`, body);
    return data?.category;
};


/**
 * Borra una categoría.
 *
 * El servidor responde 409 si alguna regla la usa; ahí hay que desactivarla en
 * lugar de borrarla. Quien llame debe leer `error.response.data.inUse`.
 */
export const deleteBonusCategory = async (id) => {
    const { data } = await axiosInstance.delete(`/bonus/categories/id=${id}`);
    return data;
};


// ══════════════════════════════════════════════════════════════════════
// REGLAS
// ══════════════════════════════════════════════════════════════════════
// Cuántos bonos otorga una alerta, dónde y cuántas hacen falta. Muchas alertas
// comparten la misma regla: el reglamento repite las mismas condiciones una y
// otra vez, así que se define una vez y se reutiliza.


/**
 * Todas las reglas, activas e inactivas.
 *
 * Cada una trae `inUse`: cuántas alertas la usan. Es lo que permite avisar
 * antes de borrar y responder "¿a cuántas les cambio el valor si toco ésta?".
 */
export const getBonusRules = async () => {
    const response = await axiosInstance.get('/bonus/rules');
    return response.data?.rules || [];
};


/** Crea una regla. Solo admin. */
export const createBonusRule = async (body) => {
    const response = await axiosInstance.post('/bonus/rules', body);
    return response.data?.rule;
};


/**
 * Edita una regla. Solo admin.
 *
 * Cambia lo que se pagará de acá en adelante en TODAS sus alertas. Lo ya
 * sellado no se toca: cada novedad guarda su propia copia.
 */
export const updateBonusRule = async (id, body) => {
    const response = await axiosInstance.put(`/bonus/rules/id=${id}`, body);
    return response.data?.rule;
};


/**
 * Borra una regla.
 *
 * El servidor responde 409 si alguna alerta la usa; ahí hay que desactivarla en
 * lugar de borrarla. Quien llame debe leer `error.response.data.inUse`.
 */
export const deleteBonusRule = async (id) => {
    const response = await axiosInstance.delete(`/bonus/rules/id=${id}`);
    return response.data;
};


/**
 * Escribe las asignaciones de una alerta: la lista COMPLETA de {regla, alcance}.
 *
 * Es una lista porque la misma alerta puede ir con reglas distintas según el
 * establecimiento. Y es la lista completa y no un delta para que el servidor
 * pueda validar el conjunto —dos asignaciones generales serían ambiguas—.
 * Lista vacía es válida: "esta alerta no bonifica".
 *
 * Endpoint propio y no el PUT general de menú: aquél exige SUPER usuario y esto
 * lo hace un administrador. Además marca `bonusReviewed`, que es lo que separa
 * "no bonifica" de "nadie la miró todavía".
 *
 * @param {Array<{ rule: string, scope: { mode, franchises, locals } }>} bonusRules
 */
export const setMenuBonusRules = async (menuId, bonusRules) => {
    const response = await axiosInstance.put(`/bonus/menu/id=${menuId}`, { bonusRules });
    return response.data?.menu;
};


/**
 * El catálogo de alertas, con lo justo para administrar su bonificación.
 *
 * Se pide acá y no al modelo de /alertmanasgement para no acoplar esta pantalla
 * a la de otra ruta, y porque de la alerta completa solo hacen falta seis
 * campos.
 */
export const getMenusForBonus = async () => {
    const response = await axiosInstance.get('/menu');
    const lista = Array.isArray(response.data) ? response.data : (response.data?.menu || []);

    return lista.map(m => ({
        _id: m._id,
        es: m.es,
        en: m.en,
        category: m.category || null,
        // Las asignaciones, con la regla como ID (sin popular): la pantalla las
        // cruza con la lista de reglas que ya tiene, y así el catálogo de
        // alertas no arrastra copias de cada regla.
        bonusRules: (m.bonusRules || []).map(a => ({
            rule: String(a.rule?._id ?? a.rule),
            scope: {
                mode: a.scope?.mode || 'all',
                franchises: (a.scope?.franchises || []).map(String),
                locals: (a.scope?.locals || []).map(String),
            },
        })),
        bonusReviewed: m.bonusReviewed === true,
    }));
};


/**
 * Los establecimientos con su marca, para elegir el alcance de una regla.
 *
 * Una sola consulta da las dos listas: los locales vienen del endpoint y las
 * franquicias se deducen de ellos. Pedirlas por separado sería una llamada más
 * para un dato que ya viene en ésta.
 */
export const getScopeOptions = async () => {
    const response = await axiosInstance.get('/localLigth?populate=franchiseReference.franchise');
    const locales = Array.isArray(response.data) ? response.data : [];

    const porMarca = new Map();
    locales.forEach(l => {
        const marca = l?.franchiseReference?.franchise;
        if (marca?._id && !porMarca.has(String(marca._id))) {
            porMarca.set(String(marca._id), { _id: marca._id, name: marca.name || marca.es || 'Sin nombre' });
        }
    });

    return {
        locals: locales.map(l => ({
            _id: l._id,
            name: l.name || l.es || 'Sin nombre',
            franchise: l?.franchiseReference?.franchise?._id || null,
            // Cómo se monitorea: 'perimeter', 'analytical' o las dos. Es lo que
            // separa los perimetrales de los analíticos en el selector de alcance.
            typeMonitoring: l.typeMonitoring || null,
        })),
        franchises: [...porMarca.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
};
