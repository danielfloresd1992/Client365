'use client';
import { useState, useEffect } from 'react';
import { fetchUserData, userById } from '@/libs/ajaxClient/user.fecth';

/**
 * LA LISTA DE USUARIOS HABILITADOS, UNA SOLA VEZ POR SESIÓN.
 *
 * Devuelve `{ usuarios, cargando, error }`. Cada usuario trae lo suficiente
 * para elegirlo de una lista: `_id`, `name`, `surName`, `position` y el
 * `nombre` ya armado.
 *
 *
 * POR QUÉ HAY UNA CACHÉ ACÁ
 *
 * `/user/AllById` devuelve SOLO los `_id`, así que para tener los nombres hay
 * que pedir cada usuario por separado. Son unas ochenta peticiones. La página
 * de usuarios y la de asistencia ya hacen exactamente eso, cada una por su
 * lado y cada vez que se montan.
 *
 * La promesa se guarda a nivel de módulo, no de componente: la segunda
 * pantalla que pida la lista se cuelga de la misma promesa en vuelo y no
 * dispara nada. Mientras la sesión dure, las ochenta peticiones pasan una vez.
 *
 * LO QUE DE VERDAD HARÍA FALTA es que el servidor devuelva `_id name surName`
 * en una sola llamada. Cuando ese endpoint exista, este hook cambia por
 * dentro y ningún componente se entera — que es justamente para lo que está.
 */

let enVuelo = null;

/** Fuerza a que la próxima consulta vuelva a pedir. Para después de crear o editar un usuario. */
export const olvidarUsuarios = () => { enVuelo = null; };

const traerUsuarios = () => {
    if (enVuelo) return enVuelo;

    enVuelo = (async () => {
        const { result = [] } = await fetchUserData();

        const completos = await Promise.all(
            result.map(u => userById(u._id).then(r => r.result).catch(() => null)),
        );

        return completos
            .filter(Boolean)
            .map(u => ({
                _id: String(u._id),
                name: u.name ?? '',
                surName: u.surName ?? '',
                position: u.job?.position ?? u.position ?? null,
                nombre: [u.name, u.surName].filter(Boolean).join(' ').trim(),
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    })();

    // Un fallo no se cachea: si se cayó la red, el próximo montaje reintenta.
    enVuelo.catch(() => { enVuelo = null; });

    return enVuelo;
};


export default function useUsers() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let vivo = true;

        traerUsuarios()
            .then(lista => { if (vivo) setUsuarios(lista); })
            .catch(e => { if (vivo) setError(e?.message || 'No se pudo cargar la lista de usuarios'); })
            .finally(() => { if (vivo) setCargando(false); });

        return () => { vivo = false; };
    }, []);

    return { usuarios, cargando, error };
}
