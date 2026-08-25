import type { NavIconKey } from '@/config/nav.types';
import type { IconComponent } from '@/types/icon';
import {
    DashboardIcon,
    NewsIcon,
    CalendarIcon,
    AttendanceIcon,
    UsersIcon,
    BellIcon,
    StarIcon,
    StoreIcon,
    SettingsIcon,
    PlugIcon,
    LogoutIcon,
} from '@/components/icons';

// ─────────────────────────────────────────────────────────────────────────────
// EL REGISTRO DE ICONOS DEL MENÚ
// ─────────────────────────────────────────────────────────────────────────────
// Traduce la clave que declara cada ruta en su nav.meta.ts al componente real.
// Hace falta porque el menú generado guarda el icono como TEXTO, que es lo
// único serializable.
//
//
// CADA ICONO DECLARA LO SUYO
//
// La entrada no es solo el componente: lleva también cómo quiere ser tratado.
// Antes esa información vivía en AppDock —`item.icon !== 'star'`— y eso lo
// obligaba a conocer los iconos por nombre: sumar otro dorado significaba
// volver a editar el componente.
//
// Ahora AppDock pregunta y el registro responde. Un icono nuevo con sus propias
// necesidades se agrega acá, en una línea, y el dock no se entera.

export interface NavIconEntry {
    Icon: IconComponent;

    /**
     * El icono trae su propio color y NO debe teñirse en la fila activa.
     *
     * El teñido del dock es un filtro que lleva cualquier icono a blanco. Sobre
     * uno que pinta con `currentColor` eso es exactamente lo que se busca; sobre
     * uno con relleno propio lo deja como un borrón blanco, perdiendo justo lo
     * que lo distinguía.
     */
    selfColored?: boolean;

    /** Tamaño propio, si el trazo de este icono pide otro. Por defecto, el del tema. */
    size?: number;
}


export const navigationIconByKey: Record<NavIconKey, NavIconEntry> = {
    dashboard: { Icon: DashboardIcon },
    news: { Icon: NewsIcon },
    calendar: { Icon: CalendarIcon },
    attendance: { Icon: AttendanceIcon },
    users: { Icon: UsersIcon },
    bell: { Icon: BellIcon },
    store: { Icon: StoreIcon },
    gear: { Icon: SettingsIcon },
    plug: { Icon: PlugIcon },
    logout: { Icon: LogoutIcon },

    // La estrella del sistema de bonificación. Trae su propio dorado y va un
    // punto más grande: es maciza donde los demás son de línea, y al mismo
    // tamaño se veía más chica que sus vecinas.
    star: { Icon: StarIcon, selfColored: true, size: 21 },
};


/** Si una ruta trajera una clave inesperada, el menú igual se dibuja. */
export const fallbackNavigationIcon: NavIconEntry = { Icon: DashboardIcon };


/** La entrada de una clave, o la de reserva. */
export const navigationIconFor = (key: NavIconKey): NavIconEntry =>
    navigationIconByKey[key] ?? fallbackNavigationIcon;
