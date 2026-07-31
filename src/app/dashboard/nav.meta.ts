import type { NavMeta } from '@/config/nav.types';

// Metadata de navegación de esta ruta. La lee scripts/generate-nav.mjs (Node 24
// importa .ts con type-stripping) para armar el menú desde el file-system.
// `satisfies NavMeta` valida label/icon/section y da autocompletado en `icon`.
export default { label: 'Panel analítico', icon: 'dashboard', section: 'Principal', order: 1 } satisfies NavMeta;
