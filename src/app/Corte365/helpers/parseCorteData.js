/**
 * parseCorteData.js
 * Convierte el estado del formulario React en el array de objetos
 * que el backend espera en POST /SendCorteDoc365.
 *
 * Replica la lógica de parseHtml() del index.js original.
 */

export default function parseCorteData(formData, locals) {
    const array = [];

    for (const local of locals) {
        const fd = formData[local._id];
        if (!fd) continue;

        const obj = {
            name: local.name,
            order: local.order ?? 0,
            rotaciones: fd.rotation || 0,
            procesos: {},
            toques: {},
        };

        if (fd.procesos.entrada !== undefined) obj.procesos.entrada = fd.procesos.entrada || 0;
        if (fd.procesos.platoFuerte !== undefined) obj.procesos.platoFuerte = fd.procesos.platoFuerte || 0;
        if (fd.procesos.postre !== undefined) obj.procesos.postre = fd.procesos.postre || 0;

        for (const key in fd.toques) {
            const t = fd.toques[key];
            if (!t.present) {
                obj.toques[key] = 'ausente';
            } else if (t.primeros !== undefined) {
                obj.toques[key] = { primeros: t.primeros || 0, otros: t.otros || 0 };
            } else {
                obj.toques[key] = { total: t.total || 0 };
            }
        }

        array.push(obj);
    }

    return array.sort((a, b) => a.order - b.order);
}
