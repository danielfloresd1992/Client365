'use client';
import { forwardRef } from 'react';

/**
 * Renderiza la tabla de indicadores de procesos (entrada, plato fuerte, postre).
 * Se renderiza oculto en el DOM para capturarlo como imagen con html-to-image.
 * Replica printDivData() + printDataDish() del index.js original de jarvis_api.
 */
const IndicatorProcesses = forwardRef(function IndicatorProcesses({ data = [] }, ref) {
    if (!data.length) return null;

    return (
        <div
            ref={ref}
            data-name="Indicadores de procesos"
            style={{
                position: 'absolute',
                left: '-9999px',
                top: 0,
                width: '920px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
            }}
        >
            {/* Header */}
            <div style={{
                backgroundColor: '#1a5c2a',
                borderRadius: '8px 8px 0 0',
                padding: '12px 20px',
                marginBottom: '2px',
            }}>
                <p style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: 0,
                }}>
                    Indicadores de proceso 📊
                </p>
            </div>

            {/* Rows per local */}
            {data.map((item, idx) => {
                const avgColor = item.resultEvaluation.processAverage < 2.4
                    ? '#c30000'
                    : '#03ad08';
                const avgArrow = item.resultEvaluation.processAverage < 2.4 ? '⬇' : '⬆';

                return (
                    <div
                        key={idx}
                        style={{
                            backgroundColor: idx % 2 === 0 ? '#f8faf9' : '#ffffff',
                            borderBottom: '1px solid #e2e8f0',
                            padding: '10px 16px',
                        }}
                    >
                        {/* Local name */}
                        <p style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#1a3c2a',
                            margin: '0 0 8px 0',
                            borderBottom: '2px solid #22c55e',
                            paddingBottom: '4px',
                            display: 'inline-block',
                        }}>
                            {item.name}
                        </p>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            {/* Column 1: Rotaciones */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MetricRow label="Rotaciones" value={item.tables} />
                                <MetricRow label="Total de procesos" value={item.precess.processTotal} />
                                <MetricRow
                                    label="Promedio de procesos"
                                    value={`${item.resultEvaluation.processAverage} ${avgArrow}`}
                                    valueColor={avgColor}
                                    bold
                                />
                            </div>

                            {/* Column 2: Números */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MetricRow label="Nº de entrada" value={item.precess.appetizer} />
                                <MetricRow label="Nº de plato fuerte" value={item.precess.mainDish} />
                                <MetricRow label="Nº de postre" value={item.precess.dessert} />
                            </div>

                            {/* Column 3: Porcentajes */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MetricRow label="% de entrada" value={`${item.resultEvaluation.percentageAppetizer}%`} />
                                <MetricRow label="% de plato fuerte" value={`${item.resultEvaluation.percentageMainDish}%`} />
                                <MetricRow label="% postre" value={`${item.resultEvaluation.percentageDessert}%`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

function MetricRow({ label, value, valueColor, bold }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '4px',
            padding: '4px 8px',
        }}>
            <span style={{ fontSize: '11px', color: '#475569' }}>{label}</span>
            <span style={{
                fontSize: '13px',
                fontWeight: bold ? 'bold' : '600',
                color: valueColor || '#0f172a',
            }}>
                {value}
            </span>
        </div>
    );
}

export default IndicatorProcesses;
