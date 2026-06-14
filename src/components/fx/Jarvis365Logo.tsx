'use client';
import Image from 'next/image';
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
                <Image src='/logo-page-removebg.png' alt='logojarvis' width={50} height={50} />

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
