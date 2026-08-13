// ══════════════════════════════════════════════════════════════════════
// MÓDULO DE NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════════
// Punto de entrada único. Quien lo use monta la campana con una línea:
//
//     import { NotificationBell } from '@/components/Notifications';
//     <NotificationBell rowClass={ROW} iconBoxClass={ICON_BOX} labelClass={LABEL} />
//
// Todo lo demás —hook, panel, ítem, avatar, red y tipos— es interno. Se exporta
// igual para que otra pantalla pueda armar su propia vista, pero importar
// desde acá y no desde los archivos sueltos mantiene una sola puerta: el día
// que una pieza cambie de nombre o se parta en dos, no hay que perseguir
// imports por todo el proyecto.

export { default as NotificationBell } from './NotificationBell';
export { default as NotificationPanel } from './NotificationPanel';
export { default as NotificationItem } from './NotificationItem';
export { default as ResourceAvatar } from './ResourceAvatar';
export { default as AttendanceDetail } from './AttendanceDetail';
export { default as CommentDetail } from './CommentDetail';
export { default as ScheduleDetail } from './ScheduleDetail';
export { viewOf } from './notificationViews';
export type { NotificationView } from './notificationViews';
export { default as useNotifications, NOTIFICATION_EVENT } from './useNotifications';

export {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    decideNotificationRequest,
    getSchedulePending,
    withdrawNotificationRequest,
} from './notification.fetch';

export type {
    Notification,
    AttendanceMeta,
    CommentMeta,
    ScheduleChange,
    NotificationFamily,
    NotificationScope,
    NotificationLevel,
    NotificationPerson,
    NotificationResource,
    NotificationChange,
    NotificationRequest,
    RequestStatus,
    Decision,
    DecideResult,
} from './types';
