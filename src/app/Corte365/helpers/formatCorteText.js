/**
 * formatCorteText.js
 * Construye el string formateado estilo WhatsApp para enviar al bot.
 * Replica arrayToString() del index.js original.
 */

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const EMOJIS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '🟤', '⚪'];

function pad(n) { return n < 10 ? '0' + n : String(n); }

export default function formatCorteText(parsedData, username = '') {
    const d = new Date();
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    const second = pad(d.getSeconds());
    const turno = d.getHours() >= 17 ? 'Nocturno' : 'Diurno';
    const nl = '\n';

    let text = `*_JARVIS⚙️365©_*  ${nl}`;
    text += `Corte de rotaciones y procesos por hora⏰ ${nl}`;
    text += `Responsable: ${username}${nl}`;
    text += `Turno: ${turno} ${nl}`;
    text += `Fecha: ${day}-${MONTHS[d.getMonth()]}-${d.getFullYear()} ${nl}`;
    text += `Hora: ${hour}:${minute}:${second} ${nl} ${nl}`;

    parsedData.forEach(data => {
        const emo = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        text += `${emo} *${data.name}* ${nl}`;
        text += `Rotaciones: ${data.rotaciones}${nl}`;
        text += `Procesos: 👇🏻${nl}`;

        if (data.procesos.entrada) text += `Entrada: ${data.procesos.entrada} ${nl}`;
        if (data.procesos.platoFuerte) text += `Plato fuerte: ${data.procesos.platoFuerte}${nl}`;
        if (data.procesos.postre) text += `Postre: ${data.procesos.postre} ${nl}`;

        for (const key in data.toques) {
            const label = key.split('_').join(' ');
            if (data.toques[key] === 'ausente') {
                text += `_${label} »_  ausente${nl}`;
                continue;
            }
            let touchText = `_${label} »_ `;
            for (const k in data.toques[key]) {
                touchText += `${k}: ${data.toques[key][k]}${nl}`;
            }
            text += touchText;
        }
        text += nl;
    });

    return text;
}
