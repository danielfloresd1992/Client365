'use client';
import { useEffect, useState } from 'react';

/**
 * Reloj en vivo. Devuelve null hasta montar (evita desajustes de hidratación
 * entre servidor y cliente) y luego un Date que avanza cada `intervalMs`.
 */
export default function useLiveClock(intervalMs = 1000) {

    const [now, setNow] = useState(null);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
}
