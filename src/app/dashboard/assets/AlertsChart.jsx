'use client';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// ApexCharts usa `window`: se carga solo en el cliente
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/*
 * Gráfica "Alertas por local — hoy" del panel analítico (ApexCharts).
 *
 * Barras HORIZONTALES por local (top por total del día), con dos barras por
 * fila gracias a los grupos de series:
 *   · grupo "dia":   ✓ aprobadas + ✗ rechazadas + ◌ ignoradas (apiladas = total)
 *   · grupo "envio": ➤ enviadas al grupo (barra propia, para comparar)
 *
 * Con degradado del verde de marca, total al final de la pila y animación
 * dinámica: cuando el conteo cambia por socket, la barra CRECE en vez de
 * saltar. Recibe los datos del padre (dayCounts + clients del store).
 *
 * MONITOREO EN VIVO: recibe además liveByLocal/silentByLocal (los mantiene
 * useMonitoringLive en el padre con 'monitoring-start'/'monitoring-end'/
 * 'monitoring-silence(-clear)') y decora cada fila POR TIPO: etiqueta verde
 * ● si su monitoreo ANALÍTICO está en ventana, azul ◆ si es PERIMETRAL,
 * roja ⚠ si el corte de silencio lo señaló sin reportar. En la cabecera,
 * chips con el desglose analítico/perimetral y los sin reportar. Todo se
 * actualiza al llegar el evento.
 */

const COLOR_APROBADAS = '#29c50c';
const COLOR_RECHAZADAS = '#fb7185';
const COLOR_IGNORADAS = '#cbd5e1';
const COLOR_ENVIADAS = '#f59e0b';

// Colores de la etiqueta del local según su estado de monitoreo AHORA
const LABEL_SILENT = '#dc2626';      // ⚠ señalado sin reportar (red-600)
const LABEL_ANALYTICAL = '#047857';  // ● analítico en ventana (emerald-700)
const LABEL_PERIMETER = '#0369a1';   // ● perimetral en ventana (sky-700)
const LABEL_OUT = '#475569';         // fuera de horario (slate-600)

export default function AlertsChart({ dayCounts, clients, liveByLocal, silentByLocal }) {

    const chartData = useMemo(() => {
        if (!dayCounts?.byId || !Array.isArray(clients)) return null;
        const nameById = new Map(clients.map(c => [String(c._id), c.name]));
        const rows = Object.entries(dayCounts.byId)
            .map(([id, c]) => {
                // Estado de monitoreo del local en este instante (viene del hook
                // del padre). El aviso de silencio solo aplica en ventana analítica.
                const monitorTypes = liveByLocal?.[id] ?? [];
                const inAnalytical = monitorTypes.includes('analytical');
                const inPerimeter = monitorTypes.includes('perimeter');
                return {
                    id,
                    name: nameById.get(id) ?? c.name ?? id,
                    positivas: c.positivas ?? 0,
                    negativas: c.negativas ?? 0,
                    ignoradas: c.ignoradas ?? 0,
                    enviadas: c.enviadas ?? 0,
                    total: c.total ?? 0,
                    inAnalytical,
                    inPerimeter,
                    isSilent: Boolean(silentByLocal?.[id]) && inAnalytical,
                };
            })
            .filter(l => l.total > 0)
            .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'es'));
        if (rows.length === 0) return null;
        return {
            names: rows.map(l => {
                const short = l.name.length > 20 ? `${l.name.slice(0, 19)}…` : l.name;
                // Glifo por tipo (además del color): ● analítico · ◆ perimetral
                return l.isSilent ? `⚠ ${short}` : l.inAnalytical ? `● ${short}` : l.inPerimeter ? `◆ ${short}` : short;
            }),
            labelColors: rows.map(l =>
                l.isSilent ? LABEL_SILENT
                    : l.inAnalytical ? LABEL_ANALYTICAL
                        : l.inPerimeter ? LABEL_PERIMETER
                            : LABEL_OUT),
            positivas: rows.map(l => l.positivas),
            negativas: rows.map(l => l.negativas),
            ignoradas: rows.map(l => l.ignoradas),
            enviadas: rows.map(l => l.enviadas),
            count: rows.length,
        };
    }, [dayCounts, clients, liveByLocal, silentByLocal]);

    const series = useMemo(() => chartData ? [
        { name: '✓ Aprobadas', group: 'dia', data: chartData.positivas },
        { name: '✗ Rechazadas', group: 'dia', data: chartData.negativas },
        { name: '◌ Ignoradas', group: 'dia', data: chartData.ignoradas },
        { name: '➤ Enviadas al grupo', group: 'envio', data: chartData.enviadas },
    ] : [], [chartData]);

    const options = useMemo(() => chartData ? ({
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
            fontFamily: 'inherit',
            parentHeightOffset: 0,
            redrawOnParentResize: true,
            animations: {
                enabled: true,
                speed: 650,
                dynamicAnimation: { enabled: true, speed: 420 },
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '72%',
                borderRadius: 4,
                borderRadiusApplication: 'end',
                borderRadiusWhenStacked: 'last',
                dataLabels: {
                    // Total del día al final de la pila
                    total: { enabled: true, style: { fontSize: '10px', fontWeight: 800, color: '#334155' } },
                },
            },
        },
        colors: [COLOR_APROBADAS, COLOR_RECHAZADAS, COLOR_IGNORADAS, COLOR_ENVIADAS],
        fill: {
            type: 'gradient',
            gradient: { type: 'horizontal', shadeIntensity: 0.3, opacityFrom: 0.88, opacityTo: 1 },
        },
        dataLabels: {
            enabled: true,
            formatter: (v) => (v > 0 ? v : ''),
            style: { fontSize: '9.5px', fontWeight: 700, colors: ['#fff'] },
            dropShadow: { enabled: false },
        },
        xaxis: {
            categories: chartData.names,
            labels: { style: { fontSize: '10px', colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            // Un color por local según su monitoreo: rojo=sin reportar,
            // verde=analítico, azul=perimetral, gris=fuera de horario
            labels: { style: { fontSize: '11px', fontWeight: 600, colors: chartData.labelColors }, maxWidth: 160 },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '11px',
            fontWeight: 600,
            markers: { size: 5, shape: 'circle' },
            itemMargin: { horizontal: 6 },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 3,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            padding: { top: -8 },
        },
        tooltip: { shared: true, intersect: false, style: { fontSize: '11px' } },

        /* En pantalla angosta, 160 px de etiqueta se comen la mitad del ancho y
           las barras dejan de compararse entre sí, que es lo único que esta
           gráfica hace. Se recorta la etiqueta, se achican los números de
           adentro y la leyenda se alinea a la izquierda —al envolverse, el aire
           libre queda de ese lado—. Los colores de cada etiqueta se conservan
           tal cual: son el estado de monitoreo, no decoración. */
        responsive: [{
            breakpoint: 640,
            options: {
                yaxis: {
                    labels: { style: { fontSize: '10px', fontWeight: 600, colors: chartData.labelColors }, maxWidth: 96 },
                },
                dataLabels: { style: { fontSize: '8.5px', fontWeight: 700, colors: ['#fff'] } },
                plotOptions: {
                    bar: { dataLabels: { total: { enabled: true, style: { fontSize: '9px', fontWeight: 800, color: '#334155' } } } },
                },
                legend: { horizontalAlign: 'left', fontSize: '10px', itemMargin: { horizontal: 4 } },
            },
        }],
    }) : null, [chartData]);

    // Totales globales del monitoreo (no solo de los locales graficados),
    // desglosados POR TIPO — un local puede estar en ambos a la vez — y los
    // señalados por el corte de silencio
    const enAnalitico = Object.values(liveByLocal ?? {}).filter(t => (t ?? []).includes('analytical')).length;
    const enPerimetral = Object.values(liveByLocal ?? {}).filter(t => (t ?? []).includes('perimeter')).length;
    const sinReportar = Object.keys(silentByLocal ?? {}).length;

    return (
        <section className='shrink-0 border-b border-gray-200 px-1 sm:px-2 pt-1' aria-label='Alertas por local hoy'>
            <div className='flex items-center justify-between gap-2 px-2 pt-1 flex-wrap'>
                <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                    Alertas por local — hoy {chartData && <span className='text-gray-300'>· {chartData.count} locales con alertas</span>}
                </h2>
                <span className='flex items-center gap-1.5 flex-wrap'>
                    {enAnalitico > 0 && (
                        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 tabular-nums' title='Establecimientos con monitoreo ANALÍTICO en ventana ahora'>
                            ● <b className='font-black'>{enAnalitico}</b> analítico
                        </span>
                    )}
                    {enPerimetral > 0 && (
                        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-sky-300 text-sky-700 tabular-nums' title='Establecimientos con monitoreo PERIMETRAL en ventana ahora'>
                            ◆ <b className='font-black'>{enPerimetral}</b> perimetral
                        </span>
                    )}
                    {sinReportar > 0 && (
                        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-red-300 text-red-600 tabular-nums animate-pulse' title='Señalados por el corte de silencio: sin novedades validadas y enviadas en la última hora'>
                            ⚠ <b className='font-black'>{sinReportar}</b> sin reportar
                        </span>
                    )}
                </span>
            </div>
            {chartData ? (
                <ReactApexChart
                    type='bar'
                    height={Math.max(170, 80 + chartData.count * 38)}
                    options={options}
                    series={series}
                />
            ) : (
                <p className='px-2 py-8 text-center text-xs text-gray-400'>
                    {dayCounts ? 'Aún no hay alertas registradas hoy.' : 'Cargando conteos del día…'}
                </p>
            )}
        </section>
    );
}
