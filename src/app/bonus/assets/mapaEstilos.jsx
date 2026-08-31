'use client';
import { iconOf } from '@/libs/alerts/categoryIcons.js';

/**
 * Lo que comparten el mapa y sus secciones.
 *
 * Vive suelto y no dentro de BonusMap porque `SeccionDelMapa` lo necesita, y
 * que la sección importe del mapa que la dibuja sería un círculo.
 */

/**
 * LAS TRES COLUMNAS DE UNA BALDOSA, EN UNA SOLA DEFINICIÓN.
 *
 * Antes la compartían la fila de rótulos y cada sección, y tenían que declarar
 * el mismo reparto o los rótulos caían corridos. Los rótulos se fueron al
 * encabezado de la tarjeta —en el mosaico hay un juego de columnas por baldosa
 * y ninguno cae debajo de una fila común—, así que hoy esta cadena la usa un
 * solo lugar: el cuerpo de la baldosa. Sigue viviendo suelta porque de ella
 * sale el ancho de la baldosa, y los dos números tienen que poder leerse
 * juntos.
 *
 *
 * ANCHOS FIJOS, Y ESO ES LO QUE HACE QUE EL ZOOM SE VEA.
 *
 * Con tracks elásticos —`minmax(210px, 1fr)`— el ancho en pantalla no cambiaba
 * NUNCA con el zoom. `zoom: 0.5` duplica el lienzo en píxeles de layout, así
 * que `1fr` reparte el doble de ancho, y ese doble por 0.5 da lo mismo:
 *
 *     al 100%   1500px de layout  →  columna de 435  →  435 en pantalla
 *     al  50%   3000px de layout  →  columna de 911  →  456 en pantalla
 *
 * El alto sí encogía, porque es intrínseco: no se reparte, se escala. De ahí
 * que alejarse achatara las cajas en vez de achicarlas.
 *
 * Un lienzo con zoom necesita tamaño PROPIO. Con columnas elásticas se
 * redimensiona solo para llenar siempre el contenedor, y entonces el zoom no
 * tiene nada que escalar en horizontal.
 */
export const COLUMNAS = 'grid gap-x-16 items-start grid-cols-[320px_380px_320px]';

/**
 * LA BALDOSA: UNA CATEGORÍA, CON SU MINI-MAPA COMPLETO ADENTRO.
 *
 *     columnas   320 + 380 + 320                    = 1020
 *     huecos     gap-x-16 × 2  (4rem = 64 cada uno)  =  128
 *     contenido                                       = 1148
 *     padding    p-5 × 2                              =   40
 *     borde      1px × 2                              =    2
 *     BALDOSA                                         = 1190
 *
 * SIN RELLENO, Y NO ES UNA ELECCIÓN ESTÉTICA. Los cables son un SVG que se
 * pinta DEBAJO del mapa (z-0 contra el z-[1] del envoltorio, que además crea
 * contexto de apilado: nada de acá adentro puede bajar por debajo de él). Un
 * `bg-white` en la baldosa no atenuaría los cables de su categoría, los
 * borraría enteros, sin ningún error y sin nada en consola. El recuadro lo hace
 * el borde, y adentro se sigue viendo el punteado del lienzo — que de paso
 * dice, sin escribirlo, que eso es mesa de trabajo.
 *
 * Y NO RECORTA: nada de `overflow-hidden`, por más que un `rounded-2xl` lo
 * pida. Las cajas se arrastran a mano SIN TOPE y el puerto del cable sobresale
 * 10px del borde derecho de su caja; con recorte, una caja llevada de más no
 * quedaría sobre el lienzo, se borraría de la pantalla, y la única forma de
 * recuperarla sería «Reacomodar» sin ver qué se está reacomodando. Tampoco
 * `overflow:auto` (el rect se desfasa apenas alguien scrollea y la época no se
 * entera), ni `transform` / `zoom` propios (el trazado divide por UNA escala
 * global), ni `content-visibility:auto` ni `contain:size` (el subárbol salteado
 * mide 0×0 y envenena el cache con ceros).
 *
 * El ancho va SEPARADO de la decoración: el banco lo reusa con otro borde y sin
 * ser una categoría.
 */
export const ANCHO_BALDOSA = 'w-[1190px]';
export const BALDOSA = 'rounded-2xl border border-gray-200 p-5';

/**
 * EL MOSAICO. Dos baldosas por fila, en píxeles declarados.
 *
 *     1190 × 2 + gap-x-12 (48) = 2428
 *
 * `grid-cols-2` es `1fr 1fr`, y `auto-fit`/`minmax` es peor: los dos devuelven
 * el mapa a ancho elástico, y con ancho elástico el zoom deja de verse en
 * horizontal — que es el pozo del que salió COLUMNAS, contado arriba. Cuántas
 * baldosas entran por fila no lo decide el navegador; lo decide este número.
 *
 * `items-start` y no el `stretch` que la grilla trae de fábrica: sin eso una
 * baldosa llena estira a su compañera vacía, y una categoría recién creada
 * aparecería como un rectángulo enorme con dos renglones adentro. Que el borde
 * de abajo quede desparejo es lo honesto: cada baldosa mide lo que tiene.
 *
 * Va escrito como literal y no armado con `${}`: el JIT de Tailwind escanea el
 * archivo, no lo ejecuta, y una clase interpolada no existiría en el CSS.
 */
export const MOSAICO = 'grid grid-cols-[repeat(2,1190px)] gap-x-12 gap-y-10 items-start';

/**
 * Y el ancho propio del mapa, que es el del mosaico.
 *
 * Sigue explícito por el ZOOM, que ahora es su única razón: el motivo viejo —la
 * línea del encabezado de cada sección, que estiraba hasta el borde— se fue con
 * la franja. Adentro de un recuadro esa línea era doble marco, así que se sacó;
 * hasta dónde llega una categoría ahora lo dice el borde.
 */
export const ANCHO_MAPA = 'w-[2428px]';


/**
 * EL TEXTO QUE NO SE ACHICA CON EL ZOOM.
 *
 * La propiedad `zoom` escala TODO por igual, así que al 50% un título de
 * 13,5px se dibuja a 6,75 y el mapa se vuelve un diagrama de cajas sin
 * nombres — que es justo lo contrario de para qué se aleja: alejarse es para
 * ver el conjunto, y el conjunto son los nombres.
 *
 * Estos textos declaran un MÍNIMO EN PANTALLA y se agrandan en el layout lo
 * necesario para sostenerlo:
 *
 *     al 100%   13,5px de layout  →  13,5px en pantalla
 *     al  50%   22px de layout    →  11px en pantalla   (el mínimo)
 *     al 150%   13,5px de layout  →  20px en pantalla   (crece normal)
 *
 * Solo se compensa lo que identifica una caja —su nombre—, los rótulos de las
 * columnas y los encabezados de sección. Las listas de establecimientos y los
 * detalles se achican como todo lo demás: alejado no se leen, y no tienen por
 * qué.
 *
 * @param base    el tamaño en píxeles de layout, al 100%
 * @param escala  el zoom actual
 * @param minimo  cuánto no puede bajar EN PANTALLA
 */
/**
 * El mismo mínimo, pero en NÚMERO: no todo lo que no puede achicarse es
 * `font-size`. Se parte en dos para que la regla del piso siga escrita en un
 * solo lugar.
 */
export const enPantalla = (base, escala = 1, minimo = 11) =>
    Math.max(base, minimo / (escala || 1));

export const sinAchicar = (base, escala = 1, minimo = 11) => ({
    fontSize: `${enPantalla(base, escala, minimo)}px`,
});


/** El rótulo de una columna. */
export const Rotulo = ({ children, escala }) => (
    <span style={sinAchicar(10, escala, 10)}
        className='font-bold uppercase tracking-wider text-gray-500'>
        {children}
    </span>
);


/** La categoría de una regla: ícono y color tal como los guarda el catálogo. */
export function ChipCategoria({ categoria, escala = 1 }) {
    const Icono = iconOf(categoria.icon);
    return (
        <span className='inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-bold'
            style={{
                ...sinAchicar(10.5, escala, 10),
                background: categoria.bg || '#fdf6e7',
                color: categoria.color || '#8a5a2b',
            }}>
            {/* El ícono con el mismo piso que su texto. En el mosaico este chip
                dejó de ser un detalle adentro de la caja de regla y pasó a ser
                el TÍTULO de la baldosa —lo único que dice de qué es el cuadro—,
                y alejarse es justamente para leer los nombres: a 50% el texto se
                maqueta a 20 (10 en pantalla) y un ícono clavado en 12 de layout
                se dibujaba a 6, la mitad de su propia letra. */}
            <Icono size={enPantalla(12, escala, 11)} />
            {categoria.es}
            {categoria.active === false && <span className='opacity-70'>· inactiva</span>}
        </span>
    );
}
