// ⚠️ ARCHIVO AUTO-GENERADO por scripts/generate-nav.mjs — NO editar a mano.
// Se regenera en cada 'npm run dev' / 'npm run build' (predev/prebuild).
// El menú sale del file-system: cada carpeta de app/ con page.* + nav.meta.ts.
// Para cambiar el menú, edita el nav.meta.ts de la ruta (no este archivo).

import type { NavSection } from './nav.types';

export const NAV_SECTIONS: NavSection[] = [
    {
        "label": "Principal",
        "items": [
            {
                "name": "Panel analítico",
                "path": "/dashboard",
                "icon": "dashboard"
            },
            {
                "name": "Muro de novedades",
                "path": "/Lobby",
                "icon": "news"
            }
        ]
    },
    {
        "label": "Empleados",
        "items": [
            {
                "name": "Horario y guardias",
                "path": "/user",
                "icon": "calendar"
            },
            {
                "name": "Consultar asistencia",
                "path": "/user/asistencia",
                "icon": "attendance"
            },
            {
                "name": "Gestión de perfiles",
                "path": "/user/config",
                "icon": "users"
            }
        ]
    },
    {
        "label": "Operación",
        "items": [
            {
                "name": "Gestión de alertas",
                "path": "/alertmanasgement",
                "icon": "bell"
            },
            {
                "name": "Establecimientos",
                "path": "/clients&manasgement",
                "icon": "store"
            }
        ]
    }
];
