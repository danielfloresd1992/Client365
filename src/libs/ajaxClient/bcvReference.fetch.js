/**
 * LA TASA DEL BCV, COMO REFERENCIA.
 *
 * El Banco Central no publica API: su sitio es HTML y además no manda
 * cabeceras CORS, así que desde el navegador no se puede leer. Esto consulta
 * ve.dolarapi.com, que republica la tasa oficial en JSON y sí permite CORS.
 *
 * Es una REFERENCIA, no la fuente de verdad. Llena el campo para que un
 * administrador lo revise y lo guarde; nada se actualiza solo. Por eso vive
 * en el front y no hay endpoint propio: si el servicio se cae, lo único que
 * se pierde es la comodidad de no copiar el número a mano.
 *
 * OJO: va por `fetch` pelado y NO por `axiosInstance`. El cliente de la casa
 * manda la cookie de sesión en cada llamada, y esto es un tercero: no tiene
 * por qué recibirla.
 *
 * SOBRE LA FECHA: el valor que devuelve es el VIGENTE HOY. El sitio del BCV,
 * en cambio, muestra el del PRÓXIMO día hábil cuando se lo mira de tarde —
 * publica al cierre la tasa que rige mañana. Los dos números son correctos y
 * distintos, así que el día que declara viene en la respuesta y se muestra:
 * sin eso, comparar contra bcv.org.ve parece un error y no lo es.
 */

const URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

export const getBcvReference = async ({ signal } = {}) => {
    const respuesta = await fetch(URL, {
        signal,
        credentials: 'omit',
        headers: { Accept: 'application/json' },
    });

    if (!respuesta.ok) throw new Error(`El servicio de referencia respondió ${respuesta.status}`);

    const datos = await respuesta.json();
    const valor = Number(datos?.promedio);

    // Un cero o un texto acá significan que cambió el formato de la respuesta.
    // Mejor fallar que escribir una tasa inventada en el campo del dinero.
    if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error('La respuesta no trae una tasa usable');
    }

    return {
        valor,
        fecha: datos?.fechaActualizacion ? new Date(datos.fechaActualizacion) : null,
        fuente: 've.dolarapi.com',
    };
};

export default getBcvReference;
