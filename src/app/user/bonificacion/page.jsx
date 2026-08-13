'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import useSubmitLock from '@/hook/useSubmitLock';
import { getNoveltiesByUser } from '@/libs/ajaxClient/noveltyReport.fecth';
import { BellIcon } from '@/components/icons';

import UserPicker from './assets/UserPicker';
import NoveltiesResult from './assets/NoveltiesResult';

/**
 * /user/bonificacion — novedades reportadas por un empleado en un rango.
 *
 * Sirve para calcular la bonificación: cuántas novedades levantó una persona en
 * el período y cuántas de ellas quedaron aprobadas.
 *
 * Cuenta lo que la persona REPORTÓ, no lo que validó. Son dos trabajos
 * distintos y el bono premia el primero.
 */

/** "2026-08-01" del día de hoy, en la zona del equipo. */
const hoyISO = () => {
    const d = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};

/** Primer día del mes en curso. */
const inicioDeMesISO = () => {
    const d = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-01`;
};


export default function BonificacionPage() {
    const dispatch = useDispatch();
    const { run: runLocked, isBusy } = useSubmitLock();

    const [empleado, setEmpleado] = useState(null);
    const [desde, setDesde] = useState(inicioDeMesISO);
    const [hasta, setHasta] = useState(hoyISO);
    const [datos, setDatos] = useState(null);

    const consultando = isBusy('consultar');

    const consultar = () => runLocked(async () => {
        if (!empleado?._id) {
            dispatch(setConfigModal({
                type: 'warning',
                title: 'Falta el empleado',
                description: 'Elegí a quién querés consultarle las novedades.',
                modalOpen: true,
            }));
            return;
        }

        try {
            const r = await getNoveltiesByUser({ userId: empleado._id, since: desde, until: hasta });
            setDatos(r);
        }
        catch (error) {
            setDatos(null);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo consultar',
                description: error?.response?.data?.message
                    || 'Hubo un problema al pedir las novedades. Intentá nuevamente.',
                modalOpen: true,
            }));
        }
    }, 'consultar');

    // Al cambiar de empleado se borra lo anterior: dejar en pantalla el
    // resultado de otra persona junto a un nombre nuevo es la forma más fácil
    // de pagarle un bono a quien no era.
    const elegirEmpleado = (u) => {
        setEmpleado(u);
        setDatos(null);
    };

    return (
        <div className='w-full h-full p-4 sm:p-6 bg-gray-50 flex flex-col gap-4 overflow-hidden'>

            {/* Encabezado */}
            <div className='shrink-0 bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3'>
                <span className='shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                    <BellIcon size={20} />
                </span>
                <div>
                    <h1 className='text-lg font-bold text-gray-800'>Bonificación por novedades</h1>
                    <p className='text-xs text-gray-500'>
                        Novedades que reportó un empleado en un rango de fechas
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className='shrink-0 bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-end gap-3'>
                <UserPicker seleccionado={empleado} onSelect={elegirEmpleado} />

                <div>
                    <label htmlFor='desde' className='block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1'>
                        Desde
                    </label>
                    <input
                        id='desde'
                        type='date'
                        value={desde}
                        max={hasta}
                        onChange={(e) => setDesde(e.target.value)}
                        className='h-10 px-3 rounded-xl border border-gray-300 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                    />
                </div>

                <div>
                    <label htmlFor='hasta' className='block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1'>
                        Hasta
                    </label>
                    <input
                        id='hasta'
                        type='date'
                        value={hasta}
                        min={desde}
                        onChange={(e) => setHasta(e.target.value)}
                        className='h-10 px-3 rounded-xl border border-gray-300 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                    />
                </div>

                <button
                    type='button'
                    onClick={consultar}
                    disabled={consultando || !empleado}
                    className='h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] active:scale-[.98] transition-colors disabled:opacity-60 disabled:cursor-default'
                >
                    {consultando ? 'Consultando…' : 'Consultar'}
                </button>

                {/* El día "hasta" cuenta completo, y conviene decirlo: si no, se
                    asume lo contrario y se repite la consulta un día más. */}
                <p className='text-[11px] text-gray-400 w-full sm:w-auto sm:ml-auto'>
                    El día final se incluye completo.
                </p>
            </div>

            {/* Resultado */}
            {datos
                ? <NoveltiesResult datos={datos} empleado={empleado} />
                : (
                    <div className='flex-1 min-h-0 grid place-items-center bg-white rounded-xl border'>
                        <div className='text-center px-6 py-10'>
                            <p className='text-sm font-semibold text-gray-500'>
                                {empleado ? 'Elegí el rango y pulsá Consultar' : 'Empezá eligiendo un empleado'}
                            </p>
                            <p className='text-xs text-gray-400 mt-1'>
                                Se cuentan las novedades que la persona reportó, no las que validó.
                            </p>
                        </div>
                    </div>
                )}
        </div>
    );
}
