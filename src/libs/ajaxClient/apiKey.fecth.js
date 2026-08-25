import axiosInstance from '@/libs/ajaxClient/axios.fetch';

/*
 * LLAVES DE INTEGRACIÓN (API keys).
 *
 * Recurso `api-key` de api_jarvis365. Son las credenciales con las que un
 * PROGRAMA —el asistente de IA, un panel, un script— consulta la API sin ser una
 * persona con sesión iniciada.
 *
 * Las tres rutas exigen una persona administradora con sesión: una llave no
 * puede crear otra llave. Por eso todo esto viaja con la cookie de siempre
 * (`withCredentials` ya está puesto en la instancia) y NUNCA con una API key.
 *
 * EL SECRETO SE VE UNA SOLA VEZ. `createApiKey` lo devuelve en `plaintext` y ese
 * es el único momento en que existe fuera del servidor: la base solo guarda su
 * firma. Quien llame a esto tiene que mostrarlo y dejar que se copie, porque no
 * hay forma de volver a pedirlo.
 */


/**
 * GET /api-key — las llaves emitidas.
 *
 * Sin secretos: alcanza para administrarlas, no para usarlas. `lastUsedAt` y
 * `usageCount` son los que dicen si una llave sigue viva o quedó olvidada.
 *
 * @returns {Promise<{ status: number, apiKeys: Array }>}
 */
export const getApiKeys = async () => {
    const response = await axiosInstance.get('/api-key');
    return response.data;
};


/**
 * POST /api-key — emite una llave nueva.
 *
 * @param {{ name: string, expiresAt?: string|null }} datos
 *        `name` dice para qué es (mínimo 3 caracteres). `expiresAt` en ISO, o
 *        se omite para una llave que no caduca.
 * @returns {Promise<{ status: number, apiKey: object, plaintext: string }>}
 *          `plaintext` es la llave completa. No se vuelve a mostrar.
 */
export const createApiKey = async (datos) => {
    const response = await axiosInstance.post('/api-key', datos);
    return response.data;
};


/**
 * DELETE /api-key/:id — borra una llave.
 *
 * El efecto es inmediato: la siguiente petición que la use recibe 401. No hay
 * caché ni ventana de gracia.
 *
 * @param {string} id
 * @returns {Promise<{ status: number, apiKey: object }>}
 */
export const deleteApiKey = async (id) => {
    const response = await axiosInstance.delete(`/api-key/${id}`);
    return response.data;
};


export default { getApiKeys, createApiKey, deleteApiKey };
