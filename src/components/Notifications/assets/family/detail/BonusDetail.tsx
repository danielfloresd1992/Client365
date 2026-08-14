'use client';

import type { Notification } from '../../types';

/**
 * Qué cambió en la bonificación de una alerta.
 *
 * Los cambios vienen YA REDACTADOS desde jarvis_api (`diffBonusSystems`), en
 * `meta.bonusChanges`. Acá no se compara nada ni se traduce: se pintan.
 *
 * Van en `meta` y no en `extra` porque `extra` no se guarda: existe solo
 * mientras el servidor arma el texto y después se descarta.
 *
 * Es a propósito. El texto de una notificación se guarda renderizado, así que
 * una de hace seis meses tiene que seguir diciendo lo que dijo aunque hoy los
 * campos se llamen distinto. Si el cliente lo recompusiera, un aviso viejo se
 * releería con las reglas de hoy.
 */

interface BonusMeta {
    bonusChanges?: string[];
    operation?: string;
    menuId?: string;
}

export default function BonusDetail({ n }: { n: Notification }) {
    const meta = (n.meta as BonusMeta | undefined) ?? {};
    const cambios = meta.bonusChanges ?? [];

    if (!cambios.length) return null;

    return (
        <ul className='mt-1.5 flex flex-col gap-1'>
            {cambios.map((cambio, i) => (
                <li
                    key={`${i}_${cambio}`}
                    className='flex items-start gap-1.5 text-[11px] leading-snug text-amber-800'
                >
                    {/* Punto dorado, no viñeta de lista: la lista de cambios de
                        una bonificación no es una enumeración cualquiera y se
                        distingue del resto del ítem. */}
                    <span
                        aria-hidden='true'
                        className='mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500'
                    />
                    <span className='min-w-0'>{cambio}</span>
                </li>
            ))}
        </ul>
    );
}
