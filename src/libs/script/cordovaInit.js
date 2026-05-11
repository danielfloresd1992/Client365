'use client';

/**
 * Puente de inicialización para Cordova.
 *
 * Detecta si la app corre en un entorno Cordova y gestiona:
 *  - Detección de plugins nativos (disponibles tras navegación desde launcher)
 *  - Inicialización de Push Notifications (@havesource/cordova-plugin-push)
 *  - Notificaciones locales (cordova-plugin-local-notification)
 *
 * Cuando la app se carga desde una URL remota (https://jarvis365.net),
 * el launcher (www/index.html) carga cordova.js y navega aquí.
 * Cordova mantiene los plugins accesibles si allow-navigation está configurado.
 */

/** Detecta si estamos en un entorno Cordova (plugins disponibles tras navegación) */
export function isCordovaEnv() {
    if (typeof window === 'undefined') return false;
    return (
        !!window.cordova ||
        !!window.Cordova ||
        !!window._cordovaNative ||
        !!window.TTS ||
        !!window.PushNotification
    );
}


// Estado interno
let _deviceReady = false;
let _deviceReadyPromise = null;
let _pushInstance = null;
let _onPushNotification = null;
let _onPushRegistration = null;


/**
 * Espera a que los plugins de Cordova estén disponibles.
 * Tras la navegación desde el launcher, los plugins pueden tardar
 * un momento en estar accesibles.
 */
export function waitForDeviceReady() {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (_deviceReady) return Promise.resolve(true);

    // Si ya hay plugins disponibles, estamos listos
    if (isCordovaEnv()) {
        _deviceReady = true;
        return Promise.resolve(true);
    }

    if (!_deviceReadyPromise) {
        _deviceReadyPromise = new Promise((resolve) => {
            // Escuchar deviceready (por si cordova.js está cargado)
            const onReady = () => {
                _deviceReady = true;
                document.removeEventListener('deviceready', onReady);
                console.log('[CordovaInit] deviceready disparado');
                resolve(true);
            };
            document.addEventListener('deviceready', onReady, false);

            // Polling: verificar si los plugins aparecen tras la navegación
            let attempts = 0;
            const maxAttempts = 25; // 5 segundos (25 * 200ms)
            const checkPlugins = () => {
                attempts++;
                if (isCordovaEnv()) {
                    _deviceReady = true;
                    document.removeEventListener('deviceready', onReady);
                    console.log('[CordovaInit] Plugins Cordova detectados');
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    setTimeout(checkPlugins, 200);
                } else {
                    // No estamos en Cordova
                    document.removeEventListener('deviceready', onReady);
                    console.log('[CordovaInit] No se detectó entorno Cordova');
                    resolve(false);
                }
            };
            setTimeout(checkPlugins, 200);
        });
    }

    return _deviceReadyPromise;
}


/**
 * Inicializa Push Notifications con @havesource/cordova-plugin-push.
 * En Android 13+ el plugin pide automáticamente el permiso POST_NOTIFICATIONS.
 */
export function initPushNotifications() {
    if (!window.PushNotification) {
        console.log('[CordovaInit] PushNotification plugin no disponible');
        return null;
    }

    if (_pushInstance) return _pushInstance;

    _pushInstance = window.PushNotification.init({
        android: {
            alert: true,
            badge: true,
            sound: true,
            vibrate: true,
            forceShow: true,
        },
        ios: {
            alert: true,
            badge: true,
            sound: true,
        },
    });

    _pushInstance.on('registration', (data) => {
        console.log('[CordovaInit] Push token:', data.registrationId);
        if (_onPushRegistration) _onPushRegistration(data.registrationId);
    });

    _pushInstance.on('notification', (data) => {
        console.log('[CordovaInit] Push notification recibida:', data);
        if (_onPushNotification) _onPushNotification(data);
    });

    _pushInstance.on('error', (e) => {
        console.error('[CordovaInit] Push error:', e.message || e);
    });

    console.log('[CordovaInit] Push Notifications inicializado');
    return _pushInstance;
}


/**
 * Registra callback para cuando llega una notificación push.
 */
export function onPushNotification(cb) {
    _onPushNotification = cb;
}


/**
 * Registra callback para cuando se obtiene el token de registro (FCM/APNs).
 */
export function onPushRegistration(cb) {
    _onPushRegistration = cb;
}


/**
 * Muestra una notificación local en Cordova.
 * Requiere cordova-plugin-local-notification.
 */
export function showLocalNotification(title, options = {}) {
    if (typeof window === 'undefined') return;

    // Si estamos en iframe, enviar al launcher vía postMessage
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'LOCAL_NOTIFICATION',
            title,
            body: options.body || '',
            icon: options.icon || '',
        }, '*');
        return;
    }

    if (window.cordova?.plugins?.notification?.local) {
        window.cordova.plugins.notification.local.schedule({
            title: title,
            text: options.body || '',
            icon: options.icon || '',
            smallIcon: 'res://ic_notification',
            foreground: true,
        });
        return;
    }

    console.warn('[CordovaInit] cordova-plugin-local-notification no disponible');
}


/**
 * Devuelve true si los plugins de Cordova están disponibles.
 */
export function isDeviceReady() {
    return _deviceReady;
}


/**
 * Devuelve la instancia del push plugin (o null).
 */
export function getPushInstance() {
    return _pushInstance;
}
