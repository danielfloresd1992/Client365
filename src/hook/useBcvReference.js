'use client';
import { useState, useEffect, useCallback } from 'react';
import { getBcvReference } from '@/libs/ajaxClient/bcvReference.fetch';

/**
 * La tasa del BCV de referencia, consultada al montar.
 *
 * Devuelve `{ tasa, cargando, error, recargar }`. `tasa` es
 * `{ valor, fecha, fuente }` o null.
 *
 * El error se guarda y no se avisa por modal: esto es una comodidad, no una
 * función. Que el servicio de referencia esté caído no puede interrumpir a
 * alguien que entró a cambiar el valor del bono, que no tiene nada que ver.
 */
export default function useBcvReference() {
    const [tasa, setTasa] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        // Se aborta al desmontar: la tarjeta vive en una pestaña, y cambiar de
        // pestaña mientras la consulta viaja dejaría un setState sobre algo
        // que ya no existe.
        const control = new AbortController();

        setCargando(true);
        setError(null);

        getBcvReference({ signal: control.signal })
            .then(setTasa)
            .catch(e => {
                if (e?.name !== 'AbortError') setError(e?.message || 'No se pudo consultar la referencia');
            })
            .finally(() => {
                if (!control.signal.aborted) setCargando(false);
            });

        return () => control.abort();
    }, [intento]);

    const recargar = useCallback(() => setIntento(n => n + 1), []);

    return { tasa, cargando, error, recargar };
}
