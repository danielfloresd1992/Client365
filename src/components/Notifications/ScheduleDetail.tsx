'use client';

import type { Notification, ScheduleChange } from './types';

// ══════════════════════════════════════════════════════════════════════
// QUÉ SE CAMBIÓ EN EL HORARIO
// ══════════════════════════════════════════════════════════════════════
// El cuerpo del aviso ya resume el cambio en una frase. Esto lo desglosa: un
// día por línea, con la fecha y lo que le pusieron.
//
// Antes el aviso solo decía "modificó tu horario el 12/08/2026", así que para
// saber si te habían puesto falta, libre o vacaciones había que abrir la
// grilla e ir a mirar la celda. El tipo de cambio ES la información.
//
// Cada tipo tiene su color, los mismos de la grilla: quien ve una falta en rojo
// en el horario la reconoce igual en la campana.

/** Colores por tipo, alineados con los de la celda del horario. */
const TONOS: Record<string, string> = {
    falta:      'bg-red-600 text-white',
    extra:      'bg-green-100 text-green-900 ring-1 ring-green-300',
    descanso:   'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
    permiso:    'bg-yellow-100 text-yellow-900 ring-1 ring-yellow-300',
    vacaciones: 'bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300',
    laboral:    'bg-white text-gray-700 ring-1 ring-gray-300',
    // Roles del día: no son un tipo de jornada, son un papel dentro de ella.
    onDuty:     'bg-teal-100 text-teal-900 ring-1 ring-teal-300',
    auxiliary:  'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300',
};

const tonoDe = (c: ScheduleChange) =>
    TONOS[c.workType || c.rol || ''] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-300';

/** Horario del día, si el tipo lo lleva. Libre o falta no tienen horas. */
const horasDe = (c: ScheduleChange) =>
    (c.startTime && c.endTime) ? `${c.startTime} – ${c.endTime}` : '';


export default function ScheduleDetail({ n }: { n: Notification }) {
    const meta = (n.meta || {}) as { cambios?: ScheduleChange[] };
    const cambios = meta.cambios || [];
    if (cambios.length === 0) return null;

    // Se muestran hasta cinco. Un lote de treinta días llenaría la bandeja
    // entera con una sola notificación.
    const visibles = cambios.slice(0, 5);
    const restantes = cambios.length - visibles.length;

    return (
        <div className='mt-2 space-y-1'>
            {visibles.map((c, i) => (
                <div
                    key={`${c.dayKey || i}`}
                    className='flex items-center gap-2 text-[11px]'
                >
                    {/* La fecha primero: es lo que se busca al repasar. */}
                    <span className='font-bold text-gray-700 tabular-nums shrink-0'>
                        {c.fecha || c.dayKey}
                    </span>

                    <span className={`px-1.5 py-[1px] rounded font-bold text-[10px] leading-tight shrink-0 ${tonoDe(c)}`}>
                        {/* Quitar un rol también se avisa, y decir solo
                            "Guardia" haría entender lo contrario. */}
                        {c.asignado === false ? `${c.etiqueta} retirada` : c.etiqueta}
                    </span>

                    {horasDe(c) && (
                        <span className='text-[10px] text-gray-400 tabular-nums truncate'>
                            {horasDe(c)}
                        </span>
                    )}

                    {c.shift && (
                        <span className='text-[10px] text-gray-400 truncate'>{c.shift}</span>
                    )}
                </div>
            ))}

            {restantes > 0 && (
                <p className='text-[10.5px] text-gray-400 pt-0.5'>
                    y {restantes} {restantes === 1 ? 'día más' : 'días más'}
                </p>
            )}
        </div>
    );
}
