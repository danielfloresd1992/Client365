'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import {
    getBonusRules, createBonusRule, updateBonusRule, deleteBonusRule,
    getMenusForBonus, setMenuBonusRules, getScopeOptions,
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
     * Borra una regla que quedó sin uso.
     *
     * `silencioso` es para la limpieza automática: al pasar una alerta a "no
     * bonifica", su configuración queda huérfana y se borra sola. Ahí un 409
     * —porque otra alerta todavía la usa, cosa que pasa con lo cargado antes de
     * este modelo— no es un problema que reportar: es el servidor haciendo
     * exactamente su trabajo, y la configuración se queda donde está.
     */
    const borrarRegla = useCallback(async (id, { silencioso = false } = {}) => {
        try {
            await deleteBonusRule(id);
            setReglas(previas => (previas ?? []).filter(r => String(r._id) !== String(id)));
            if (!silencioso) avisar('successfull', 'Configuración eliminada', 'No la usaba ninguna alerta.');
            return true;
        }
        catch (error) {
            if (!silencioso) avisar('error', 'No se pudo eliminar', mensajeDeError(error, 'Ha ocurrido un error.'));
            return false;
        }
    }, [avisar]);


    /**
     * Escribe las asignaciones de una alerta: la lista completa de {regla, alcance}.
     *
     * Es UNA operación para todo lo que toca las asignaciones —tender un cable,
     * moverlo, soltarlo, cambiar el alcance de una asignación— porque el
     * servidor recibe la lista completa y la valida junta. Cada gesto del mapa
     * arma la lista siguiente y la manda entera.
     *
     * Se pinta al confirmar el servidor y no antes: las asignaciones deciden
     * qué regla paga y dónde, y mostrar un cambio que después se rechaza es peor
     * que la espera de un segundo. El 400 más probable es un alcance a medias
     * —modo 'only' sin ningún establecimiento— y el mapa lo evita antes de
     * llegar acá.
     *
     * @param {string} menuId
     * @param {Array<{ rule: string, scope: object }>} bonusRules
     */
    /**
     * Escribe las asignaciones de una alerta: su interruptor y su lista de
     * {regla, alcance}.
     *
     * OPTIMISTA. Se pinta ANTES de que responda el servidor y se revierte si
     * falla. Armar una alerta son varios gestos seguidos —marcarla, elegir
     * dónde, elegir la regla— y esperar la respuesta en cada uno hace que el
     * mapa parpadee y el trabajo se sienta trabado.
     *
     * Es seguro porque lo que el mapa manda ya está validado del lado del
     * cliente con las mismas reglas del servidor: el único rechazo previsible
     * sería un fallo de red, y ahí la fila vuelve a como estaba.
     *
     * @param {string} menuId
     * @param {{ bonifies?: boolean|null, bonusRules: Array<{rule, scope}> }} cambios
     */
    const escribirAsignaciones = useCallback(async (menuId, cambios) => {
        const { bonifies = null, bonusRules = [] } = cambios || {};

        // Se guarda cómo estaba para poder volver si el servidor rechaza.
        const anterior = (alertas ?? []).find(a => String(a._id) === String(menuId));

        const conCambios = (lista) => (lista ?? []).map(a => (String(a._id) === String(menuId)
            ? { ...a, bonifies, bonusRules, bonusReviewed: true }
            : a));

        // El uso de cada regla se recuenta sobre la lista ya cambiada: una
        // alerta con la misma regla en dos alcances cuenta una vez.
        const recontar = (lista) => (reglasPrevias) => (reglasPrevias ?? []).map(r => ({
            ...r,
            inUse: lista.filter(a => (a.bonusRules || []).some(x => String(x.rule) === String(r._id))).length,
        }));

        setAlertas(previas => {
            const siguientes = conCambios(previas);
            setReglas(recontar(siguientes));
            return siguientes;
        });

        try {
            await setMenuBonusRules(menuId, bonusRules, bonifies);
            return true;
        }
        catch (error) {
            // Vuelve exactamente a como estaba, incluido el conteo de uso.
            setAlertas(previas => {
                const siguientes = (previas ?? []).map(a => (String(a._id) === String(menuId) ? anterior : a));
                setReglas(recontar(siguientes));
                return siguientes;
            });
            avisar('error', 'No se pudo guardar la asignación', mensajeDeError(error, 'Ha ocurrido un error.'));
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
        escribirAsignaciones,
    };
}
