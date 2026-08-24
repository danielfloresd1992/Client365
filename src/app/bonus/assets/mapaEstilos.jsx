'use client';
import { iconOf } from '@/libs/alerts/categoryIcons.js';

/**
 * Lo que comparten el mapa y sus secciones.
 *
 * Vive suelto y no dentro de BonusMap porque `SeccionDelMapa` lo necesita, y
 * que la sección importe del mapa que la dibuja sería un círculo.
 */

/**
 * LAS TRES COLUMNAS, EN UNA SOLA DEFINICIÓN.
 *
 * La usan la fila de rótulos y cada sección. Tiene que ser la misma cadena en
 * todas: si los rótulos declararan otro reparto, dirían «Reglas» encima de la
 * columna del medio.
 */
export const COLUMNAS = `grid gap-x-16 items-start
                         grid-cols-[minmax(210px,1fr)_minmax(230px,1.15fr)_minmax(220px,1fr)]`;


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
export const sinAchicar = (base, escala = 1, minimo = 11) => ({
    fontSize: `${Math.max(base, minimo / (escala || 1))}px`,
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
            <Icono size={12} />
            {categoria.es}
            {categoria.active === false && <span className='opacity-70'>· inactiva</span>}
        </span>
    );
}
