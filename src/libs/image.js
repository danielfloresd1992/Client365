// ══════════════════════════════════════════════════════════════════════
// IMÁGENES
// ══════════════════════════════════════════════════════════════════════
// Helpers de URL de imagen. Sin JSX y sin React: son cadenas.

/**
 * Miniatura del backend, que redimensiona con `?w=`.
 *
 * Se pide el DOBLE del tamaño en pantalla para que no se vea borrosa en
 * pantallas retina.
 *
 * @param {string} url
 * @param {number} width  ancho en píxeles a solicitar
 */
export const thumbUrl = (url, width) => {
    if (!url) return url;
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
};
