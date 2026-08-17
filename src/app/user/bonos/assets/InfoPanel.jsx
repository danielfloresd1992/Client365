'use client';
import { useMemo } from 'react';
import { bonusPerAlert, formatBonus, formulaLabel } from './bonusRuleFormat';

/**
 * PANEL INFORMATIVO.
 *
 * Qué hay configurado, cómo se llega al monto que se paga, y qué falta.
 *
 * No edita nada, y por eso está aparte: la pantalla de configuración muestra
 * los datos para tocarlos uno por uno, y ninguna de sus partes responde las dos
 * preguntas que se hace cualquiera que llega —"¿esto está bien cargado?" y "¿de
 * dónde sale el número?"—. Para responderlas había que cruzar las tres listas a
 * ojo, hacer cuentas a mano y conocer el reglamento.
 *
 * Todo sale de lo que ya trajeron los hooks de la página. Ninguna consulta
 * nueva: son cuentas sobre datos que ya están en pantalla.
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
            <Estado resumen={resumen} />
            <Ejemplo resumen={resumen} />
            <Pendientes lista={resumen.pendientes} />
            <ComoFunciona />
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════
// LAS CUENTAS
// ══════════════════════════════════════════════════════════════════════

/**
 * Todo lo que el panel muestra, en una sola pasada.
 *
 * Vive fuera del componente y sin estado para poder leerse de arriba abajo: son
 * las mismas cuentas que alguien haría a mano mirando la pantalla de
 * configuración.
 */
const calcular = (ajustes, reglas = [], alertas = []) => {

    const pointValue = typeof ajustes?.pointValue === 'number' ? ajustes.pointValue : null;
    const exchangeRate = typeof ajustes?.exchangeRate === 'number' ? ajustes.exchangeRate : null;

    const activas = reglas.filter(r => r.active !== false);
    const bonifican = alertas.filter(a => a.bonusRule);
    const sinRevisar = alertas.filter(a => !a.bonusReviewed);

    // Reglas dadas de baja que todavía tienen alertas apuntándoles. Importa más
    // de lo que parece: al resolver la bonificación, una regla inactiva devuelve
    // "no bonifica", así que esas alertas dejaron de pagar sin que nadie las
    // tocara y sin que salte ningún error.
    const inactivasEnUso = reglas.filter(r => r.active === false && r.inUse > 0);
    const sinUsar = activas.filter(r => !r.inUse);

    const pendientes = [];

    if (activas.length === 0) {
        pendientes.push({
            gravedad: 'alta',
            texto: 'No hay ninguna regla creada, así que hoy no bonifica ninguna alerta.',
            comoSeArregla: 'Se crean en el mapa, con «+ Regla».',
        });
    }

    if (exchangeRate === 0 || exchangeRate === null) {
        pendientes.push({
            gravedad: 'alta',
            texto: 'La tasa del BCV está sin cargar.',
            comoSeArregla: 'Los bonos se acumulan igual, pero no se pueden convertir a bolívares hasta que se cargue.',
        });
    }

    if (pointValue === 0) {
        pendientes.push({
            gravedad: 'alta',
            texto: 'El valor de un bono está en cero.',
            comoSeArregla: 'Todo lo que se selle mientras siga así vale cero, y no se recalcula después.',
        });
    }

    if (inactivasEnUso.length > 0) {
        pendientes.push({
            gravedad: 'alta',
            texto: `${inactivasEnUso.length} regla${inactivasEnUso.length === 1 ? '' : 's'} desactivada${inactivasEnUso.length === 1 ? '' : 's'} que todavía usa${inactivasEnUso.length === 1 ? '' : 'n'} ${inactivasEnUso.reduce((t, r) => t + r.inUse, 0)} alerta(s).`,
            comoSeArregla: 'Esas alertas dejaron de bonificar sin avisar. Hay que reactivar la regla o pasarles otra.',
        });
    }

    if (sinRevisar.length > 0) {
        pendientes.push({
            gravedad: 'media',
            texto: `${sinRevisar.length} de ${alertas.length} alertas sin revisar.`,
            comoSeArregla: 'Hoy no bonifican, pero nadie decidió que no debieran hacerlo. Se les tiende un cable desde el mapa.',
        });
    }

    if (sinUsar.length > 0) {
        pendientes.push({
            gravedad: 'baja',
            texto: `${sinUsar.length} regla${sinUsar.length === 1 ? '' : 's'} activa${sinUsar.length === 1 ? '' : 's'} que no usa ninguna alerta.`,
            comoSeArregla: 'No molestan, pero llenan el mapa de reglas vacías. Conviene asignarles alertas o darlas de baja.',
        });
    }

    return {
        pointValue,
        exchangeRate,
        unBonoEnBolivares: pointValue !== null && exchangeRate !== null ? pointValue * exchangeRate : null,

        totalReglas: reglas.length,
        reglasActivas: activas.length,
        totalAlertas: alertas.length,
        alertasQueBonifican: bonifican.length,
        alertasSinRevisar: sinRevisar.length,

        // Para el ejemplo: la regla que más alertas usa, que es la que más
        // veces va a aparecer en un corte real.
        reglaDelEjemplo: [...activas].sort((a, b) => (b.inUse || 0) - (a.inUse || 0))[0] || null,

        pendientes,
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


/**
 * DE DÓNDE SALE EL MONTO.
 *
 * La misma cuenta que hace el sistema, con los valores que hay cargados ahora y
 * con una regla que existe de verdad — la que más alertas usa, que es la que más
 * va a aparecer en un corte.
 *
 * Se muestra con seis alertas y no con cuatro a propósito: seis es el caso que
 * genera la duda —"si la regla pide 4 y hay 6, ¿las dos que sobran se pierden?"—
 * y verlo resuelto vale más que cualquier explicación.
 */
function Ejemplo({ resumen }) {

    const regla = resumen.reglaDelEjemplo;

    if (!regla) {
        return (
            <section className='bg-white rounded-xl shadow-sm border p-5'>
                <h2 className='text-base font-bold text-gray-800 leading-tight'>De dónde sale el monto</h2>
                <p className='text-[12.5px] text-gray-600 mt-2 max-w-[72ch]'>
                    Cuando haya al menos una regla creada, acá va a aparecer la cuenta completa hecha con ella y con
                    los valores cargados arriba: de las alertas aprobadas al monto en bolívares, paso por paso.
                </p>
            </section>
        );
    }

    const CANTIDAD = 6;
    const porAlerta = bonusPerAlert(regla, 'day');
    const bonos = CANTIDAD * porAlerta;
    const dolares = resumen.pointValue !== null ? bonos * resumen.pointValue : null;
    const bolivares = dolares !== null && resumen.exchangeRate !== null ? dolares * resumen.exchangeRate : null;

    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>
            <h2 className='text-base font-bold text-gray-800 leading-tight'>De dónde sale el monto</h2>
            <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[74ch]'>
                La cuenta que hace el sistema, con los valores de hoy y con la regla que más alertas usa.
            </p>

            <p className='text-[12.5px] text-gray-700 mt-4'>
                Un operador <strong className='font-semibold'>diurno</strong> tiene {CANTIDAD} alertas aprobadas
                de <strong className='font-semibold'>«{regla.name}»</strong>, que otorga {formulaLabel(regla)}.
            </p>

            <ol className='mt-3 rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden'>
                <Paso texto='Cada alerta de este tipo vale' valor={`${formatBonus(porAlerta)} bono`} />
                <Paso texto={`Las ${CANTIDAD} aprobadas suman`} valor={`${formatBonus(bonos)} bonos`} />
                <Paso
                    texto={resumen.pointValue !== null ? `A ${enDolares(resumen.pointValue)} el bono` : 'Falta el valor del bono'}
                    valor={dolares !== null ? enDolares(dolares) : '—'}
                />
                <Paso
                    texto={resumen.exchangeRate ? `Al cambio de ${enBolivares(resumen.exchangeRate)} por dólar` : 'Falta la tasa del BCV'}
                    valor={bolivares ? enBolivares(bolivares) : '—'}
                    final
                />
            </ol>

            {regla.alertsRequired > 1 && (
                <p className='text-[11.5px] text-gray-600 mt-3 max-w-[74ch]'>
                    Fijate en el segundo renglón: la regla pide {regla.alertsRequired} alertas por bono y hay {CANTIDAD}.
                    Las {CANTIDAD - regla.alertsRequired} que sobran del grupo <strong className='font-semibold'>no se
                    pierden</strong> — cada alerta aporta su parte y se suman todas.
                </p>
            )}
        </section>
    );
}


function Paso({ texto, valor, final }) {
    return (
        <li className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${final ? 'bg-[#fdf6e7]' : ''}`}>
            <span className={`text-[12.5px] ${final ? 'text-[#8a5a2b]' : 'text-gray-600'}`}>{texto}</span>
            <span className={`text-[13px] tabular-nums shrink-0 ${final ? 'text-[#8a5a2b] font-black' : 'text-gray-800 font-bold'}`}>
                {valor}
            </span>
        </li>
    );
}


/**
 * QUÉ FALTA.
 *
 * Solo aparece cuando hay algo que arreglar: una sección que dice "todo en
 * orden" en cada carga entrena a saltearla, y el día que sí diga algo tampoco
 * se va a leer.
 */
function Pendientes({ lista }) {

    if (lista.length === 0) {
        return (
            <section className='bg-white rounded-xl shadow-sm border p-5'>
                <div className='flex items-center gap-2.5'>
                    <span className='shrink-0 grid place-items-center w-6 h-6 rounded-full bg-[#29c50c]/10 text-[#1f9a08]'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' className='w-3.5 h-3.5'>
                            <polyline points='20 6 9 17 4 12' />
                        </svg>
                    </span>
                    <p className='text-[13px] font-semibold text-gray-800'>
                        No queda nada por configurar.
                    </p>
                </div>
            </section>
        );
    }

    const COLOR = {
        alta: 'bg-red-50 border-red-200 text-red-800',
        media: 'bg-[#fdf6e7] border-[#d9a441]/40 text-[#8a5a2b]',
        baja: 'bg-gray-50 border-gray-200 text-gray-700',
    };

    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>
            <h2 className='text-base font-bold text-gray-800 leading-tight'>Qué falta</h2>
            <p className='text-[11.5px] text-gray-500 mt-0.5'>
                Ordenado por lo que más afecta a lo que se paga.
            </p>

            <ul className='space-y-2 mt-4'>
                {lista.map((p, i) => (
                    <li key={i} className={`rounded-lg border px-4 py-3 ${COLOR[p.gravedad]}`}>
                        <p className='text-[12.5px] font-bold'>{p.texto}</p>
                        <p className='text-[11.5px] opacity-80 mt-0.5 max-w-[74ch]'>{p.comoSeArregla}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}


/**
 * Las cuatro cosas que no se deducen mirando la pantalla.
 *
 * Cada una está acá porque su contraria es la suposición natural: que el resto
 * se pierde, que el turno es el de la novedad, que corregir una regla arregla lo
 * viejo, y que la tasa queda congelada como el valor del bono.
 */
function ComoFunciona() {

    const REGLAS = [
        {
            titulo: 'Las alertas suman, y el resto no se pierde',
            texto: 'Una regla de 4 alertas por bono deja 0,25 en cada una. Seis alertas son 1,5 bonos, no 1: las dos que sobran del grupo aportan su parte igual.',
        },
        {
            titulo: 'El turno es el del operador, no el de la novedad',
            texto: 'Lo que cambia entre diurno y nocturno es cuántos bonos otorga la alerta, y el bono es del operador que la reportó. Un operador nocturno puede reportar algo que pasó de día y cobra como nocturno.',
        },
        {
            titulo: 'Lo ya sellado no se vuelve a calcular',
            texto: 'Cada novedad guarda su propia copia de cuánto bonificó y de cuánto valía el bono en ese momento. Corregir una regla o el valor rige de ahí en adelante: nunca cambia lo de la semana pasada.',
        },
        {
            titulo: 'La tasa no se congela; el valor del bono sí',
            texto: 'El valor del bono queda grabado en cada novedad al validarla. La tasa se aplica recién al liquidar, y toda la liquidación va al mismo cambio.',
        },
    ];

    return (
        <section className='bg-white rounded-xl shadow-sm border p-5'>
            <h2 className='text-base font-bold text-gray-800 leading-tight'>Cómo funciona la bonificación</h2>
            <p className='text-[11.5px] text-gray-500 mt-0.5 max-w-[74ch]'>
                Cuatro cosas que no se deducen mirando la pantalla, y que conviene saber antes de tocar una regla.
            </p>

            <div className='grid gap-x-8 gap-y-4 sm:grid-cols-2 mt-4'>
                {REGLAS.map(regla => (
                    <div key={regla.titulo}>
                        <h3 className='text-[12.5px] font-bold text-gray-800'>{regla.titulo}</h3>
                        <p className='text-[11.5px] text-gray-600 mt-1 max-w-[62ch]'>{regla.texto}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
