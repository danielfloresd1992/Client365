'use client';
import { useMemo } from 'react';
import { FaTimes, FaPrint, FaStar } from 'react-icons/fa';
import { metaOf } from '../../lib/categoryMeta.js';
import {
    partirPorBonificacion, porValorDeBono, excepcionesPorDestino,
    filasPorCategoria, sinCodigoDeReglamento, fechaLarga,
} from '../../lib/bonusReport.js';

/**
 * El sistema de bonificación, en un documento imprimible.
 *
 * Sale de las alertas REALES que ya tiene la pantalla. No hay ninguna lista
 * escrita a mano: un informe redactado aparte envejece mal, y a la tercera
 * edición del reglamento ya no coincide con lo que hace el sistema.
 *
 *
 * POR QUÉ SE IMPRIME Y NO SE DESCARGA
 *
 * Client365 no tiene librería de PDF, y sumar una —unos 350 KB— para una sola
 * pantalla es caro. El diálogo de impresión del navegador guarda como PDF, así
 * que el resultado es el mismo archivo sin agregar nada al paquete.
 *
 * El precio es un clic más: hay que elegir "Guardar como PDF" en el diálogo. Se
 * dice en el botón para que nadie lo busque.
 *
 *
 * LAS REGLAS DE IMPRESIÓN NO SON UN DETALLE
 *
 * En pantalla esto es un modal; impreso tiene que ser un documento. Las reglas
 * de abajo esconden el resto de la aplicación, sueltan el alto fijo del modal y
 * evitan que una tabla se parta a la mitad entre dos hojas.
 */

const VERDE = '#1f9a08';
const ORO = '#b45309';
const CREMA = '#f4f7f0';
const LINEA = '#dfe5da';

/** Un número grande con su etiqueta: lo que se mira primero. */
function Cifra({ valor, etiqueta, tono = '#1a1a1a', fondo = '#fff' }) {
    return (
        <div style={{
            flex: 1, minWidth: '108px', padding: '10px 12px',
            border: `1px solid ${LINEA}`, borderRadius: '10px', background: fondo,
        }}>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, lineHeight: 1, color: tono, fontVariantNumeric: 'tabular-nums' }}>
                {valor}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>
                {etiqueta}
            </p>
        </div>
    );
}

const TH = {
    textAlign: 'left', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.06em', color: '#fff', background: VERDE, padding: '6px 8px',
};

const TD = { fontSize: '11px', padding: '6px 8px', borderBottom: `1px solid ${LINEA}`, verticalAlign: 'top' };


export default function BonusReport({ alertas = [], local = [], franchises = [], onCerrar }) {
    const nombreDeLocal = (id) => local.find(l => String(l._id) === String(id))?.name || '(establecimiento no encontrado)';
    const nombreDeMarca = (id) => franchises.find(f => String(f._id) === String(id))?.name || '(franquicia no encontrada)';

    const datos = useMemo(() => {
        const { bonifican, noBonifican } = partirPorBonificacion(alertas);
        return {
            bonifican, noBonifican,
            porValor: porValorDeBono(bonifican),
            categorias: filasPorCategoria(bonifican, (clave) => metaOf(clave).text || clave),
            excepciones: excepcionesPorDestino(alertas, nombreDeLocal, nombreDeMarca),
            sinCodigo: sinCodigoDeReglamento(bonifican),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alertas, local, franchises]);

    const totalExcepciones = datos.excepciones.locales.length + datos.excepciones.marcas.length;

    return (
        <div className='informe-bono__telon' style={{
            position: 'fixed', inset: 0, zIndex: 70,
            background: 'rgba(17,24,39,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '18px',
        }}>
            <style>{`
                @media print {
                    /* Todo lo que no sea el informe desaparece. Sin esto, la
                       hoja sale con la barra de navegación y la lista detrás. */
                    body > *:not(.informe-bono__telon) { display: none !important; }
                    .informe-bono__telon {
                        position: static !important; inset: auto !important;
                        background: #fff !important; padding: 0 !important; display: block !important;
                    }
                    .informe-bono {
                        max-height: none !important; height: auto !important;
                        overflow: visible !important; box-shadow: none !important;
                        border: none !important; border-radius: 0 !important; max-width: none !important;
                    }
                    .informe-bono__cuerpo { overflow: visible !important; padding: 0 !important; }
                    .informe-bono__barra { display: none !important; }
                    /* Una tabla partida entre dos hojas pierde su encabezado y
                       deja de leerse. Cada bloque se mantiene entero. */
                    .informe-bono__bloque { break-inside: avoid; page-break-inside: avoid; }
                    .informe-bono__salto { break-before: page; page-break-before: always; }
                }
            `}</style>

            <div className='informe-bono' style={{
                width: '100%', maxWidth: '900px', maxHeight: '92vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                background: '#fff', borderRadius: '14px', border: `1px solid ${LINEA}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            }}>

                {/* Barra de acciones — no se imprime */}
                <div className='informe-bono__barra' style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', borderBottom: `1px solid ${LINEA}`, background: CREMA,
                }}>
                    <FaStar size={15} color={ORO} />
                    <b style={{ flex: 1, fontSize: '14px' }}>Sistema de bonificación</b>

                    <button
                        type='button'
                        onClick={() => window.print()}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '12.5px', fontWeight: 700, color: '#fff',
                            background: `linear-gradient(135deg, #29c50c 0%, ${VERDE} 100%)`,
                        }}
                    >
                        <FaPrint size={12} /> Guardar como PDF
                    </button>

                    <button
                        type='button' onClick={onCerrar} title='Cerrar'
                        style={{
                            width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${LINEA}`, background: '#fff', color: '#6b7280',
                        }}
                    >
                        <FaTimes size={13} />
                    </button>
                </div>

                <div className='informe-bono__cuerpo' style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 26px 34px' }}>

                    {/* ── Encabezado del documento ─────────────────── */}
                    <div style={{ background: VERDE, color: '#fff', borderRadius: '10px', padding: '18px 20px', marginBottom: '18px' }}>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Sistema de bonificación</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.92 }}>
                            Cómo bonifica cada alerta, y dónde
                        </p>
                        <p style={{ margin: '10px 0 0', fontSize: '10.5px', opacity: 0.85 }}>
                            Client365 · Amazonas365 · {fechaLarga()}
                        </p>
                    </div>

                    <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, margin: '0 0 16px' }}>
                        Este documento sale de las alertas cargadas en el sistema, no de una lista
                        aparte: refleja lo que el sistema hace hoy. Cada alerta puede bonificar en
                        todos los establecimientos, en algunos, o de forma distinta según cuál — y
                        eso es lo que se detalla acá.
                    </p>

                    {/* ── Las cifras ───────────────────────────────── */}
                    <div className='informe-bono__bloque' style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <Cifra valor={alertas.length} etiqueta='Alertas' />
                        <Cifra valor={datos.bonifican.length} etiqueta='Bonifican' tono={ORO} fondo='#fffbeb' />
                        <Cifra valor={datos.noBonifican.length} etiqueta='Sin bonificación' tono='#6b7280' fondo={CREMA} />
                        <Cifra valor={totalExcepciones} etiqueta='Con regla propia' tono={VERDE} />
                    </div>

                    {/* ── Cómo se cuenta ───────────────────────────── */}
                    <div className='informe-bono__bloque' style={{
                        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px',
                        padding: '14px 16px', marginBottom: '20px',
                    }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: ORO }}>
                            Cómo se cuenta un bono
                        </p>
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
                            Al cierre se agrupan las novedades <b>aprobadas</b> de cada alerta y se
                            aplica la proporción del reglamento. <b>Acumulación 3 con valor 1</b> se
                            escribe <b>3x1</b>: tres alertas reportadas dan un bono. <b>1x2</b> es una
                            alerta que da dos.
                        </p>
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#374151', fontFamily: 'ui-monospace, monospace' }}>
                            bonos = cantidad × valor ÷ acumulación &nbsp;·&nbsp; puntos = bonos × valor del punto
                        </p>
                        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#92400e' }}>
                            Cada novedad guarda la regla que estaba vigente cuando se reportó, así que
                            cambiar una alerta hoy no altera lo que ya se contó.
                        </p>
                    </div>

                    {/* ── Distribución por valor ───────────────────── */}
                    {datos.porValor.length > 0 && (
                        <div className='informe-bono__bloque' style={{ marginBottom: '22px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px', color: '#1a1a1a' }}>
                                Cuántas alertas hay de cada valor
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {datos.porValor.map(v => (
                                    <div key={v.worth} style={{
                                        display: 'flex', alignItems: 'center', gap: '7px',
                                        padding: '6px 12px', borderRadius: '999px',
                                        background: '#fffbeb', border: '1px solid #fde68a',
                                    }}>
                                        <b style={{ fontSize: '13px', color: ORO }}>{v.etiqueta}</b>
                                        <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                                            {v.cantidad} {v.cantidad === 1 ? 'alerta' : 'alertas'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── El detalle por categoría ─────────────────── */}
                    {datos.categorias.map(grupo => (
                        <div key={grupo.clave} className='informe-bono__bloque' style={{ marginBottom: '18px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px', color: VERDE }}>
                                {grupo.nombre} <span style={{ color: '#9ca3af', fontWeight: 600 }}>· {grupo.filas.length}</span>
                            </p>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                                    <thead>
                                        <tr>
                                            <th style={TH}>Alerta</th>
                                            <th style={TH}>Reglamento</th>
                                            <th style={TH}>Valor</th>
                                            <th style={TH}>Proporción</th>
                                            <th style={TH}>Alcance</th>
                                            <th style={TH}>Excepciones</th>
                                            <th style={TH}>Punto d/n</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grupo.filas.map((f, i) => (
                                            <tr key={`${f.titulo}_${i}`} style={{ background: i % 2 ? CREMA : '#fff' }}>
                                                <td style={{ ...TD, fontWeight: 600 }}>{f.titulo}</td>
                                                <td style={{ ...TD, fontFamily: 'ui-monospace, monospace', color: '#6b7280' }}>{f.codigo || '—'}</td>
                                                <td style={{ ...TD, fontWeight: 700, color: ORO }}>{f.valor}</td>
                                                <td style={{ ...TD, fontFamily: 'ui-monospace, monospace' }}>{f.proporcion}</td>
                                                <td style={{ ...TD, color: '#6b7280' }}>{f.alcance}</td>
                                                <td style={{ ...TD, color: '#6b7280' }}>{f.excepciones}</td>
                                                <td style={{ ...TD, fontVariantNumeric: 'tabular-nums', color: '#6b7280' }}>{f.punto}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* ── Las excepciones, vistas al revés ─────────── */}
                    {totalExcepciones > 0 && (
                        <div className='informe-bono__salto'>
                            <p style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px' }}>
                                Quién se aparta de la regla general
                            </p>
                            <p style={{ fontSize: '11.5px', color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>
                                La misma información al revés: en vez de «esta alerta, en estos
                                establecimientos», acá está «este establecimiento, en estas alertas».
                                Es la vista que hace falta cuando alguien pregunta por qué en su local
                                se bonifica distinto.
                            </p>

                            {[
                                { titulo: 'Por franquicia', lista: datos.excepciones.marcas },
                                { titulo: 'Por establecimiento', lista: datos.excepciones.locales },
                            ].filter(b => b.lista.length).map(bloque => (
                                <div key={bloque.titulo} style={{ marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: VERDE, margin: '0 0 8px' }}>
                                        {bloque.titulo}
                                    </p>
                                    {bloque.lista.map(destino => (
                                        <div key={destino.id} className='informe-bono__bloque' style={{
                                            border: `1px solid ${LINEA}`, borderRadius: '9px',
                                            padding: '10px 12px', marginBottom: '8px',
                                        }}>
                                            <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 700 }}>
                                                {destino.nombre}
                                                <span style={{ color: '#9ca3af', fontWeight: 600 }}> · {destino.alertas.length} alerta(s)</span>
                                            </p>
                                            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                                                {destino.alertas.map((a, i) => (
                                                    <li key={`${a.titulo}_${i}`} style={{ fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>
                                                        <b>{a.titulo}</b>
                                                        {' — '}
                                                        {a.bonifica === false ? 'no bonifica acá'
                                                            : a.bonifica === true ? 'bonifica acá'
                                                                : 'igual que la regla general'}
                                                        {a.worth != null && `, valor ${a.worth}`}
                                                        {a.acumulacion != null && `, cada ${a.acumulacion}`}
                                                        {a.nota && <span style={{ color: '#9ca3af' }}> · {a.nota}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Lo que falta cargar ──────────────────────── */}
                    {datos.sinCodigo.length > 0 && (
                        <div className='informe-bono__bloque' style={{
                            border: '1px solid #fecaca', background: '#fef2f2',
                            borderRadius: '10px', padding: '12px 14px', marginTop: '18px',
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>
                                {datos.sinCodigo.length} alerta(s) bonifican sin código del reglamento
                            </p>
                            <p style={{ margin: '4px 0 6px', fontSize: '11px', color: '#7f1d1d' }}>
                                Bonifican igual, pero no se pueden contrastar con el papel cuando alguien reclama.
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#7f1d1d' }}>
                                {datos.sinCodigo.slice(0, 12).join(' · ')}
                                {datos.sinCodigo.length > 12 && ` … y ${datos.sinCodigo.length - 12} más`}
                            </p>
                        </div>
                    )}

                    <p style={{ marginTop: '22px', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                        Jarvis365 · Amazonas365 · Generado el {fechaLarga()} desde las alertas del sistema
                    </p>
                </div>
            </div>
        </div>
    );
}
