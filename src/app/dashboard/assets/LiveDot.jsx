'use client';

/**
 * El punto de "está en monitoreo AHORA", con su latido.
 *
 * El color lo elige quien lo usa porque significa el TIPO de monitoreo —verde
 * analítico, celeste perimetral— y un local puede estar en los dos a la vez:
 * en ese caso se dibujan dos puntos, no uno de color mezclado.
 */
export default function LiveDot({ ping, bg }) {
    return (
        <span className='relative flex h-[6px] w-[6px] shrink-0'>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ping} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-[6px] w-[6px] ${bg}`}></span>
        </span>
    );
}
