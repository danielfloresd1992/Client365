'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAuthOnServer from '@/hook/auth';
import { getMyDayRole } from '@/libs/ajaxClient/user.fecth';
import { setDayRole } from '@/store/slices/dayRole';

/*
 * Rol del día del usuario en sesión: ¿es ENCARGADO DE TURNO (onDuty) o
 * AUXILIAR (auxiliary) según el horario de HOY?
 *
 * La verdad sale del roster del horario (GET /user/roster/today). El estado
 * vive ahora en REDUX (slice `dayRole`): el loader lo despacha y cualquier
 * componente lo lee con useDayRole() — sin Context.
 *   · Noveltie: muestra los botones de validar/enviar a admin o al designado.
 *   · AppDock: resalta el rol en la barra de navegación.
 *
 * Se refresca cada 5 minutos y al volver a la pestaña (la designación puede
 * cambiar durante el día).
 */

const REFRESH_MS = 5 * 60 * 1000;

// Lectura: rol del día desde el store + derivados (hasDayRole, roleLabel,
// ventana horaria del rol). El backend resuelve el día OPERATIVO (08:00 →
// 07:00), así que el rol del personal nocturno sobrevive la medianoche.
export const useDayRole = () => {
    const { onDuty, auxiliary, shift, startTime, endTime } = useSelector(state => state.dayRole);
    return {
        onDuty,
        auxiliary,
        shift,
        startTime,
        endTime,
        hasDayRole: onDuty || auxiliary,
        roleLabel: onDuty ? 'Encargado de turno' : auxiliary ? 'Auxiliar del día' : null,
        // "18:00 → 07:00" — listo para pintar junto al rol
        roleWindow: (onDuty || auxiliary) && startTime && endTime ? `${startTime} → ${endTime}` : null,
    };
};

// Loader (antes "Provider"): ya no hay Context; solo consulta el roster y
// despacha el rol del día al store. Se monta en el layout raíz, así que
// persiste al navegar. Envuelve a children solo por comodidad de montaje.
export function DayRoleProvider({ children }) {

    const dispatch = useDispatch();
    const { dataSessionState } = useAuthOnServer();
    const userId = dataSessionState?.dataSession?._id;

    useEffect(() => {
        if (!userId) {
            dispatch(setDayRole({ onDuty: false, auxiliary: false }));
            return;
        }

        let alive = true;
        const load = () => {
            getMyDayRole()
                .then(role => {
                    if (!alive) return;
                    dispatch(setDayRole({
                        onDuty: Boolean(role?.onDuty),
                        auxiliary: Boolean(role?.auxiliary),
                        shift: role?.shift ?? null,
                        startTime: role?.startTime ?? null,
                        endTime: role?.endTime ?? null,
                    }));
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
    }, [userId, dispatch]);

    return children;
}