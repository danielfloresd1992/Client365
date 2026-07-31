/**
 * ImageFile — par de archivo + su representación base64 (para previsualizar).
 * (Antes se llamaba `File`, pero ese nombre sombreaba al `File` global del DOM
 *  y se auto-referenciaba; renombrado para que `file: File` sea el File real.)
 */
export type ImageFile = {
    file: File;
    base64: string;
};


/**
 * DropResult — resultado dual del componente:
 *   • files → imágenes NUEVAS subidas por el usuario (binarios a enviar).
 *   • urls  → URLs EXISTENTES (modo edición) que se conservan tras las eliminaciones.
 */
export type DropResult = {
    files: ImageFile[];
    urls: string[];
};


/** Item interno de la galería: nuevo (File) o existente (URL del backend). */
export type GalleryItem =
    | { kind: 'new'; file: File; base64: string }
    | { kind: 'existing'; url: string };
