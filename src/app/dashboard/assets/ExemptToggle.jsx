'use client';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSilenceExempt } from '@/libs/ajaxClient/monitoring.fecth';
import { setConfigModal } from '@/store/slices/globalModal';

/*
 * EL INTERRUPTOR DE "NO LO CUENTES EN LA LISTA"
 *
 * Saca al establecimiento del corte horario "ESTABLECIMIENTOS SIN REPORTAR AL
 * GRUPO". Solo lo ven —y solo lo pueden tocar— los usuarios con `admin: true`;
 * el backend lo exige además, porque esconder un botón no es una medida de
 * seguridad, es una comodidad.
 *
 * Apaga SOLO ese aviso. El local sigue en monitoreo, sus alertas se siguen
 * contando, su inicio y su fin se siguen anunciando y su DVR se sigue
 * vigilando. Al devolverlo a la lista vuelve a evaluarse en el corte siguiente.
 *
 * NO es optimista, y es a propósito: el servidor emite `monitoring-silence-
 * exempt` al guardar, así que la fila se actualiza por el mismo camino que si
 * lo hubiera tocado otro. Una copia local del estado tendría que reconciliarse
 * después con la que llega por socket, y ahí es donde aparecen los botones que
 * se quedan al revés. Mientras tanto el botón queda deshabilitado, que es el
 * aviso de que está guardando.
 */
export default function ExemptToggle({ local }) {

    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);

    const exento = Boolean(local.exempt);

    const alternar = async (event) => {
        // La fila entera es clicable en otras vistas; que el botón no arrastre.
        event.stopPropagation();
        if (saving) return;

        setSaving(true);

        try {
            await setSilenceExempt({ idLocal: local.id, active: !exento });
        }
        catch (err) {
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'No se pudo cambiar',
                description: err?.response?.data?.message
                    ?? 'No se pudo cambiar si este establecimiento entra en la lista de "sin reportar al grupo".',
                isCallback: null,
                type: 'error',
            }));
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <button
            type='button'
            onClick={alternar}
            disabled={saving}
            aria-pressed={exento}
            title={exento
                ? `${local.name} está FUERA de la lista "sin reportar al grupo"${local.exempt?.byName ? ` · lo quitó ${local.exempt.byName}` : ''}. Tocá para volver a contarlo.`
                : `${local.name} entra en la lista "sin reportar al grupo". Tocá para dejar de contarlo.`}
            className={`shrink-0 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-[2px] rounded border transition-colors
                disabled:opacity-40 disabled:cursor-wait
                ${exento
                    ? 'bg-slate-700 text-white border-slate-700 hover:bg-slate-600'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'}`}
        >
            {exento ? '🔕 sin contar' : '🔔 contando'}
        </button>
    );
}

