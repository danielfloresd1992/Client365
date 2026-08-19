'use client';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';

/**
 * PREGUNTAR ANTES DE ALGO QUE NO SE PUEDE DESHACER.
 *
 * Envuelve el modal global, que ya está montado en el layout raíz, para no
 * repetir su contrato en cada pantalla:
 *
 *     isCallback  una función  →  el modal muestra Aceptar y Cancelar
 *                 null         →  muestra un solo botón, Cerrar
 *
 * Ese detalle es lo que separa una confirmación de un aviso, y no se deduce
 * leyendo el `dispatch`. Acá queda dicho una vez.
 *
 *     const confirmar = useConfirm();
 *
 *     confirmar({
 *         titulo: '¿Quitar esta asignación?',
 *         descripcion: '«Piso sucio» va a dejar de bonificar en Miami.',
 *         alAceptar: () => quitar(alerta, i),
 *     });
 *
 * `alAceptar` corre al tocar Aceptar; en Cancelar no pasa nada. El modal se
 * cierra solo en los dos casos.
 *
 * OJO: el modal es global y hay uno solo. Pedir una confirmación mientras otra
 * está abierta reemplaza la anterior, así que no encadenes dos seguidas.
 */
export default function useConfirm() {
    const dispatch = useDispatch();

    return useCallback(({ titulo, descripcion, alAceptar, tipo = 'warning' }) => {
        if (typeof alAceptar !== 'function') {
            throw new Error('useConfirm necesita `alAceptar`; sin eso es un aviso, no una confirmación');
        }
        dispatch(setConfigModal({
            modalOpen: true,
            type: tipo,
            title: titulo,
            description: descripcion,
            isCallback: alAceptar,
        }));
    }, [dispatch]);
}
