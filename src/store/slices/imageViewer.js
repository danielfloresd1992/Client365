'use client';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Estado global del visor de imágenes.
 *
 * API:
 *   openViewer({ src, alt?, images?, index? })  — abre el visor
 *     - src: string (URL de imagen única)
 *     - alt: string opcional (texto alternativo)
 *     - images: string[] opcional (galería de múltiples imágenes)
 *     - index: number opcional (índice inicial en la galería, default 0)
 *
 *   closeViewer()  — cierra el visor
 *   setViewerIndex(number) — cambia la imagen actual en galería
 */
const imageViewer = createSlice({
    name: 'imageViewer',
    initialState: {
        isOpen: false,
        src: null,
        alt: '',
        images: [],
        currentIndex: 0,
    },
    reducers: {
        openViewer: (state, action) => {
            const { src, alt, images, index } = action.payload;
            state.isOpen = true;
            state.src = src || null;
            state.alt = alt || '';
            state.images = images || (src ? [src] : []);
            state.currentIndex = index || 0;
        },
        closeViewer: (state) => {
            state.isOpen = false;
            state.src = null;
            state.alt = '';
            state.images = [];
            state.currentIndex = 0;
        },
        setViewerIndex: (state, action) => {
            const idx = action.payload;
            if (idx >= 0 && idx < state.images.length) {
                state.currentIndex = idx;
                state.src = state.images[idx];
            }
        },
    },
});

export const { openViewer, closeViewer, setViewerIndex } = imageViewer.actions;
export default imageViewer.reducer;
