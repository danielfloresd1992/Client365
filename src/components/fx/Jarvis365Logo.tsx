'use client';

/**
 * Jarvis365Logo — Logo "JARVIS 365" con tipografía HTML (auto-maquetada, sin
 * recortes) + ícono SVG de tuerca/engranaje con trazos tipo circuito integrado,
 * y el lema SIEMPRE legible.
 *
 * variant: 'light' (sobre marfil/claro) | 'green' (sobre panel verde).
 */
export default function Jarvis365Logo({
    variant = 'light',
    className = '',
}: { variant?: 'light' | 'green'; className?: string }) {
    const green = variant === 'green';

    const wordStyle = green
        ? { color: '#ffffff' }
        : {
            backgroundImage: 'linear-gradient(180deg, #34d40f 0%, #1f9a08 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
        } as const;

    const cGear = green ? '#f3fff8' : '#5f676e';
    const cTag = green ? 'rgba(255,255,255,0.9)' : '#6b6450';

    return (
        <div className={`j365 ${className}`} role="img" aria-label="Jarvis 365 — Herramientas al alcance de tu mano">
            <div className="j365-row">
                <span className="j365-word" style={wordStyle}>JARVIS</span>

                {/* Ícono: tuerca con muesca + circuito integrado (réplica de la referencia) */}
                <svg className="j365-gear" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <g stroke={cGear} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                        {/* Trazos de circuito + nodos (anillos) */}
                        <line x1="50" y1="49" x2="50" y2="23" />
                        <circle cx="50" cy="16" r="5" />
                        <line x1="40" y1="49" x2="40" y2="30" />
                        <line x1="60" y1="49" x2="60" y2="30" />
                        <path d="M30 49 L30 41 L23 32" />
                        <circle cx="18.5" cy="28" r="4.5" />
                        <path d="M70 49 L70 41 L77 32" />
                        <circle cx="81.5" cy="28" r="4.5" />

                        {/* Engranaje / tuerca */}
                        <g transform="translate(25,47) scale(0.5)">
                            <path d="M87.30 42.75 L95.79 45.59 L95.79 54.41 L87.30 57.25 L84.44 66.06 L89.63 73.35 L84.45 80.48 L75.92 77.79 L68.42 83.24 L68.34 92.18 L59.96 94.91 L54.63 87.72 L45.37 87.72 L40.04 94.91 L31.66 92.18 L31.58 83.24 L24.08 77.79 L15.55 80.48 L10.37 73.35 L15.56 66.06 L12.70 57.25 L4.21 54.41 L4.21 45.59 L12.70 42.75 L15.56 33.94 L10.37 26.65 L15.55 19.52 L24.08 22.21 L31.58 16.76 L31.66 7.82 L40.04 5.09 L45.37 12.28 L54.63 12.28 L59.96 5.09 L68.34 7.82 L68.42 16.76 L75.92 22.21 L84.45 19.52 L89.63 26.65 L84.44 33.94 Z" />
                        </g>
                        {/* Muesca semicircular (bowl) en el centro de la tuerca */}
                        <path d="M40 67 L40 71 A10 10 0 0 0 60 71 L60 67" />
                    </g>
                </svg>

                <span className="j365-word" style={wordStyle}>365</span>
            </div>

            <div className="j365-tag" style={{ color: cTag }}>HERRAMIENTAS AL ALCANCE DE TU MANO</div>

            <style>{`
                .j365 { display:inline-flex; flex-direction:column; align-items:center; gap:.3em; width:100%; }
                .j365-row { display:flex; align-items:center; justify-content:center; gap:.1em; line-height:1; }
                .j365-word {
                    font-family: var(--font-geist-sans), 'Arial Black', system-ui, sans-serif;
                    font-weight: 800;
                    font-size: clamp(1.7rem, 7.5vw, 2.6rem);
                    letter-spacing: .03em;
                    text-transform: uppercase;
                }
                .j365-gear { height: 1.5em; width: auto; flex: 0 0 auto; }
                .j365-tag {
                    font-family: var(--font-geist-sans), system-ui, sans-serif;
                    font-weight: 600;
                    font-size: clamp(.4rem, 1.9vw, .58rem);
                    letter-spacing: .26em;
                    text-transform: uppercase;
                    text-align: center;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
}
