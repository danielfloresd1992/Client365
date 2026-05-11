/**
 * calculateDishMetrics.js
 * Calcula indicadores de procesos por plato (entrada, plato fuerte, postre).
 * Replica fillDish() del index.js original.
 */

export default function calculateDishMetrics(locals, parsedData) {
    if (!parsedData.length || !locals.length) return [];

    const results = [];

    for (const local of locals) {
        if (!local.dishMenu?.isRequiredeEvaluation) continue;

        const data = parsedData.find(d => d.name === local.name);
        if (!data) continue;

        const entrada = parseInt(data.procesos.entrada) || 0;
        const platoFuerte = parseInt(data.procesos.platoFuerte) || 0;
        const postre = parseInt(data.procesos.postre) || 0;
        const total = entrada + platoFuerte + postre;
        const rotaciones = parseInt(data.rotaciones) || 0;

        const safe = (n, d) => d === 0 ? 0 : Number(((n / d) * 100).toFixed(0));
        const avg = rotaciones === 0 ? 0 : Number((total / rotaciones).toFixed(1));

        results.push({
            name: data.name,
            tables: rotaciones,
            precess: {
                appetizer: entrada,
                mainDish: platoFuerte,
                dessert: postre,
                processTotal: total,
            },
            resultEvaluation: {
                percentageAppetizer: safe(entrada, total),
                percentageMainDish: safe(platoFuerte, total),
                percentageDessert: safe(postre, total),
                processAverage: avg,
            },
        });
    }

    return results;
}
