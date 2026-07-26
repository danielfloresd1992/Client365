'use client';
import AnalogCounter from '@/components/AnalogCounter/AnalogCounter';

/*
 * Contador grande de la cinta superior del panel: el AnalogCounter compartido
 * (tambor oscuro, dígitos claros, Victor Mono) con su etiqueta pequeña debajo.
 * El color distintivo de cada métrica va en la ETIQUETA (los dígitos son
 * neutros, como en un contador mecánico real).
 */
export function TickerStat({ label, value, className = '' }) {
    return (
        <div className='flex flex-col items-end gap-[3px] leading-none'>
            <AnalogCounter value={value} fontSize='1.05rem' weight={500} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${className || 'text-gray-400'}`}>{label}</span>
        </div>
    );
}
