'use client';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';

/**
 * Los botones del zoom: lupa menos, el porcentaje, lupa más.
 *
 * Es la pareja de `useZoom` y no sabe nada del elemento que escala — solo lee
 * los controles que el hook devuelve. Dónde va y cómo se ve lo decide quien lo
 * pone, por `className`; acá adentro no hay ninguna posición.
 *
 *     const zoom = useZoom({ nombre: 'mapa-de-bonificacion' });
 *     <ControlesDeZoom zoom={zoom} className='ml-auto' />
 *     <div ref={zoom.ref}>…</div>
 *
 * El porcentaje es además el botón de volver al 100%. Es donde mira quien se
 * perdió de escala, así que no hace falta gastar un tercer control en eso.
 */
export default function ControlesDeZoom({ zoom, className = '', etiqueta = 'Zoom' }) {
    const { porcentaje, acercar, alejar, restablecer, puedeAcercar, puedeAlejar } = zoom;

    return (
        <div role='group' aria-label={etiqueta}
            className={`inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 ${className}`}>

            <Lupa onClick={alejar} deshabilitado={!puedeAlejar} etiqueta='Alejar'>
                <FiZoomOut size={14} />
            </Lupa>

            <button type='button' onClick={restablecer} title='Volver al 100%'
                className='h-7 min-w-[46px] px-1 rounded-md text-[11.5px] font-bold text-gray-600 tabular-nums
                           hover:bg-gray-100 transition-colors
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                {porcentaje}%
            </button>

            <Lupa onClick={acercar} deshabilitado={!puedeAcercar} etiqueta='Acercar'>
                <FiZoomIn size={14} />
            </Lupa>
        </div>
    );
}


const Lupa = ({ onClick, deshabilitado, etiqueta, children }) => (
    <button type='button' onClick={onClick} disabled={deshabilitado} title={etiqueta} aria-label={etiqueta}
        className='grid place-items-center w-7 h-7 rounded-md text-gray-600 transition-colors
                   hover:bg-gray-100 hover:text-gray-900
                   disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
        {children}
    </button>
);
