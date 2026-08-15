import axiosStand from '@/libs/ajaxClient/axios.fetch';

/**
 * Catálogo de categorías de BONIFICACIÓN.
 *
 * No confundir con la categoría operativa de la alerta ('delay', 'food'…): ésa
 * es una lista fija que vive en `categoryMeta.js` y no se administra, porque
 * reportes365 y Jarvis-express365 la leen con nombres escritos a mano.
 *
 * Ésta sí se crea y se edita desde la pantalla: la bonificación se calcula
 * puertas adentro y no la consume ningún sistema externo.
 *
 * A diferencia del resto de este módulo, que trabaja con callbacks, acá se
 * devuelven promesas: la pantalla de gestión encadena varias operaciones
 * seguidas (guardar y recargar) y con promesas se lee derecho.
 */

/**
 * Trae el catálogo.
 *
 * @param incluirInactivas - true para la pantalla de gestión (necesita ver las
 *                           desactivadas para poder reactivarlas). El selector
 *                           de alertas las pide sin esto: ofrecer una categoría
 *                           dada de baja es justo lo que se quería evitar.
 */
const getBonusCategories = async (incluirInactivas = false) => {
    const { data } = await axiosStand.get(
        `/menu/bonus-categories${incluirInactivas ? '?includeInactive=true' : ''}`,
    );
    return data?.categories || [];
};


/** Crea una categoría. La clave se deriva de la etiqueta en español. */
const createBonusCategory = async (body) => {
    const { data } = await axiosStand.post('/menu/bonus-categories', body);
    return data?.category;
};


/**
 * Edita etiquetas, apariencia, orden o el estado activo.
 *
 * La clave (`value`) no se manda nunca: es con lo que las alertas apuntan a su
 * categoría y el servidor la ignora aunque llegue.
 */
const updateBonusCategory = async (id, body) => {
    const { data } = await axiosStand.put(`/menu/bonus-categories/id=${id}`, body);
    return data?.category;
};


/**
 * Borra una categoría.
 *
 * El servidor responde 409 si alguna alerta la usa; ahí hay que desactivarla en
 * lugar de borrarla. Quien llame debe leer `error.response.data.inUse`.
 */
const deleteBonusCategory = async (id) => {
    const { data } = await axiosStand.delete(`/menu/bonus-categories/id=${id}`);
    return data;
};


export { getBonusCategories, createBonusCategory, updateBonusCategory, deleteBonusCategory };
