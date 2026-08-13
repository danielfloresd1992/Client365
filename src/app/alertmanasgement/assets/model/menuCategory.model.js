import axiosStand from '@/libs/ajaxClient/axios.fetch';

/**
 * Catálogo de categorías de alerta.
 *
 * Antes las categorías estaban escritas dentro de este mismo proyecto (en
 * `category.js`), así que agregar una obligaba a tocar código y volver a
 * publicar. Ahora viven en la base y se administran desde la pantalla.
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
const getCategories = async (incluirInactivas = false) => {
    const { data } = await axiosStand.get(
        `/menu/categories${incluirInactivas ? '?includeInactive=true' : ''}`,
    );
    return data?.categories || [];
};


/** Crea una categoría. La clave se deriva de la etiqueta en español. */
const createCategory = async (body) => {
    const { data } = await axiosStand.post('/menu/categories', body);
    return data?.category;
};


/**
 * Edita etiquetas, apariencia, orden o el estado activo.
 *
 * La clave (`value`) no se manda nunca: es con lo que las alertas apuntan a su
 * categoría y el servidor la ignora aunque llegue.
 */
const updateCategory = async (id, body) => {
    const { data } = await axiosStand.put(`/menu/categories/id=${id}`, body);
    return data?.category;
};


/**
 * Borra una categoría.
 *
 * El servidor responde 409 si alguna alerta la usa; ahí hay que desactivarla en
 * lugar de borrarla. Quien llame debe leer `error.response.data.inUse`.
 */
const deleteCategory = async (id) => {
    const { data } = await axiosStand.delete(`/menu/categories/id=${id}`);
    return data;
};


export { getCategories, createCategory, updateCategory, deleteCategory };
