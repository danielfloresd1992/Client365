'use client';
import { useState, useEffect, useRef } from 'react';
import useSubmitLock from '@/hook/useSubmitLock';

const MAX_LENGTH = 500;

/**
 * Modal para agregar un comentario sobre un operador.
 *
 * SOLO UI: la lógica de envío se conecta después a través de onSave(texto),
 * que recibe el comentario ya recortado. onCancel cierra sin guardar.
 */
export default function UserCommentForm({ user, dateObj = null, onSave = () => {}, onCancel = () => {} }) {

    const [comment, setComment] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const trimmed = comment.trim();
    const { run: runLocked, isBusy } = useSubmitLock();

    // Se ESPERA a onSave con el cerrojo puesto: sin await, el cerrojo se
    // liberaba de inmediato y el botón volvía a aceptar clics con el comentario
    // todavía viajando, guardándolo dos veces.
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!trimmed) return;
        return runLocked(() => onSave(trimmed));
    };

    return (
        <div
            className='fixed inset-0 z-[1005] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
            onClick={onCancel}
        >
            <div
                className='bg-white rounded-xl shadow-2xl border w-full max-w-md flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className='px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                        </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-sm font-bold text-gray-800 leading-tight'>Agregar comentario</h2>
                        <p className='text-[11px] text-gray-500 truncate'>
                            {user?.name} {user?.surName} · {user?.dni || 'Sin cédula'}
                            {dateObj && ` · ${new Date(dateObj).toLocaleDateString('es-VE')}`}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={onCancel}
                        aria-label='Cerrar'
                        className='text-gray-400 hover:text-red-500 text-xl leading-none px-1 transition-colors'
                    >
                        ✕
                    </button>
                </div>

                {/* ── Cuerpo ── */}
                <form onSubmit={handleSubmit} className='p-4 flex flex-col gap-2'>
                    <label htmlFor='user-comment' className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                        Comentario
                    </label>
                    <textarea
                        id='user-comment'
                        ref={textareaRef}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={MAX_LENGTH}
                        rows={4}
                        placeholder='Escribe el comentario sobre el operador...'
                        className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 placeholder:text-gray-400'
                    />
                    <div className='flex items-center justify-between'>
                        <p className='text-[10px] text-gray-400'>El comentario quedará registrado con tu usuario y la fecha.</p>
                        <span className={`text-[10px] font-semibold ${comment.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                            {comment.length}/{MAX_LENGTH}
                        </span>
                    </div>

                    {/* ── Footer ── */}
                    <div className='flex gap-3 pt-3 border-t border-gray-100 mt-1'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='btn-neutral btn-sm flex-1'
                        >
                            Cancelar
                        </button>
                        <button
                            type='submit'
                            disabled={!trimmed || isBusy()}
                            className='btn-primary btn-sm flex-1 disabled:opacity-60'
                        >
                            {isBusy() ? 'Guardando…' : 'Guardar comentario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}