'use client';

/**
 * Puente de inicialización para Cordova.
 *
 * Detecta si la app corre en un entorno Cordova y gestiona:
 *  - Espera a `deviceready`
 *  - Inicialización de Push Notifications (@havesource/cordova-plugin-push)
 *  - Estado de permisos nativos
 */

/** Detecta si estamos en un entorno Cordova/Capacitor */
export function isCordovaEnv() {
    if (typeof window === 'undefined') return false;
    return (
        !!window.cordova ||
        !!window.Cordova ||
        !!window._cordovaNative ||
        (document.URL.indexOf('http://') === -1 &&
         document.URL.indexOf('https://') === -1)
    );
}


// Estado interno
let _deviceReady = false;
let _deviceReadyPromise = null;
let _pushInstance = null;
let _onPushNotification = null;
let _onPushRegistration = null;


/**
 * Espera a que Cordova esté completamente listo (deviceready).
 * Si no estamos en Cordova, resuelve inmediatamente.
 */
export function waitForDeviceReady() {
    if (!isCordovaEnv()) return Promise.resolve(false);
    if (_deviceReady) return Promise.resolve(true);

    if (!_deviceReadyPromise) {
        _deviceReadyPromise = new Promise((resolve) => {
            const onReady = () => {
                _deviceReady = true;
                document.removeEventListener('deviceready', onReady);
                console.log('[CordovaInit] deviceready disparado');
                resolve(true);
            };

            document.addEventListener('deviceready', onReady, false);

            // Timeout de seguridad: si deviceready no se dispara en 5s, resolver igualmente
            setTimeout(() => {
                if (!_deviceReady) {
                    console.warn('[CordovaInit] deviceready no se disparó en 5s, continuando...');
                    _deviceReady = true;
                    resolve(true);
                }
            }, 5000);
        });
    }

    return _deviceReadyPromise;
}


/**
 * Inicializa Push Notifications con @havesource/cordova-plugin-push.
 * Debe llamarse después de `deviceready`.
 *
 * En Android 13+ el plugin pide automáticamente el permiso POST_NOTIFICATIONS.
 */
export function initPushNotifications() {
    if (!isCordovaEnv() || !window.PushNotification) {
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
            forceShow: true, // Muestra notificación aunque la app esté en foreground
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
 * Requiere cordova-plugin-local-notification (opcional).
 * Si no está disponible, usa el título como fallback con un alert.
 */
export function showLocalNotification(title, options = {}) {
    if (!isCordovaEnv()) return;

    // Si tiene cordova-plugin-local-notification
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

    // Fallback: no hay plugin de notificaciones locales
    console.warn('[CordovaInit] cordova-plugin-local-notification no disponible');
}


/**
 * Devuelve true si deviceready ya se disparó.
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
