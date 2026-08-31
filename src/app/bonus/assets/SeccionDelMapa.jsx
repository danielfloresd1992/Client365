'use client';
import { COLUMNAS, BALDOSA, ANCHO_BALDOSA, sinAchicar, ChipCategoria } from './mapaEstilos.jsx';

/**
 * UNA SECCIÓN DEL MAPA, DIBUJADA COMO BALDOSA: TODO LO QUE PAGA BAJO UNA MISMA
 * CATEGORÍA.
 *
 * El mapa entero en tres columnas se lee bien con cinco alertas y se vuelve
 * ilegible con cien: la columna del medio queda con veinte cajas y los cables
 * cruzan de punta a punta. Partido por la CATEGORÍA DE LA REGLA, cada baldosa
 * es un mapa chico y completo —estas alertas, con estos alcances, pagan bajo
 * estas reglas— y se puede leer una sin mirar las otras.
 *
 * Antes eran franjas apiladas a todo el ancho, y comparar dos categorías era
 * hacer memoria porque nunca entraban juntas en pantalla. Como recuadros entran
 * de a dos, y de a más alejando.
 *
 * La categoría es la de la REGLA y no la de la alerta a propósito: es la que
 * agrupa en el corte, la que decide cuánto se paga. La categoría operativa de
 * la alerta ya no se pinta en el mapa: adentro de una baldosa que declara su
 * categoría con todas las letras, un segundo chip de otra clasificación sobre
 * la misma caja se leía como si fueran lo mismo.
 *
 * LA ABRE EL CATÁLOGO, NO LAS REGLAS. Una categoría recién creada llega acá
 * vacía a propósito, y por eso esta sección tiene un estado vacío que antes no
 * necesitaba. El porqué está en el memo `secciones` de BonusMap, que es donde
 * se decide.
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
    alertas, alcances, reglas, vacio = null,
}) {

    const { categoria, banco } = seccion;

    const n = seccion.alertas.length;
    const m = seccion.reglas.length;
    const cuenta = `${n} alerta${n === 1 ? '' : 's'} · ${m} regla${m === 1 ? '' : 's'}`;

    // Sin alertas y sin reglas no hay mini-mapa que dibujar: los alcances
    // cuelgan siempre de una alerta, así que no hace falta mirarlos.
    const vacia = !n && !m;

    return (
        // El banco arranca FILA PROPIA y mide lo mismo que cualquier baldosa. No
        // es una categoría —enfrente tiene TODAS las reglas activas, no las de
        // una—, así que a mitad de fila sería un cuadrante deforme; pero a doble
        // ancho tampoco: su contenido siguen siendo las mismas tres columnas de
        // 1148, y el resto sería borde vacío. `col-start-1` lo baja de renglón y
        // el hueco que deja a la derecha es correcto: no falta ninguna baldosa.
        // El punteado del borde dice lo mismo que su chip: acá todavía no hay
        // categoría.
        <section className={`${ANCHO_BALDOSA} ${BALDOSA}
                             ${banco ? 'col-start-1 border-dashed border-gray-400' : ''}`}>
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

                {/* La cuenta al otro extremo. Antes había en el medio una línea
                    que estiraba hasta el borde para marcar hasta dónde llegaba la
                    sección; adentro de un recuadro eso era dibujar dos veces el
                    mismo límite. */}
                <span style={sinAchicar(10.5, escala, 10)} className='ml-auto shrink-0 text-gray-500'>
                    {cuenta}
                </span>

                {!abierta && (
                    <span style={sinAchicar(10, escala, 9.5)}
                        className='shrink-0 font-bold uppercase tracking-wider text-gray-400'>
                        Plegada
                    </span>
                )}
            </header>

            {/* Plegada se desmonta, no se esconde: las cajas que no están en el
                DOM no se miden, y los cables de esta baldosa desaparecen con
                ella en vez de quedar colgando de la nada.

                Y una categoría sin nada NO dibuja tres columnas en blanco: un
                cuadro vacío no invita a nada, y que la baldosa invite a crearle
                su primera regla es todo el argumento de que exista. Se queda del
                alto de una caja para seguir leyéndose como baldosa y no como un
                renglón perdido entre cuadros. */}
            {abierta && (vacia ? (
                <div className='min-h-[190px] grid place-items-center content-center gap-3 text-center'>
                    {vacio}
                </div>
            ) : (
                <div className={COLUMNAS}>
                    <div className='flex flex-col gap-5'>{alertas}</div>
                    <div className='flex flex-col gap-3'>{alcances}</div>
                    <div className='flex flex-col gap-3'>{reglas}</div>
                </div>
            ))}
        </section>
    );
}
