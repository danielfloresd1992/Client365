function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permiso para notificaciones concedido');
                // Aquí podrías registrar el Service Worker para push
            }
        });
    }
}

// Mostrar una notificación
export function showBrowserNotification(title, options) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'denied') {
        requestNotificationPermission();
    }
}

