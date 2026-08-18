import type { NavSection } from '@/config/nav.types';
import { isAdminRoute } from '@/libs/auth/routes.config';

/**
 * Qué secciones del menú ve este usuario.
 *
 * Función pura y fuera del componente: es una regla de permisos, se prueba sin
 * montar nada, y el día que aparezca otro criterio —por rol, por
 * establecimiento— se agrega acá sin abrir AppDock.
 *
 * La lista de rutas de administrador es la MISMA que aplica LoadingGuard
 * (routes.config), así no hay dos definiciones que se desincronicen: agregar
 * una ruta allí la oculta acá y la bloquea con el 403 en la página.
 *
 * Con `isAdmin` en false —que es lo que pasa mientras la sesión se resuelve—
 * las rutas de administrador quedan ocultas. Es el default seguro: aparecen al
 * confirmarse el permiso, en vez de mostrarse y desaparecer.
 *
 * Las secciones que quedan sin ítems no se devuelven: un encabezado sobre nada
 * es peor que no estar.
 */
export const visibleNavSections = (
    sections: NavSection[],
    { isAdmin }: { isAdmin: boolean },
): NavSection[] => sections
    .map(section => ({
        ...section,
        items: section.items.filter(item => isAdmin || !isAdminRoute(item.path)),
    }))
    .filter(section => section.items.length > 0);
