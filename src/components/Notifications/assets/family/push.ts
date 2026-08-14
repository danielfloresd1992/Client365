import { viewOf } from './views';
import type { Notification, PushContent } from '../types';

// ══════════════════════════════════════════════════════════════════════
// DE NOTIFICACIÓN A AVISO DEL SISTEMA
// ══════════════════════════════════════════════════════════════════════
// Convierte una notificación de la campana en lo que necesita el sistema
// operativo para mostrarla fuera de la aplicación.
//
//
// EL TÍTULO Y EL CUERPO NO SE VUELVEN A ARMAR ACÁ
//
// Se reciben ya resueltos, los mismos que pinta la bandeja. Si este archivo los
// compusiera por su cuenta, el aviso del teléfono y la fila de la campana
// podrían terminar diciendo cosas distintas del mismo hecho, y nadie sabría
// cuál de los dos es el bueno.
//
//
// LO PROPIO DE CADA FAMILIA LO PONE LA FAMILIA
//
// La foto del marcaje, el texto del comentario, el logo del establecimiento: no
// hay ningún `if (family === ...)` acá. Cada familia lo declara en su vista
// (`push`), igual que declara su color y su marca de agua. Una familia nueva se
// suma allá y este archivo no se entera.

/** Nombre completo de quien hizo el cambio, para cuando no hay mejor ícono. */
const caraDelActor = (n: Notification) => n.actor?.img || undefined;

/**
 * Arma el aviso del sistema de una notificación.
 *
 * @param n      la notificación tal cual llegó
 * @param texto  título y cuerpo YA resueltos en el idioma activo
 */
export function pushOf(n: Notification, texto: { title: string; body: string }): PushContent | null {
    // Sin título no hay aviso que mostrar: una notificación del sistema sin
    // texto es una fila vacía que solo genera desconcierto.
    if (!n?._id || !texto?.title) return null;

    const extras = viewOf(n).push?.(n) || {};

    return {
        title: texto.title,
        body: extras.body ?? texto.body ?? '',

        // El ícono pequeño: primero el recurso —el logo del establecimiento—,
        // que es lo que se reconoce; si no, la cara de quien lo hizo. Cuando no
        // hay ninguno, native.js pone la campana.
        icon: extras.icon ?? n.resource?.img ?? caraDelActor(n) ?? undefined,

        image: extras.image,

        // ESTABLE, y esto importa: con una etiqueta distinta por llamada el
        // sistema apila avisos, así que una notificación que llegue dos veces
        // —una reconexión del socket, dos pestañas abiertas— se vería duplicada.
        // Con el id de la notificación, la segunda reemplaza a la primera.
        tag: `jarvis-notif-${n._id}`,

        // A dónde lleva al tocarla. Es el mismo destino que abre la fila de la
        // campana, así que tocar el aviso y tocar la fila terminan en el mismo
        // lugar.
        url: n.resource?.path || undefined,

        requireInteraction: extras.requireInteraction,
    };
}
