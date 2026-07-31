import type { ReactElement, SVGProps } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos del set de iconos (SVG de línea, currentColor). Reutilizables en toda
// la app: cada icono acepta las props de un <svg> + `size`.
// ─────────────────────────────────────────────────────────────────────────────

// Props de cualquier icono del set: todas las de un <svg> más `size`, un atajo
// para width/height. El COLOR se hereda de `currentColor` → contrólalo con las
// clases `text-…` de Tailwind (o la prop `color`). El TAMAÑO con `size` o con
// className (`w-…`/`h-…`). Todo lo demás (onClick, aria-*, style…) también pasa.
export type IconProps = SVGProps<SVGSVGElement> & {
    /** Atajo para width y height (número → px). Por defecto 24. */
    size?: number | string;
};

// Firma de un componente de icono del set.
export type IconComponent = (props: IconProps) => ReactElement;
