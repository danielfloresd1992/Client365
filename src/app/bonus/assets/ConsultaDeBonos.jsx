'use client';
import { useEffect, useRef, useState } from 'react';
import DateRange, { contarDias } from '@/components/inpust/DateRange';
import UserPicker from '@/components/inpust/UserPicker';

/** El mismo tope que aplica el servidor. Se avisa acá para no ir y volver. */
export const MAX_DIAS = 92;

/**
 * LA CONSULTA DEL PANEL DE BONOS.
 *
 * Un rango y, opcionalmente, un operador. Es lo mismo que hoy se hace en la
 * hoja de cálculo poniendo dos fechas y un nombre en la pestaña «Resumen».
 *
 *
 * ARRANCA EN EL MES EN CURSO, Y SOLA.
 *
 * Del día 1 hasta hoy, todos los operadores. Es lo que alguien viene a mirar
 * casi siempre, y dejar los campos vacíos obliga a llenar tres cosas antes de
 * ver nada. Se puede cambiar; lo que no hace falta es elegir para empezar.
 *
 *
 * LAS FECHAS SE CALCULAN EN UN EFECTO, NO EN EL ESTADO INICIAL.
 *
 * `/bonus` se prerenderiza en el build. Un `useState(() => hoy())` grabaría en
 * el HTML la fecha del BUILD y después hidrataría con la de verdad: aviso de
 * hidratación, y un panel que arranca mostrando el mes equivocado hasta que
 * alguien lo toca. En un efecto se calcula en el navegador, con el reloj de
 * quien mira.
 *
 * Por eso hay un `listo`: hasta que las fechas existan no se consulta nada.
 *
 * @param {(c: {desde, hasta, operador}) => void} onConsultar
 *        Se llama al montar con el mes en curso, y después en cada «Consultar».
 * @param {boolean} cargando  deshabilita mientras la consulta está en vuelo
 */
export default function ConsultaDeBonos({ onConsultar, cargando = false }) {

    const [rango, setRango] = useState({ desde: '', hasta: '' });
    const [operador, setOperador] = useState(null);
    const [listo, setListo] = useState(false);

    // La primera consulta se dispara sola, una vez. En un ref y no en el
    // estado: cambiarlo volvería a renderizar para nada.
    const yaConsulto = useRef(false);
    const alConsultar = useRef(onConsultar);
    alConsultar.current = onConsultar;

    useEffect(() => {
        const ahora = new Date();
        const dosDigitos = n => String(n).padStart(2, '0');
        const dia = f => `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;

        const inicial = {
            desde: `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-01`,
            hasta: dia(ahora),
        };

        setRango(inicial);
        setListo(true);

        if (!yaConsulto.current) {
            yaConsulto.current = true;
            alConsultar.current?.({ ...inicial, operador: null });
        }
    }, []);

    const dias = contarDias(rango.desde, rango.hasta);
    const puedeConsultar = listo && dias > 0 && dias <= MAX_DIAS && !cargando;

    const consultar = () => {
        if (!puedeConsultar) return;
        onConsultar?.({ ...rango, operador: operador?._id ? String(operador._id) : null });
    };

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
                    deshabilitado={!listo}
                    className='min-w-[260px] flex-1'
                />

                <UserPicker
                    valor={operador}
                    onElegir={setOperador}
                    etiqueta='Operador'
                    textoTodos='Todos los operadores'
                    deshabilitado={!listo}
                    className='min-w-[220px] flex-1'
                />

                {/* Alineado con los campos y no con sus rótulos: el rótulo mide
                    un renglón fijo, así que este margen lo baja exactamente a
                    la altura de los inputs sin depender del largo del texto. */}
                <button type='button' onClick={consultar} disabled={!puedeConsultar}
                    className='mt-[21px] h-9 px-5 rounded-lg text-[12.5px] font-bold text-white
                               bg-[#29c50c] hover:bg-[#1f9a08] active:scale-[.98] transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed'>
                    {cargando ? 'Consultando…' : 'Consultar'}
                </button>
            </div>

            <p className='text-[11px] text-gray-500 mt-3 max-w-[80ch]'>
                {!listo
                    ? 'Preparando el mes en curso…'
                    : !dias
                        ? 'Elegí un desde y un hasta para empezar.'
                        : dias > MAX_DIAS
                            ? `El período no puede pasar de ${MAX_DIAS} días.`
                            : `${dias} día${dias === 1 ? '' : 's'}. Cuenta las alertas ya aprobadas del período; las anteriores al sistema de bonos no traen valor sellado.`}
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
