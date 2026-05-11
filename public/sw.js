// Service Worker para Jarvis365 — Push Notifications

const CACHE_NAME = 'jarvis365-v1';

// Install
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
    let data = { title: 'Jarvis365', body: 'Nueva notificación' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/ico/icons8-campana-48.png',
        badge: '/ico/icons8-campana-25.png',
        image: data.image || undefined,
        vibrate: [200, 100, 200],
        tag: data.tag || 'jarvis365-alert',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: {
            url: data.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Jarvis365', options)
    );
});

// Click on notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Si ya hay una ventana abierta, enfocarla
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                // Si no, abrir nueva ventana
                return self.clients.openWindow(urlToOpen);
            })
    );
});

// Notification close (analytics si se necesita en el futuro)
self.addEventListener('notificationclose', (event) => {
    // Placeholder
});
