'use client';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import FormLayaut from '../../../components/forms/FormLayaut';
import { useForm } from 'react-hook-form';
import { setConfigModal } from '@/store/slices/globalModal';
import LoandingData from '@/components/loandingComponent/loanding';





export default function Login({ eventSubmit, errorHttp, setType }) {


    const [visibilityState, setVisibilityState] = useState(true);
    const { register, handleSubmit, reset } = useForm();


    const PATH_VISIBILITY = '/ico/visibility/icons8-visible-48.png';
    const PATH_NO_VISIBILITY = '/ico/visibility/icons8-invisible-48.png';





    const printErrorAuth = (errorHttp) => {
        if (errorHttp === 404) return 'El correo es invalido o no existe';
        if (errorHttp === 403) return 'Credenciales inválidas';
        if (errorHttp === 401) return 'Clave inválida';
        if (errorHttp >= 500) return 'Error server internal'
        return ''
    };




    return (
        <FormLayaut setSubmit={handleSubmit(eventSubmit)} style={{ position: 'relative', minHeight: '300px' }} >
        
                <div className='__width-complete flex justify-center padding-[1rem]'>
                        <Image src='/logo-page-removebg.png' alt='ico-lgo-jarvis' width={60} height={50} />
                </div>

                <div className='__width-complete __padding1rem __center_center columns __oneGap'>
                    <label className='form-label'>
                     
                        <div className='__width-complete flex content-input'>
                            <input
                                className='form-input'
                                placeholder='Email'
                                type='email'
                                required={true}
                                style={{ backgroundImage: 'unset' }}
                                {...register('email')}
                            />
                            <Image src='/ico/mail.png' width={25} height={15} alt='logo-mail' className='absolute right-0' />
                        </div>
                    </label>

                    <label className='form-label'>
                        <div className='__width-complete flex content-input'>
                            <input
                                className='form-input'
                                placeholder='password'
                                type={visibilityState ? 'password' : 'text'}
                                id='user'
                                required={true}
                                style={{ backgroundImage: 'unset' }}
                                {...register('password')}
                            />
                            <Image className='absolute right-0 z-10 __pointer' onClick={() => setVisibilityState(!visibilityState)} src={visibilityState ? PATH_VISIBILITY : PATH_NO_VISIBILITY} width={25} height={20} alt='logo-mail' />
                        </div>
                    </label>
                    <span className='__text-center' style={{ fontSize: '0.9rem', color: 'red' }}>{printErrorAuth(errorHttp)}</span>
                </div>


                <div className='__width-complete __center_center columns' style={{ gap: '1rem' }}>
                    <button className='btn-item'>Iniciar sesión</button>
                    <a href='' className='text-sm'>¿Haz olvidado la contraseña?</a>
                    <p onClick={() => setType('createUser')} className='__pointer text-sm' style={{ textDecoration: 'underline' }}>Registarse en Jarvis365</p>

                    <button className='btn-item btn-item_back-transparent' type='button' onClick={(e) => setType('updateUserAndLogin')}>Actualizar mis datos</button>
                </div>
    
        </FormLayaut>
    );
}