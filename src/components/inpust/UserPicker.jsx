'use client';
import { useState, useRef, useEffect } from 'react';
import useUserSearch from '@/hook/useUserSearch';

/**
 * BUSCADOR DE UN USUARIO.
 *
 * Un campo de texto y una lista debajo. Busca contra el servidor por el mismo
 * `/user/list` que usa el directorio de `/user/config`.
 *
 *     const [operador, setOperador] = useState(null);
 *     <UserPicker valor={operador} onElegir={setOperador} etiqueta='Operador' />
 *
 * `valor` es el usuario elegido —o `null` para "todos"— y `onElegir` recibe el
 * usuario entero, no solo el id: quien lo usa casi siempre necesita el nombre
 * para mostrarlo, y volver a buscarlo en la lista es trabajo repetido.
 *
 * ES UN BUSCADOR Y NO UN `<select>` porque son cientos de usuarios. En un
 * desplegable eso es una lista que hay que recorrer con la rueda, y además
 * obliga a traerlos todos para llenarlo. Acá se escriben tres letras y el
 * servidor devuelve ocho.
 */
export default function UserPicker({
    valor = null,
    onElegir,
    etiqueta = 'Usuario',
    textoTodos = 'Todos',
    deshabilitado = false,
    className = '',
    maximo = 8,
}) {

    const [texto, setTexto] = useState('');
    const [abierto, setAbierto] = useState(false);
    const caja = useRef(null);

    // Solo se busca con la lista abierta: elegido un usuario la lista se
    // cierra, y seguir consultando por un texto que nadie ve es trabajo al
    // servidor por nada.
    const { usuarios, cargando, error } = useUserSearch(abierto && !valor ? texto : '', { limite: maximo });

    // Cerrar al tocar fuera. Sin esto la lista queda abierta tapando lo que
    // sigue, y el gesto natural para descartarla no hace nada.
    useEffect(() => {
        if (!abierto) return undefined;
        const fuera = e => { if (!caja.current?.contains(e.target)) setAbierto(false); };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [abierto]);

    const elegir = (usuario) => {
        onElegir(usuario);
        setTexto('');
        setAbierto(false);
    };

    return (
        <div ref={caja} className={`relative ${className}`}>
            <span className='block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 mb-1'>
                {etiqueta}
            </span>

            {/* Elegido, se muestra como una pastilla con su cruz. Un input con
                el nombre adentro invita a editarlo, y editar el texto de algo
                ya elegido no significa nada. */}
            {valor ? (
                <div className='h-9 flex items-center gap-2 px-3 rounded-lg border border-[#29c50c]/60 bg-[#29c50c]/5'>
                    <span className='flex-1 min-w-0 truncate text-[13px] font-semibold text-gray-800'>
                        {valor.nombre}
                    </span>
                    {!deshabilitado && (
                        <button type='button' onClick={() => onElegir(null)} title={`Quitar — vuelve a «${textoTodos}»`}
                            className='shrink-0 text-[11px] font-bold text-gray-400 hover:text-gray-700 transition-colors'>
                            ✕
                        </button>
                    )}
                </div>
            ) : (
                <input
                    type='search'
                    value={texto}
                    disabled={deshabilitado}
                    placeholder={textoTodos}
                    onChange={e => { setTexto(e.target.value); setAbierto(true); }}
                    onFocus={() => setAbierto(true)}
                    className='w-full h-9 px-3 rounded-lg border border-gray-300 text-[13px] text-gray-700
                               placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]
                               disabled:bg-gray-50 disabled:cursor-not-allowed'
                />
            )}

            {abierto && !valor && (
                <ul className='absolute z-30 mt-1 w-full max-h-64 overflow-y-auto
                               bg-white border border-gray-200 rounded-lg shadow-lg p-1'>
                    {usuarios.map(u => (
                        <li key={u._id}>
                            <button type='button' onClick={() => elegir(u)}
                                className='w-full text-left px-3 py-2 rounded-md hover:bg-[#29c50c]/10 transition-colors'>
                                <span className='flex items-center gap-1.5'>
                                    <span className='flex-1 min-w-0 text-[12.5px] text-gray-800 truncate'>{u.nombre}</span>
                                    {/* Los inhabilitados se muestran igual: una consulta
                                        de meses atrás puede ser de alguien que ya no está. */}
                                    {u.inabilited && (
                                        <span className='shrink-0 text-[9.5px] font-bold rounded px-1 py-0.5 bg-gray-100 text-gray-500'>
                                            inactivo
                                        </span>
                                    )}
                                </span>
                                {u.position && (
                                    <span className='block text-[10.5px] text-gray-500 truncate'>{u.position}</span>
                                )}
                            </button>
                        </li>
                    ))}

                    {!usuarios.length && (
                        <li className='px-3 py-4 text-[12.5px] text-gray-500'>
                            {cargando ? 'Buscando…' : error || 'Ninguno coincide.'}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
