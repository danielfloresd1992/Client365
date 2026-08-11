'use client';

import { useState } from 'react';

/**
 * Input en línea para agregar comentarios desde el popover (estilo red social).
 * Componente a nivel de módulo con estado propio: así el tipeo no pierde el
 * foco cuando la celda re-renderiza. onSubmit(texto) debe devolver true si
 * guardó (para limpiar el input).
 */
export default function CommentComposer({ onSubmit, sending }) {
    const [text, setText] = useState('');
    const trimmed = text.trim();

    const handleSend = async () => {
        if (!trimmed || sending) return;
        const saved = await onSubmit(trimmed);
        if (saved) setText('');
    };

    return (
        <div className='flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/70'>
            <input
                type='text'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                maxLength={500}
                placeholder='Escribe un comentario...'
                disabled={sending}
                className='flex-1 h-8 bg-white border border-amber-200 rounded-full px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400 disabled:opacity-60'
            />
            <button
                type='button'
                onClick={handleSend}
                disabled={!trimmed || sending}
                aria-label='Enviar comentario'
                title='Enviar comentario'
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${trimmed && !sending
                    ? 'bg-[#f0a500] text-white hover:brightness-110 active:scale-95 shadow-sm'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
                {sending
                    ? <span className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    : (
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <path d='m22 2-7 20-4-9-9-4Z'></path>
                            <path d='M22 2 11 13'></path>
                        </svg>
                    )}
            </button>
        </div>
    );
}
