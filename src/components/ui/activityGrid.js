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
 * Cuántas columnas hacen falta para cubrir al menos `minDias` terminando en `hasta`.
 *
 * La última columna está a medias: solo llega hasta hoy, así que aporta
 * `diaDeLaSemana + 1` días y no siete. Sin contar eso, un mes pedido un lunes
 * se quedaría corto por cinco días.
 */
export const columnasParaCubrir = (hasta, minDias) => {
    const diasEnLaUltima = new Date(hasta).getUTCDay() + 1;
    if (minDias <= diasEnLaUltima) return 1;
    return 1 + Math.ceil((minDias - diasEnLaUltima) / 7);
};

/**
 * Cuántas columnas caben SIN pasarse de `maxDias`.
 *
 * Es la simétrica de `columnasParaCubrir`, y hace falta que sean dos funciones
 * distintas: aquélla redondea hacia ARRIBA porque su trabajo es no quedarse
 * corta, y usada como techo se pasa de largo. Con un año pedido terminando en
 * viernes daba 54 columnas = 377 días, seis más de los que se le trajeron al
 * servidor — seis días pintados en cero por falta de datos y no por falta de
 * caídas, que es justo la mentira que el techo existe para evitar.
 */
export const columnasDentroDe = (hasta, maxDias) => {
    const diasEnLaUltima = new Date(hasta).getUTCDay() + 1;
    if (maxDias <= diasEnLaUltima) return 1;
    return 1 + Math.floor((maxDias - diasEnLaUltima) / 7);
};

/**
 * Cuántas columnas caben en un ancho, y de qué tamaño queda la celda.
 *
 * El ancho manda: se calcula cuántas columnas entran con la celda deseada y
 * después la celda se ESTIRA para que las columnas llenen el ancho exacto. Así
 * no queda una franja muerta a la derecha, que es lo que pasaba con la celda
 * fija.
 *
 * `minColumnas` es el piso: aunque el panel sea estrecho, el mapa nunca muestra
 * menos del período pedido — prefiere celdas chicas a esconder días.
 *
 * `maxColumnas` es el techo, y hace falta: en una pantalla ancha caben más
 * semanas de las que se le pidieron al servidor, y sin tope la rejilla pintaría
 * en cero meses de los que nunca se trajo un dato — un mapa mintiendo en vez de
 * un mapa vacío. Cuando el techo manda, la celda se estira igual para llenar el
 * ancho: se ven las mismas semanas, más grandes.
 *
 * @returns {{ columnas: number, celda: number }}
 */
export const medidasDeLaRejilla = ({ ancho, celdaDeseada = 13, gap = 3, minColumnas = 1, maxColumnas = Infinity }) => {
    if (!ancho || ancho <= 0) return { columnas: minColumnas, celda: celdaDeseada };

    const caben = Math.floor((ancho + gap) / (celdaDeseada + gap));

    // El piso gana sobre el techo: antes esconder semanas que mostrar menos del
    // período pedido.
    const columnas = Math.max(minColumnas, Math.min(Math.max(caben, 1), maxColumnas));

    // Reparto exacto del ancho entre las columnas que van a ir.
    const celda = (ancho - (columnas - 1) * gap) / columnas;

    return { columnas, celda: Math.max(4, celda) };
};

/**
 * El primer día de una rejilla de N columnas que termina en `hasta`.
 *
 * Devuelve el DOMINGO de la primera columna, no un día suelto: si el rango
 * empezara a mitad de semana, la primera columna quedaría con huecos arriba y
 * la rejilla dejaría de llenar el ancho por la izquierda.
 */
export const inicioParaColumnas = (hasta, columnas) => {
    const fin = aMedianocheUtc(hasta);
    const domingoDeEstaSemana = new Date(fin);
    domingoDeEstaSemana.setUTCDate(domingoDeEstaSemana.getUTCDate() - domingoDeEstaSemana.getUTCDay());

    const inicio = new Date(domingoDeEstaSemana);
    inicio.setUTCDate(inicio.getUTCDate() - (columnas - 1) * 7);
    return inicio;
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
 *
 * Se puede pedir por `columnas` en lugar de por `from`, y es lo que usa el
 * mapa: el ancho de la pantalla decide cuántas columnas caben y el rango se
 * estira hacia ATRÁS para llenarlas. Pedido así la rejilla queda COMPLETA —
 * arranca en domingo y no deja huecos por la izquierda—, que es lo que hace que
 * ocupe el ancho de verdad en vez de dejar una franja muerta.
 *
 * Los DATOS no dependen del rango que se pinte: llegan todos y cada uno se
 * coloca en su casilla por fecha. Los que caigan fuera de lo mostrado
 * simplemente no se dibujan.
 */
export const construirRejilla = ({ data = [], from, to, columnas } = {}) => {
    const fin = aMedianocheUtc(to ?? new Date());

    const desde = columnas
        ? inicioParaColumnas(fin, columnas)
        : aMedianocheUtc(from ?? new Date(fin.getTime() - 29 * DIA_MS));

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
