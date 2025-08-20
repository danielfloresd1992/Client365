/**
 * Convierte una cadena de tiempo en formato 'HH:mm:ss' a milisegundos.
 * @param {string} timeString - La cadena de tiempo en formato 'HH:mm:ss'.
 * @returns {number} - El número total de milisegundos.
 */


export default function timeToMilliseconds(timeString) {
    // Separa la cadena por ':' y convierte los segmentos a números
    const parts = timeString.split(':').map(Number);

    // Asigna los valores a horas, minutos y segundos
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    // Calcula el total de milisegundos
    const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

    return totalMilliseconds;
}
