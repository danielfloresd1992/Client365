'use client';
import { useState, useCallback } from 'react';
import { getNoveltiesOfLocalByDay } from '@/libs/ajaxClient/noveltyReport.fecth';

/**
 * LAS ALERTAS DEL DÍA DE UN ESTABLECIMIENTO, PEDIDAS ANTES DE QUE HAGAN FALTA.
 *
 * Una caché por establecimiento, viva mientras dure la pantalla:
 *
 *     precargar(idLocal)   dispara la consulta y no espera — para el hover
 *     usar(idLocal)        lee lo que haya, o lo pide si nadie lo hizo
 *
 * La caché vive FUERA de React a propósito. Precargar tiene que poder arrancar
 * desde el `onMouseEnter` de una fila que todavía no desplegó nada: si el dato
 * viviera en el estado de un componente, ese componente tendría que existir
 * primero, y existir es justo lo que estamos adelantando.
 *
 * Entre que alguien apunta a una fila y hace clic pasan dos o tres décimas de
 * segundo. Alcanza para que la respuesta ya esté cuando el acordeón se abre.
 *
 * DEDUPLICA: pasar el mouse cinco veces por la misma fila pide una sola vez, y
 * abrir el acordeón después no vuelve a pedir. Un error NO se cachea —no tiene
 * sentido recordar que la red falló hace un rato—, así que el siguiente intento
 * lo reintenta solo.
 */

/** idLocal → { promesa, datos } */
const cache = new Map();

export const precargarAlertas = (idLocal, dia = '0') => {
    if (!idLocal) return Promise.resolve(null);

    const clave = `${idLocal}:${dia}`;
    const guardado = cache.get(clave);
    if (guardado) return guardado.promesa ?? Promise.resolve(guardado.datos);

    const promesa = getNoveltiesOfLocalByDay({ idLocal, dia })
        .then(datos => {
            cache.set(clave, { promesa: null, datos });
            return datos;
        })
        .catch(error => {
            cache.delete(clave);
            throw error;
        });

    cache.set(clave, { promesa, datos: null });
    return promesa;
};

/** Olvida lo cacheado. Al llegar alertas nuevas por socket, por ejemplo. */
export const olvidarAlertas = (idLocal = null) => {
    if (!idLocal) return cache.clear();
    for (const clave of [...cache.keys()]) {
        if (clave.startsWith(`${idLocal}:`)) cache.delete(clave);
    }
};


/**
 * El lado de React. Devuelve `{ datos, cargando, error, pedir }`.
 *
 * `pedir` es lo que se llama al abrir el acordeón: si el hover ya lo trajo,
 * resuelve al instante y no hay pantalla de carga.
 */
export default function useLocalAlerts(idLocal, dia = '0') {
    const [datos, setDatos] = useState(() => cache.get(`${idLocal}:${dia}`)?.datos ?? null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const pedir = useCallback(() => {
        setError(null);
        setCargando(true);

        return precargarAlertas(idLocal, dia)
            .then(setDatos)
            .catch(e => setError(e?.response?.data?.message || 'No se pudieron traer las alertas'))
            .finally(() => setCargando(false));
    }, [idLocal, dia]);

    return { datos, cargando, error, pedir };
}
