/**
 * calculateTouchMetrics.js
 * Calcula indicadores de toques de gerente agrupados por franquicia.
 * Replica fillLocalTouch() + resultFillTouch() del index.js original.
 */

export default function calculateTouchMetrics(franchises, locals, parsedData) {
    if (!locals?.length || !parsedData?.length) return [];

    // Paso 1: enriquecer parsedData con info del local (franchise, lang, isEvaluationGroup)
    const enriched = [];
    for (const local of locals) {
        if (!local.touchs?.isRequiredeEvaluation) continue;
        const data = parsedData.find(d => d.name === local.name);
        if (!data) continue;

        // Obtener el ID de franquicia del local
        const franchiseId = local.franchiseReference?.franchise
            || local.franchiseReference?._id
            || null;

        const franchiseName = local.franchiseReference?.name_franchise
            || local.franchise
            || local.name;

        enriched.push({
            ...data,
            idLocal: local._id,
            franchiseId,
            franchiseName,
            lang: local.lang || 'es',
            isEvaluationGroup: !!local.touchs.isEvaluationGroup,
        });
    }

    if (!enriched.length) return [];

    // Paso 2: agrupar por franquicia (o individual si isEvaluationGroup === false)
    const groups = [];

    if (franchises?.length) {
        for (const fr of franchises) {
            const group = [];
            for (const item of enriched) {
                // Comparar franchise ID del local con el ID de la franquicia
                const itemFrId = String(item.franchiseId || '');
                const frId = String(fr._id || '');

                if (itemFrId === frId) {
                    if (!item.isEvaluationGroup) {
                        groups.push([item]);
                    } else {
                        group.push(item);
                    }
                }
            }
            if (group.length) groups.push(group);
        }
    }

    // Fallback: locales que no matchearon ninguna franquicia, agrupar individualmente
    const matched = new Set(groups.flat().map(i => i.idLocal));
    for (const item of enriched) {
        if (!matched.has(item.idLocal)) {
            groups.push([item]);
        }
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
                franchise: data.franchiseName,
                lang: data.lang,
                rotaciones,
                resultEvaluation,
            };
        })
    );
}
