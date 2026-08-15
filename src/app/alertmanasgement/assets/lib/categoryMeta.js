import { iconOf } from './categoryIcons.js';
import { CATEGORIAS_OPERATIVAS, listaDeCategorias } from '@/libs/alerts/categories.js';

/**
 * Las categorías OPERATIVAS de una alerta y sus metadatos visuales.
 *
 * Se comparten entre la lista (ícono del círculo, pills de filtro, encabezado de
 * cada grupo) y cualquier otra vista que necesite representar una categoría.
 *
 *
 * ES UNA LISTA FIJA, Y ES A PROPÓSITO
 *
 * Durante un tiempo estas categorías se administraron desde la pantalla y se
 * guardaban en la base. Se volvió atrás porque rompía la compatibilidad con dos
 * sistemas que leen `Menu.category` con nombres escritos a mano y que se
 * despliegan por separado: reportes365 agrupa por esa cadena las páginas del
 * reporte, y Jarvis-express365 la tiene en sus JSON.
 *
 * Una categoría creada acá sería una que ninguno de los dos entiende, y el
 * síntoma no sería un error visible: la alerta no aparecería donde corresponde.
 *
 * Lo que SÍ se administra es la categoría de bonificación
 * (`Menu.bonusCategory`), que se calcula puertas adentro. Vive en el catálogo
 * del servidor y se gestiona con `useBonusCategories`.
 *
 *
 * POR QUÉ EL MAPA VIVE EN UNA VARIABLE DE MÓDULO
 *
 * `metaOf(value)` se llama desde cuatro componentes distintos y en cada tarjeta
 * de la lista. Pasarlo por props obligaría a enhebrarlo por toda la jerarquía
 * para un dato que es el mismo para todos y que además nunca cambia.
 */

/** Se usa cuando la categoría guardada no está en la lista. */
const CATEGORY_FALLBACK = { Icon: iconOf('bell'), bg: '#f3f4f6', color: '#374151', text: '' };

/** El catálogo, por clave. Es fijo: no hay nada que reemplazar en tiempo de
 *  ejecución. */
const catalogo = new Map(Object.entries(CATEGORIAS_OPERATIVAS));


/**
 * Devuelve siempre metadatos pintables: ícono, colores y etiqueta.
 *
 * Nunca devuelve undefined. Una alerta guardada con una categoría que ya no
 * existe —se borró, o se escribió a mano en su momento— se sigue viendo, con la
 * apariencia genérica.
 */
const metaOf = (category) => {
    const c = catalogo.get(category);
    if (!c) return CATEGORY_FALLBACK;

    return {
        Icon:  iconOf(c.icon),
        bg:    c.bg || CATEGORY_FALLBACK.bg,
        color: c.color || CATEGORY_FALLBACK.color,
        text:  c.es || category,
    };
};


export { CATEGORIAS_OPERATIVAS, CATEGORY_FALLBACK, metaOf, listaDeCategorias };
