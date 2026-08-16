'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import {
    getBonusRules, createBonusRule, updateBonusRule, deleteBonusRule,
    getMenusForBonus, setMenuBonusRule, getScopeOptions,
} from '@/libs/ajaxClient/bonus.fecth';

/**
 * Las reglas de bonificación y las alertas que las usan.
 *
 * Vive en la página y no dentro de cada pestaña por la misma razón que
 * `useBonusSettings`: las pestañas se desmontan al cambiar, y con el estado
 * adentro volver a "Reglas" dispararía otra consulta y perdería lo escrito.
 *
 * Las tres consultas van juntas porque las tres pantallas se necesitan
 * mutuamente: la lista de alertas muestra el nombre de su regla, y el editor de
 * una regla necesita el catálogo de establecimientos para su alcance.
 */
export default function useBonusRules() {
    const dispatch = useDispatch();

    const [reglas, setReglas] = useState(null);        // null = cargando
    const [alertas, setAlertas] = useState(null);
    const [alcance, setAlcance] = useState({ franchises: [], locals: [] });
    const [guardando, setGuardando] = useState(false);

    const avisar = useCallback((type, title, description) => {
        dispatch(setConfigModal({ modalOpen: true, type, title, description, isCallback: null }));
    }, [dispatch]);

    /** El mensaje del servidor si lo hay; si no, uno que diga algo útil. */
    const mensajeDeError = (error, porDefecto) =>
        error?.response?.data?.message
        || (error?.response?.status === 403
            ? 'Solo un administrador puede hacer este cambio.'
            : porDefecto);

    useEffect(() => {
        // Por separado y no con Promise.all: si falla el catálogo de
        // establecimientos, las reglas igual se pueden ver y asignar.
        getBonusRules().then(setReglas).catch(() => setReglas([]));
        getMenusForBonus().then(setAlertas).catch(() => setAlertas([]));
        getScopeOptions().then(setAlcance).catch(() => { /* el alcance queda sin nombres */ });
    }, []);


    /** Crea o edita, según venga con `_id`. Devuelve la regla guardada o null. */
    const guardarRegla = useCallback(async (regla) => {
        setGuardando(true);
        try {
            const guardada = regla._id
                ? await updateBonusRule(regla._id, regla)
                : await createBonusRule(regla);

            // `?? []` porque se puede guardar antes de que llegue la lista: el
            // botón de crear está disponible desde el primer render.
            setReglas(previas => (regla._id
                ? (previas ?? []).map(r => (String(r._id) === String(guardada._id) ? guardada : r))
                : [...(previas ?? []), guardada]
            ).sort((a, b) => a.name.localeCompare(b.name)));

            avisar('successfull', regla._id ? 'Regla actualizada' : 'Regla creada',
                regla._id
                    ? 'Rige de ahora en adelante en todas sus alertas. Lo ya sellado conserva su valor.'
                    : 'Ya se puede asignar a las alertas.');
            return guardada;
        }
        catch (error) {
            avisar('error', 'No se pudo guardar', mensajeDeError(error, 'Ha ocurrido un error.'));
            return null;
        }
        finally {
            setGuardando(false);
        }
    }, [avisar]);


    /**
     * Borra una regla. El servidor la rechaza con 409 si alguna alerta la usa,
     * y ahí el mensaje explica que lo correcto es desactivarla.
     */
    const borrarRegla = useCallback(async (id) => {
        setGuardando(true);
        try {
            await deleteBonusRule(id);
            setReglas(previas => (previas ?? []).filter(r => String(r._id) !== String(id)));
            avisar('successfull', 'Regla eliminada', 'No la usaba ninguna alerta.');
            return true;
        }
        catch (error) {
            avisar('error', 'No se pudo eliminar', mensajeDeError(error, 'Ha ocurrido un error.'));
            return false;
        }
        finally {
            setGuardando(false);
        }
    }, [avisar]);


    /**
     * Le asigna la regla a una alerta, o se la quita con `null`.
     *
     * Se pinta antes de que responda el servidor porque son decenas de alertas
     * seguidas y esperar cada una haría el trabajo insoportable. Si falla, la
     * fila vuelve a como estaba: dejarla mostrando algo que no se guardó sería
     * peor que la demora.
     */
    const asignarRegla = useCallback(async (menuId, ruleId) => {
        const anterior = alertas?.find(a => String(a._id) === String(menuId));

        setAlertas(previas => previas.map(a => (String(a._id) === String(menuId)
            ? { ...a, bonusRule: ruleId, bonusReviewed: true }
            : a)));

        try {
            await setMenuBonusRule(menuId, ruleId);

            // El contador de uso quedó viejo en las dos reglas involucradas.
            setReglas(previas => (previas ?? []).map(r => {
                const id = String(r._id);
                if (id === String(ruleId)) return { ...r, inUse: (r.inUse || 0) + 1 };
                if (id === String(anterior?.bonusRule)) return { ...r, inUse: Math.max(0, (r.inUse || 0) - 1) };
                return r;
            }));
            return true;
        }
        catch (error) {
            setAlertas(previas => previas.map(a => (String(a._id) === String(menuId) ? anterior : a)));
            avisar('error', 'No se pudo asignar', mensajeDeError(error, 'Ha ocurrido un error.'));
            return false;
        }
    }, [alertas, avisar]);


    return {
        reglas,
        alertas,
        alcance,
        cargando: reglas === null || alertas === null,
        guardando,
        guardarRegla,
        borrarRegla,
        asignarRegla,
    };
}
