'use client';
import { FaStar, FaStore, FaBuilding } from 'react-icons/fa';
import { worthLabel, ratioLabel } from '../../lib/bonusLabels.js';

/**
 * Cómo bonifica una alerta, en la tarjeta de la lista.
 *
 * Responde de un vistazo las tres preguntas que se hacen al mirar la lista:
 * cuánto vale, dónde aplica, y si hay casos especiales.
 *
 * La estrella es DORADA y solo aparece acá. En toda la pantalla no hay otra
 * cosa dorada: es lo que permite recorrer la lista buscando "las que pagan"
 * sin leer una sola palabra.
 *
 * No se muestra nada cuando la bonificación está apagada. Una fila que dijera
 * "sin bonificación" en las 207 alertas que no bonifican convertiría el dato
 * en ruido y escondería justo a las que sí.
 */

const ORO = '#b45309';
const ORO_FONDO = '#fffbeb';
const ORO_BORDE = '#fde68a';

/** Una píldora del resumen: ícono + texto, todo del mismo tono. */
function Pildora({ Icono, children, titulo }) {
    return (
        <span
            title={titulo}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: ORO,
                background: '#fff',
                border: `1px solid ${ORO_BORDE}`,
                borderRadius: '999px',
                padding: '1px 7px',
                whiteSpace: 'nowrap',
            }}
        >
            {Icono && <Icono size={9} />}
            {children}
        </span>
    );
}


export default function BonusSummary({ bonusSystem }) {
    if (!bonusSystem?.isEnabled) return null;

    const regla = bonusSystem.defaultRule || {};
    const marcas = bonusSystem.franchiseExceptions?.length || 0;
    const locales = bonusSystem.localExceptions?.length || 0;
    const proporcion = ratioLabel(regla);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '5px 8px',
            borderRadius: '8px',
            background: ORO_FONDO,
            border: `1px solid ${ORO_BORDE}`,
        }}>
            <FaStar size={11} color={ORO} style={{ flexShrink: 0 }} />

            {/* El valor por defecto: lo primero que se busca. */}
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: ORO }}>
                {worthLabel(regla.bonusWorth)}
            </span>

            {/* La proporción solo si NO es la normal: "3x1" dice algo, "1x1" no. */}
            {proporcion && (
                <Pildora titulo={`${regla.accumulationRequired} alertas por ${regla.bonusWorth} bono(s)`}>
                    {proporcion}
                </Pildora>
            )}

            {/* Dónde aplica la regla general. */}
            <span style={{ fontSize: '10.5px', color: ORO, opacity: 0.85 }}>
                {regla.bonifies === false ? 'solo donde se indique' : 'en todos'}
            </span>

            {/* Y qué se aparta. El conteo alcanza: el detalle está en el
                formulario, y una lista de quince nombres acá haría la tarjeta
                más alta que la información que aporta. */}
            {marcas > 0 && (
                <Pildora Icono={FaBuilding} titulo='Franquicias con regla propia'>
                    {marcas}
                </Pildora>
            )}

            {locales > 0 && (
                <Pildora Icono={FaStore} titulo='Establecimientos con regla propia'>
                    {locales}
                </Pildora>
            )}

            {/* El código del reglamento, para poder contrastarlo con el papel. */}
            {bonusSystem.regulationCode && (
                <span style={{
                    fontSize: '10px', color: ORO, opacity: 0.7,
                    marginLeft: 'auto', fontFamily: 'ui-monospace, monospace',
                }}>
                    {bonusSystem.regulationCode}
                </span>
            )}
        </div>
    );
}
