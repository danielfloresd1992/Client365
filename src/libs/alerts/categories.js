/**
 * LAS CATEGORÍAS OPERATIVAS DE UNA ALERTA. Lista FIJA y fuente de verdad.
 *
 * Vive en `libs` y no dentro de una pantalla porque la usan varias: el
 * formulario y la lista de /alertmanasgement, y los filtros de /dashboard.
 *
 *
 * POR QUÉ ES FIJA
 *
 * Durante un tiempo estas categorías se administraron desde la pantalla y se
 * guardaban en la base. Se volvió atrás porque rompía la compatibilidad con dos
 * sistemas que leen `Menu.category` con nombres escritos a mano y que se
 * despliegan por separado:
 *
 *   · reportes365 agrupa por esa cadena las páginas del reporte, y trata
 *     'delay' de forma especial según el nombre de la alerta.
 *   · Jarvis-express365 la tiene hardcodeada en sus JSON ('delay', 'door').
 *
 * Una categoría creada acá sería una que ninguno de los dos entiende, y el
 * síntoma no sería un error visible: la alerta simplemente no aparecería donde
 * corresponde.
 *
 * Lo que SÍ se administra es la categoría de BONIFICACIÓN
 * (`BonusRule.bonusCategory`), que se calcula puertas adentro y no la consume ningún
 * sistema externo. Ésa vive en el servidor.
 */

/** Clave → etiqueta y apariencia. El orden es el que se muestra. */
export const CATEGORIAS_OPERATIVAS = {
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


/**
 * Las mismas categorías en forma de lista, para selectores y filtros.
 *
 * Salen en el orden en que están escritas arriba, que es el alfabético por
 * etiqueta y el que las pantallas venían mostrando.
 */
export const listaDeCategorias = () => Object.entries(CATEGORIAS_OPERATIVAS)
    .map(([value, meta]) => ({ value, es: meta.es }));
