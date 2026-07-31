import type { DropResult } from "@/types/dropZone";


interface Props {
    /** Se llama en cada cambio con el resultado dual y un error ('' si todo ok). */
    getImageCallback: (result: DropResult, error: string) => void;
    /** Máximo de imágenes permitidas (cuenta existentes + nuevas). */
    filesLimit?: number;
    /** Peso máximo por imagen en MB (por defecto 10). */
    maxSizeMB?: number;
    /** Tipos MIME aceptados (por defecto jpeg/png/webp/gif). */
    accept?: string[];
    /** Texto de ayuda opcional bajo el título. */
    hint?: string;
    /** URLs ya guardadas en el documento (modo edición). */
    initialImages?: string[];
}


export type { Props }
