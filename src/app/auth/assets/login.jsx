'use client';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import FormLayaut from './FormLayaut';
import { useForm } from 'react-hook-form';
import { setConfigModal } from '@/store/slices/globalModal';
import LoandingData from '@/components/loandingComponent/loanding';
import useAuthOnServer from '@/hook/auth'




export default function Login({ setType }) {

    const [visibilityState, setVisibilityState] = useState(true);


    const { signIn, dataSessionState, errorState } = useAuthOnServer();

    const { register, handleSubmit, reset } = useForm();
    const dispatch = useDispatch();


    const PATH_VISIBILITY = '/ico/visibility/icons8-visible-48.png';
    const PATH_NO_VISIBILITY = '/ico/visibility/icons8-invisible-48.png';


    useEffect(() => {
        if (errorState) {
            dispatch(setConfigModal({
                type: 'error',
                title: '',
                description: '',
                modalOpen: false,
            }));
        }
        else {
            if (dataSessionState.stateSession === 'authenticated') {
                dispatch(setConfigModal({
                    type: '',
                    title: '',
                    description: '',
                    modalOpen: false,
                }));
            }

            reset();
        }
    }, [errorState, dataSessionState]);



    const loginUser = async data => {
        dispatch(setConfigModal({
            type: 'await',
            title: 'Iniciando sessión',
            description: 'Espere...',
            modalOpen: true,
        }));
        const { email, password } = data;
        signIn({ email, password }, '/Lobby');
    };



    const printErrorAuth = () => {
        if (errorState?.status === 404) return 'Correo o usuario no existe';
        else if (errorState?.status === 401 && errorState?.message !== 'Your session has expired') return 'Clave invalida';
        else if (errorState?.status >= 500) return 'Error server internal'
        else ''
    };




    return (
        <FormLayaut setSubmit={handleSubmit(loginUser)} style={{ position: 'relative', minHeight: '300px' }} >
            {
                dataSessionState.stateSession === 'authenticated' ?
                    <LoandingData title={'Esperando repuesta'} style={{ height: '300px' }} />
                    :
                    <>
                        <div className="__width-complete">
                            <h1 className='__text-center' style={{ fontWeight: '500', fontSize: '1.5rem' }}>Bienvenido</h1>
                        </div>

                        <div className='__width-complete __padding1rem __center_center columns __oneGap'>
                            <label className='form-label'>
                                <p className='form-label-p.intro'>Correo</p>
                                <div className='__width-complete flex content-input'>
                                    <input
                                        className='form-input'
                                        type='email'
                                        required={true}
                                        style={{ backgroundImage: 'unset' }}
                                        {...register('email')}
                                    />
                                    <Image src='/ico/mail.png' width={25} height={15} alt='logo-mail' className='absolute right-0' />
                                </div>
                            </label>

                            <label className='form-label'>
                                <p className='form-label-p.intro'>Contraseña</p>
                                <div className='__width-complete flex content-input'>
                                    <input
                                        className='form-input'
                                        type={visibilityState ? 'password' : 'text'}
                                        id='user'
                                        required={true}
                                        style={{ backgroundImage: 'unset' }}
                                        {...register('password')}
                                    />
                                    <Image className='absolute right-0 z-10 __pointer' onClick={() => setVisibilityState(!visibilityState)} src={visibilityState ? PATH_VISIBILITY : PATH_NO_VISIBILITY} width={25} height={20} alt='logo-mail' />
                                </div>
                            </label>
                            <span className='__text-center' style={{ fontSize: '0.9rem', color: 'red' }}>{printErrorAuth()}</span>
                        </div>


                        <div className='__width-complete __center_center columns' style={{ gap: '1rem' }}>
                            <button className='btn-item '>Login</button>
                            <a href='' className='text-sm'>¿Haz olvidado la contraseña?</a>
                            <p onClick={() => setType('createUser')} className='__pointer text-sm' style={{ textDecoration: 'underline' }}>Registarse en Jarvis365</p>

                            <button className='btn-item btn-item_back-transparent' type='button' onClick={(e) => setType('updateUserAndLogin')}>Actualizar mis datos</button>
                        </div>
                    </>
            }


        </FormLayaut>
    );
}