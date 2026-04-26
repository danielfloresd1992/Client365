

'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form'
import validateSecurityPass from '@/libs/script/validateSecurityPass';

import sendTextJarvis from '@/libs/sendMsmJarvis';

//types
import { DateToCreateComplete, DateToCreateCompleteForm, CreateUserProps, LevelPassword } from '@/types/submitAuth';
import { NumbeTeUser } from '@/types/dataBasic';


//fetching
import { handdlerCreateUserFetch, handdlerUpdateUserFetch } from '@/libs/ajaxClient/authFetch';


import axiosInstance from '@/libs/ajaxClient/axios.fetch';
;
async function isExistNumberTel(number: string): any {
    try {
        const res: any = await axiosInstance.get(`/auth/existPhone=${number}`);
        if (res.status === 200) {
            return res.data.exist || false;
        }
    } 
    catch (error) {
        console.log(error);
        return false;
    }
}



export default function CreatUser({ setType, callback, update }: CreateUserProps) {



    const [visibilityState, setVisibilityState] = useState<boolean>(true);

    //const [ confirmNumberState, setConfirmNumberState ] = useState<boolean | null>(null);
    const CODE_FOR_CONFIRM_NUMBER = useRef<string | undefined>(undefined);
    const [levelSecurityPasswordState, setLevelSecurityPasswordState] = useState<LevelPassword>(null);
    //const [ errorDataUserState, setErrorDataUserState ] = useState({ isError: false, textError: '', code: null });
    const { register, handleSubmit, setError, formState: { errors }, reset, watch, getValues, setValue, control } = useForm<DateToCreateCompleteForm>({ mode: "onTouched" });
    const textPasswordSecurity: React.RefObject<HTMLInputElement> = useRef(null);

    const PATH_VISIBILITY: string = '/ico/visibility/icons8-visible-48.png';
    const PATH_NO_VISIBILITY: string = '/ico/visibility/icons8-invisible-48.png';


    useEffect(() => {
        CODE_FOR_CONFIRM_NUMBER.current = generateSixDigitCode();
        if (update) {
            setValue('name', update.dataUserLegace.name);
            setValue('surName', update.dataUserLegace.surName);
            setValue('surName', update.dataUserLegace.surName);
            setValue('user', update.dataUserLegace.user);
            setValue('user', update.dataUserLegace.user);
            setValue('password', update.dataUserLegace.password);

        }
    }, [update])


    function generateSixDigitCode(): string {
        const min = 100000;
        const max = 999999;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }


    const handler = (err: unknown, userResult: DateToCreateComplete | null) => {
        if (err) {
            console.log(err);
            return callback(err, null);
        }
        else {
            reset();

            if (callback) callback(err, userResult);
        }
    }


    const sumbit = async (data: DateToCreateCompleteForm) => {
        const { email, password, code_tel, tel, user, name, surName } = data;
        const data_for_submit: DateToCreateComplete = {
            email: email,
            password: password,
            phone: `${code_tel}${tel}`,
            user: user,
            name: name,
            surName: surName
        };

        if (update) data_for_submit.newPassword = data.newPassword;
        console.log(data_for_submit);
        if (update) {
            handdlerUpdateUserFetch(data_for_submit, handler);
        }
        else {
            handdlerCreateUserFetch(data_for_submit, handler);
        }
    };


    const sendCode: React.MouseEventHandler = async () => {
        try {
            const code: string = getValues('code_tel');
            const tel: string = getValues('tel');
            if (!code || !tel) return;

            
            const existNumber = await isExistNumberTel(`${code}${tel}`);
            console.log(`${code}${tel}`)
            if (existNumber) {
                setError('tel', { message: 'El número ya está registrado en el sistema con un usuario' });
                return;
            }
            console.warn(CODE_FOR_CONFIRM_NUMBER.current);
            const numberComplete: NumbeTeUser = `58${code}${tel}@c.us`;
            const textForMsm: string = `El codigo de verificación es:\n*${CODE_FOR_CONFIRM_NUMBER.current}*`;
           // const res: unknown = await sendTextJarvis(textForMsm, numberComplete);

        }
        catch (error) {
            console.log(error)
        }
    };


    return (
        <form onSubmit={handleSubmit(sumbit)} className='auth-card auth-card--wide auth-form-enter'>

            {/* Header */}
            <div className='auth-section-header'>
                <h1 className='auth-section-header__title'>{update ? 'Actualiza tus datos' : 'Crear cuenta'}</h1>
                <div className='auth-section-header__divider' />
            </div>

            <div className='auth-fields'>

                {/* Email */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Correo electrónico</label>
                    <div className={`auth-input-wrapper ${errors.email ? 'auth-input-wrapper--error' : ''}`}>
                        <input
                            className='auth-input'
                            type='email'
                            placeholder='ejemplo@correo.com'
                            autoComplete='email'
                            {...register('email', { required: { value: true, message: 'El correo es requerido' } })}
                        />
                        <Image className='auth-input-icon' src='/ico/mail.png' width={20} height={20} alt='mail' />
                    </div>
                    {errors.email?.message && <span className='auth-error'>{errors.email.message}</span>}
                </div>

                {/* Legacy password (update mode) */}
                {update && (
                    <div className='auth-input-group'>
                        <label className='auth-input-label'>Contraseña anterior</label>
                        <div className='auth-input-wrapper'>
                            <input
                                className='auth-input'
                                type='text'
                                disabled
                                {...register('password', { required: { value: true, message: 'La contraseña es requerida' } })}
                            />
                        </div>
                    </div>
                )}

                {/* Password + Confirm password */}
                <div className='auth-double-col'>
                    <div className='auth-input-group' style={{ flex: 1 }}>
                        <label className='auth-input-label'>Contraseña</label>
                        <div className={`auth-input-wrapper ${errors.password || errors.newPassword ? 'auth-input-wrapper--error' : ''}`}>
                            <input
                                className='auth-input'
                                type={visibilityState ? 'password' : 'text'}
                                placeholder='••••••••'
                                autoComplete='new-password'
                                {...register(update ? 'newPassword' : 'password', {
                                    required: { value: true, message: 'La contraseña es requerida' },
                                    validate: (value) => {
                                        const validateResult = validateSecurityPass(value);
                                        setLevelSecurityPasswordState(validateResult);
                                        return validateResult.pass;
                                    }
                                })}
                            />
                            <Image
                                className='auth-input-icon auth-input-icon--action'
                                onClick={() => setVisibilityState(!visibilityState)}
                                src={visibilityState ? PATH_VISIBILITY : PATH_NO_VISIBILITY}
                                width={20} height={20}
                                alt={visibilityState ? 'Mostrar' : 'Ocultar'}
                            />
                        </div>
                        {/* Security bars */}
                        <div className='auth-security-bars'>
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className='auth-security-bar'
                                    style={{
                                        background: levelSecurityPasswordState?.level && levelSecurityPasswordState.level > i
                                            ? levelSecurityPasswordState.color || '#e2e8d8'
                                            : '#e2e8d8'
                                    }}
                                />
                            ))}
                        </div>
                        {levelSecurityPasswordState?.msm && (
                            <p className='auth-security-text' style={{ color: levelSecurityPasswordState.level === 4 ? '#4e8300' : '#ef4444' }}>
                                {levelSecurityPasswordState.msm}
                            </p>
                        )}
                        {errors.password?.message && <span className='auth-error'>{errors.password.message}</span>}
                    </div>

                    <div className='auth-input-group' style={{ flex: 1 }}>
                        <label className='auth-input-label'>Confirmar contraseña</label>
                        <div className={`auth-input-wrapper ${errors.confirmPassword ? 'auth-input-wrapper--error' : ''}`}>
                            <input
                                className='auth-input'
                                type='password'
                                placeholder='••••••••'
                                autoComplete='new-password'
                                {...register('confirmPassword', {
                                    required: 'La confirmación es obligatoria',
                                    validate: (value) => value === getValues(update ? 'newPassword' : 'password') || 'Las contraseñas no coinciden'
                                })}
                            />
                        </div>
                        {errors.confirmPassword?.message && <span className='auth-error'>{errors.confirmPassword.message}</span>}
                    </div>
                </div>

                {/* Phone */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Teléfono</label>
                    <div className='auth-double-col'>
                        <div className={`auth-input-wrapper ${errors.code_tel ? 'auth-input-wrapper--error' : ''}`} style={{ flex: '0 0 140px' }}>
                            <select
                                className='auth-select'
                                defaultValue=''
                                {...register('code_tel', { required: { value: true, message: 'Código requerido' } })}
                            >
                                <option value='' disabled>Código</option>
                                <option value='414'>0414</option>
                                <option value='424'>0424</option>
                                <option value='416'>0416</option>
                                <option value='426'>0426</option>
                                <option value='412'>0412</option>
                            </select>
                        </div>
                        <div className={`auth-input-wrapper ${errors.tel ? 'auth-input-wrapper--error' : ''}`} style={{ flex: 1 }}>
                            <input
                                className='auth-input'
                                type='tel'
                                placeholder='1234567'
                                {...register('tel', {
                                    required: { value: true, message: 'El número es requerido' },
                                    minLength: { value: 7, message: 'Debe tener 7 dígitos' },
                                    maxLength: { value: 7, message: 'Debe tener 7 dígitos' },
                                })}
                            />
                            <Image src='/ico/telefono-celular-64.png' draggable={false} className='auth-input-icon' width={20} height={20} alt='phone' />
                        </div>
                    </div>
                    {errors.code_tel?.message && <span className='auth-error'>{errors.code_tel.message}</span>}
                    {errors.tel?.message && <span className='auth-error'>{errors.tel.message}</span>}
                </div>

                {/* Verify phone code */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Verificar teléfono</label>
                    <div className='auth-double-col' style={{ alignItems: 'flex-start' }}>
                        <button className='auth-btn auth-btn--secondary auth-btn--small' type='button' onClick={sendCode} style={{ flexShrink: 0 }}>
                            Enviar código
                        </button>
                        <div className={`auth-input-wrapper ${errors.codeConfirmTel ? 'auth-input-wrapper--error' : ''}`} style={{ flex: 1 }}>
                            <input
                                className='auth-input'
                                type='text'
                                placeholder='Código de 6 dígitos'
                                {...register('codeConfirmTel', {
                                    required: { value: true, message: 'El código es obligatorio' },
                                    validate: (value) => {
                                        if (value !== CODE_FOR_CONFIRM_NUMBER.current) {
                                            setError('codeConfirmTel', { message: 'El código es inválido' });
                                            return 'El código es inválido';
                                        }
                                    }
                                })}
                            />
                        </div>
                    </div>
                    {errors.codeConfirmTel?.message && <span className='auth-error'>{errors.codeConfirmTel.message}</span>}
                </div>

                {/* Username */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Usuario</label>
                    <div className={`auth-input-wrapper ${errors.user ? 'auth-input-wrapper--error' : ''}`}>
                        <input
                            className='auth-input'
                            type='text'
                            placeholder='nombre_de_usuario'
                            disabled={!!update}
                            {...register('user', { required: { value: true, message: 'El usuario es requerido' } })}
                        />
                    </div>
                    {errors.user?.message && <span className='auth-error'>{errors.user.message}</span>}
                </div>

                {/* Name + Surname */}
                <div className='auth-double-col'>
                    <div className='auth-input-group' style={{ flex: 1 }}>
                        <label className='auth-input-label'>Nombre</label>
                        <div className={`auth-input-wrapper ${errors.name ? 'auth-input-wrapper--error' : ''}`}>
                            <input
                                className='auth-input'
                                type='text'
                                placeholder='Tu nombre'
                                disabled={!!update}
                                {...register('name', { required: { value: true, message: 'El nombre es requerido' } })}
                            />
                        </div>
                        {errors.name?.message && <span className='auth-error'>{errors.name.message}</span>}
                    </div>
                    <div className='auth-input-group' style={{ flex: 1 }}>
                        <label className='auth-input-label'>Apellido</label>
                        <div className={`auth-input-wrapper ${errors.surName ? 'auth-input-wrapper--error' : ''}`}>
                            <input
                                className='auth-input'
                                type='text'
                                placeholder='Tu apellido'
                                disabled={!!update}
                                {...register('surName', { required: { value: true, message: 'El apellido es requerido' } })}
                            />
                        </div>
                        {errors.surName?.message && <span className='auth-error'>{errors.surName.message}</span>}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className='auth-actions'>
                <button type='submit' className='auth-btn auth-btn--primary'>
                    {update ? '¡Actualizar ya!' : 'Crear cuenta'}
                </button>
                <p className='auth-footer-text'>
                    ¿Ya tienes cuenta? {' '}
                    <span className='auth-link' onClick={() => setType('login')}>Iniciar sesión</span>
                </p>
            </div>
        </form>
    );
}