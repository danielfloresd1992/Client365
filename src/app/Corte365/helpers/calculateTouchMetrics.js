/**
 * calculateTouchMetrics.js
 * Calcula indicadores de toques de gerente agrupados por franquicia.
 * Replica fillLocalTouch() + resultFillTouch() del index.js original.
 */

export default function calculateTouchMetrics(franchises, locals, parsedData) {
    if (!franchises?.length || !locals?.length || !parsedData?.length) return [];

    // Paso 1: enriquecer parsedData con info del local (franchise, lang, isEvaluationGroup)
    const enriched = [];
    for (const local of locals) {
        if (!local.touchs?.isRequiredeEvaluation) continue;
        const data = parsedData.find(d => d.name === local.name);
        if (!data) continue;
        enriched.push({
            ...data,
            idLocal: local._id,
            franchise: local.franchise,
            lang: local.lang || 'es',
            isEvaluationGroup: !!local.touchs.isEvaluationGroup,
        });
    }

    // Paso 2: agrupar por franquicia (o individual si isEvaluationGroup === false)
    const groups = [];
    for (const fr of franchises) {
        const group = [];
        for (const item of enriched) {
            if (item.idLocal === fr._id) {
                if (!item.isEvaluationGroup) {
                    groups.push([item]);
                } else {
                    group.push(item);
                }
            }
        }
        if (group.length) groups.push(group);
    }

    // Paso 3: calcular porcentajes por manager
    return groups.map(group =>
        group.map(data => {
            const rotaciones = parseInt(data.rotaciones) || 0;
            const resultEvaluation = [];

            for (const key in data.toques) {
                if (typeof data.toques[key] === 'string') continue; // 'ausente'
                const t = data.toques[key];

                if (t.primeros !== undefined) {
                    const first = parseInt(t.primeros) || 0;
                    const second = parseInt(t.otros) || 0;
                    const pFirst = rotaciones ? Math.round((first / rotaciones) * 100) : 0;
                    const pSecond = rotaciones ? Math.round((second / rotaciones) * 100) : 0;

                    resultEvaluation.push({
                        name: key,
                        first: { amount: first, percentage: pFirst },
                        second: { amount: second, percentage: pSecond },
                    });
                }
            }

            return {
                name: data.name,
                franchise: data.franchise,
                lang: data.lang,
                rotaciones,
                resultEvaluation,
            };
        })
    );
}
