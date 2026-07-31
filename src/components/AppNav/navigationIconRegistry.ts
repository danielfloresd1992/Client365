import type { NavIconKey } from '@/config/nav.types';
import type { IconComponent } from '@/types/icon';
import {
    DashboardIcon,
    NewsIcon,
    CalendarIcon,
    AttendanceIcon,
    UsersIcon,
    BellIcon,
    StoreIcon,
    SettingsIcon,
    LogoutIcon,
} from '@/components/icons';

// Resuelve la clave de icono de cada ruta (NavIconKey, declarada en su
// nav.meta.ts) al componente real del set. Es necesario porque el menú
// generado guarda el icono como TEXTO (serializable); aquí se traduce
// texto → componente. Record<NavIconKey, …> obliga a cubrir todas las claves.
export const navigationIconByKey: Record<NavIconKey, IconComponent> = {
    dashboard: DashboardIcon,
    news: NewsIcon,
    calendar: CalendarIcon,
    attendance: AttendanceIcon,
    users: UsersIcon,
    bell: BellIcon,
    store: StoreIcon,
    gear: SettingsIcon,
    logout: LogoutIcon,
};

// Icono por defecto si una ruta trajera una clave inesperada.
export const fallbackNavigationIcon: IconComponent = DashboardIcon;
