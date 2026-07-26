'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import useAuthOnServer from '@/hook/auth';
import { getTodayRoster } from '@/libs/ajaxClient/user.fecth';

/*
 * Rol del día del usuario en sesión: ¿es ENCARGADO DE TURNO (onDuty) o
 * AUXILIAR (auxiliary) según el horario de HOY?
 *
 * La verdad sale del roster del horario (GET /user/roster/today, que resuelve
 * la asistencia del día con overrides y roles). Vive en el layout raíz, así
 * que persiste al navegar y cualquier componente lo consume con useDayRole():
 *   · Noveltie: muestra los botones de validar/enviar solo a los designados
 *     (el backend ya lo exige con validateDayRoleUser en el PUT).
 *   · AppDock: resalta el rol en la barra de navegación.
 *
 * Se refresca cada 5 minutos y al volver a la pestaña (la designación puede
 * cambiar durante el día).
 */

const REFRESH_MS = 5 * 60 * 1000;

const DayRoleContext = createContext({ onDuty: false, auxiliary: false, hasDayRole: false, roleLabel: null });

export const useDayRole = () => useContext(DayRoleContext);

export function DayRoleProvider({ children }) {

    const { dataSessionState } = useAuthOnServer();
    const userId = dataSessionState?.dataSession?._id;

    const [role, setRole] = useState({ onDuty: false, auxiliary: false });

    useEffect(() => {
        if (!userId) {
            setRole({ onDuty: false, auxiliary: false });
            return;
        }

        let alive = true;
        const load = () => {
            getTodayRoster()
                .then(data => {
                    if (!alive) return;
                    const me = (data?.roster ?? []).find(r => String(r.userId) === String(userId));
                    setRole({ onDuty: Boolean(me?.onDuty), auxiliary: Boolean(me?.auxiliary) });
                })
                .catch(err => console.error('Rol del día:', err?.message ?? err));
        };

        load();
        const timer = setInterval(load, REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            alive = false;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [userId]);

    const value = {
        onDuty: role.onDuty,
        auxiliary: role.auxiliary,
        hasDayRole: role.onDuty || role.auxiliary,
        roleLabel: role.onDuty ? 'Encargado de turno' : role.auxiliary ? 'Auxiliar del día' : null,
    };

    return (
        <DayRoleContext.Provider value={value}>
            {children}
        </DayRoleContext.Provider>
    );
}