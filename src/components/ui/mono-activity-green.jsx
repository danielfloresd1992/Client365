'use client';
import { useMemo } from 'react';
import { construirRejilla, nivelDe, DIAS_ES } from './activityGrid';

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
 * @param {Date|string} [props.from]  primer día de la rejilla (default: hace 30 días)
 * @param {Date|string} [props.to]    último día (default: hoy)
 * @param {string}   [props.title]
 * @param {string}   [props.unitLabel='eventos']  cómo se llaman los valores en el tooltip
 * @param {(dia) => string} [props.tooltip]  texto propio para cada celda
 * @param {number}   [props.cell=13]  lado de la celda en px
 */
export function ActivityGreen({
    theme = 'dark',
    data = [],
    from,
    to,
    title,
    unitLabel = 'eventos',
    tooltip,
    cell = 13,
}) {

    const color = PALETA[theme] ?? PALETA.dark;

    const { semanas, maximo, total, etiquetasDeMes } = useMemo(
        () => construirRejilla({ data, from, to }),
        [data, from, to],
    );

    const gap = 3;
    const anchoColumna = cell + gap;

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

            <div className='overflow-x-auto'>
                <div className='inline-block'>

                    {/* Fila de meses */}
                    <div className='relative h-[13px]' style={{ width: semanas.length * anchoColumna }}>
                        {etiquetasDeMes.map(m => (
                            <span key={`${m.texto}-${m.columna}`}
                                style={{ left: m.columna * anchoColumna, color: color.texto }}
                                className='absolute top-0 text-[9px] font-semibold'>
                                {m.texto}
                            </span>
                        ))}
                    </div>

                    <div className='flex gap-[6px]'>

                        {/* Días de la semana: uno sí, uno no — con los siete la
                            columna pesa más que la rejilla que rotula. */}
                        <div className='flex flex-col' style={{ gap }}>
                            {DIAS_ES.map((dia, i) => (
                                <span key={dia}
                                    style={{ height: cell, color: color.texto, lineHeight: `${cell}px` }}
                                    className='text-[8.5px] w-[22px] text-right'>
                                    {i % 2 === 1 ? dia : ''}
                                </span>
                            ))}
                        </div>

                        {/* La rejilla */}
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
                                                    width: cell,
                                                    height: cell,
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
                    </div>

                    {/* Leyenda */}
                    <div className='flex items-center gap-1.5 mt-2 justify-end'
                        style={{ width: semanas.length * anchoColumna }}>
                        <span style={{ color: color.texto }} className='text-[9px]'>menos</span>
                        <div style={{ width: cell - 3, height: cell - 3, borderRadius: 2, background: color.vacio, outline: `1px solid ${color.borde}`, outlineOffset: -1 }} />
                        {color.niveles.map(c => (
                            <div key={c} style={{ width: cell - 3, height: cell - 3, borderRadius: 2, background: c, outline: `1px solid ${color.borde}`, outlineOffset: -1 }} />
                        ))}
                        <span style={{ color: color.texto }} className='text-[9px]'>más</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityGreen;
