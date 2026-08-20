'use client';
import { useState, useEffect } from 'react';
import { getUsersList } from '@/libs/ajaxClient/user.fecth';

/**
 * BUSCAR USUARIOS POR NOMBRE, CONTRA EL SERVIDOR.
 *
 * Devuelve `{ usuarios, cargando, error }` para el texto que se le pase, con
 * el nombre ya armado y el puesto listo para mostrar.
 *
 *     const [texto, setTexto] = useState('');
 *     const { usuarios, cargando } = useUserSearch(texto);
 *
 * Es el mismo `/user/list` que usa el directorio de `/user/config`: filtra por
 * nombre y apellido, cada palabra tiene que aparecer en uno de los dos, y
 * devuelve una página. Buscar allá y no acá importa porque son cientos de
 * usuarios: traerlos todos para filtrarlos en el navegador son cientos de
 * documentos moviéndose para mostrar ocho.
 *
 *
 * LAS DOS COSAS QUE HACEN QUE UN BUSCADOR NO MOLESTE
 *
 * La ESPERA: no se consulta en cada tecla, se espera a que la persona pare de
 * escribir. «Bresia» son seis pulsaciones y seis consultas de las que solo
 * sirve la última.
 *
 * La CANCELACIÓN: la consulta anterior se aborta. Sin eso gana la respuesta
 * que vuelve última, que no es siempre la última que se pidió, y la lista
 * termina mostrando resultados de un texto que ya no está escrito.
 */

const ESPERA_MS = 250;

export default function useUserSearch(texto = '', { limite = 8 } = {}) {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const control = new AbortController();
        setCargando(true);
        setError(null);

        const temporizador = setTimeout(() => {
            getUsersList({ search: texto.trim(), limit: limite, signal: control.signal })
                .then(datos => setUsuarios((datos?.users ?? []).map(comoOpcion)))
                .catch(e => {
                    // Abortar es lo normal acá: pasa en cada tecla.
                    if (e?.name === 'CanceledError' || e?.name === 'AbortError') return;
                    setError(e?.response?.data?.message || 'No se pudo buscar');
                })
                .finally(() => {
                    if (!control.signal.aborted) setCargando(false);
                });
        }, ESPERA_MS);

        return () => { clearTimeout(temporizador); control.abort(); };
    }, [texto, limite]);

    return { usuarios, cargando, error };
}


/** Lo que el buscador necesita de un usuario, y nada más. */
const comoOpcion = (u) => ({
    _id: String(u._id),
    name: u.name ?? '',
    surName: u.surName ?? '',
    nombre: [u.name, u.surName].filter(Boolean).join(' ').trim(),
    position: u.jobInformation?.position ?? null,
    inabilited: u.inabilited === true,
});
