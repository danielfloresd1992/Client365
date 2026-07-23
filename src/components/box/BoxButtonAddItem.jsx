'use client';

export default function BoxButtonAddItem({ day, openSetForm }) {
    return (
        <button
            type='button'
            onClick={() => openSetForm(day)}
            className='w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 border-t border-slate-200 py-2.5 hover:bg-emerald-50 transition-colors'
        >
            <span className='text-sm leading-none'>+</span> Añadir
        </button>
    );
}