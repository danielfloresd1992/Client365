'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { getBonusSettings, putBonusSettings } from '@/libs/ajaxClient/bonus.fecth';

/**
 * Las dos variables globales del sistema de bonificación, compartidas por las
 * pestañas de la pantalla.
 *
 * Vive en un hook y no dentro de cada panel porque las pestañas se montan y se
 * desmontan al cambiar: con el estado adentro, volver a "Tasa de cambio"
 * dispararía otra consulta y perdería lo que se estuviera escribiendo.
 *
 * @returns {{ ajustes, cargando, guardando, guardar }}
 *          `guardar` acepta cambios parciales: { exchangeRate } deja el valor
 *          del bono como estaba.
 */
export default function useBonusSettings() {
    const dispatch = useDispatch();

    const [ajustes, setAjustes] = useState(null);   // null = cargando
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        getBonusSettings()
            .then(setAjustes)
            .catch(() => {
                // Sin endpoint desplegado la pantalla sigue en pie y lo dice:
                // es peor una pantalla en blanco que una que explica qué falta.
                setAjustes({ pointValue: null, exchangeRate: null, configured: false, unreachable: true });
            });
    }, []);

    const guardar = useCallback(async (cambios) => {
        setGuardando(true);
        try {
            const datos = await putBonusSettings(cambios);
            setAjustes(datos);

            dispatch(setConfigModal({
                modalOpen: true,
                type: 'successfull',
                title: 'Valor actualizado',
                description: 'Rige de ahora en adelante. Las novedades ya selladas conservan el suyo.',
                isCallback: null,
            }));
            return true;
        }
        catch (error) {
            dispatch(setConfigModal({
                modalOpen: true,
                type: 'error',
                title: 'No se pudo guardar',
                description: error?.response?.data?.message
                    || (error?.response?.status === 403
                        ? 'Solo un administrador puede cambiar estos valores.'
                        : 'Ha ocurrido un error.'),
                isCallback: null,
            }));
            return false;
        }
        finally {
            setGuardando(false);
        }
    }, [dispatch]);

    return { ajustes, cargando: ajustes === null, guardando, guardar };
}
