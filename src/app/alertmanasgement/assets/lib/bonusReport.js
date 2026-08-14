import { worthLabel, ratioLabel } from './bonusLabels.js';

// ══════════════════════════════════════════════════════════════════════
// LOS DATOS DEL INFORME DE BONIFICACIÓN
// ══════════════════════════════════════════════════════════════════════
// Ordena y cuenta las alertas para el documento. Sin JSX: acá solo se decide
// QUÉ se cuenta; cómo se ve es problema de la vista.
//
// Todo sale de las alertas reales que ya tiene la pantalla. No hay ninguna
// lista escrita a mano: un informe que se redacta aparte envejece mal, y a la
// tercera edición del reglamento ya no coincide con el sistema.

/** Alertas que bonifican, y las que no. */
export const partirPorBonificacion = (alertas = []) => {
    const bonifican = [];
    const noBonifican = [];
    alertas.forEach(a => (a.bonusSystem?.isEnabled ? bonifican : noBonifican).push(a));
    return { bonifican, noBonifican };
};


/**
 * Cuántas alertas hay por cada valor de bono.
 * Devuelve [{ worth, etiqueta, cantidad }] ordenado de mayor a menor valor,
 * porque las de X5 y X10 son las que más se revisan.
 */
export const porValorDeBono = (bonifican = []) => {
    const cuenta = new Map();
    bonifican.forEach(a => {
        const w = a.bonusSystem?.defaultRule?.bonusWorth ?? 1;
        cuenta.set(w, (cuenta.get(w) || 0) + 1);
    });
    return [...cuenta.entries()]
        .map(([worth, cantidad]) => ({ worth, etiqueta: worthLabel(worth), cantidad }))
        .sort((a, b) => b.worth - a.worth);
};


/**
 * Los establecimientos y franquicias que aparecen en alguna excepción, con
 * cuántas alertas los nombran.
 *
 * Es la respuesta a "¿en qué se aparta este local del reglamento general?", que
 * hoy no se puede contestar sin abrir las alertas una por una.
 */
export const excepcionesPorDestino = (alertas = [], nombreDeLocal, nombreDeMarca) => {
    const locales = new Map();
    const marcas = new Map();

    const anotar = (mapa, id, nombre, alerta, excepcion) => {
        if (!id) return;
        const clave = String(id);
        if (!mapa.has(clave)) mapa.set(clave, { id: clave, nombre, alertas: [] });
        mapa.get(clave).alertas.push({
            titulo: alerta.es || alerta.en || '(sin título)',
            // `bonifies` en null significa "igual que la regla general", que es
            // distinto de un sí o un no explícitos.
            bonifica: excepcion.bonifies,
            worth: excepcion.bonusWorth,
            acumulacion: excepcion.accumulationRequired,
            nota: excepcion.note || '',
        });
    };

    alertas.forEach(a => {
        if (!a.bonusSystem?.isEnabled) return;
        (a.bonusSystem.localExceptions || []).forEach(e =>
            anotar(locales, e.local, nombreDeLocal(e.local), a, e));
        (a.bonusSystem.franchiseExceptions || []).forEach(e =>
            anotar(marcas, e.franchise, nombreDeMarca(e.franchise), a, e));
    });

    const ordenar = (mapa) => [...mapa.values()]
        .sort((a, b) => b.alertas.length - a.alertas.length || a.nombre.localeCompare(b.nombre));

    return { locales: ordenar(locales), marcas: ordenar(marcas) };
};


/**
 * Las alertas que bonifican, agrupadas por categoría y listas para la tabla.
 *
 * @param etiquetaDeCategoria  traduce la clave guardada a su nombre legible
 */
export const filasPorCategoria = (bonifican = [], etiquetaDeCategoria) => {
    const grupos = new Map();

    bonifican.forEach(a => {
        const clave = a.category || '(sin categoría)';
        if (!grupos.has(clave)) {
            grupos.set(clave, { clave, nombre: etiquetaDeCategoria(clave), filas: [] });
        }

        const regla = a.bonusSystem.defaultRule || {};
        const marcas = a.bonusSystem.franchiseExceptions?.length || 0;
        const locales = a.bonusSystem.localExceptions?.length || 0;

        grupos.get(clave).filas.push({
            titulo: a.es || a.en || '(sin título)',
            codigo: a.bonusSystem.regulationCode || '',
            valor: worthLabel(regla.bonusWorth),
            proporcion: ratioLabel(regla) || '1x1',
            alcance: regla.bonifies === false
                ? 'Solo donde se indique'
                : 'Todos los establecimientos',
            excepciones: marcas + locales === 0
                ? '—'
                : [marcas ? `${marcas} franquicia(s)` : '', locales ? `${locales} local(es)` : '']
                    .filter(Boolean).join(' · '),
            punto: `${Number(regla.pointValue?.day ?? 0.20).toFixed(2)} / ${Number(regla.pointValue?.night ?? 0.30).toFixed(2)}`,
        });
    });

    return [...grupos.values()]
        .map(g => ({ ...g, filas: g.filas.sort((a, b) => a.titulo.localeCompare(b.titulo)) }))
        .sort((a, b) => b.filas.length - a.filas.length);
};


/** Las alertas que tienen la bonificación encendida pero sin código del reglamento. */
export const sinCodigoDeReglamento = (bonifican = []) =>
    bonifican
        .filter(a => !a.bonusSystem?.regulationCode?.trim())
        .map(a => a.es || a.en || '(sin título)')
        .sort((a, b) => a.localeCompare(b));


/** Fecha de hoy, escrita como la escribe la gente. */
export const fechaLarga = () => new Date().toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit', month: 'long', year: 'numeric',
});
