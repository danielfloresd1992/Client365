'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════════════
// CERROJO DE ENVÍO — evita el doble submit
// ══════════════════════════════════════════════════════════════════════
// POR QUÉ UN REF Y NO UN ESTADO
//
// El patrón habitual es `if (enviando) return; setEnviando(true)`. No sirve:
// setEnviando NO actualiza la variable en el acto, solo agenda un re-render.
// Dos clics en el mismo tick —o un doble clic, que es literalmente eso— leen
// ambos `enviando === false` y disparan las dos peticiones.
//
// El ref se lee y se escribe de forma SÍNCRONA, así que el segundo clic ve el
// cerrojo puesto por el primero. El estado se conserva aparte, solo para que
// los botones puedan mostrarse deshabilitados.
//
// Mismo criterio que ya usaba Noveltie.jsx para el envío a WhatsApp; acá se
// generaliza para no repetir el ref en cada componente.
//
// USO
//   const { run, isBusy } = useSubmitLock();
//
//   // una acción por componente
//   <button disabled={isBusy()} onClick={() => run(guardar)} />
//
//   // varias acciones independientes: una clave por cada una
//   <button disabled={isBusy('aprobar')} onClick={() => run(aprobar, 'aprobar')} />
//
// El valor que devuelve `run` es el de la función. Si la llamada se DESCARTA
// por estar en curso, devuelve SKIPPED, para que quien lo necesite pueda
// distinguir "se descartó" de "falló".

export const SKIPPED = Symbol('submit-descartado');

export default function useSubmitLock() {
    // Fuente de verdad del cerrojo. Síncrono.
    const locks = useRef(new Set());
    // Espejo para pintar: acá sí hace falta re-render.
    const [busyKeys, setBusyKeys] = useState([]);
    // Evita avisar a un componente ya desmontado.
    const mounted = useRef(true);

    useEffect(() => () => { mounted.current = false; }, []);

    const run = useCallback(async (fn, key = 'default') => {
        if (locks.current.has(key)) return SKIPPED;

        locks.current.add(key);
        setBusyKeys(prev => (prev.includes(key) ? prev : [...prev, key]));

        try {
            return await fn();
        }
        finally {
            // El cerrojo se libera SIEMPRE, incluso si la petición falló: si no,
            // un error dejaría el botón muerto hasta recargar la página.
            locks.current.delete(key);
            if (mounted.current) setBusyKeys(prev => prev.filter(k => k !== key));
        }
    }, []);

    const isBusy = useCallback((key = 'default') => busyKeys.includes(key), [busyKeys]);

    return { run, isBusy, busy: busyKeys.length > 0, SKIPPED };
}
