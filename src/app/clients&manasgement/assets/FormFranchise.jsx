'use client';
/**
 * FormFranchise.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario para crear una nueva franquicia.
 * Envía POST /franchise con { name, location, lang }.
 *
 * Usa react-hook-form para la gestión del formulario y el componente
 * InputBorderBlue del proyecto para mantener consistencia en los inputs.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import useAxios from '@/hook/useAxios';
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';


export default function FormFranchise({ closeModal }) {

    const { register, handleSubmit } = useForm();
    const dispatch = useDispatch();
    const { requestAction } = useAxios();


    /** Envía los datos al servidor */
    const sendData = data => {
        requestAction({ url: '/franchise', body: data, action: 'POST' })
            .then(res => {
                if (res.status === 200) {
                    dispatch(setConfigModal({
                        modalOpen: true, title: 'Franquicia creada',
                        description: 'La franquicia fue registrada exitosamente',
                        isCallback: null, type: 'successfull',
                    }));
                    dispatch(setTypeForm(null));
                }
            })
            .catch(err => {
                console.error(err);
                dispatch(setConfigModal({
                    modalOpen: true, title: 'Error',
                    description: 'Ocurrió un error al crear la franquicia',
                    isCallback: null, type: 'error',
                }));
            });
    };


    return (
        <div className='
            fixed inset-0 z-50
            bg-black/40 backdrop-blur-[2px]
            flex items-center justify-center
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




                <div className='bg-white rounded-2xl shadow-xl overflow-hidden'>

                    {/* ── Header ────────────────────────────────────────────────── */}
                    <div className='bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5'>
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                                <img
                                    src='/ico/icons8-franquicia-50.png'
                                    alt='franquicia'
                                    className='w-5 h-5'
                                    style={{ filter: 'brightness(10)' }}
                                />
                            </div>
                            <div>
                                <h2 className='text-white font-bold text-base'>Nueva Franquicia</h2>
                                <p className='text-emerald-100 text-xs'>Registra un grupo de establecimientos</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Formulario ────────────────────────────────────────────── */}
                    <form onSubmit={handleSubmit(sendData)} className='p-6 flex flex-col gap-5'>

                        <InputBorderBlue
                            textLabel='Nombre de la franquicia'
                            register={register}
                            name='name'
                        />

                        <InputBorderBlue
                            textLabel='Ubicación de la franquicia'
                            type='select'
                            register={register}
                            name='location'
                            childSelect={[
                                { value: 'Venezuela', text: 'Venezuela' },
                                { value: 'Confidencial', text: 'Confidencial' },
                                { value: 'USA', text: 'USA' },
                                { value: 'Colombia', text: 'Colombia' },
                            ]}
                        />

                        <InputBorderBlue
                            textLabel='Idioma de origen'
                            type='select'
                            register={register}
                            name='lang'
                            childSelect={[
                                { value: 'es', text: 'Castellano' },
                                { value: 'en', text: 'Inglés' },
                            ]}
                        />

                        {/* ── Submit ─────────────────────────────────────────── */}
                        <button
                            type='submit'
                            className='
                            w-full py-3 rounded-xl
                            bg-emerald-600 text-white font-semibold text-sm
                            hover:bg-emerald-700 active:scale-[0.99]
                            transition-all duration-200 mt-2
                        '
                        >
                            Crear franquicia
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
