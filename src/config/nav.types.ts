// ─────────────────────────────────────────────────────────────────────────────
// Tipos del menú de navegación (compartidos por: los nav.meta.ts de cada ruta,
// el registro de iconos, el archivo generado y AppDock).
// ─────────────────────────────────────────────────────────────────────────────

// Clave de icono. Debe existir en el registro navigationIconByKey
// (navigationIconRegistry.ts). Si añades un icono nuevo: agrégalo aquí y en el
// registro, y quedará disponible en los nav.meta.ts con autocompletado.
export type NavIconKey =
    | 'dashboard'
    | 'news'
    | 'calendar'
    | 'attendance'
    | 'users'
    | 'bell'
    | 'store'
    | 'gear'
    | 'logout';

// Metadata que cada ruta declara en su `nav.meta.ts` (co-locada con su page).
export interface NavMeta {
    /** Texto que se muestra en el menú. */
    label: string;
    /** Clave del icono (ver NavIconKey / registro ICONS). */
    icon: NavIconKey;
    /** Sección bajo la que se agrupa (p. ej. 'Principal', 'Empleados'). */
    section: string;
    /** Orden dentro de la sección (menor = primero). Opcional. */
    order?: number;
}

// Ítem del menú ya resuelto — lo emite el generador (scripts/generate-nav.mjs).
export interface NavItem {
    name: string;
    path: string;
    icon: NavIconKey;
}

// Sección del menú con sus ítems.
export interface NavSection {
    label: string;
    items: NavItem[];
}