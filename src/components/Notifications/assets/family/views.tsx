'use client';

import type { ReactNode } from 'react';
import { StoreIcon } from '@/components/icons';
import AttendanceDetail from './detail/AttendanceDetail';
import CommentDetail from './detail/CommentDetail';
import ScheduleDetail from './detail/ScheduleDetail';
import BonusDetail from './detail/BonusDetail';
import type {
    Notification, NotificationFamily, PushExtras, AttendanceMeta, CommentMeta,
} from '../types';

// ══════════════════════════════════════════════════════════════════════
// VISTAS POR FAMILIA — el espejo en el cliente del patrón del backend
// ══════════════════════════════════════════════════════════════════════
// El backend declara la FAMILIA en su estrategia y la manda en la notificación.
// Acá cada familia dice cómo se pinta: qué marca de agua lleva de fondo, qué
// acento usa y a quiénes muestra.
//
// El componente que dibuja no conoce ninguna familia: pide su vista al registro
// y obedece. Agregar una familia nueva —vacaciones, inventario, lo que venga—
// es registrar un objeto más acá, sin tocar el ítem ni la bandeja.
//
// La otra opción era un `if (type.startsWith('schedule'))` dentro del ítem. Con
// tres familias parece igual; con doce es una cadena de condicionales que hay
// que leer entera para saber por qué una notificación se ve como se ve.

export interface NotificationView {
    /** Fondo tenue que identifica la familia de un vistazo. */
    watermark?: ReactNode;
    /** Franja de color del borde izquierdo del ítem. */
    accent: string;
    /** Fondo del ítem cuando NO está leído. */
    unreadBg: string;
    /**
     * Fondo al pasar el mouse sobre uno no leído. Es una clase de color y no un
     * `brightness`: un filter crea capa de composición y puede correr el
     * renderizado del texto. En una lista larga se nota.
     */
    unreadHoverBg: string;
    /**
     * Mostrar también a la persona afectada, no solo a quien hizo el cambio.
     * En el horario intervienen dos y hay que ver las dos caras: quién lo tocó
     * y a quién le cambiaron la jornada.
     */
    showTarget: boolean;
    /** Ícono de respaldo cuando el recurso no tiene imagen propia. */
    fallbackIcon: ReactNode;
    /**
     * Bloque extra bajo el texto, propio de la familia: las fotos del marcaje,
     * el rango de fechas de un permiso, lo que cada una necesite mostrar.
     *
     * Es una función y no un nodo porque depende de la notificación concreta.
     * Gracias a esto el ítem sigue sin conocer ninguna familia: pide el detalle
     * y lo pinta, sea cual sea.
     */
    detail?: (n: Notification) => ReactNode;
    /**
     * Ocultar el avatar estándar del ítem.
     *
     * Lo usa la familia cuyo `detail` ya muestra a las personas por su cuenta:
     * repetir la misma cara en pequeño al lado sería ruido.
     */
    hideAvatar?: boolean;
    /**
     * Qué le agrega esta familia al aviso del sistema —la notificación del
     * escritorio o del teléfono— por encima del título y el cuerpo que ya trae
     * la notificación.
     *
     * Vive acá, junto al resto de lo que define a la familia, y no en un mapa
     * aparte: si estuviera en otro archivo habría dos listas de familias que
     * mantener sincronizadas, y la segunda se olvidaría.
     *
     * Devuelve datos, no JSX: una notificación del sistema la dibuja el sistema
     * operativo y solo entiende textos y URLs de imagen.
     */
    push?: (n: Notification) => PushExtras;
}


// ── Marcas de agua ────────────────────────────────────────────────────
// SVG planos, sin animación: son decorativos y están en una lista que puede
// tener decenas de filas. Animarlos costaría repintados en cada fotograma.

const CalendarWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-[#29c50c] opacity-[0.07] pointer-events-none'
        aria-hidden='true'
    >
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <path d='M16 2v4M8 2v4M3 10h18' />
        <path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01' />
    </svg>
);

const BuildingWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-blue-600 opacity-[0.06] pointer-events-none'
        aria-hidden='true'
    >
        <path d='m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.3a2 2 0 0 1 1.5.6L22 7' />
        <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
        <path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20' />
    </svg>
);

const ClockWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-teal-600 opacity-[0.07] pointer-events-none'
        aria-hidden='true'
    >
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3.2 1.9' />
    </svg>
);

const BubbleWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-amber-500 opacity-[0.07] pointer-events-none'
        aria-hidden='true'
    >
        <path d='M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8v.4z' />
    </svg>
);

const SparkWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-amber-500 opacity-[0.07] pointer-events-none'
        aria-hidden='true'
    >
        <path d='M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' />
        <circle cx='12' cy='12' r='4' />
    </svg>
);


const StarWatermark = (
    <svg
        viewBox='0 0 24 24' fill='currentColor'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-amber-500 opacity-[0.09] pointer-events-none'
        aria-hidden='true'
    >
        <path d='m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z' />
    </svg>
);

const TagWatermark = (
    <svg
        viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'
        className='absolute -right-2 -bottom-2 w-[86px] h-[86px] text-slate-500 opacity-[0.07] pointer-events-none'
        aria-hidden='true'
    >
        <path d='M20.6 13.4 12 22l-8.6-8.6A2 2 0 0 1 2.8 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.4z' />
        <circle cx='7.5' cy='7.5' r='1.5' />
    </svg>
);


// ── Registro ──────────────────────────────────────────────────────────

const VIEWS: Record<NotificationFamily, NotificationView> = {
    // Horario: guardia, permisos, faltas, cambios de jornada, horas extras.
    // Verde de marca y calendario de fondo.
    schedule: {
        watermark: CalendarWatermark,
        // Cada día que cambió, con lo que le pusieron. El cuerpo del aviso lo
        // resume; esto lo desglosa y lo resalta.
        detail: (n) => <ScheduleDetail n={n} />,
        accent: 'before:bg-[#29c50c]',
        unreadBg: 'bg-[#29c50c]/[0.05]',
        unreadHoverBg: 'hover:bg-[#29c50c]/[0.10]',
        showTarget: true,
        // Una solicitud pendiente espera una decisión, así que el aviso se queda
        // en pantalla en vez de desvanecerse solo: si se va antes de que la
        // persona lo mire, el cambio queda esperando sin que nadie lo sepa.
        push: (n) => ({
            requireInteraction: n.request?.status === 'pending',
        }),
        fallbackIcon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
                <rect x='3' y='4' width='18' height='18' rx='2' />
                <path d='M16 2v4M8 2v4M3 10h18' />
            </svg>
        ),
    },

    // El marcaje PROPIO: entrada, salida, retardo, día extra. Es la única
    // familia con un detalle visual bajo el texto —las dos fotos—, porque es la
    // única donde el aviso también sirve de comprobante.
    //
    // Teal y no verde de marca: se parece al horario pero no es lo mismo, y
    // conviene distinguir de un vistazo "te cambiaron la jornada" de "así
    // marcaste hoy".
    attendance: {
        watermark: ClockWatermark,
        accent: 'before:bg-teal-500',
        unreadBg: 'bg-teal-500/[0.05]',
        unreadHoverBg: 'hover:bg-teal-500/[0.10]',
        // Actor y afectado son la MISMA persona: es su propio marcaje. Mostrar
        // dos caras iguales sería ruido.
        showTarget: false,
        detail: (n) => <AttendanceDetail n={n} />,
        // La foto del marcaje como imagen grande. Es la única familia donde el
        // aviso sirve de comprobante: verla en la notificación, sin abrir nada,
        // es la mitad del valor.
        push: (n) => {
            const meta = (n.meta || {}) as AttendanceMeta;
            return { image: meta.photoOut || meta.photoIn || undefined };
        },
        fallbackIcon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
                <circle cx='12' cy='12' r='9' />
                <path d='M12 7v5l3.2 1.9' />
            </svg>
        ),
    },

    // Una nota escrita sobre el día de otra persona.
    //
    // Ámbar y globo de fondo: es la única familia que transporta texto de una
    // persona en vez de un hecho del sistema, y conviene que se distinga de un
    // vistazo entre los avisos de cambios.
    comment: {
        watermark: BubbleWatermark,
        accent: 'before:bg-amber-400',
        unreadBg: 'bg-amber-400/[0.05]',
        unreadHoverBg: 'hover:bg-amber-400/[0.10]',
        // El nombre del comentado ya está en el cuerpo del texto y su cara en
        // el detalle: la línea de "target" volvería a decir lo mismo.
        showTarget: false,
        // El detalle pinta las dos caras a 50px; el avatar chico sobra.
        hideAvatar: true,
        detail: (n) => <CommentDetail n={n} />,
        // La nota NO viaja en el cuerpo de la notificación —se pinta aparte como
        // cita—, así que sin esto el aviso del sistema diría "te dejaron un
        // comentario" sin decir cuál, que es justo lo único que importa.
        push: (n) => {
            const meta = (n.meta || {}) as CommentMeta;
            return meta.message ? { body: `“${meta.message}”` } : {};
        },
        fallbackIcon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
                <path d='M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8v.4z' />
            </svg>
        ),
    },

    // Establecimientos y franquicias.
    resource: {
        watermark: BuildingWatermark,
        accent: 'before:bg-blue-500',
        unreadBg: 'bg-blue-500/[0.04]',
        unreadHoverBg: 'hover:bg-blue-500/[0.09]',
        showTarget: false,
        // El logo del establecimiento en grande: es lo que se reconoce de un
        // vistazo, mucho antes que el nombre escrito.
        push: (n) => ({ image: n.resource?.img || undefined }),
        fallbackIcon: <StoreIcon size={17} />,
    },

    // Anuncios de la plataforma.
    system: {
        watermark: SparkWatermark,
        accent: 'before:bg-amber-400',
        unreadBg: 'bg-amber-400/[0.06]',
        unreadHoverBg: 'hover:bg-amber-400/[0.12]',
        showTarget: false,
        fallbackIcon: (
            // eslint-disable-next-line @next/next/no-img-element
            <img src='/logo-page-removebg.png' alt='' className='w-6 h-6 object-contain' />
        ),
    },

    // La alerta como tal: se creó, se editó, se eliminó. Gris pizarra y una
    // etiqueta de fondo — es información operativa, no toca dinero.
    menu: {
        watermark: TagWatermark,
        accent: 'before:bg-slate-400',
        unreadBg: 'bg-slate-500/[0.04]',
        unreadHoverBg: 'hover:bg-slate-500/[0.09]',
        showTarget: false,
        fallbackIcon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-[17px] h-[17px]'>
                <path d='M20.6 13.4 12 22l-8.6-8.6A2 2 0 0 1 2.8 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.4z' />
                <circle cx='7.5' cy='7.5' r='1.5' />
            </svg>
        ),
    },

    // Cambió lo que PAGA una alerta.
    //
    // Es la única familia dorada de toda la bandeja, y la única cuyo ícono de
    // respaldo es una estrella rellena. No es decoración: entre veinte avisos
    // de que alguien renombró un campo, el que cambia lo que cobra la gente
    // tiene que poder encontrarse sin leer.
    bonus: {
        watermark: StarWatermark,
        accent: 'before:bg-amber-500',
        unreadBg: 'bg-amber-500/[0.07]',
        unreadHoverBg: 'hover:bg-amber-500/[0.13]',
        showTarget: false,
        // El desglose de qué cambió en la bonificación, ya redactado por la API.
        detail: (n) => <BonusDetail n={n} />,
        fallbackIcon: (
            <svg viewBox='0 0 24 24' fill='currentColor' className='w-[17px] h-[17px] text-amber-500'>
                <path d='m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z' />
            </svg>
        ),
    },

    // Todo lo que aún no declara familia. Sin marca de agua: es preferible que
    // una notificación nueva se vea sobria a que herede un fondo que no le toca.
    general: {
        accent: 'before:bg-gray-300',
        unreadBg: 'bg-gray-500/[0.04]',
        unreadHoverBg: 'hover:bg-gray-500/[0.09]',
        showTarget: false,
        fallbackIcon: <StoreIcon size={17} />,
    },
};


/**
 * Vista de una notificación. Las creadas antes de que existiera `family` no la
 * traen: caen en 'general' y se ven sobrias, no rotas.
 */
export const viewOf = (n: Notification): NotificationView =>
    VIEWS[(n.family as NotificationFamily) || 'general'] || VIEWS.general;
