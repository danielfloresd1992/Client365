'use client';

import { isCordovaEnv, showLocalNotification } from '@/libs/script/cordovaInit';

let swRegistration = null;
let permissionState = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'denied';


/**
 * Registra el Service Worker. Debe llamarse una vez al montar la app.
 * En Cordova no se usan Service Workers — se omite silenciosamente.
 */
export async function registerServiceWorker() {
    if (typeof window === 'undefined') return null;
    if (isCordovaEnv()) {
        console.log('[Notifications] Cordova detectado — Service Worker omitido');
        return null;
    }
    if (!('serviceWorker' in navigator)) {
        console.warn('[Notifications] Service Worker no soportado');
        return null;
    }

    try {
        swRegistration = await navigator.serviceWorker.register('/sw.js');
        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
        return swRegistration;
    } catch (err) {
        console.warn('[Notifications] Error registrando SW:', err);
        return null;
    }
}


/**
 * Solicita permiso de notificaciones. Debe llamarse dentro de un evento
 * de usuario (click, touch) para funcionar en todos los navegadores.
 * Retorna 'granted', 'denied', o 'default'.
 */
export async function requestNotificationPermission() {
    if (typeof window === 'undefined') return 'denied';

    // En Cordova, los permisos los gestiona el plugin push al init()
    if (isCordovaEnv()) {
        permissionState = 'granted';
        return 'granted';
    }

    if (!('Notification' in window)) return 'denied';

    if (Notification.permission === 'granted') {
        permissionState = 'granted';
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        permissionState = 'denied';
        return 'denied';
    }

    try {
        const result = await Notification.requestPermission();
        permissionState = result;
        return result;
    } catch (err) {
        console.warn('[Notifications] Error solicitando permiso:', err);
        return 'denied';
    }
}


/**
 * Retorna el estado actual del permiso sin solicitarlo.
 */
export function getPermissionState() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
    }
    return 'denied';
}


/**
 * Muestra una notificación usando el Service Worker (funciona en background
 * y en mobile). Si el SW no está disponible, hace fallback a `new Notification()`.
 *
 * @param {string} title
 * @param {object} options - { body, icon, image, tag, url, requireInteraction }
 */
export async function showBrowserNotification(title, options = {}) {
    if (typeof window === 'undefined') return;

    // En Cordova, usar notificación local nativa
    if (isCordovaEnv()) {
        showLocalNotification(title, options);
        return;
    }

    // Si no hay permiso, intentar pedirlo
    if (permissionState !== 'granted') {
        const result = await requestNotificationPermission();
        if (result !== 'granted') return;
    }

    const notifOptions = {
        body: options.body || '',
        icon: options.icon || '/ico/icons8-campana-48.png',
        badge: '/ico/icons8-campana-25.png',
        image: options.image || undefined,
        vibrate: [200, 100, 200],
        tag: options.tag || 'jarvis365-' + Date.now(),
        renotify: true,
        data: { url: options.url || '/' },
    };

    // Intentar via Service Worker (funciona en background + mobile)
    //
    // Se pregunta con getRegistration() y NO con `ready`. Parecen lo mismo y no
    // lo son: `ready` espera a que haya un Service Worker ACTIVO, así que en una
    // página donde nunca se registró ninguno la promesa queda pendiente para
    // siempre. Como no lanza, el catch no corre y ni siquiera se llega al
    // respaldo de abajo: la notificación no aparece y no hay ningún error.
    //
    // Pasa de verdad en la primera visita: registerServiceWorker() corre después
    // de comprobar Cordova, que en la web tarda unos segundos en descartarse.
    //
    // getRegistration() siempre se resuelve —con el registro o con undefined—.
    // Recién cuando sabemos que existe uno tiene sentido esperar su activación.
    try {
        const registration = swRegistration || await navigator.serviceWorker?.getRegistration();
        if (registration) {
            const activo = await navigator.serviceWorker.ready;
            await activo.showNotification(title, notifOptions);
            return;
        }
    } catch (err) {
        // Fallback abajo
    }

    // Fallback: Notification API directa (solo foreground, no mobile)
    try {
        if ('Notification' in window) {
            new Notification(title, {
                body: notifOptions.body,
                icon: notifOptions.icon,
                image: notifOptions.image,
            });
        }
    } catch (err) {
        console.warn('[Notifications] Fallback notification failed:', err);
    }
}


/**
 * Verifica si las notificaciones están soportadas en este navegador/plataforma.
 */
export function isNotificationSupported() {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
}
