/*
 * LA MATEMÁTICA DEL CALENDARIO DE ACTIVIDAD.
 *
 * Separada del componente porque es la parte que se puede equivocar en silencio:
 * si la rejilla arranca en el día que no es, las celdas quedan corridas y el
 * mapa sigue viéndose perfectamente bien — solo que cada caída aparece un día
 * antes o después. Acá es JavaScript puro y se prueba sin React.
 *
 * TODO EN UTC, de punta a punta. El día operativo se guarda como medianoche
 * UTC; pasar por hora local correría las celdas un día entero en Venezuela
 * (UTC−4), y la caída de las 21:00 caería en la casilla de mañana.
 */

/** Cinco pasos: vacío + cuatro niveles. Más y dos verdes contiguos se confunden. */
export const NIVELES = 4;

export const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DIA_MS = 86_400_000;

/** Clave YYYY-MM-DD de una fecha, en UTC. */
export const claveDia = (fecha) => {
    const d = new Date(fecha);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/** Medianoche UTC del día de una fecha. */
const aMedianocheUtc = (fecha) => {
    const d = new Date(fecha);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * En qué nivel (0…NIVELES) cae un valor, con escala RELATIVA al máximo.
 *
 * Con umbrales fijos —1, 3, 5, 10— un mes tranquilo se ve entero en el verde
 * más pálido y uno malo, entero en el más oscuro: en los dos casos el mapa deja
 * de decir nada. Con la escala relativa, el peor día del período siempre es el
 * más oscuro y el resto se ordena contra él.
 *
 * El 0 nunca toma color: un día sin caídas y un día con una sola tienen que
 * verse distintos aunque el mes entero sea de unos y ceros.
 */
export const nivelDe = (valor, maximo) => {
    if (!valor || valor <= 0) return 0;
    if (maximo <= 1) return NIVELES;
    return Math.max(1, Math.min(NIVELES, Math.ceil((valor / maximo) * NIVELES)));
};

/**
 * Arma la rejilla: una columna por semana, siete filas por columna.
 *
 * @param {{ data?: Array<{date, value}>, from?: Date|string, to?: Date|string }} opciones
 * @returns {{ semanas, maximo, total, etiquetasDeMes }}
 *
 * Las columnas arrancan en DOMINGO —no en el primer día pedido— para que se
 * lean como semanas de verdad. Los días de relleno que quedan antes de `from` o
 * después de `to` vienen con `dentro: false` y no se pintan: sin ellos la
 * primera columna quedaría desalineada de las demás.
 */
export const construirRejilla = ({ data = [], from, to } = {}) => {
    const fin = aMedianocheUtc(to ?? new Date());
    const desde = aMedianocheUtc(from ?? new Date(fin.getTime() - 29 * DIA_MS));

    const valores = new Map();
    for (const punto of data ?? []) {
        if (!punto?.date) continue;
        valores.set(claveDia(punto.date), punto);
    }

    // Al domingo de la semana en que cae el primer día.
    const cursor = new Date(desde);
    cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());

    const semanas = [];
    const etiquetasDeMes = [];
    let mesAnterior = null;
    let maximo = 0;
    let total = 0;

    while (cursor <= fin) {
        const columna = [];

        for (let d = 0; d < 7; d++) {
            const clave = claveDia(cursor);
            const dentro = cursor >= desde && cursor <= fin;
            const punto = dentro ? valores.get(clave) : undefined;
            const valor = punto?.value ?? 0;

            if (dentro) {
                if (valor > maximo) maximo = valor;
                total += valor;
            }

            columna.push({ key: clave, fecha: new Date(cursor), dentro, valor, datos: punto ?? null });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        // La etiqueta del mes va sobre la columna donde ese mes EMPIEZA a
        // verse. Repetirla en todas llena la fila de "Ago Ago Ago" y deja de
        // servir de referencia.
        const primerDiaDentro = columna.find(c => c.dentro);
        if (primerDiaDentro) {
            const mes = primerDiaDentro.fecha.getUTCMonth();
            if (mes !== mesAnterior) {
                etiquetasDeMes.push({ columna: semanas.length, texto: MESES_ES[mes] });
                mesAnterior = mes;
            }
        }

        semanas.push(columna);
    }

    return { semanas, maximo, total, etiquetasDeMes };
};
