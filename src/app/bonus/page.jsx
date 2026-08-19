'use client';

import { useContext, useState } from 'react';
import { myUserContext } from '@/contexts/userContext';

import useBonusSettings from './assets/useBonusSettings';
import useBonusRules from './assets/useBonusRules';
import ConfigPanel from './assets/ConfigPanel';
import InfoPanel from './assets/InfoPanel';

/**
 * /bonus — SISTEMA DE BONIFICACIÓN.
 *
 * Dos pestañas, separadas por lo que se hace en cada una y no por el tema:
 *
 *   Configuración de referencias  donde se configura: los valores globales y
 *                                 la bonificación de cada alerta.
 *
 *   Panel informativo             donde se consulta: qué hay cargado, de dónde
 *                                 sale el monto y qué falta. No edita nada.
 *
 * La configuración se entra POR ALERTA: se elige una y ahí se define cuánto
 * otorga, dónde y sus excepciones. Cada una tiene lo suyo, así que tocar una no
 * mueve el valor de ninguna otra.
 *
 *
 * POR QUÉ LOS DATOS VIVEN ACÁ
 *
 * Los dos hooks se piden en la página y no dentro de cada pestaña: las pestañas
 * se desmontan al cambiar, y con el estado adentro volver a una dispararía otra
 * consulta y perdería lo que se estuviera escribiendo.
 *
 * El panel informativo se apoya en eso: no consulta nada propio, son cuentas
 * sobre los mismos datos que usa la otra.
 */

const PESTAÑAS = [
    { key: 'referencias', label: 'Configuración de referencias' },
    { key: 'info', label: 'Panel informativo' },
];


export default function BonosPage() {

    const { dataSessionState } = useContext(myUserContext);
    const esAdmin = dataSessionState?.dataSession?.admin === true;

    const [pestaña, setPestaña] = useState('referencias');

    const ajustesBonos = useBonusSettings();
    const reglasBonos = useBonusRules();

    return (
        <div className='w-full h-full bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden'>

            <header className='shrink-0 px-5 pt-3 border-b border-gray-200'>
                <div className='flex items-center gap-3 pb-2.5'>
                    <span className='shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                        <IconoEstrella />
                    </span>
                    <div className='min-w-0'>
                        <h1 className='text-[15px] font-black tracking-tight text-slate-900'>Sistema de bonificación</h1>
                        <p className='text-[10.5px] text-gray-500'>Valores, reglas y alertas que bonifican</p>
                    </div>
                </div>

                <div className='flex items-center gap-1.5 pb-2'>
                    {PESTAÑAS.map(t => (
                        <button
                            key={t.key}
                            type='button'
                            onClick={() => setPestaña(t.key)}
                            aria-pressed={pestaña === t.key}
                            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors
                                ${pestaña === t.key
                                    ? 'bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08]'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className='flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-gray-50'>
                {/* «Configuración de referencias» lleva el mapa de cables y toma
                    todo el ancho: acotado a 1100px el mapa quedaba con scroll
                    lateral propio y las reglas se apretaban contra el borde. El
                    panel informativo sí se lee mejor en columna angosta. */}
                <div className={pestaña === 'referencias' ? 'w-full' : 'max-w-[1100px]'}>

                    {pestaña === 'referencias' && (
                        <ConfigPanel
                            ajustes={ajustesBonos.ajustes}
                            cargandoAjustes={ajustesBonos.cargando}
                            guardandoAjustes={ajustesBonos.guardando}
                            onGuardarAjustes={ajustesBonos.guardar}

                            reglas={reglasBonos.reglas || []}
                            alertas={reglasBonos.alertas}
                            alcance={reglasBonos.alcance}
                            cargando={reglasBonos.cargando}
                            guardando={reglasBonos.guardando}
                            puedeEditar={esAdmin}
                            onGuardarRegla={reglasBonos.guardarRegla}
                            onBorrarRegla={reglasBonos.borrarRegla}
                            onEscribirAsignaciones={reglasBonos.escribirAsignaciones}
                        />
                    )}

                    {/* Los dos hooks juntos: el panel cruza el dinero con la
                        cobertura, y por separado ninguno de los dos responde
                        si el sistema está bien configurado. */}
                    {pestaña === 'info' && (
                        <InfoPanel
                            ajustes={ajustesBonos.ajustes}
                            reglas={reglasBonos.reglas || []}
                            alertas={reglasBonos.alertas || []}
                            cargando={ajustesBonos.cargando || reglasBonos.cargando}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}


function IconoEstrella() {
    return (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-5 h-5'>
            <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
        </svg>
    );
}
