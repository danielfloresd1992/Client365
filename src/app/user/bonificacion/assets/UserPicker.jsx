'use client';

import { useState, useEffect } from 'react';
import { getUsersList } from '@/libs/ajaxClient/user.fecth';
import { thumbUrl } from '@/libs/image';
import { SearchIcon } from '@/components/icons';

/**
 * Buscador de empleado para la consulta de bonificación.
 *
 * Busca contra el servidor y no sobre una lista traída entera: el directorio
 * pasa de setenta personas y el endpoint ya sabe filtrar por nombre y apellido.
 *
 * La búsqueda va con retardo: escribir "Valladares" son once teclas, y sin
 * esperar serían once consultas para una sola intención.
 */
export default function UserPicker({ seleccionado, onSelect }) {
    const [texto, setTexto] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [abierto, setAbierto] = useState(false);

    useEffect(() => {
        // Con menos de dos letras no se busca: devolvería medio directorio.
        if (texto.trim().length < 2) {
            setResultados([]);
            return;
        }

        let vigente = true;
        setBuscando(true);

        const id = setTimeout(async () => {
            try {
                const data = await getUsersList({ page: 1, limit: 8, search: texto.trim() });
                if (vigente) setResultados(data?.users || []);
            }
            catch {
                // Un fallo de búsqueda no puede romper la pantalla: se queda
                // sin resultados y el usuario puede reintentar escribiendo.
                if (vigente) setResultados([]);
            }
            finally {
                if (vigente) setBuscando(false);
            }
        }, 350);

        return () => { vigente = false; clearTimeout(id); };
    }, [texto]);

    const elegir = (u) => {
        onSelect(u);
        setTexto('');
        setResultados([]);
        setAbierto(false);
    };

    return (
        <div className='relative w-full sm:w-80'>
            <label className='block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1'>
                Empleado
            </label>

            {seleccionado ? (
                <div className='flex items-center gap-2 h-10 px-2 rounded-xl border border-gray-300 bg-white'>
                    <span className='w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 grid place-items-center'>
                        {seleccionado.img
                            /* eslint-disable-next-line @next/next/no-img-element */
                            ? <img src={thumbUrl(seleccionado.img, 56)} alt='' className='w-full h-full object-cover' />
                            : <span className='text-[10px] font-bold text-slate-600'>{seleccionado.name?.[0] || '?'}</span>}
                    </span>

                    <span className='flex-1 min-w-0 text-[13px] font-semibold text-gray-800 truncate'>
                        {seleccionado.name} {seleccionado.surName}
                    </span>

                    <button
                        type='button'
                        onClick={() => onSelect(null)}
                        title='Elegir otro empleado'
                        className='shrink-0 w-7 h-7 grid place-items-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <div className='relative'>
                    <span className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
                        <SearchIcon size={16} />
                    </span>
                    <input
                        type='text'
                        value={texto}
                        onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
                        onFocus={() => setAbierto(true)}
                        placeholder='Buscar por nombre o apellido…'
                        className='w-full h-10 pl-8 pr-3 rounded-xl border border-gray-300 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                    />
                </div>
            )}

            {abierto && !seleccionado && texto.trim().length >= 2 && (
                <div className='absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg'>
                    {buscando && (
                        <p className='px-3 py-3 text-[12px] text-gray-400'>Buscando…</p>
                    )}

                    {!buscando && resultados.length === 0 && (
                        <p className='px-3 py-3 text-[12px] text-gray-400'>Sin coincidencias.</p>
                    )}

                    {resultados.map(u => (
                        <button
                            key={u._id}
                            type='button'
                            onClick={() => elegir(u)}
                            className='w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors'
                        >
                            <span className='w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 grid place-items-center'>
                                {u.img
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    ? <img src={thumbUrl(u.img, 56)} alt='' className='w-full h-full object-cover' />
                                    : <span className='text-[10px] font-bold text-slate-600'>{u.name?.[0] || '?'}</span>}
                            </span>
                            <span className='min-w-0'>
                                <span className='block text-[13px] font-semibold text-gray-800 truncate'>
                                    {u.name} {u.surName}
                                </span>
                                <span className='block text-[11px] text-gray-400 truncate'>
                                    {u.jobInformation?.position || 'Sin cargo'}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
