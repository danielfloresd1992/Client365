import { createIcon } from './createIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Iconos de BOTONES / acciones — configuración, cerrar sesión, notificaciones.
// ─────────────────────────────────────────────────────────────────────────────

// Engranaje de "Configuración".
export const SettingsIcon = createIcon('SettingsIcon', (
    <>
        <circle cx='12' cy='12' r='3' />
        <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
    </>
));

// Puerta con flecha de salida — "Cerrar sesión".
export const LogoutIcon = createIcon('LogoutIcon', (
    <>
        <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
        <polyline points='16 17 21 12 16 7' />
        <line x1='21' y1='12' x2='9' y2='12' />
    </>
));

// Campana simple — estado "sin notificaciones nuevas" y badge del rol del día.
export const BellOffIcon = createIcon('BellOffIcon', (
    <>
        <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
        <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
    </>
));

// Lupa — para inputs de búsqueda.
export const SearchIcon = createIcon('SearchIcon', (
    <>
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.3-4.3' />
    </>
));

// Chevrons — para paginación y navegación.
export const ChevronLeftIcon = createIcon('ChevronLeftIcon', (
    <path d='m15 18-6-6 6-6' />
));

export const ChevronRightIcon = createIcon('ChevronRightIcon', (
    <path d='m9 18 6-6-6-6' />
));
