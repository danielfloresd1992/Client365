'use client';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openViewer, closeViewer, setViewerIndex } from '@/store/slices/imageViewer';

/**
 * Hook para controlar el visor global de imágenes.
 *
 * Uso básico (imagen única):
 *   const { open, close } = useImageViewer();
 *   <img onClick={() => open({ src: url })} />
 *
 * Uso galería (múltiples imágenes):
 *   const { open } = useImageViewer();
 *   open({ images: [url1, url2, url3], index: 0 });
 *
 * Uso con alt text:
 *   open({ src: url, alt: 'Foto del local' });
 */
export default function useImageViewer() {
    const dispatch = useDispatch();

    const open = useCallback((payload) => {
        dispatch(openViewer(payload));
    }, [dispatch]);

    const close = useCallback(() => {
        dispatch(closeViewer());
    }, [dispatch]);

    const goTo = useCallback((index) => {
        dispatch(setViewerIndex(index));
    }, [dispatch]);

    return { open, close, goTo };
}
