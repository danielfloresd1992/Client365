'use client';

/**
 * ServerConnectionError
 * ──────────────────────────────────────────────────────────────────────────
 * Pantalla a pantalla completa que cubre TODA la app cuando se pierde la
 * conexión con el servidor (servidor caído o bloqueo CORS).
 *
 * - Responsiva (móvil → desktop) y en la paleta de marca (marfil/verde/oro).
 * - Usa clases del design system: `card-glass`, `accent-strip`, `btn-primary`.
 * - Por defecto el botón recarga la página; se puede sobreescribir con `onRetry`.
 *
 * La lógica de CUÁNDO mostrarla vive en LoadingGuard (loandingPage.tsx); este
 * componente es solo presentación.
 */

type ServerConnectionErrorProps = {
    /** Acción del botón "Reintentar". Por defecto recarga la página. */
    onRetry?: () => void;
};

export default function ServerConnectionError({ onRetry }: ServerConnectionErrorProps) {
    const handleRetry = onRetry ?? (() => window.location.reload());

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-gradient-to-br from-[#f7f2e4] via-[#f1e9d7] to-[#e9dec8]">
            <div className="card-glass relative w-full max-w-md overflow-hidden text-center !p-6 sm:!p-8">
                <span className="accent-strip absolute top-0 left-0" />

                <ConnectionLostIllustration />

                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Sin conexión con el servidor
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    El servidor no está respondiendo. Puede estar caído o haber un problema de red
                    (incluida la política <strong>CORS</strong>). Inténtalo de nuevo en unos momentos.
                </p>

                <button onClick={handleRetry} className="btn-primary mt-6 mx-auto">
                    <RetryIcon />
                    Reintentar
                </button>
            </div>
        </div>
    );
}

/** Ilustración: un servidor con la señal interrumpida (tachón rojo). */
function ConnectionLostIllustration() {
    return (
        <div className="mx-auto mb-6 w-36 sm:w-44">
            <svg
                viewBox="0 0 200 160"
                fill="none"
                className="w-full h-auto"
                role="img"
                aria-label="Conexión con el servidor interrumpida"
            >
                <defs>
                    <radialGradient id="cnxHalo" cx="50%" cy="42%" r="62%">
                        <stop offset="0%" stopColor="#29c50c" stopOpacity="0.12" />
                        <stop offset="60%" stopColor="#d9a441" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#d9a441" stopOpacity="0" />
                    </radialGradient>
                </defs>

                <ellipse cx="100" cy="84" rx="96" ry="66" fill="url(#cnxHalo)" />

                {/* Ondas de señal (interrumpidas) */}
                <g stroke="#b5763b" strokeWidth="6" strokeLinecap="round" opacity="0.5">
                    <path d="M58 70a60 60 0 0 1 84 0" />
                    <path d="M74 88a37 37 0 0 1 52 0" />
                </g>
                <circle cx="100" cy="104" r="6.5" fill="#b5763b" opacity="0.5" />

                {/* Servidor */}
                <rect x="60" y="110" width="80" height="40" rx="10" fill="#faf5ea" stroke="#29c50c" strokeWidth="3.5" />
                <line x1="74" y1="124" x2="112" y2="124" stroke="#7bd42a" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="74" y1="137" x2="100" y2="137" stroke="#7bd42a" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="126" cy="130" r="4.5" fill="#ef4444" />

                {/* Tachón rojo = interrupción */}
                <line x1="46" y1="36" x2="154" y2="140" stroke="#fff7e0" strokeWidth="11" strokeLinecap="round" />
                <line x1="46" y1="36" x2="154" y2="140" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
            </svg>
        </div>
    );
}

/** Ícono de "recargar" del botón Reintentar. */
function RetryIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
        </svg>
    );
}
