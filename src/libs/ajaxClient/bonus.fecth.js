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
 * Le asigna la regla a una alerta, o se la quita con `null`.
 *
 * Endpoint propio y no el PUT general de menú: aquél exige SUPER usuario y esto
 * lo hace un administrador. Además marca `bonusReviewed`, que es lo que separa
 * "no bonifica" de "nadie la miró todavía".
 */
export const setMenuBonusRule = async (menuId, bonusRule) => {
    const response = await axiosInstance.put(`/bonus/menu/id=${menuId}`, { bonusRule });
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
        bonusCategory: m.bonusCategory || null,
        bonusRule: m.bonusRule || null,
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
        })),
        franchises: [...porMarca.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
};
