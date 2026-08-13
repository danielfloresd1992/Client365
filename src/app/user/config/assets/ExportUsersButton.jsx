'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import useSubmitLock from '@/hook/useSubmitLock';
import { exportarUsuariosActivos } from '@/libs/export/usersExcel';

/**
 * Descarga el directorio de usuarios activos en Excel.
 *
 * El botón cuenta lo que está haciendo mientras dura: la exportación pide un
 * usuario por petición y luego sus fotos, así que con la plantilla completa
 * tarda unos segundos. Un botón que se queda mudo ese rato se lee como colgado
 * y se vuelve a pulsar.
 *
 * El cerrojo va por ref (useSubmitLock) y no por el estado: `setState` agenda
 * un re-render, no cambia la variable en el acto, así que un doble clic
 * dispararía dos exportaciones.
 */
export default function ExportUsersButton() {
    const dispatch = useDispatch();
    const { run: runLocked, isBusy } = useSubmitLock();
    const [paso, setPaso] = useState(null);

    const exportando = isBusy('exportar');

    const etiqueta = () => {
        if (!exportando) return 'Descargar en Excel';
        if (!paso) return 'Preparando…';

        if (paso.fase === 'consultando') return 'Buscando usuarios activos…';
        if (paso.fase === 'datos') return `Leyendo datos… ${paso.hechos}/${paso.total}`;
        if (paso.fase === 'fotos') return 'Descargando fotos…';
        return 'Generando el archivo…';
    };

    const descargar = () => runLocked(async () => {
        setPaso(null);
        try {
            const r = await exportarUsuariosActivos({ onProgress: setPaso });

            // Se informa cuántas fotos faltaron en vez de callarlo: el archivo
            // sale igual, pero quien lo abre tiene que saber por qué hay celdas
            // vacías y no pensar que la exportación falló.
            const sinFoto = r.total - r.conFoto;
            dispatch(setConfigModal({
                type: 'success',
                title: 'Directorio descargado',
                description: `${r.total} usuario${r.total === 1 ? '' : 's'} activo${r.total === 1 ? '' : 's'} en ${r.archivo}.`
                    + (sinFoto > 0 ? ` ${sinFoto} sin foto disponible.` : ''),
                modalOpen: true,
            }));
        }
        catch (error) {
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo exportar',
                description: error?.message || 'Hubo un problema al generar el archivo. Intenta nuevamente.',
                modalOpen: true,
            }));
        }
        finally {
            setPaso(null);
        }
    }, 'exportar');

    return (
        <button
            type='button'
            onClick={descargar}
            disabled={exportando}
            title='Descarga nombre, apellido, cédula, correo, teléfono y foto de los usuarios activos'
            className='shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] active:scale-[.98] transition-colors disabled:opacity-70 disabled:cursor-default'
        >
            {exportando ? (
                <span
                    className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin'
                    aria-hidden='true'
                />
            ) : (
                <svg
                    xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
                    stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'
                    className='w-4 h-4' aria-hidden='true'
                >
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='7 10 12 15 17 10' />
                    <line x1='12' y1='15' x2='12' y2='3' />
                </svg>
            )}
            {etiqueta()}
        </button>
    );
}
