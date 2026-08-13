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
//
//
// QUÉ SE BUSCA EN EL ASPECTO
//
// Que se pueda TRABAJAR con él, no que se vea bonito. Un directorio se abre
// para buscar a alguien, filtrar por departamento y a veces imprimirlo. De ahí
// salen las decisiones:
//
//   · filtro automático en los encabezados, para acotar sin escribir fórmulas
//   · encabezado congelado, porque con setenta filas se pierde de vista
//   · cédula y teléfono como TEXTO, o Excel se come el cero de la izquierda y
//     convierte "0414-1112233" en una operación
//   · líneas horizontales suaves y filas alternas: la vista viaja por la fila,
//     y una cuadrícula completa compite con los datos
//   · configurado para imprimir en horizontal, con los encabezados repetidos
//     en cada página

/** Alto de la fila y lado de la foto, en píxeles. */
export const FOTO = 56;

/**
 * Alto de fila en PUNTOS. Excel mide las filas en puntos y las imágenes en
 * píxeles: a 96 ppp, un punto son 1,333 píxeles. Se deja un poco de aire por
 * encima y por debajo de la foto.
 */
const FILA_PT = 48;
const FILA_PX = FILA_PT * (96 / 72);

export const COLUMNAS = [
    { header: 'Foto', key: 'foto', width: 11, align: 'center' },
    { header: 'Nombre', key: 'name', width: 18 },
    { header: 'Apellido', key: 'surName', width: 18 },
    { header: 'Cédula identidad', key: 'dni', width: 17, texto: true },
    { header: 'Cargo', key: 'position', width: 22 },
    { header: 'Departamento', key: 'department', width: 21 },
    { header: 'Turno', key: 'shift', width: 11, align: 'center' },
    { header: 'Correo', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'phone', width: 16, texto: true },
];

const VERDE = 'FF1F9A08';
const CREMA = 'FFF7FAF5';
const LINEA = 'FFE1E7DD';
const TINTA = 'FF1A1A1A';
const SUAVE = 'FF6B7280';

const FUENTE = { name: 'Calibri', size: 11 };


/**
 * Arma el libro y devuelve su contenido binario.
 *
 * @param {object}   params
 * @param {Function} params.ExcelJS   el módulo, inyectado por quien llama
 * @param {Array}    params.usuarios  documentos de usuario tal como los da la API
 * @param {Array}    params.fotos     misma longitud que `usuarios`;
 *                                    { buffer, extension } o null
 * @returns {Promise<ArrayBuffer>}
 */
export async function construirLibroUsuarios({ ExcelJS, usuarios, fotos = [] }) {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'Jarvis365';
    libro.created = new Date();

    const hoja = libro.addWorksheet('Directorio', {
        // El encabezado queda fijo al desplazar: con setenta y seis filas, sin
        // esto se pierde de vista a la tercera vuelta de rueda.
        views: [{ state: 'frozen', ySplit: 1, activeCell: 'B2' }],
        pageSetup: {
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printTitlesRow: '1:1',   // los encabezados se repiten en cada hoja
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
        },
    });

    hoja.columns = COLUMNAS.map(c => ({ key: c.key, width: c.width }));

    // ── Encabezado ────────────────────────────────────────────────────
    const cabecera = hoja.getRow(1);
    cabecera.values = COLUMNAS.map(c => c.header);
    cabecera.height = 26;

    cabecera.eachCell((celda, i) => {
        celda.font = { ...FUENTE, bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
        celda.alignment = {
            vertical: 'middle',
            horizontal: COLUMNAS[i - 1]?.align || 'left',
        };
        celda.border = { bottom: { style: 'medium', color: { argb: VERDE } } };
    });

    // Filtro automático: acotar por departamento o turno sin escribir nada.
    const ultimaCol = String.fromCharCode(64 + COLUMNAS.length);
    hoja.autoFilter = `A1:${ultimaCol}1`;

    // ── Filas ─────────────────────────────────────────────────────────
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

        fila.height = FILA_PT;

        fila.eachCell({ includeEmpty: true }, (celda, j) => {
            const col = COLUMNAS[j - 1];
            if (!col) return;

            celda.font = { ...FUENTE, color: { argb: TINTA } };
            celda.alignment = {
                vertical: 'middle',
                horizontal: col.align || 'left',
                indent: col.align ? 0 : 1,
            };

            // Cédula y teléfono como texto: si Excel los toma por números, se
            // come el cero inicial y "0414-1112233" pasa a ser una resta.
            if (col.texto) celda.numFmt = '@';

            // El correo en gris: es el dato más largo de la fila y en negro
            // pleno tira del ojo por encima del nombre, que es lo que se busca.
            if (col.key === 'email') celda.font = { ...FUENTE, color: { argb: SUAVE } };

            // Solo línea inferior. Una cuadrícula completa compite con los
            // datos; la vista tiene que viajar por la fila, no por la celda.
            celda.border = { bottom: { style: 'thin', color: { argb: LINEA } } };

            if (i % 2 === 1) {
                celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREMA } };
            }
        });

        const foto = fotos[i];
        if (!foto) return;

        const idImagen = libro.addImage({ buffer: foto.buffer, extension: foto.extension });

        // Centrada en su celda. `tl` va en base cero y la fila 1 es el
        // encabezado, así que la primera persona —índice 0— ancla en row 1.
        const anchoColPx = COLUMNAS[0].width * 7;          // ~7 px por carácter
        const margenX = Math.max(0, (anchoColPx - FOTO) / 2) / anchoColPx;
        const margenY = Math.max(0, (FILA_PX - FOTO) / 2) / FILA_PX;

        hoja.addImage(idImagen, {
            tl: { col: margenX, row: i + 1 + margenY },
            ext: { width: FOTO, height: FOTO },
        });
    });

    return libro.xlsx.writeBuffer();
}
