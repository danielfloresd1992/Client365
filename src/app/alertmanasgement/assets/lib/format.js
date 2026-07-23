/**
 * Helpers de formato/presentación compartidos por la lista y el formulario
 * de /alertmanasgement. Son funciones puras, sin dependencias de React.
 */

/** Iniciales de una persona ({ name, surName }) para el avatar de respaldo. */
const initials = person =>
    ((person?.name?.[0] ?? '') + (person?.surName?.[0] ?? '')).toUpperCase() || '?';

/**
 * URL de miniatura de la foto de usuario.
 * `img` ya es una URL completa; el backend de imágenes acepta `?w=<ancho>`.
 */
const photoUrl = img => (img ? `${img}${img.includes('?') ? '&' : '?'}w=48` : null);

/** Normaliza texto para búsquedas: minúsculas y sin acentos. */
const norm = text =>
    (text ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Genera un id estable a partir del label de una sección del formulario.
 * Lo usan tanto `SectionHeader` (para el ancla) como la barra de navegación,
 * por lo que ambos deben derivarlo SIEMPRE del mismo label.
 */
const slug = label =>
    'sec-' + (label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export { initials, photoUrl, norm, slug };
