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

// ─────────────────────────────────────────────────────────────────────────────
// Iconos de la HERRAMIENTA DE INTEGRACIONES — llaves de API.
// ─────────────────────────────────────────────────────────────────────────────

// Llave — una credencial de integración.
export const KeyIcon = createIcon('KeyIcon', (
    <>
        <circle cx='7.5' cy='15.5' r='4.5' />
        <path d='m10.7 12.3 8.5-8.5' />
        <path d='m17 6 2.5 2.5' />
        <path d='m14.5 8.5 3 3' />
    </>
));

// Más — crear algo nuevo.
export const PlusIcon = createIcon('PlusIcon', (
    <>
        <path d='M12 5v14' />
        <path d='M5 12h14' />
    </>
));

// Ojo — revelar un secreto oculto.
export const EyeIcon = createIcon('EyeIcon', (
    <>
        <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z' />
        <circle cx='12' cy='12' r='3' />
    </>
));

// Ojo tachado — volver a ocultarlo.
export const EyeOffIcon = createIcon('EyeOffIcon', (
    <>
        <path d='M10.6 6.2A9.9 9.9 0 0 1 12 6c6.5 0 10 7 10 7a15.5 15.5 0 0 1-2.9 3.7' />
        <path d='M6.6 6.7A15.6 15.6 0 0 0 2 13s3.5 7 10 7a9.7 9.7 0 0 0 4.5-1.1' />
        <path d='M9.9 10.1a3 3 0 0 0 4.2 4.2' />
        <path d='m2 2 20 20' />
    </>
));

// Dos hojas superpuestas — copiar al portapapeles.
export const CopyIcon = createIcon('CopyIcon', (
    <>
        <rect x='9' y='9' width='12' height='12' rx='2' />
        <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </>
));

// Tilde — confirmación breve ("copiado").
export const CheckIcon = createIcon('CheckIcon', (
    <path d='M20 6 9 17l-5-5' />
));

// Papelera — eliminar.
export const TrashIcon = createIcon('TrashIcon', (
    <>
        <path d='M3 6h18' />
        <path d='M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2' />
        <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' />
        <path d='M10 11v6' />
        <path d='M14 11v6' />
    </>
));

// Triángulo de aviso — el momento en que el secreto está a la vista.
export const AlertIcon = createIcon('AlertIcon', (
    <>
        <path d='M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' />
        <path d='M12 9v4' />
        <path d='M12 17h.01' />
    </>
));
