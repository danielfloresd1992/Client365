'use client';
import { useState, useMemo } from 'react';
import { agruparParaSelector } from '@/libs/parser/estableshment';

/*
 * EL EDITOR DE ALCANCE, FUERA DEL MAPA.
 *
 * Salió de BonusMap sin tocarle una línea el día que la vista de LISTA
 * necesitó el mismo modal: es la única forma de elegir marcas y locales, y
 * tenerlo adentro del mapa obligaba a la lista a importar el mapa entero
 * —dos mil líneas de lienzo, cables y zoom— para abrir un cuadro de diálogo.
 *
 * No tiene nada del mapa: recibe un alcance, devuelve otro.
 */

/**
 * Editar el alcance de una asignación. Modal, porque el alcance puede ser una
 * lista larga de locales y en la caja del mapa no entra.
 *
 * No deja guardar un alcance a medias —'only' sin ningún elegido—: es lo que
 * el servidor rechaza, y con razón, porque no aplicaría en ningún lado.
 */
export default function EditorDeAlcance({ catalogo, inicial, yaHayGeneral, onCerrar, onGuardar }) {
    const [scope, setScope] = useState(inicial || { mode: 'all', franchises: [], locals: [] });

    const alternar = (clave, id) => setScope(s => {
        const actual = (s[clave] || []).map(String);
        return { ...s, [clave]: actual.includes(String(id)) ? actual.filter(x => x !== String(id)) : [...actual, String(id)] };
    });
    const tildado = (clave, id) => (scope[clave] || []).some(x => String(x) === String(id));

    const incompleto = scope.mode === 'only' && !scope.franchises?.length && !scope.locals?.length;
    // Una segunda asignación general sería ambigua: el servidor la rechaza.
    const generalDuplicada = scope.mode === 'all' && yaHayGeneral;
    const puedeGuardar = !incompleto && !generalDuplicada;

    return (
        <div className='fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/50' onClick={onCerrar}>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[82vh] flex flex-col' onClick={e => e.stopPropagation()}>
                <div className='px-5 pt-4 pb-3 border-b border-gray-100'>
                    <h3 className='text-[15px] font-bold text-gray-800'>Dónde aplica esta asignación</h3>
                    <div className='flex flex-wrap gap-1 mt-3'>
                        {[{ key: 'all', label: 'Todos' }, { key: 'only', label: 'Solo estos' }, { key: 'except', label: 'Todos menos' }].map(m => (
                            <button key={m.key} type='button' onClick={() => setScope(s => ({ ...s, mode: m.key }))}
                                aria-pressed={scope.mode === m.key}
                                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-colors
                                    ${scope.mode === m.key ? 'bg-[#29c50c] text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='flex-1 min-h-0 overflow-y-auto p-3'>
                    {scope.mode === 'all' ? (
                        <p className='px-2 py-3 text-[12.5px] text-gray-600'>
                            {generalDuplicada
                                ? 'Esta alerta ya tiene una asignación general. Elegí «Solo estos» o «Todos menos» para esta.'
                                : 'En todos los establecimientos. Un local que abra mañana queda cubierto solo.'}
                        </p>
                    ) : (
                        <>
                            <Grupo titulo='Marcas' items={catalogo.franchises} clave='franchises' tildado={tildado} alternar={alternar} />
                            <Establecimientos catalogo={catalogo} tildado={tildado} alternar={alternar} />
                        </>
                    )}
                </div>

                <div className='px-5 py-3 border-t border-gray-100 flex items-center gap-2'>
                    {incompleto && <span className='text-[11px] text-[#8a5a2b]'>Elegí al menos una marca o un establecimiento.</span>}
                    <button type='button' onClick={onCerrar}
                        className='ml-auto h-9 px-4 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors'>Cancelar</button>
                    <button type='button' disabled={!puedeGuardar} onClick={() => onGuardar(scope)}
                        className='h-9 px-4 rounded-lg text-[12.5px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] disabled:opacity-50 transition-colors'>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Los establecimientos como se piensan: los PERIMETRALES en un grupo propio y
 * los ANALÍTICOS por marca. Es la división que hace el reglamento —son tarifas
 * distintas—, y con setenta locales en una lista plana había que buscar uno
 * por uno.
 *
 * El armado vive en libs/parser/estableshment.js, junto al agrupador por
 * franquicia que ya usa el resto de la app.
 */
function Establecimientos({ catalogo, tildado, alternar }) {
    const grupos = useMemo(() => agruparParaSelector(catalogo.locals), [catalogo.locals]);

    return (
        <>
            {grupos.perimetrales.length > 0 && (
                <Grupo titulo='Perimetrales' items={grupos.perimetrales} clave='locals' tildado={tildado} alternar={alternar} />
            )}
            {grupos.analiticos.map(g => (
                <Grupo key={g.titulo} titulo={`Analíticos · ${g.titulo}`} items={g.locales} clave='locals' tildado={tildado} alternar={alternar} />
            ))}
        </>
    );
}

function Grupo({ titulo, items, clave, tildado, alternar }) {
    if (!items?.length) return null;
    return (
        <>
            <p className='px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500'>{titulo}</p>
            {items.map(o => (
                <label key={o._id} className='flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer'>
                    <input type='checkbox' checked={tildado(clave, o._id)} onChange={() => alternar(clave, o._id)}
                        className='w-3.5 h-3.5 rounded accent-[#29c50c]' />
                    <span className='text-[12px] text-gray-700 truncate'>{o.name}</span>
                </label>
            ))}
        </>
    );
}
