import { fetchUserData, userById } from '@/libs/ajaxClient/user.fecth';
import { thumbUrl } from '@/libs/image';
import { construirLibroUsuarios, FOTO } from './usersWorkbook';

// ══════════════════════════════════════════════════════════════════════
// DIRECTORIO DE USUARIOS ACTIVOS EN EXCEL
// ══════════════════════════════════════════════════════════════════════
// Genera un .xlsx con foto, nombre, apellido, cédula, cargo, departamento,
// turno, correo y teléfono de todos los usuarios que NO estén inhabilitados.
//
// POR QUÉ ExcelJS Y NO LA LIBRERÍA HABITUAL
//
// Porque el archivo lleva FOTOS. SheetJS —la opción típica— no puede incrustar
// imágenes en su versión libre; ExcelJS sí. Se carga con `import()` dinámico
// dentro de la función: pesa cerca de un mega y sería absurdo que lo
// descargara todo el que entra a /user/config sin pulsar el botón.
//
// POR QUÉ SE PIDE UN USUARIO POR PETICIÓN
//
// El endpoint que filtra por inhabilitados (`/user/AllById?inabilited=false`)
// devuelve SOLO los identificadores, así que los datos hay que pedirlos uno a
// uno. No es un capricho: es exactamente lo que ya hace la grilla de /user en
// cada carga. Se lanzan en tandas para no abrir setenta y seis conexiones a la
// vez.
//
// Con un endpoint que devolviera los campos de una sola vez esto sería una
// petición en lugar de setenta y siete. Queda anotado como la mejora obvia
// para cuando toque tocar la API.

/** Cuántos usuarios se piden a la vez. */
const TANDA = 12;

/** Trae los detalles en tandas, conservando el orden de llegada. */
const traerDetalles = async (ids, onProgress) => {
    const usuarios = [];

    for (let i = 0; i < ids.length; i += TANDA) {
        const lote = ids.slice(i, i + TANDA);
        const resultados = await Promise.all(
            // Un usuario que falle no puede tumbar la exportación entera: se
            // descarta y el resto del directorio sale igual.
            lote.map(id => userById(id).then(r => r?.result || null).catch(() => null)),
        );
        usuarios.push(...resultados.filter(Boolean));
        onProgress?.({ fase: 'datos', hechos: Math.min(i + TANDA, ids.length), total: ids.length });
    }

    return usuarios;
};


/**
 * Descarga una foto como buffer.
 *
 * Devuelve null ante cualquier problema —la imagen ya no está, el servidor no
 * permite leerla desde otro origen— porque una foto que falta no puede impedir
 * que salga el directorio.
 */
const traerFoto = async (url) => {
    if (!url) return null;
    try {
        const respuesta = await fetch(thumbUrl(url, FOTO * 2), { mode: 'cors' });
        if (!respuesta.ok) return null;

        const blob = await respuesta.blob();
        const extension = blob.type.includes('png') ? 'png' : 'jpeg';
        return { buffer: await blob.arrayBuffer(), extension };
    }
    catch {
        return null;
    }
};


/**
 * Arma el .xlsx y lo descarga.
 *
 * @param {object} [opts]
 * @param {(p: { fase: string, hechos?: number, total?: number }) => void} [opts.onProgress]
 *        Se llama a medida que avanza, para poder mostrarlo en el botón.
 * @returns {Promise<{ total: number, conFoto: number, archivo: string }>}
 */
export async function exportarUsuariosActivos({ onProgress } = {}) {
    onProgress?.({ fase: 'consultando' });

    // 1. Quiénes están activos. El filtro lo aplica el servidor.
    const lista = await fetchUserData();
    const ids = (lista?.result || []).map(u => u._id).filter(Boolean);
    if (ids.length === 0) throw new Error('No hay usuarios activos que exportar.');

    // 2. Sus datos.
    const detalles = await traerDetalles(ids, onProgress);
    if (detalles.length === 0) throw new Error('No se pudo leer ningún usuario.');

    // 3. Fuera los que están al margen de la estructura de horario.
    //
    // El servidor ya filtró por inhabilitados, pero `outForkSchedule` no viaja
    // en esa consulta, así que se aplica acá.
    //
    // Se descarta solo cuando vale TRUE, no cuando es distinto de false: hay
    // usuarios sin el campo, y para el resto de la plataforma —la grilla de
    // /user y el corte diario— esos SÍ cuentan. Exigir un false explícito los
    // dejaría fuera del directorio sin motivo.
    const usuarios = detalles.filter(u => u?.workSchedule?.outForkSchedule !== true);
    if (usuarios.length === 0) {
        throw new Error('Ningún usuario activo está dentro de la estructura de horario.');
    }

    // Se ordena como el resto de la plataforma: por apellido y luego nombre.
    usuarios.sort((a, b) =>
        `${a.surName || ''}${a.name || ''}`.localeCompare(`${b.surName || ''}${b.name || ''}`, 'es'));

    // 4. Las fotos, en paralelo. Van después de los datos para no competir por
    //    conexiones con las peticiones de arriba.
    onProgress?.({ fase: 'fotos', hechos: 0, total: usuarios.length });
    const fotos = await Promise.all(usuarios.map(u => traerFoto(u.img)));

    // 5. El libro. El armado vive aparte, en usersWorkbook.js, para poder
    //    comprobarlo fuera del navegador.
    onProgress?.({ fase: 'generando' });
    const ExcelJS = (await import('exceljs')).default;
    const datos = await construirLibroUsuarios({ ExcelJS, usuarios, fotos });

    // 6. Descarga.
    const archivo = `usuarios-activos-${new Date().toISOString().slice(0, 10)}.xlsx`;

    const url = URL.createObjectURL(
        new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    );
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    // Sin esto el blob se queda en memoria hasta que se recargue la pestaña.
    URL.revokeObjectURL(url);

    return {
        total: usuarios.length,
        conFoto: fotos.filter(Boolean).length,
        archivo,
    };
}
