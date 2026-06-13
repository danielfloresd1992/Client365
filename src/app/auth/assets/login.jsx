'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';


export default function Login({ eventSubmit, errorHttp, setType }) {

    const [visibilityState, setVisibilityState] = useState(true);
    const { register, handleSubmit } = useForm();

    const PATH_VISIBILITY = '/ico/visibility/icons8-visible-48.png';
    const PATH_NO_VISIBILITY = '/ico/visibility/icons8-invisible-48.png';


    const printErrorAuth = (errorHttp) => {
        if (errorHttp === 404) return 'El correo es inválido o no existe';
        if (errorHttp === 403) return 'Credenciales inválidas';
        if (errorHttp === 401) return 'Clave inválida';
        if (errorHttp >= 500) return 'Error interno del servidor';
        return '';
    };

    const errorMessage = printErrorAuth(errorHttp);

    return (
        <form onSubmit={handleSubmit(eventSubmit)} className='auth-card auth-form-enter'>
            {/* Logo */}
            <div className='auth-logo'>
                <Image src='/logo-page-removebg.png' alt='Jarvis365' width={64} height={56} priority />
                <h1 className='auth-logo__title'>Iniciar sesión</h1>
                <p className='auth-logo__subtitle'>Accede a tu cuenta de Jarvis365</p>
            </div>

            {/* Fields */}
            <div className='auth-fields'>
                {/* Email */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Correo electrónico</label>
                    <div className={`auth-input-wrapper ${errorHttp === 404 ? 'auth-input-wrapper--error' : ''}`}>
                        <input
                            className='auth-input'
                            placeholder='ejemplo@correo.com'
                            type='email'
                            required
                            autoComplete='email'
                            {...register('email')}
                        />
                        <Image src='/ico/mail.png' width={20} height={20} alt='mail' className='auth-input-icon' />
                    </div>
                </div>

                {/* Password */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Contraseña</label>
                    <div className={`auth-input-wrapper ${errorHttp === 401 ? 'auth-input-wrapper--error' : ''}`}>
                        <input
                            className='auth-input'
                            placeholder='••••••••'
                            type={visibilityState ? 'password' : 'text'}
                            required
                            autoComplete='current-password'
                            {...register('password')}
                        />
                        <Image
                            className='auth-input-icon auth-input-icon--action'
                            onClick={() => setVisibilityState(!visibilityState)}
                            src={visibilityState ? PATH_VISIBILITY : PATH_NO_VISIBILITY}
                            width={20}
                            height={20}
                            alt={visibilityState ? 'Mostrar' : 'Ocultar'}
                        />
                    </div>
                </div>

                {/* Error */}
                {errorMessage && (
                    <div className='auth-error'>{errorMessage}</div>
                )}
            </div>

            {/* Actions */}
            <div className='auth-actions'>
                <button type='submit' className='auth-btn auth-btn--primary'>
                    Iniciar sesión
                </button>

                <button type='button' className='auth-btn auth-btn--ghost'>
                    ¿Olvidaste tu contraseña?
                </button>

                <div className='auth-divider'>
                    <span className='auth-divider__line' />
                    <span className='auth-divider__text'>o</span>
                    <span className='auth-divider__line' />
                </div>

                <button type='button' className='auth-btn auth-btn--secondary' onClick={() => setType('createUser')}>
                    Crear cuenta nueva
                </button>
            </div>

            {/* Footer */}
            <p className='auth-footer-text'>
                ¿Usuario anterior? {' '}
                <span className='auth-link' onClick={() => setType('updateUserAndLogin')}>
                    Actualizar mis datos
                </span>
            </p>
        </form>
    );
}