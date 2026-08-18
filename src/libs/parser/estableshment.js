/**
 * Los establecimientos, agrupados y separados como los piensa el negocio.
 *
 * Funciones puras sobre la lista que devuelve `/localLigth`. Viven acá y no en
 * una pantalla porque las usan varias: la gestión de clientes, el corte, el
 * filtro del muro, el alta de alertas y el mapa de bonos.
 */


/**
 * Agrupa por franquicia.
 *
 * La clave es el NOMBRE de la marca (`franchiseReference.name_franchise`), con
 * el campo viejo `franchise` de respaldo para los documentos que aún lo traen.
 *
 * @returns {Record<string, object[]> | null}  { 'Francisca': [...], 'Mister': [...] }
 */
export function groupByFranchiseComprehensive(restaurantsArray) {

    if (!restaurantsArray) return null;

    return restaurantsArray.reduce((grouped, restaurant) => {
        // Use name_franchise as primary key, fallback to franchise if not available
        const key = restaurant.franchiseReference?.name_franchise || restaurant.franchise;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push(restaurant);
        return grouped;
    }, {});
}


/**
 * Cómo se monitorea un establecimiento, según `Local.typeMonitoring`.
 *
 * El modelo tiene tres valores: 'perimeter', 'analytical' y
 * 'analytical and perimeter'. Para el reglamento —que separa perimetrales de
 * analíticos como tarifas distintas— el tercero cuenta como ANALÍTICO: tiene
 * analítica, y es ahí donde entra.
 */
export const MONITOREO = {
    PERIMETRAL: 'perimetral',
    ANALITICO: 'analitico',
};

/** @returns {'perimetral' | 'analitico'} */
export const tipoDeMonitoreo = (local) =>
    local?.typeMonitoring === 'perimeter' ? MONITOREO.PERIMETRAL : MONITOREO.ANALITICO;

export const esPerimetral = (local) => tipoDeMonitoreo(local) === MONITOREO.PERIMETRAL;
export const esAnalitico = (local) => tipoDeMonitoreo(local) === MONITOREO.ANALITICO;


/**
 * Separa perimetrales de analíticos.
 *
 * @returns {{ perimetrales: object[], analiticos: object[] }}
 */
export const separarPorMonitoreo = (locales = []) => ({
    perimetrales: locales.filter(esPerimetral),
    analiticos: locales.filter(esAnalitico),
});


/**
 * Los establecimientos como se leen en un selector: los perimetrales en un
 * grupo, y los analíticos por franquicia, en orden alfabético.
 *
 * Combina las dos funciones de arriba en la forma que pide la pantalla, para no
 * repetir el armado en cada una que lo necesite.
 *
 * @returns {{ perimetrales: object[], analiticos: Array<{ titulo: string, locales: object[] }> }}
 */
export const agruparParaSelector = (locales = []) => {
    const { perimetrales, analiticos } = separarPorMonitoreo(locales);
    const porMarca = groupByFranchiseComprehensive(analiticos) || {};

    return {
        perimetrales,
        analiticos: Object.entries(porMarca)
            .map(([titulo, lista]) => ({ titulo: titulo || 'Sin marca', locales: lista }))
            .sort((a, b) => a.titulo.localeCompare(b.titulo)),
    };
};
