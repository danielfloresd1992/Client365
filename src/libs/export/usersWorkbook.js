// ══════════════════════════════════════════════════════════════════════
// EL LIBRO DE EXCEL DEL DIRECTORIO
// ══════════════════════════════════════════════════════════════════════
// Recibe los usuarios y sus fotos ya descargadas, y devuelve el .xlsx.
//
// Está separado de usersExcel.js a propósito: acá no hay red, ni `document`,
// ni imports de la aplicación. Solo ExcelJS. Eso permite ejecutarlo fuera del
// navegador para comprobar que el archivo sale como debe — encabezados,
// valores, fotos y sus posiciones—, que es justo lo que no se puede verificar
// mirando el código.

/** Alto de la fila y lado de la foto, en píxeles. */
export const FOTO = 56;

export const COLUMNAS = [
    { header: 'Foto', key: 'foto', width: 10 },
    { header: 'Nombre', key: 'name', width: 20 },
    { header: 'Apellido', key: 'surName', width: 20 },
    { header: 'Cédula identidad', key: 'dni', width: 18 },
    { header: 'Cargo', key: 'position', width: 22 },
    { header: 'Departamento', key: 'department', width: 22 },
    { header: 'Turno', key: 'shift', width: 12 },
    { header: 'Correo', key: 'email', width: 32 },
    { header: 'Teléfono', key: 'phone', width: 18 },
];

const VERDE = 'FF1F9A08';
const CREMA = 'FFF4F7F0';


/**
 * Arma el libro y devuelve su contenido binario.
 *
 * @param {object}   params
 * @param {Function} params.ExcelJS   el módulo, inyectado por quien llama
 * @param {Array}    params.usuarios  [{ name, surName, dni, email, phone }]
 * @param {Array}    params.fotos     misma longitud que `usuarios`;
 *                                    { buffer, extension } o null
 * @returns {Promise<ArrayBuffer>}
 */
export async function construirLibroUsuarios({ ExcelJS, usuarios, fotos = [] }) {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'Jarvis365';
    libro.created = new Date();

    const hoja = libro.addWorksheet('Usuarios activos', {
        // El encabezado queda fijo al desplazar: con setenta y seis filas, sin
        // esto se pierde de vista a la tercera vuelta de rueda.
        views: [{ state: 'frozen', ySplit: 1 }],
    });
    hoja.columns = COLUMNAS;

    const cabecera = hoja.getRow(1);
    cabecera.height = 22;
    cabecera.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cabecera.alignment = { vertical: 'middle', horizontal: 'left' };
    cabecera.eachCell(celda => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    });

    usuarios.forEach((u, i) => {
        // El cargo, el departamento y el turno viven anidados en el usuario.
        // Se aplanan acá y no en quien llama para que esta función siga
        // recibiendo el documento tal cual lo devuelve la API.
        const fila = hoja.addRow({
            foto: '',
            name: u.name || '',
            surName: u.surName || '',
            dni: u.dni || '',
            position: u.jobInformation?.position || '',
            department: u.jobInformation?.department || '',
            shift: u.workSchedule?.shiftType || '',
            email: u.email || '',
            phone: u.phone || '',
        });

        // Los puntos de Excel no son píxeles: 0.75 es la conversión.
        fila.height = FOTO * 0.78;
        fila.alignment = { vertical: 'middle' };

        if (i % 2 === 1) {
            fila.eachCell(celda => {
                celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREMA } };
            });
        }

        const foto = fotos[i];
        if (!foto) return;

        const idImagen = libro.addImage({ buffer: foto.buffer, extension: foto.extension });
        // `tl` va en base cero y la fila 1 es el encabezado, así que la primera
        // persona —índice 0— ocupa la fila 2 y ancla en row 1.
        hoja.addImage(idImagen, {
            tl: { col: 0.15, row: i + 1.1 },
            ext: { width: FOTO, height: FOTO },
        });
    });

    return libro.xlsx.writeBuffer();
}
