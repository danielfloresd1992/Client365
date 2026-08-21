'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    construirRejilla,
    nivelDe,
    medidasDeLaRejilla,
    columnasParaCubrir,
    columnasDentroDe,
    DIAS_ES,
} from './activityGrid';

/*
 * MAPA DE CALOR DE ACTIVIDAD — rejilla estilo calendario de contribuciones.
 *
 *     import { ActivityGreen } from '@/components/ui/mono-activity-green';
 *     <ActivityGreen theme='dark' />
 *
 * Una columna por semana, una fila por día de la semana, y cada celda coloreada
 * según su valor. De un vistazo se ve QUÉ DÍAS pasó algo y con qué intensidad,
 * que es lo que una lista de fechas no deja ver.
 *
 *
 * POR QUÉ ESTÁ ESCRITO ACÁ Y NO INSTALADO
 *
 * El componente venía de `npx @subhanhq/amicro@latest add mono-activity-green`.
 * Ese paquete existe en npm pero NO trae ejecutable: su `main` apunta a un
 * `dist/index.html` —es el sitio de la galería, no una herramienta—, así que el
 * comando falla con "could not determine executable to run". Se reprodujo acá
 * con la misma API pública (`ActivityGreen`, prop `theme`) para no depender de
 * un paquete que no se puede instalar, y sin sumar dependencias: es SVG y CSS.
 *
 *
 * La matemática del calendario —qué día cae en qué celda y con qué intensidad—
 * vive aparte, en `activityGrid.js`: es la parte que se equivoca en silencio
 * (una rejilla corrida se ve perfecta, solo que cada dato aparece un día
 * antes), así que está en JavaScript puro y con pruebas.
 *
 *
 * LA REJILLA OCUPA TODO EL ANCHO
 *
 * El ancho manda, no el calendario. Se mide el contenedor, se calcula cuántas
 * semanas entran y las celdas se estiran para repartirse el ancho EXACTO. Si
 * caben más semanas de las que pide el período, el rango se alarga hacia ATRÁS:
 * antes que dejar una franja muerta a la derecha, se muestran más días.
 *
 * `minDays` es el piso — nunca menos de eso, aunque el panel sea estrecho: en
 * ese caso las celdas se achican en lugar de esconder días.
 *
 * Los DATOS no dependen de nada de esto. Llegan todos y cada uno se coloca en
 * su casilla por fecha; los que caigan fuera de lo que se está mostrando
 * simplemente no se dibujan. Así el tamaño de la ventana no cambia lo que hay
 * que pedirle al servidor.
 */

const PALETA = {
    dark: {
        vacio: '#1b1f23',
        borde: '#2b3138',
        niveles: ['#0e4429', '#006d32', '#26a641', '#39d353'],
        texto: '#8b949e',
        textoFuerte: '#e6edf3',
        fondo: 'transparent',
    },
    light: {
        vacio: '#ebedf0',
        borde: '#d8dee4',
        niveles: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
        texto: '#57606a',
        textoFuerte: '#1f2328',
        fondo: 'transparent',
    },
};

/**
 * Rejilla de actividad.
 *
 * @param {object}   props
 * @param {'dark'|'light'} [props.theme='dark']
 * @param {Array<{date: string|Date, value: number, label?: string}>} [props.data]
 *        Solo los días CON actividad. Los que falten se pintan en cero.
 * @param {Date|string} [props.to]    último día (default: hoy)
 * @param {number}   [props.minDays=30]  días mínimos a mostrar; si cabe más, se
 *        alarga hacia atrás hasta llenar el ancho
 * @param {number}   [props.maxDays=371]  tope hacia atrás. Debe cubrir como
 *        mucho lo que se le pidió al servidor: sin tope, una pantalla ancha
 *        pintaría en cero meses de los que nunca se trajo un dato
 * @param {string}   [props.title]
 * @param {string}   [props.unitLabel='eventos']  cómo se llaman los valores en el tooltip
 * @param {(dia) => string} [props.tooltip]  texto propio para cada celda
 * @param {number}   [props.cell=13]  lado DESEADO de la celda; el real se
 *        calcula para repartir el ancho exacto, así que sale igual o mayor
 * @param {(rango) => void} [props.onRangeChange]  avisa qué rango quedó a la
 *        vista, por si quien lo usa quiere rotularlo
 */
export function ActivityGreen({
    theme = 'dark',
    data = [],
    to,
    minDays = 30,
    maxDays = 371,
    title,
    unitLabel = 'eventos',
    tooltip,
    cell = 13,
    onRangeChange,
}) {

    const color = PALETA[theme] ?? PALETA.dark;
    const gap = 3;

    // ── El ancho disponible ───────────────────────────────────────────
    // Se mide el hueco real donde va la rejilla, ya descontada la columna de
    // los días de la semana. Con ResizeObserver y no con el `resize` de la
    // ventana: este panel vive en una pestaña dentro de un riel que cambia de
    // ancho sin que la ventana se mueva.
    const cajaRef = useRef(null);
    const [ancho, setAncho] = useState(0);

    useEffect(() => {
        const caja = cajaRef.current;
        if (!caja || typeof ResizeObserver === 'undefined') return;

        const observador = new ResizeObserver(entradas => {
            const medida = entradas[0]?.contentRect?.width ?? 0;
            // Se redondea al entero: sin esto un ancho fraccionario dispara un
            // re-render por cada píxel decimal durante toda la animación de
            // apertura del panel.
            setAncho(Math.floor(medida));
        });

        observador.observe(caja);
        return () => observador.disconnect();
    }, []);

    const fin = useMemo(() => (to ? new Date(to) : new Date()), [to]);

    // Cuántas columnas y de qué tamaño. El ancho decide; el período pone el piso.
    const { columnas, celda } = useMemo(() => medidasDeLaRejilla({
        ancho,
        celdaDeseada: cell,
        gap,
        minColumnas: columnasParaCubrir(fin, minDays),
        // `columnasDentroDe` y no `columnasParaCubrir`: como techo hace falta la
        // que redondea hacia ABAJO, o se muestran más días de los que se pidieron.
        maxColumnas: columnasDentroDe(fin, maxDays),
    }), [ancho, cell, fin, minDays, maxDays]);

    const { semanas, maximo, total, etiquetasDeMes } = useMemo(
        () => construirRejilla({ data, to: fin, columnas }),
        [data, fin, columnas],
    );

    // Qué rango quedó a la vista, para que quien lo use pueda rotularlo.
    const primerDia = semanas[0]?.[0]?.fecha ?? null;
    const diasALaVista = columnas * 7;

    useEffect(() => {
        if (!onRangeChange || !primerDia) return;
        onRangeChange({ from: primerDia, to: fin, days: diasALaVista, columns: columnas });
        // `primerDia` es el que resume el rango: si no cambió, no cambió nada.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [primerDia?.getTime(), fin?.getTime(), columnas]);

    const anchoColumna = celda + gap;

    const textoCelda = (dia) => {
        if (!dia.dentro) return '';
        const fecha = dia.fecha.toLocaleDateString('es-VE', {
            weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
        });
        if (tooltip) return `${fecha}\n${tooltip(dia)}`;
        return `${fecha}\n${dia.valor} ${unitLabel}`;
    };

    return (
        <div style={{ background: color.fondo, fontFamily: "'Victor Mono', ui-monospace, monospace" }}>

            {(title || total > 0) && (
                <div className='flex items-baseline justify-between gap-3 mb-2'>
                    {title && (
                        <h4 style={{ color: color.textoFuerte }} className='text-[11.5px] font-bold tracking-tight'>
                            {title}
                        </h4>
                    )}
                    <span style={{ color: color.texto }} className='text-[10px] tabular-nums'>
                        {total} {unitLabel} en el período
                    </span>
                </div>
            )}

            {/* La fila de días de la semana va FUERA del contenedor medido: lo
                que se mide es el hueco de la rejilla, no el del componente. Si
                se midiera todo, las columnas se calcularían con 28px de más y
                la última se saldría. */}
            <div className='flex gap-[6px] items-start'>

                {/* Días de la semana: uno sí, uno no — con los siete la columna
                    pesa más que la rejilla que rotula. */}
                <div className='shrink-0 w-[22px]'>
                    {/* Hueco a la altura de la fila de meses, para que los
                        rótulos queden a la altura de sus filas. */}
                    <div className='h-[13px]' />
                    <div className='flex flex-col' style={{ gap }}>
                        {DIAS_ES.map((dia, i) => (
                            <span key={dia}
                                style={{ height: celda, color: color.texto, lineHeight: `${celda}px` }}
                                className='text-[8.5px] text-right block'>
                                {i % 2 === 1 ? dia : ''}
                            </span>
                        ))}
                    </div>
                </div>

                {/* El hueco que se mide y que la rejilla llena por completo */}
                <div ref={cajaRef} className='flex-1 min-w-0'>

                    {/* Fila de meses */}
                    <div className='relative h-[13px]'>
                        {etiquetasDeMes.map(m => (
                            <span key={`${m.texto}-${m.columna}`}
                                style={{ left: m.columna * anchoColumna, color: color.texto }}
                                className='absolute top-0 text-[9px] font-semibold whitespace-nowrap'>
                                {m.texto}
                            </span>
                        ))}
                    </div>

                    {/* La rejilla. `flex` con las columnas repartidas: el ancho
                        de celda ya viene calculado para que sumen el total. */}
                    <div className='flex' style={{ gap }}>
                        {semanas.map((columna, ci) => (
                            <div key={ci} className='flex flex-col' style={{ gap }}>
                                {columna.map(dia => {
                                    const nivel = nivelDe(dia.valor, maximo);
                                    return (
                                        <div
                                            key={dia.key}
                                            title={textoCelda(dia)}
                                            style={{
                                                width: celda,
                                                height: celda,
                                                borderRadius: 2,
                                                background: !dia.dentro
                                                    ? 'transparent'
                                                    : nivel === 0
                                                        ? color.vacio
                                                        : color.niveles[nivel - 1],
                                                outline: dia.dentro ? `1px solid ${color.borde}` : 'none',
                                                outlineOffset: -1,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Leyenda */}
                    <div className='flex items-center gap-1.5 mt-2 justify-end'>
                        <span style={{ color: color.texto }} className='text-[9px]'>menos</span>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: color.vacio, outline: `1px solid ${color.borde}`, outlineOffset: -1 }} />
                        {color.niveles.map(c => (
                            <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c, outline: `1px solid ${color.borde}`, outlineOffset: -1 }} />
                        ))}
                        <span style={{ color: color.texto }} className='text-[9px]'>más</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityGreen;
