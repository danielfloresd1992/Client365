'use client';
import { useState, useRef, useEffect, useMemo } from 'react';

/**
 * UN SELECTOR OSCURO, CON BUSCADOR.
 *
 * Existe porque un `<select>` nativo acá se veía roto: la LISTA desplegada la
 * dibuja el sistema operativo, no la página — blanca, con el resaltado azul
 * de Windows, flotando sobre el panel negro. El botón sí se puede pintar; el
 * desplegable no. Así que el desplegable es nuestro.
 *
 * Y de paso gana lo que un select nativo no tiene: con sesenta
 * establecimientos, un buscador vale más que una rueda de scroll.
 *
 *     <SelectorOscuro
 *         valor={idElegido}                    // '' = la opción "todos"
 *         opciones={[{ id, name }, …]}
 *         textoTodos='Todos los establecimientos'
 *         onElegir={id => …}                   // '' al elegir "todos"
 *     />
 */
export default function SelectorOscuro({ valor = '', opciones = [], textoTodos = 'Todos', onElegir }) {

    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const caja = useRef(null);
    const buscador = useRef(null);

    // Cerrar al tocar fuera o con Escape: el gesto natural para descartar un
    // desplegable tiene que funcionar, o queda abierto tapando el mapa.
    useEffect(() => {
        if (!abierto) return undefined;

        const fuera = e => { if (!caja.current?.contains(e.target)) setAbierto(false); };
        const escape = e => { if (e.key === 'Escape') setAbierto(false); };

        document.addEventListener('pointerdown', fuera);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', fuera);
            document.removeEventListener('keydown', escape);
        };
    }, [abierto]);

    // El foco va directo al buscador: abrir para después tener que hacer clic
    // en el campo es un paso de más que nadie espera.
    useEffect(() => {
        if (abierto) buscador.current?.focus();
    }, [abierto]);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return opciones;
        return opciones.filter(o => o.name.toLowerCase().includes(texto));
    }, [opciones, busqueda]);

    const nombreActual = opciones.find(o => o.id === valor)?.name ?? textoTodos;

    const elegir = (id) => {
        onElegir(id);
        setAbierto(false);
        setBusqueda('');
    };

    return (
        <div ref={caja} className='relative'>

            <button type='button' onClick={() => setAbierto(v => !v)}
                aria-expanded={abierto} aria-haspopup='listbox'
                className='h-8 min-w-[230px] rounded-lg bg-[#161b22] border border-[#2b3138] px-2.5
                           flex items-center gap-2 text-[12.5px] font-bold text-white
                           hover:border-[#3d444d] transition-colors
                           focus:outline-none focus-visible:border-emerald-500'>
                <span className='flex-1 min-w-0 truncate text-left text-white'>{nombreActual}</span>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'
                    strokeLinecap='round' strokeLinejoin='round'
                    className={`w-3 h-3 shrink-0 text-gray-500 transition-transform ${abierto ? 'rotate-180' : ''}`}>
                    <path d='m6 9 6 6 6-6' />
                </svg>
            </button>

            {abierto && (
                <div className='absolute z-40 mt-1 w-[280px] rounded-lg border border-[#2b3138]
                                bg-[#161b22] shadow-2xl shadow-black/50 overflow-hidden'>

                    <div className='p-2 border-b border-[#2b3138]'>
                        <input
                            ref={buscador}
                            type='search'
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder='Buscar establecimiento…'
                            className='w-full h-8 px-2.5 rounded-md bg-[#0d1117] border border-[#2b3138]
                                       text-[12.5px] text-white placeholder:text-gray-400
                                       focus:outline-none focus:border-emerald-500'
                        />
                    </div>

                    <ul role='listbox' className='max-h-64 overflow-y-auto scroll-oscuro p-1'>

                        {/* "Todos" siempre primero y fuera del filtro: es la
                            salida, y una búsqueda sin resultados no debería
                            esconderla. */}
                        <Opcion activa={valor === ''} onClick={() => elegir('')}>
                            {textoTodos}
                        </Opcion>

                        {visibles.map(o => (
                            <Opcion key={o.id} activa={o.id === valor} onClick={() => elegir(o.id)}>
                                {o.name}
                            </Opcion>
                        ))}

                        {visibles.length === 0 && (
                            <li className='px-2.5 py-4 text-center text-[11px] text-gray-400'>
                                Ninguno coincide.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}


function Opcion({ activa, onClick, children }) {
    return (
        <li role='option' aria-selected={activa}>
            <button type='button' onClick={onClick}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md
                            text-[12.5px] transition-colors
                            ${activa ? 'bg-emerald-500/25' : 'hover:bg-white/10'}`}>

                {/* EL COLOR VA EN EL SPAN, NO EN EL BOTÓN.
                    styles.css pinta `span { color: var(--app-text) }` sin capa
                    y sin clase, y un color aplicado DIRECTO le gana siempre a
                    uno heredado — la especificidad ni siquiera entra en la
                    cuenta. Puesto en el botón, el span lo pisaba y cada opción
                    salía en #3c4350 sobre el #161b22 del panel. */}
                <span className={`flex-1 min-w-0 truncate font-semibold
                                  ${activa ? 'text-emerald-100 font-bold' : 'text-white'}`}>
                    {children}
                </span>

                {activa && (
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'
                        strokeLinecap='round' strokeLinejoin='round'
                        className='w-3 h-3 shrink-0 text-emerald-100'>
                        <path d='m5 13 4 4L19 7' />
                    </svg>
                )}
            </button>
        </li>
    );
}
