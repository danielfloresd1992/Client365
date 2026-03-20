'use client';
/**
 * FormComponent.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal overlay que renderiza el formulario correcto según el estado global
 * `typeForm` (Redux). Muestra FormFranchise o FormClient según corresponda.
 *
 * Rediseñado con overlay backdrop-blur y botón de cierre moderno.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useSelector, useDispatch } from 'react-redux';
import { setTypeForm }              from '@/store/slices/typeForm';
import FormFranchise                from './FormFranchise';
import FormClient                   from './FormClient';
import Image                        from 'next/image';


export default function FormComponent() {

    const dispatch = useDispatch();
    const typeForm = useSelector(state => state.typeForm);

    /** Cierra el modal limpiando el estado global */
    const closeModal = () => dispatch(setTypeForm(null));

    /** Determina qué formulario renderizar según typeForm */
    const renderForm = () => {
        if (typeof typeForm === 'string') {
            if (typeForm === 'create-franchise') return <FormFranchise />;
            if (typeForm === 'create-client')    return <FormClient />;
        }
        if (typeof typeForm === 'object') {
            if (typeForm.type === 'create-client') {
                return <FormClient id={typeForm.idData} action={closeModal} />;
            }
        }
        return null;
    };


    /* Si no hay formulario activo, no renderizar nada */
    if (!typeForm) return null;


    return (
        /* ── Overlay con backdrop blur ────────────────────────────────────── */
        <div className='
            fixed inset-0 z-50
            bg-black/40 backdrop-blur-[2px]
            flex items-start justify-center
            overflow-y-auto
            p-4 sm:p-8
        '>
            {/* Contenedor del formulario */}
            <div className='relative w-full max-w-[650px] mt-8 mb-8'>

                {/* Botón cerrar — esquina superior derecha */}
                <button
                    onClick={closeModal}
                    className='
                        absolute -top-3 -right-3 z-10
                        w-9 h-9 rounded-full
                        bg-white shadow-lg border border-gray-200
                        flex items-center justify-center
                        hover:bg-red-50 hover:border-red-200
                        transition-colors group
                    '
                    title='Cerrar formulario'
                >
                    <svg
                        className='w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors'
                        fill='none' stroke='currentColor' strokeWidth='2.5'
                        viewBox='0 0 24 24'
                    >
                        <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                </button>

                {/* Formulario inyectado */}
                {renderForm()}

            </div>
        </div>
    );
}
