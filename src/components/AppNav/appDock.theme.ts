// ─────────────────────────────────────────────────────────────────────────────
// EL ASPECTO DEL DOCK, EN UN SOLO LUGAR
// ─────────────────────────────────────────────────────────────────────────────
// Las clases vivían dentro de AppDock, así que cambiar un color obligaba a
// editar el componente. Acá son datos: se reemplazan sin tocar la lógica, y el
// componente acepta un tema parcial por props para pisar solo lo que haga falta.

export interface AppDockTheme {
    /** La fila: alto, márgenes y transición. Común a navegación y acciones. */
    row: string;
    /** El cuadro del icono. Fija el ancho del riel colapsado. */
    iconBox: string;
    /** La etiqueta, que aparece al expandir. */
    label: string;

    /** Fila del ítem activo. */
    rowActive: string;
    /** Fila en reposo. */
    rowInactive: string;
    /** La etiqueta cuando la fila está activa. */
    labelActive: string;

    /**
     * Cómo se tiñe un icono sobre la fila activa.
     *
     * Es un filtro y no un color porque los iconos del set pintan con
     * `currentColor` en trazo: teñirlos con una clase de texto no alcanza
     * cuando el icono trae relleno.
     */
    iconActiveTint: string;

    /** Tamaño por defecto de los iconos. Cada uno puede pedir el suyo. */
    iconSize: number;

    /** El encabezado de cada sección del menú. */
    sectionLabel: string;

    /** Acciones del pie, que no son rutas y por eso tienen su propio color. */
    actionRow: string;
    dangerRow: string;
}


/**
 * El tema de siempre.
 *
 * Nota sobre `!text-white` en la fila activa: una regla global de styles.css
 * —`a,p,h1-h6,b { color:#0f5673 }`, fuera de @layer— le gana por herencia al
 * `text-white` normal del `<a>`. El `!` es para eso, no es un descuido.
 */
export const defaultAppDockTheme: AppDockTheme = {
    row: 'flex items-center h-10 mx-[7px] rounded-lg transition-colors',
    iconBox: 'w-[38px] shrink-0 flex items-center justify-center',
    label: 'whitespace-nowrap text-[12.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150',

    rowActive: 'bg-[#29c50c] !text-white shadow-sm hover:bg-[#1f9a08] hover:!text-white',
    rowInactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
    labelActive: 'text-white',

    iconActiveTint: 'brightness-0 invert',
    iconSize: 18,

    sectionLabel: 'h-4 flex items-center px-[13px] text-[9.5px] font-bold uppercase tracking-wider text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150',

    actionRow: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
    dangerRow: 'text-red-500 hover:bg-red-50 hover:text-red-600',
};


/** Mezcla un tema parcial sobre el de siempre. Lo ausente queda como estaba. */
export const resolveAppDockTheme = (parcial?: Partial<AppDockTheme>): AppDockTheme =>
    parcial ? { ...defaultAppDockTheme, ...parcial } : defaultAppDockTheme;
