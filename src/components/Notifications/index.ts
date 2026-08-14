// ══════════════════════════════════════════════════════════════════════
// MÓDULO DE NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════════
// Punto de entrada único. Quien lo use monta la campana con una línea:
//
//     import { NotificationBell } from '@/components/Notifications';
//     <NotificationBell rowClass={ROW} iconBoxClass={ICON_BOX} labelClass={LABEL} />
//
// Todo lo demás es interno. Se exporta igual para que otra pantalla pueda armar
// su propia vista, pero importar desde acá y no desde los archivos sueltos
// mantiene una sola puerta: el día que una pieza cambie de nombre o se parta en
// dos, no hay que perseguir imports por todo el proyecto.
//
//
// CÓMO ESTÁ ORGANIZADO
//
//   NotificationBell.tsx     La campana. Lo único que se monta desde afuera, y
//                            por eso el único archivo suelto acá.
//
//   assets/types.ts          La forma de una notificación. La usan las cuatro
//                            carpetas, así que vive por encima de todas.
//
//   assets/model/            Hablar con el servidor. Nada de React.
//   assets/state/            El hook: estado, socket, lectura y decisiones.
//                            No sabe cómo se ve nada.
//   assets/family/           Qué hace propio cada FAMILIA de notificación
//                            —horario, marcaje, comentario, recurso—: su color,
//                            su marca de agua, su bloque de detalle y qué manda
//                            al aviso del sistema. Agregar una familia es
//                            agregar un objeto acá y nada más.
//   assets/view/             Lo que se pinta: el panel, la fila y el avatar.
//                            No conoce ninguna familia: le pregunta a family.
//
// Las dependencias van en UNA sola dirección: view usa family, family usa
// types, y nadie va para atrás. Si alguna vez family necesitara algo de view,
// eso sería la señal de que la pieza está en la carpeta equivocada.

export { default as NotificationBell } from './NotificationBell';

export { default as NotificationPanel } from './assets/view/NotificationPanel';
export { default as NotificationItem } from './assets/view/NotificationItem';
export { default as ResourceAvatar } from './assets/view/ResourceAvatar';

export { default as AttendanceDetail } from './assets/family/detail/AttendanceDetail';
export { default as CommentDetail } from './assets/family/detail/CommentDetail';
export { default as ScheduleDetail } from './assets/family/detail/ScheduleDetail';
export { viewOf } from './assets/family/views';
export type { NotificationView } from './assets/family/views';
export { pushOf } from './assets/family/push';

export { default as useNotifications, NOTIFICATION_EVENT } from './assets/state/useNotifications';

export {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    decideNotificationRequest,
    getSchedulePending,
    withdrawNotificationRequest,
} from './assets/model/notification.fetch';

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
    PushExtras,
    PushContent,
} from './assets/types';
