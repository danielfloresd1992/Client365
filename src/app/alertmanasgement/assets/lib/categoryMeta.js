import { iconOf } from './categoryIcons.js';

/**
 * Metadatos visuales de las categorías de alerta y del multiplicador de bono.
 *
 * Se comparten entre la lista (ícono del círculo, pills de filtro, encabezado de
 * cada grupo) y cualquier otra vista que necesite representar una categoría.
 *
 *
 * ANTES ERA UN MAPA FIJO
 *
 * Las categorías y sus colores estaban escritos acá. Ahora vienen de la API
 * (`GET /menu/categories`), así que se pueden crear y editar desde la pantalla
 * sin volver a publicar el front.
 *
 *
 * POR QUÉ SIGUE HABIENDO UN MAPA ESCRITO A MANO
 *
 * `RESPALDO` son las 12 categorías de siempre, y se usa mientras el catálogo no
 * haya llegado: en el primer pintado, y también si la API todavía no tiene el
 * endpoint —se despliega a mano, así que hay una ventana real en la que
 * responde 404—. Sin este respaldo, en esa ventana la lista quedaría gris y sin
 * íconos, que es peor que verse como se veía antes.
 *
 *
 * POR QUÉ EL CATÁLOGO VIVE EN UNA VARIABLE DE MÓDULO
 *
 * `metaOf(value)` se llama desde tres componentes distintos y en cada tarjeta de
 * la lista. Pasarles el catálogo por props obligaría a enhebrarlo por toda la
 * jerarquía para un dato que es el mismo para todos.
 *
 * Quien carga el catálogo (el hook `useCategories`) además lo guarda en su
 * estado, así que el repintado ocurre por la vía normal de React; esta variable
 * es solo el atajo de lectura.
 */

/** Las 12 de siempre. Solo se usan hasta que llega el catálogo real. */
const RESPALDO = {
    client:        { icon: 'users',     bg: '#dbeafe', color: '#1d4ed8', es: 'Cliente' },
    delay:         { icon: 'clock',     bg: '#fef9c3', color: '#854d0e', es: 'Demoras' },
    door:          { icon: 'door',      bg: '#f3e8ff', color: '#7e22ce', es: 'Puerta' },
    employee:      { icon: 'user-tie',  bg: '#d1fae5', color: '#065f46', es: 'Empleados' },
    failed:        { icon: 'tools',     bg: '#fee2e2', color: '#991b1b', es: 'Fallas' },
    food:          { icon: 'utensils',  bg: '#fff7ed', color: '#9a3412', es: 'Comidas' },
    incident:      { icon: 'warning',   bg: '#ffedd5', color: '#c2410c', es: 'Incidencias' },
    localIncident: { icon: 'building',  bg: '#e0f2fe', color: '#0369a1', es: 'Incidencias en el local' },
    merchandise:   { icon: 'box',       bg: '#fdf4ff', color: '#7c3aed', es: 'Mercancía' },
    protocol:      { icon: 'clipboard', bg: '#ecfdf5', color: '#047857', es: 'Protocolos' },
    trash:         { icon: 'trash',     bg: '#f1f5f9', color: '#475569', es: 'Basura' },
    perimeter:     { icon: 'shield',    bg: '#fef2f2', color: '#b91c1c', es: 'Perimetral' },
};

/** Se usa cuando la categoría no está ni en el catálogo ni en el respaldo. */
const CATEGORY_FALLBACK = { Icon: iconOf('bell'), bg: '#f3f4f6', color: '#374151', text: '' };

/** El catálogo vigente, por clave. Arranca con el respaldo. */
let catalogo = new Map(Object.entries(RESPALDO));


/**
 * Reemplaza el catálogo con lo que devolvió la API.
 *
 * Lo llama el hook `useCategories` al terminar de cargar. Si la lista viene
 * vacía no se toca nada: una respuesta vacía significa que el catálogo aún no
 * se sembró, y dejar la pantalla sin ningún ícono sería perder información.
 */
const setCategoryCatalog = (categorias) => {
    if (!Array.isArray(categorias) || categorias.length === 0) return;
    catalogo = new Map(categorias.map(c => [c.value, c]));
};


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


export { RESPALDO, CATEGORY_FALLBACK, metaOf, setCategoryCatalog };
