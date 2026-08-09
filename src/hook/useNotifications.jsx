'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';
import {
    getNotifications, getUnreadCount,
    markNotificationRead, markAllNotificationsRead, decideNotificationRequest,
} from '@/libs/ajaxClient/notification.fetch';

// ══════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — estado, socket y lectura
// ══════════════════════════════════════════════════════════════════════
// Concentra todo lo que la campana necesita para que AppDock solo pinte.
//
// El usuario se UNE a su sala de socket al conectarse. Es lo que permite que
// las notificaciones personales lleguen solo a él: sin sala habría que emitir
// a todos y esconderlas en el front, que no es lo mismo que no enviarlas.

// Idioma de los textos. Las notificaciones se guardan en español e inglés;
// acá se elige cuál se lee. Queda en una constante para que el día que haya
// preferencia de idioma por usuario sea un solo punto que tocar.
const LANG = 'es';

export const NOTIFICATION_EVENT = 'notification:new';


export default function useNotifications() {
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const userId = user?._id;
    const isAdmin = user?.admin === true;

    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Contador que sube con cada notificación que ENTRA en vivo. La campana lo
    // usa como `key` para remontar el ícono y así reiniciar la animación de
    // sacudida: una animación CSS no se vuelve a lanzar sola si el nodo sigue
    // siendo el mismo.
    const [pulseKey, setPulseKey] = useState(0);

    // Evita que dos aperturas seguidas de la campana disparen dos cargas
    const loadingRef = useRef(false);

    /** Texto en el idioma activo, con respaldo al otro si faltara. */
    const textOf = useCallback((n) => {
        const t = n?.i18n?.[LANG] || n?.i18n?.es || n?.i18n?.en || {};
        return { title: t.title || '', body: t.body || '' };
    }, []);

    const refreshUnread = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await getUnreadCount();
            setUnread(data?.unread ?? 0);
        } catch { /* la campana no puede romper la app por un contador */ }
    }, [userId]);

    const load = useCallback(async () => {
        if (!userId || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const data = await getNotifications({ page: 0, limit: 20 });
            setNotifications(data?.notifications || []);
            setLoaded(true);
        } catch { /* silencioso: se reintenta al volver a abrir */ }
        finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [userId]);

    // ── Contador inicial ──────────────────────────────────────────────
    useEffect(() => { refreshUnread(); }, [refreshUnread]);

    // ── Sala de socket y llegada en vivo ──────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const join = () => socket.emit('join-user', { userId, admin: isAdmin });

        // Al reconectar, las salas se pierden: hay que volver a unirse o las
        // personales dejarían de llegar en silencio.
        join();
        socket.on('connect', join);

        const onNew = (notification) => {
            if (!notification?._id) return;
            setUnread(n => n + 1);
            setPulseKey(k => k + 1);
            // Solo se antepone si la lista ya se abrió alguna vez; si no, se
            // cargará completa al abrirla.
            setNotifications(prev => (
                prev.some(p => String(p._id) === String(notification._id))
                    ? prev
                    : [{ ...notification, read: false }, ...prev]
            ));
        };

        socket.on(NOTIFICATION_EVENT, onNew);

        return () => {
            socket.off('connect', join);
            socket.off(NOTIFICATION_EVENT, onNew);
            socket.emit('leave-user', { userId });
        };
    }, [userId, isAdmin]);

    // ── Lectura ───────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        // Optimista: la campana responde de inmediato y el servidor confirma.
        let cambiaba = false;
        setNotifications(prev => prev.map(n => {
            if (String(n._id) !== String(id) || n.read) return n;
            cambiaba = true;
            return { ...n, read: true };
        }));
        if (!cambiaba) return;
        setUnread(n => Math.max(0, n - 1));

        try { await markNotificationRead(id); }
        catch { refreshUnread(); }   // falló: que mande el servidor
    }, [refreshUnread]);

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
        try { await markAllNotificationsRead(); }
        catch { refreshUnread(); }
    }, [refreshUnread]);

    // ── Solicitudes ───────────────────────────────────────────────────
    // Aprobar o rechazar. NO es optimista a propósito: al aprobar, el servidor
    // escribe el horario, y adelantar el resultado dejaría la campana diciendo
    // "aprobado" sobre un cambio que pudo no aplicarse.
    const [deciding, setDeciding] = useState(null);   // id en curso

    const decide = useCallback(async (id, decision, note = '') => {
        setDeciding(id);
        try {
            const data = await decideNotificationRequest(id, decision, note);
            const actualizada = data?.notification;
            setNotifications(prev => prev.map(n => (
                String(n._id) === String(id)
                    ? { ...n, ...(actualizada || {}), read: true, request: actualizada?.request || { ...n.request, status: decision } }
                    : n
            )));
            refreshUnread();
            return { ok: true, applied: data?.applied ?? 0 };
        }
        catch (error) {
            return {
                ok: false,
                message: error?.response?.data?.message || 'No se pudo procesar la solicitud.',
            };
        }
        finally {
            setDeciding(null);
        }
    }, [refreshUnread]);

    return {
        notifications, unread, loading, loaded, load,
        markRead, markAllRead, textOf, pulseKey,
        decide, deciding,
    };
}
