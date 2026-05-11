'use client';
import { forwardRef } from 'react';

/**
 * Renderiza las tablas de indicadores de toques de gerente agrupadas por franquicia.
 * Se renderiza oculto para capturarlo como imagen con html-to-image.
 * Replica createImgTouch() del index.js original de jarvis_api.
 *
 * Cada grupo de franquicia genera una imagen separada, por eso se usa un ref array.
 */
const IndicatorTouches = forwardRef(function IndicatorTouches({ data = [] }, ref) {
    if (!data.length) return null;

    return (
        <div
            ref={ref}
            style={{
                position: 'absolute',
                left: '-9999px',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                pointerEvents: 'none',
            }}
        >
            {data.map((group, gIdx) => {
                if (!group.length) return null;

                const lang = group[0].lang || 'es';
                const isEs = lang === 'es';
                const groupName = group.length > 1
                    ? `Indicadores de ${group[0].franchise || group[0].name}`
                    : `Indicadores de ${group[0].name}`;

                const headers = isEs
                    ? ['Manager', 'Primer toques', '%', 'Otros toques', '%']
                    : ['Manager', 'First touch', '%', 'Others touch', '%'];

                return (
                    <div
                        key={gIdx}
                        data-name={groupName}
                        className="touch-indicator-group"
                        style={{
                            width: '620px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            backgroundColor: '#1a5c2a',
                            padding: '12px 20px',
                        }}>
                            <p style={{
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                margin: 0,
                            }}>
                                {isEs ? 'Indicadores de toques de gerente 📈' : 'Manager visit tables 📈'}
                            </p>
                        </div>

                        {/* Each local in the group */}
                        {group.map((local, lIdx) => (
                            <div key={lIdx} style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {/* Local sub-header */}
                                <div style={{
                                    backgroundColor: '#f8faf9',
                                    padding: '8px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderBottom: '1px solid #e2e8f0',
                                }}>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a3c2a', margin: 0 }}>
                                        {isEs ? 'Restaurante' : 'Restaurant'}: {local.name}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                                        {isEs ? 'Nº rotaciones' : 'Nº rotations'}: <strong>{local.rotaciones}</strong>
                                    </p>
                                </div>

                                {/* Table header */}
                                <div style={{
                                    display: 'flex',
                                    backgroundColor: '#334155',
                                    padding: '6px 0',
                                }}>
                                    {headers.map((h, i) => (
                                        <div key={i} style={{
                                            flex: i === 0 ? 2 : 1,
                                            textAlign: 'center',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            color: '#ffffff',
                                            padding: '0 4px',
                                        }}>
                                            {h}
                                        </div>
                                    ))}
                                </div>

                                {/* Manager rows */}
                                {local.resultEvaluation.length === 0 ? (
                                    <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                            {isEs
                                                ? `Gerentes ausentes ${local.name}`
                                                : `Absence of manager ${local.name}`}
                                        </p>
                                    </div>
                                ) : (
                                    local.resultEvaluation.map((mgr, mIdx) => (
                                        <div
                                            key={mIdx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '6px 0',
                                                backgroundColor: mIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                                borderBottom: '1px solid #f1f5f9',
                                            }}
                                        >
                                            <div style={{ flex: 2, paddingLeft: '8px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                                                {mgr.name.split('_').join(' ')}
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#334155' }}>
                                                {mgr.first.amount}
                                            </div>
                                            <div style={{
                                                flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                                                color: mgr.first.percentage > 70 ? '#0DC607' : '#C6070A',
                                            }}>
                                                {mgr.first.percentage}%
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#334155' }}>
                                                {mgr.second.amount}
                                            </div>
                                            <div style={{
                                                flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                                                color: mgr.second.percentage > 70 ? '#0DC607' : '#C6070A',
                                            }}>
                                                {mgr.second.percentage}%
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
});

export default IndicatorTouches;
