'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from '@/libs/ajaxClient/apiKey.fecth';

/**
 * EL ESTADO DE LAS LLAVES DE INTEGRACIÓN.
 *
 * La página se queda con el dibujo y acá vive el trato con el servidor: pedir la
 * lista, emitir, revocar. Separado porque son dos cosas que cambian por motivos
 * distintos —el diseño de la tabla y la forma del recurso— y porque así se puede
 * leer cada una sin la otra.
 *
 * LA LLAVE RECIÉN CREADA NO SE GUARDA ACÁ COMO UNA MÁS. Vive en su propio
 * estado, `llaveNueva`, porque es lo único de toda la pantalla que no se puede
 * volver a pedir: el servidor la muestra una vez y después solo queda su firma.
 * Mezclarla con la lista la haría desaparecer en el próximo refresco, y con ella
 * el secreto.
 */
export default function useApiKeys() {

    const [llaves, setLlaves] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    /** La llave recién emitida, con su secreto. Se limpia cuando el usuario la descarta. */
    const [llaveNueva, setLlaveNueva] = useState(null);

    /** Hay una operación de escritura en curso: evita dobles clics. */
    const [guardando, setGuardando] = useState(false);


    const refrescar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const data = await getApiKeys();
            setLlaves(Array.isArray(data?.apiKeys) ? data.apiKeys : []);
        }
        catch (fallo) {
            setError(mensajeDeError(fallo, 'No se pudieron cargar las llaves.'));
        }
        finally {
            setCargando(false);
        }
    }, []);


    useEffect(() => { refrescar(); }, [refrescar]);


    /**
     * Emite una llave y deja su secreto a la vista.
     *
     * Devuelve `true` si salió bien, para que el formulario sepa si cerrarse. No
     * se refresca la lista antes de mostrar el secreto: si algo fallara en ese
     * refresco, el secreto se perdería sin que nadie lo haya copiado.
     */
    const emitir = useCallback(async ({ name, expiresAt }) => {
        setGuardando(true);
        setError(null);
        try {
            const data = await createApiKey({
                name,
                ...(expiresAt ? { expiresAt } : {}),
            });

            setLlaveNueva({ ...data.apiKey, plaintext: data.plaintext });
            await refrescar();
            return true;
        }
        catch (fallo) {
            setError(mensajeDeError(fallo, 'No se pudo crear la llave.'));
            return false;
        }
        finally {
            setGuardando(false);
        }
    }, [refrescar]);


    const revocar = useCallback(async (id) => {
        setGuardando(true);
        setError(null);
        try {
            await deleteApiKey(id);
            // Se saca de la lista al instante en vez de esperar el refresco: la
            // llave ya dejó de funcionar en el servidor, y verla un segundo más
            // haría dudar de si el borrado ocurrió.
            setLlaves(previas => previas.filter(l => l._id !== id));
            return true;
        }
        catch (fallo) {
            setError(mensajeDeError(fallo, 'No se pudo eliminar la llave.'));
            await refrescar();
            return false;
        }
        finally {
            setGuardando(false);
        }
    }, [refrescar]);


    const descartarLlaveNueva = useCallback(() => setLlaveNueva(null), []);


    return { llaves, cargando, error, llaveNueva, guardando, emitir, revocar, descartarLlaveNueva, refrescar };
}


/**
 * El motivo real del fallo, si el servidor lo dijo.
 *
 * La API responde `{ status, error, message }` y `message` está escrito para
 * leerse. Un 403 acá significa algo concreto —«no sos administrador»— y decirlo
 * ahorra el rato de no entender por qué no funciona.
 */
function mensajeDeError(fallo, porDefecto) {
    const delServidor = fallo?.response?.data?.message;
    if (delServidor) return delServidor;

    // Sin `response` no hubo respuesta legible: la API no contesta, o contestó
    // de una forma que el navegador bloqueó.
    if (!fallo?.response) return 'No hubo respuesta de la API de Jarvis365. Revisá la conexión.';

    return porDefecto;
}
