'use client';
/**
 * WinterScheduleToggle — Interruptor global del horario de invierno (USA/Doral).
 *
 * Enciende/apaga el flag global `usWinterActive` (recurso `time`). Cuando está
 * activo, los establecimientos marcados con `usesUsTimezone` usan su horario
 * alternativo de invierno en vez del normal.
 *
 * Solo visible para usuarios `admin` (el backend además exige admin en el PUT).
 */
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FaSnowflake } from 'react-icons/fa';

import axiosStand from '@/libs/ajaxClient/axios.fetch';
import useAuthOnServer from '@/hook/auth';
import { setConfigModal } from '@/store/slices/globalModal';

export default function WinterScheduleToggle() {

    const { dataSessionState } = useAuthOnServer();
    const isAdmin = Boolean(dataSessionState?.dataSession?.admin);

    const dispatch = useDispatch();

    const [active, setActive] = useState(null);   // null → cargando
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axiosStand.get('/time')
            .then(res => setActive(Boolean(res.data?.usWinterActive)))
            .catch(() => setActive(false));
    }, []);

    // Gate en el front (el backend también lo exige)
    if (!isAdmin) return null;

    const toggle = async () => {
        if (saving || active === null) return;

        const next = !active;
        setSaving(true);
        setActive(next);   // optimista

        try {
            await axiosStand.put(`/time/usWinter?value=${next}`);
            dispatch(setConfigModal({
                modalOpen:   true,
                title:       'Horario de invierno',
                description: next
                    ? 'Activado: los locales USA usan su horario de invierno.'
                    : 'Desactivado: los locales USA usan su horario normal.',
                isCallback:  null,
                type:        'successfull',
            }));
        }
        catch (err) {
            setActive(!next);   // revertir
            dispatch(setConfigModal({
                modalOpen:   true,
                title:       'Error',
                description: err.response?.data?.message ?? 'No se pudo cambiar el horario de invierno.',
                isCallback:  null,
                type:        'error',
            }));
        }
        finally {
            setSaving(false);
        }
    };

    const on = active === true;

    return (
        <button
            type='button'
            onClick={toggle}
            disabled={active === null || saving}
            aria-pressed={on}
            title='Horario de invierno para los establecimientos de USA (Doral)'
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                on
                    ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
            <FaSnowflake size={12} className={on ? 'text-white' : 'text-indigo-500'} />
            Invierno USA
            <span className={`ml-0.5 inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-bold ${
                on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
                {active === null ? '…' : on ? 'ON' : 'OFF'}
            </span>
        </button>
    );
}