'use client';
import { useMemo, useState } from 'react';
import DateRange, { contarDias } from '@/components/inpust/DateRange';
import UserPicker from '@/components/inpust/UserPicker';

/** El mismo tope que aplica el servidor. Se avisa acá para no ir y volver. */
const MAX_DIAS = 92;

/**
 * PANEL INFORMATIVO.
 *
 * Consultar lo bonificado en un período, y ver qué hay configurado hoy.
 *
 * No edita nada, y por eso está aparte: la pantalla de configuración muestra
 * los datos para tocarlos uno por uno, y ninguna de sus partes responde las
 * preguntas que se hace cualquiera que llega —"¿esto está bien cargado?" y
 * "¿cuánto se bonificó esta quincena?"—.
 *
 * El estado sale de lo que ya trajeron los hooks de la página: son cuentas
 * sobre datos que ya están en pantalla. La consulta de período sí va al
 * servidor, porque son las novedades y no la configuración.
 */
export default function InfoPanel({ ajustes, reglas, alertas, cargando }) {

    const resumen = useMemo(() => calcular(ajustes, reglas, alertas), [ajustes, reglas, alertas]);

    if (cargando) {
        return (
            <section className='bg-white rounded-xl shadow-sm border p-5'>
                <p className='text-[13px] text-gray-500'>Cargando el estado del sistema…</p>
            </section>
        );
    }

    return (
        <div className='space-y-4'>
            <Consulta />
            <Estado resumen={resumen} />
        </div>
    );
}


/**
 * LA CONSULTA.
 *
 * Un rango y, opcionalmente, un operador. Es lo mismo que hoy se hace en la
 * hoja de cálculo poniendo dos fechas y un nombre en la pestaña «Resumen».
 *
 * Los tres campos son piezas de uso general, no de esta pantalla: `DateRange`
 * y `UserPicker` viven en `components/inpust` y los puede usar cualquiera. Acá
 * solo se los junta y se decide cuándo la consulta está lista para pedirse.
 */
function Consulta() {

    const [rango, setRango] = useState({ desde: '', hasta: '' });
    const [operador, setOperador] = useState(null);

    const dias = contarDias(rango.desde, rango.hasta);
    const listo = dias > 0 && dias <= MAX_DIAS;

    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>

            <div className='flex flex-wrap items-start gap-3'>
                <span className='shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                    <IconoBuscar />
                </span>
                <div className='min-w-0 flex-1'>
                    <h2 className='text-base font-bold text-gray-800 leading-tight'>Consultar bonos</h2>
                    <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[72ch]'>
                        Las alertas de un período, sumadas. Sin elegir operador vienen las de todos.
                    </p>
                </div>
            </div>

            {/* Los tres campos en una fila, con el botón al final: se leen como
                una sola frase —de tal fecha a tal otra, de tal persona— y así
                se ve de un vistazo qué falta para poder consultar. */}
            <div className='mt-4 flex flex-wrap items-start gap-3'>
                <DateRange
                    valor={rango}
                    onCambiar={setRango}
                    maximoDias={MAX_DIAS}
                    className='min-w-[260px] flex-1'
                />

                <UserPicker
                    valor={operador}
                    onElegir={setOperador}
                    etiqueta='Operador'
                    textoTodos='Todos los operadores'
                    className='min-w-[220px] flex-1'
                />

                {/* Alineado con los campos y no con sus rótulos: el rótulo mide
                    un renglón fijo, así que este margen lo baja exactamente a
                    la altura de los inputs sin depender del largo del texto. */}
                <button type='button' disabled={!listo}
                    className='mt-[21px] h-9 px-5 rounded-lg text-[12.5px] font-bold text-white
                               bg-[#29c50c] hover:bg-[#1f9a08] active:scale-[.98] transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed'>
                    Consultar
                </button>
            </div>

            <p className='text-[11px] text-gray-500 mt-3 max-w-[80ch]'>
                {!dias
                    ? 'Elegí un desde y un hasta para empezar.'
                    : dias > MAX_DIAS
                        ? `El período no puede pasar de ${MAX_DIAS} días.`
                        : 'Cuenta las alertas ya aprobadas del período. Las anteriores al sistema de bonos no traen valor sellado.'}
            </p>
        </section>
    );
}


function IconoBuscar() {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
            strokeLinecap='round' strokeLinejoin='round' className='w-5 h-5'>
            <circle cx='11' cy='11' r='7' />
            <path d='m20 20-3.5-3.5' />
        </svg>
    );
}


// ══════════════════════════════════════════════════════════════════════
// LAS CUENTAS
// ══════════════════════════════════════════════════════════════════════

/**
 * Lo que muestra el estado del sistema, en una sola pasada.
 *
 * Vive fuera del componente y sin estado para poder leerse de arriba abajo: son
 * las mismas cuentas que alguien haría a mano mirando la pantalla de
 * configuración.
 */
const calcular = (ajustes, reglas = [], alertas = []) => {

    const pointValue = typeof ajustes?.pointValue === 'number' ? ajustes.pointValue : null;
    const exchangeRate = typeof ajustes?.exchangeRate === 'number' ? ajustes.exchangeRate : null;

    const activas = reglas.filter(r => r.active !== false);
    const bonifican = alertas.filter(a => a.bonusRules?.length);
    const sinRevisar = alertas.filter(a => !a.bonusReviewed);

    return {
        pointValue,
        exchangeRate,
        unBonoEnBolivares: pointValue !== null && exchangeRate !== null ? pointValue * exchangeRate : null,

        totalReglas: reglas.length,
        reglasActivas: activas.length,
        totalAlertas: alertas.length,
        alertasQueBonifican: bonifican.length,
        alertasSinRevisar: sinRevisar.length,
    };
};


const enDolares = (n) => `${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const enBolivares = (n) => `${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;


// ══════════════════════════════════════════════════════════════════════
// SECCIONES
// ══════════════════════════════════════════════════════════════════════

/**
 * El estado, en dos columnas: el dinero y la cobertura.
 *
 * En renglones de etiqueta y valor, como un estado de cuenta, y no en tarjetas
 * con un número grande cada una: son ocho datos que se leen juntos para sacar
 * una conclusión, y ocho tarjetas los convierten en ocho cosas sueltas.
 */
function Estado({ resumen }) {
    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>
            <h2 className='text-base font-bold text-gray-800 leading-tight'>Estado del sistema</h2>
            <p className='text-[11.5px] text-gray-500 mt-0.5'>Lo que hay cargado hoy.</p>

            <div className='grid gap-x-8 gap-y-5 sm:grid-cols-2 mt-4'>
                <Grupo titulo='El dinero'>
                    <Renglon etiqueta='Valor de un bono'
                        valor={resumen.pointValue !== null ? enDolares(resumen.pointValue) : 'sin cargar'}
                        atenuado={!resumen.pointValue} />
                    <Renglon etiqueta='Tasa del BCV'
                        valor={resumen.exchangeRate ? enBolivares(resumen.exchangeRate) : 'sin cargar'}
                        atenuado={!resumen.exchangeRate} />
                    <Renglon etiqueta='Un bono hoy'
                        valor={resumen.unBonoEnBolivares ? enBolivares(resumen.unBonoEnBolivares) : '—'}
                        destacado={Boolean(resumen.unBonoEnBolivares)}
                        atenuado={!resumen.unBonoEnBolivares} />
                </Grupo>

                <Grupo titulo='La cobertura'>
                    <Renglon etiqueta='Reglas activas'
                        valor={`${resumen.reglasActivas}${resumen.totalReglas > resumen.reglasActivas ? ` de ${resumen.totalReglas}` : ''}`}
                        atenuado={resumen.reglasActivas === 0} />
                    <Renglon etiqueta='Alertas que bonifican'
                        valor={`${resumen.alertasQueBonifican} de ${resumen.totalAlertas}`}
                        atenuado={resumen.alertasQueBonifican === 0} />
                    <Renglon etiqueta='Sin revisar'
                        valor={String(resumen.alertasSinRevisar)}
                        atenuado={resumen.alertasSinRevisar === 0} />
                </Grupo>
            </div>
        </section>
    );
}


function Grupo({ titulo, children }) {
    return (
        <div>
            <h3 className='text-[11px] font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100'>
                {titulo}
            </h3>
            <dl className='divide-y divide-gray-50'>{children}</dl>
        </div>
    );
}


function Renglon({ etiqueta, valor, destacado, atenuado }) {
    return (
        <div className='flex items-baseline justify-between gap-3 py-2'>
            <dt className='text-[12.5px] text-gray-600'>{etiqueta}</dt>
            <dd className={`text-[13px] tabular-nums ${
                atenuado ? 'text-gray-400 font-medium'
                    : destacado ? 'text-[#8a5a2b] font-black'
                    : 'text-gray-800 font-bold'
            }`}>
                {valor}
            </dd>
        </div>
    );
}
