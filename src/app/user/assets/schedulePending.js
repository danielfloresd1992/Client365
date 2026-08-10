'use client';

import socket from '@/libs/socket/socketIo';
import { getSchedulePending } from '@/components/Notifications';

// ══════════════════════════════════════════════════════════════════════
// SOLICITUDES PENDIENTES DE LA GRILLA
// ══════════════════════════════════════════════════════════════════════
// Qué celdas del horario tienen un cambio esperando aprobación.
//
// Es un almacén de MÓDULO, no un contexto de React, por lo mismo que
// `attendanceCache` en user.list.jsx: la grilla monta más de dos mil celdas y
// cada una necesita consultar lo mismo. Un contexto haría que cada llegada por
// socket repintara el árbol entero; así solo se avisa a quien se suscribió y
// cada celda decide si le tocó a ella.
//
// Se carga UNA vez para toda la grilla. Preguntar celda por celda serían más de
// dos mil peticiones para dibujar un mes.

/** slot -> { notificationId, requestedBy, createdAt, slotCount, targets, mine } */
let pendientes = {};
let cargado = false;
let cargando = null;
let socketListo = false;
// Para quién se cargó el mapa. Un `super` solo recibe SUS solicitudes y un
// administrador las de todos, así que si cambia la sesión sin recargar la
// página el mapa anterior ya no aplica.
let cargadoPara = null;

const oyentes = new Set();
const avisar = () => oyentes.forEach(fn => fn());

const dosDigitos = (n) => String(n).padStart(2, '0');

/**
 * Clave de celda: "userId|YYYY-MM-DD".
 *
 * La fecha se arma con los componentes LOCALES y no con `toISOString()`, que
 * convierte a UTC: la celda representa el día que se ve en la columna, y una
 * conversión de zona la correría un día en cuanto el servidor o el navegador
 * estén en otro huso.
 */
export const slotOf = (userId, dateObj) => {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    if (!userId || Number.isNaN(d.getTime())) return null;
    return `${userId}|${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
};

/** Lo pendiente de una celda, o null. */
export const pendingFor = (userId, dateObj) => {
    const slot = slotOf(userId, dateObj);
    return slot ? (pendientes[slot] || null) : null;
};

/** Suscripción de una celda a los cambios. Devuelve la baja. */
export const subscribePending = (fn) => {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
};


/**
 * Aplica un movimiento del ciclo de vida llegado por socket.
 *
 * `created` pinta las celdas; aprobar, rechazar o retirar las libera. Se limpia
 * por `notificationId` y no por las celdas del evento: si la solicitud tocaba
 * quince celdas y el evento trae quince, borrar por id deja el mapa consistente
 * aunque el evento venga incompleto.
 */
export const applyPendingEvent = (evento) => {
    if (!evento?.action) return;

    if (evento.action === 'created') {
        const resumen = {
            notificationId: evento.notificationId,
            requestedBy: evento.requestedBy || {},
            createdAt: evento.createdAt || new Date().toISOString(),
            slotCount: (evento.slots || []).length,
            targets: evento.targets || [],
        };
        (evento.slots || []).forEach(slot => { pendientes[slot] = resumen; });
        avisar();
        return;
    }

    // approved | rejected | withdrawn → la celda deja de estar pendiente
    const id = evento.notificationId;
    if (!id) return;
    let cambio = false;
    Object.keys(pendientes).forEach(slot => {
        if (pendientes[slot]?.notificationId === id) {
            delete pendientes[slot];
            cambio = true;
        }
    });
    if (cambio) avisar();
};


/** Quita una solicitud del mapa sin esperar al socket (respuesta optimista). */
export const clearPending = (notificationId) => {
    applyPendingEvent({ action: 'resolved', notificationId });
};


/**
 * Carga el mapa y engancha el socket. Idempotente: la llaman todas las celdas
 * al montarse y solo la primera hace el trabajo.
 *
 * @param {string} [sessionUserId] con quién se está mirando la grilla. Si es
 *        otro que el de la carga anterior, se descarta y se vuelve a pedir: lo
 *        que se ve depende de quién mira.
 */
export const ensurePendingLoaded = async (sessionUserId = null) => {
    const quien = sessionUserId ? String(sessionUserId) : null;

    if (cargado && quien !== cargadoPara) {
        pendientes = {};
        cargado = false;
    }
    cargadoPara = quien;

    if (cargado) return pendientes;
    if (cargando) return cargando;

    if (!socketListo) {
        socketListo = true;
        // El evento lo emite jarvis_api a los administradores y a quien
        // solicitó. Es distinto de la notificación de la campana: acá solo
        // interesa qué celdas tocar, no el texto ni el estado de lectura.
        socket.on('schedule:request', applyPendingEvent);
    }

    cargando = getSchedulePending()
        .then(data => {
            pendientes = data?.pending || {};
            cargado = true;
            avisar();
            return pendientes;
        })
        .catch(() => {
            // Sin el mapa la grilla se dibuja igual, solo que sin el aviso de
            // pendiente. Es degradar, no romper.
            cargado = true;
            return pendientes;
        })
        .finally(() => { cargando = null; });

    return cargando;
};
