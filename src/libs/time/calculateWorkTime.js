import { differenceInMinutes, parseISO } from 'date-fns';

export const calculateWorkTime = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;

    // Aseguramos que sean objetos Date
    const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
    const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;

    // Obtenemos la diferencia total en minutos
    const totalMinutes = differenceInMinutes(end, start);

    if (totalMinutes < 0) return "Error: Salida antes de entrada";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
        totalMinutes,
        formatted: `${hours}h ${minutes}m`,
        decimal: parseFloat((totalMinutes / 60).toFixed(2)) // Útil para nóminas (ej: 8.5)
    };
};