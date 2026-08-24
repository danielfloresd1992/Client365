'use client';
import { COLUMNAS, sinAchicar, ChipCategoria } from './mapaEstilos.jsx';

/**
 * UNA SECCIÓN DEL MAPA: TODO LO QUE PAGA BAJO UNA MISMA CATEGORÍA.
 *
 * El mapa entero en tres columnas se lee bien con cinco alertas y se vuelve
 * ilegible con cien: la columna del medio queda con veinte cajas y los cables
 * cruzan de punta a punta. Partido por la CATEGORÍA DE LA REGLA, cada sección
 * es un mapa chico y completo —estas alertas, con estos alcances, pagan bajo
 * estas reglas— y se puede leer una sin mirar las otras.
 *
 * La categoría es la de la REGLA y no la de la alerta a propósito: es la que
 * agrupa en el corte, la que decide cuánto se paga. La categoría operativa de
 * la alerta ('delay', 'food'…) sigue en su chip dentro de cada caja.
 *
 *
 * UNA ALERTA PUEDE ESTAR EN DOS SECCIONES, y está bien que se vea así: si
 * bonifica bajo una regla de Higiene y otra de Perimetrales, está en las dos.
 * Su caja se dibuja una vez por sección, y cada copia es una caja distinta a
 * todos los efectos —se mide, se acomoda y se arrastra por separado—.
 *
 *
 * LA ÚLTIMA SECCIÓN ES EL BANCO DE TRABAJO. Ahí van las alertas que todavía no
 * están cableadas, y por eso es la única que muestra TODAS las reglas: sin una
 * regla enfrente, el gesto de arrastrar el cable no tendría dónde caer. Se
 * vacía sola a medida que se cablea, y cuando no queda ninguna, desaparece.
 *
 * Recibe las tres columnas ya armadas en vez de armarlas: quién puede editar,
 * qué se está arrastrando y cómo se escribe cada cambio son asuntos del mapa,
 * y pasarlos acá para volver a bajarlos sería veinte props de tránsito.
 */
export default function SeccionDelMapa({
    seccion, escala = 1, abierta = true, onAlternar,
    alertas, alcances, reglas,
}) {

    const { categoria, banco } = seccion;

    const n = seccion.alertas.length;
    const m = seccion.reglas.length;
    const cuenta = `${n} alerta${n === 1 ? '' : 's'} · ${m} regla${m === 1 ? '' : 's'}`;

    return (
        <section>
            <header className='flex items-center gap-2.5 pb-2.5'>

                <button type='button' onClick={onAlternar} aria-expanded={abierta}
                    title={abierta ? 'Plegar esta sección' : 'Desplegar esta sección'}
                    className='shrink-0 w-6 h-6 grid place-items-center rounded-md text-gray-500
                               hover:bg-gray-100 hover:text-gray-800 transition-colors
                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'
                        strokeLinecap='round' strokeLinejoin='round'
                        className={`w-3 h-3 transition-transform ${abierta ? '' : '-rotate-90'}`}>
                        <path d='m6 9 6 6 6-6' />
                    </svg>
                </button>

                {/* Qué agrupa esta sección. El banco no tiene categoría porque
                    justamente es lo que todavía no eligió ninguna, y el
                    punteado lo dice sin necesidad de leerlo. */}
                {banco ? (
                    <span style={sinAchicar(10.5, escala, 10)}
                        className='rounded-md border border-dashed border-gray-400 px-2 py-1
                                   font-bold text-gray-600'>
                        Sin asignar
                    </span>
                ) : categoria ? (
                    <ChipCategoria categoria={categoria} escala={escala} />
                ) : (
                    <span style={sinAchicar(10.5, escala, 10)}
                        className='rounded-md bg-gray-100 px-2 py-1 font-bold text-gray-600'>
                        Sin categoría
                    </span>
                )}

                <span style={sinAchicar(10.5, escala, 10)} className='text-gray-500 shrink-0'>
                    {cuenta}
                </span>

                <span className='flex-1 h-px bg-gray-200' aria-hidden='true' />

                {!abierta && (
                    <span style={sinAchicar(10, escala, 9.5)}
                        className='shrink-0 font-bold uppercase tracking-wider text-gray-400'>
                        Plegada
                    </span>
                )}
            </header>

            {/* Plegada se desmonta, no se esconde: las cajas que no están en el
                DOM no se miden, y los cables de esta sección desaparecen con
                ella en vez de quedar colgando de la nada. */}
            {abierta && (
                <div className={COLUMNAS}>
                    <div className='flex flex-col gap-5'>{alertas}</div>
                    <div className='flex flex-col gap-3'>{alcances}</div>
                    <div className='flex flex-col gap-3'>{reglas}</div>
                </div>
            )}
        </section>
    );
}
