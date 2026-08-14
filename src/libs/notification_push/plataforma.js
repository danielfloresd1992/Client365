'use client';

import { waitForDeviceReady, initPushNotifications } from '@/libs/script/cordovaInit';
import { registerServiceWorker, showBrowserNotification } from './native';

// ══════════════════════════════════════════════════════════════════════
// LA PLATAFORMA DE AVISOS, LISTA UNA SOLA VEZ
// ══════════════════════════════════════════════════════════════════════
// Antes, quien quisiera mostrar una notificación del sistema tenía que saber
// primero si estaba dentro del APK o en un navegador, y preparar lo que
// correspondiera. Eso vivía dentro de un componente, así que el resto de la
// aplicación no podía notificar sin montarlo.
//
// Acá esa preparación se hace UNA vez por carga de página y `avisar()` queda
// disponible desde cualquier lado.
//
//
// EL CANDADO ES LA PROMESA, NO UNA BANDERA
//
// Con `let listo = false` dos llamadas en el mismo tick pasan las dos antes de
// que ninguna termine, y se prepararía dos veces. Guardando la PROMESA, la
// segunda espera a la primera.
//
//
// POR QUÉ ARRANCA SOLA AL IMPORTARSE
//
// waitForDeviceReady() sondea los plugins de Cordova durante unos segundos
// antes de rendirse; en un navegador ese tiempo se pierde siempre. Empezando al
// cargar la página, se gasta cuando nadie lo está esperando, y para cuando
// llegue el primer aviso ya está resuelto.

/** La preparación en curso, o la ya terminada. */
let preparacion = null;

/**
 * Deja lista la plataforma de avisos. Idempotente: llamarla mil veces prepara
 * una sola.
 *
 * @returns {Promise<'nativo'|'service-worker'|'directo'>} por qué canal se va a
 *          notificar. 'directo' es el peor: solo funciona con la aplicación en
 *          primer plano.
 */
export function prepararAvisos() {
    if (preparacion) return preparacion;

    preparacion = (async () => {
        const enCordova = await waitForDeviceReady();

        if (enCordova) {
            // El plugin pide sus propios permisos en Android 13+.
            initPushNotifications();
            return 'nativo';
        }

        const registro = await registerServiceWorker();
        return registro ? 'service-worker' : 'directo';
    })();

    // Si falla se olvida, para que el próximo intento vuelva a probar. Cachear
    // una promesa rechazada dejaría la aplicación sin avisos hasta recargar.
    preparacion.catch(() => { preparacion = null; });

    return preparacion;
}


/**
 * Cuánto se espera como mucho a que la plataforma esté lista antes de notificar
 * igual.
 *
 * Sin tope, el primer aviso de la sesión podría quedarse esperando el sondeo de
 * Cordova. Notificar por un canal peor es mejor que no notificar: showBrowser-
 * Notification tiene sus propios respaldos y ya no se cuelga sin Service Worker.
 */
const ESPERA_MAXIMA_MS = 1500;

const conTope = (promesa, ms) => Promise.race([
    promesa,
    new Promise(resolve => setTimeout(() => resolve('sin-esperar'), ms)),
]);


/**
 * Muestra una notificación del sistema desde donde sea.
 *
 * Nunca lanza: un aviso que no se pudo mostrar no puede romper lo que lo pidió.
 *
 * @param {string} titulo
 * @param {object} opciones  { body, icon, image, tag, url, requireInteraction }
 */
export async function avisar(titulo, opciones = {}) {
    if (!titulo) return;

    try {
        await conTope(prepararAvisos(), ESPERA_MAXIMA_MS);
        await showBrowserNotification(titulo, opciones);
    }
    catch (err) {
        console.warn('[Avisos] No se pudo mostrar la notificación:', err);
    }
}


// Arranca al importarse. Ver la nota de arriba: el sondeo de Cordova conviene
// gastarlo durante la carga y no delante del primer aviso.
if (typeof window !== 'undefined') prepararAvisos();
