'use client';

/*
 * AnalogCounter — contador con estética ANALÓGICA (visor mecánico).
 *
 * Todos los caracteres viven dentro de UN SOLO panel oscuro opaco (no una
 * celda por dígito): los dígitos ruedan verticalmente hasta su valor cuando
 * el número cambia (frenada suave, como un visor de panel) y los caracteres
 * que no son dígitos (":", "·", "A", "M", ...) se muestran fijos. Acepta
 * números o cadenas (p. ej. una hora "00:09AM").
 *
 * Todo el aspecto es configurable por PROPS; los valores por defecto dan el
 * visor oscuro con dígitos claros y Victor Mono:
 *   value       número o cadena a mostrar
 *   fontSize    tamaño de los dígitos (cualquier medida CSS; '1em' hereda)
 *   color       color de los dígitos ('currentColor' hereda del padre)
 *   background  color del panel (oscuro opaco por defecto); null = sin panel
 *   weight      grosor de la fuente (undefined = lo decide el CSS/heredado)
 *   glow        resplandor del dígito (por defecto: sólo si hay panel)
 *   gap         separación entre dígitos DENTRO del panel (mínima: "pegados")
 *   radius      radio de las esquinas del panel
 *   pad         relleno del panel
 *   fontFamily  familia tipográfica
 *   className   clases extra en la raíz
 */

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const DEFAULT_FONT = "'Victor Mono', ui-monospace, monospace";

function Reel({ digit, color, glow }) {
    return (
        <span style={{ display: 'inline-block', height: '1em', overflow: 'hidden' }}>
            <span style={{ display: 'block', transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)', transform: `translateY(-${digit}em)` }}>
                {DIGITS.map(n => (
                    // El color va en el span EXACTO del número para que ningún
                    // estilo global (que apunta a span) lo pise por herencia.
                    <span key={n} style={{ display: 'block', height: '1em', lineHeight: '1em', color, textShadow: glow ? `0 0 0.16em ${color}` : 'none' }}>
                        {n}
                    </span>
                ))}
            </span>
        </span>
    );
}

export default function AnalogCounter({
    value,
    fontSize = '1.05rem',
    color = '#f8fafc',
    background = '#1f2937',
    weight,
    glow,
    gap = '1px',
    radius = '0.26em',
    pad = '0.14em 0.28em',
    fontFamily = DEFAULT_FONT,
    className = '',
}) {
    const showGlow = glow ?? Boolean(background);
    const chars = String(value ?? '').split('');

    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap,
                fontSize,
                fontFamily,
                fontFeatureSettings: "'tnum'",
                ...(weight != null ? { fontWeight: weight } : {}),
                ...(background ? {
                    background,
                    borderRadius: radius,
                    padding: pad,
                    // Hundido, con brillo de visor: el ambiente analógico
                    boxShadow: 'inset 0 0.16em 0.30em rgba(0,0,0,.55), inset 0 -0.14em 0.26em rgba(0,0,0,.42)',
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,0) 45%, rgba(0,0,0,.30) 55%, rgba(0,0,0,.14))',
                } : {}),
            }}
        >
            {chars.map((ch, index) => {
                // key por posición desde la derecha: al crecer de 99→100 los
                // dígitos existentes conservan su columna y siguen rodando
                const key = chars.length - index;
                if (ch >= '0' && ch <= '9') {
                    return <Reel key={key} digit={Number(ch)} color={color} glow={showGlow} />;
                }
                // Separador (":", "·", "A", "M", ...): fijo, dentro del panel
                return (
                    <span key={key} style={{ display: 'inline-block', height: '1em', lineHeight: '1em', color, textShadow: showGlow ? `0 0 0.16em ${color}` : 'none', padding: '0 0.02em' }}>
                        {ch}
                    </span>
                );
            })}
        </span>
    );
}
