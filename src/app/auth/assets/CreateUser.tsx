

'use client';
import React, { useState, useRef, useEffect, ReactElement } from 'react';
//import { useDispatch } from 'react-redux';
import Image from 'next/image';
import FormLayaut from './FormLayaut';
import { useForm, Controller } from 'react-hook-form'
import validateSecurityPass from '@/script/validateSecurityPass';
//import fetchSaveNewUser from '@/libs/ajaxClient/fetchSaveNewUser';

import sendTextJarvis from '@/libs/sendMsmJarvis';

//types
import { DateToCreateComplete, DateToCreateCompleteForm, CreateUserProps, LevelPassword } from '@/types/submitAuth';
import { NumbeTeUser } from '@/types/dataBasic';


//fetching
import { handdlerCreateUserFetch, handdlerUpdateUserFetch } from '@/libs/ajaxClient/authFetch';




const styleDoubleInputLayaut: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
    alignContent: 'stretch',
    flexDirection: 'row'
};


const styleForm: React.CSSProperties = {
    gap: '2rem', 
    minWidth: '650px',
    padding: '2rem 1rem'
};


const buttonSendCodeStyle: React.CSSProperties = { width: '120px', height: '40px', fontSize: '.8rem', backgroundColor: '#ddd', color: '#000'}




export default function CreatUser({ setType, callback, update }: CreateUserProps ){



    const [visibilityState, setVisibilityState] = useState<boolean>(true);

    //const [ confirmNumberState, setConfirmNumberState ] = useState<boolean | null>(null);
    const CODE_FOR_CONFIRM_NUMBER = useRef<string |undefined>(undefined);
    const [ levelSecurityPasswordState, setLevelSecurityPasswordState ] = useState<LevelPassword>(null);
    //const [ errorDataUserState, setErrorDataUserState ] = useState({ isError: false, textError: '', code: null });
    const { register, handleSubmit, setError, formState: { errors }, reset, watch, getValues, setValue, control } = useForm<DateToCreateCompleteForm>({ mode: "onTouched" });
    const textPasswordSecurity: React.RefObject<HTMLInputElement> = useRef(null);

    const PATH_VISIBILITY: string = '/ico/visibility/icons8-visible-48.png';
    const PATH_NO_VISIBILITY: string = '/ico/visibility/icons8-invisible-48.png';


    useEffect(() => {
        CODE_FOR_CONFIRM_NUMBER.current = generateSixDigitCode();
        if(update){
            setValue('name', update.dataUserLegace.name);
            setValue('surName', update.dataUserLegace.surName);
            setValue('surName', update.dataUserLegace.surName);
            setValue('user', update.dataUserLegace.user);
            setValue('user', update.dataUserLegace.user);
            setValue('password', update.dataUserLegace.password);
            
        }
    }, [ update ])


    function generateSixDigitCode():string {
        const min = 100000;
        const max = 999999;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
      }


      const handler = (err: unknown, userResult: DateToCreateComplete | null) => {
        if(err){ 
            return callback(err, null);
        }
        else{
            reset();

            if(callback) callback(err, userResult);
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

        if(update) data_for_submit.newPassword = data.newPassword;

        if(update){
            handdlerUpdateUserFetch(data_for_submit, handler);
        }
        else{
            handdlerCreateUserFetch(data_for_submit, handler);
        }
    };

    
    const sendCode: React.MouseEventHandler = async () => {
        try {
            const code:string  = getValues('code_tel');
            const tel:string = getValues('tel');
            if(!code || !tel) return;
            const numberComplete: NumbeTeUser =`58${code}${tel}@c.us`;
            const textForMsm: string = `El codigo de verificación es:\n*${CODE_FOR_CONFIRM_NUMBER.current}*`;
            const res:unknown = await sendTextJarvis(textForMsm, numberComplete);

        } 
        catch(error){
            console.log(error)    
        }
    };


    return (
        <FormLayaut control={ control } setSubmit={handleSubmit(sumbit)} style={styleForm} >

            <div className="__width-complete">
                <h1 className='__text-center' style={{ fontWeight: '500', fontSize: '1.5rem' }}>{update ? 'Actualize sus datos' : 'Registro de usuario'}</h1>
                <hr />
            </div>

            <div className='__width-complete __padding1rem __center_center columns __oneGap'>

                
                <label className='form-label'>
                    <p className='form-label-p.intro'>Correo</p>
                    <div className='__width-complete flex content-input'>
                        <input
                            className='form-input'
                            type='email'
                            id='user'
                            style={{ backgroundImage: 'unset' }}
                            { ...register('email', { required: { value: true, message: 'El correo es requerido' } }) } 
                        />
                        <Image className='absolute right-0' src='/ico/mail.png' width={25} height={25} alt='logo-mail' />
                    </div>
                </label>

                <span className='textError'>{ errors.email?.message }</span>

                {
                    update ? 
                        <label className='form-label'>
                            <p className='form-label-p.intro'>Password legace</p>
                            <div className='__width-complete flex content-input'>
                                <input
                                    className='form-input'
                                    type='text'
                                    id='user'
                                    disabled={ update ? true : false }
                                    style={{ backgroundImage: 'unset' }}
                                    { ...register('password', { required: { value: true, message: 'El correo es requerido' } }) } 
                                />
                                <Image className='absolute right-0' src='/ico/mail.png' width={25} height={25} alt='logo-mail' />
                            </div>
                        </label>
                    : 
                        null
                }

                <div style={ styleDoubleInputLayaut }>
                    <div className='__width-complete __center_center columns'>
                        <label className='form-label'>
                            <p className='form-label-p.intro'>Contraseña</p>
                            <div className='__width-complete flex content-input'>
                                <input
                                    className='form-input'
                                    type={visibilityState ? 'password' : 'text'}
                                    style={{ backgroundImage: 'unset' }}
                                  
                                    { ...register(update ? 'newPassword' : 'password', 
                                        { 
                                            required: { value: true, message: 'La contraseña es requerida' }, 
                                            
                                            validate: (value) => { 
                                                const validateesult = validateSecurityPass(value);
                                                setLevelSecurityPasswordState(validateesult); 
                                                return validateesult.pass;
                                            }
                                        }
                                    )}
                                /> 
                                <Image className='absolute right-0 z-10 __pointer' onClick={() => setVisibilityState(!visibilityState)} src={visibilityState ? PATH_VISIBILITY : PATH_NO_VISIBILITY} width={25} height={25} alt='logo-mail' />
                            </div>
                        </label>
                       
                        <div className='__width-complete __center_center columns __oneGap'>
                            <div className='__width-complete __align-center __oneGap'>
                                <div className='__width-complete' style={{ backgroundColor: levelSecurityPasswordState?.color ? levelSecurityPasswordState?.color : 'gray', height: '8px', borderRadius: '5px' }}></div>
                                <div className='__width-complete' style={{ backgroundColor: levelSecurityPasswordState?.color ? levelSecurityPasswordState?.color : 'gray', height: '8px', borderRadius: '5px' }}></div>
                                <div className='__width-complete' style={{ backgroundColor: levelSecurityPasswordState?.color ? levelSecurityPasswordState?.color : 'gray', height: '8px', borderRadius: '5px' }}></div>
                                <div className='__width-complete' style={{ backgroundColor: levelSecurityPasswordState?.color ? levelSecurityPasswordState?.color : 'gray', height: '8px', borderRadius: '5px' }}></div>
                            </div>
                            {
                                levelSecurityPasswordState ?
                                    <>
                                        <p style={levelSecurityPasswordState.level === 4 ? { fontSize: '.8rem', color: 'green' } : { fontSize: '.8rem', color: 'red' }} ref={textPasswordSecurity}>{levelSecurityPasswordState.msm}</p>
                                        {levelSecurityPasswordState.pass ? <Image src='/ico/candado-50.png' width={25} height={250} alt='lock' /> : null }
                                    </>
                                    :
                                    null
                            }
                             <span className='textError __text-center'>{ errors.password?.message }</span>
                            <p ref={ textPasswordSecurity }></p>
                        </div>
                    </div>
                    <div className='__width-complete __center_center columns'>
                        <label className='form-label'>
                            <p className='form-label-p.intro'>Confirmar contraseña</p>
                            <div className='__width-complete flex content-input'>
                                <input
                                    className='form-input'
                                    type={ 'confirmPassword' }
                                    {...register('confirmPassword', {
                                        required: 'La confirmación de contraseña es obligatoria',
                                        validate: (value) => value === getValues(update ? 'newPassword' : 'password') || 'Las contraseñas no coinciden'
                                    })}
                                
                                /> 
                            </div>
                        </label>
                        <span className='textError __text-center'>{ errors.confirmPassword?.message }</span>
                    </div>
                </div>
                

                <div className='__width-complete'>
                    <label className='form-label'>
                        <p className='form-label-p.intro'>Telefono</p>
                        <div className='__width-complete flex content-input'>
                            <select
                                className='form-input'
                                style={{ width: '35%' }}
                                defaultValue={''}
                                { ...register('code_tel', { required : { value: true, message: 'El código de operadora es requerido' }})}
                            >
                                <option value={''} disabled={ true }>--Codigo--</option>
                                <option value='414'>0414</option>
                                <option value='424'>0424</option>
                                <option value='416'>0416</option>
                                <option value='426'>0426</option>
                                <option value='412'>0412</option>
                            </select>


                            <input
                                className='form-input'
                                type='tel'
                                style={{ width: '65%' }}
                                { ...register('tel', {
                                    required: { value: true, message: 'El número es requerido' },
                                    minLength: { value: 7, message: 'El numero debe tener una lingitud de 7' },
                                    maxLength: { value: 7, message: 'El numero debe tener una lingitud de 7' },
                                }) }
                            />
                            <Image
                                src='/ico/telefono-celular-64.png'
                                draggable={ false }
                                className='absolute right-0 z-10'
                                width={25}
                                height={25}
                                alt='logo-mail'
                            />
                        </div>
                    </label>
                </div>
                { 
                    errors.code_tel?.message ? <span className='textError' >{ errors.code_tel?.message }</span> : null
                }
                {
                    errors.tel?.message ? <span className='textError' >{ errors.tel?.message }</span> : null
                }

                <label className='form-label'>
                    <p className='form-label-p.intro'>Confirmar número telefono</p>
                    <div className='__width-complete flex content-input' style={{ padding: '1rem 0' }}>

                        <button className='btn-item' type='button' style={buttonSendCodeStyle} onClick={ sendCode }>Enviar código</button>
                        <input
                            className='form-input'
                            type='text'
                            style={{ backgroundImage: 'unset', padding: '0 2rem' }}
                            { ...register('codeConfirmTel',{ 
                                required: { value: true, message: 'El código es obligatorio' },
                                validate: (value) => {
                                    
                                    if(value === CODE_FOR_CONFIRM_NUMBER.current){
                                        
                                    }
                                    else{
                                        setError('codeConfirmTel', { message: 'El codigo es inválido'})
                                        return 'El codigo es inválido'
                                    }
                                    
                                }
                            })} 
                        />
                    </div> {

                    }
                    <span className='textError' >{ errors.codeConfirmTel?.message }</span>
                </label>


                <label className='form-label'>
                    <p className='form-label-p.intro'>User</p>
                    <div className='__width-complete flex content-input'>
                        <input
                            className='form-input'
                            type='text'
                            disabled={ update ? true : false }
                            style={{ backgroundImage: 'unset' }}
                            { ...register('user',{ required: { value: true, message: 'Un username es requerido' }}) } 
                        />
                     
                    </div>
                    <span className='textError' >{ errors.user?.message }</span>
                </label>

                <div style={ styleDoubleInputLayaut }>
                    <label className='form-label'>
                        <p className='form-label-p.intro'>Nombre</p>
                        <div className='__width-complete flex content-input'>
                            <input
                                className='form-input'
                                type='text'
                                disabled={ update ? true : false }
                                style={{ backgroundImage: 'unset' }}
                                { ...register('name', { required: { value: true, message: 'El nombre del usuario es requerido' }}) } 
                            />
                        
                        </div>
                        <span className='textError' >{ errors.name?.message }</span>
                    </label>

                    <label className='form-label'>
                        <p className='form-label-p.intro'>Apellido</p>
                        <div className='__width-complete flex content-input'>
                            <input
                                className='form-input'
                                type='text'
                                disabled={ update ? true : false }
                                style={{ backgroundImage: 'unset' }}
                                { ...register('surName', { required: { value: true, message: 'El primer apellido del usuario es requerido' }}) } 
                            />
                        
                        </div>
                        <span className='textError' >{ errors.surName?.message }</span>
                    </label>
                </div>
            </div>

            <div className='__width-complete __center_center columns' style={{ gap: '1.5rem' }}>
                <button className='btn-item'>{update ? '¡Actualizar ya!' : 'Registrarme'}</button>
                <p onClick={() => setType('login')} className='__pointer' style={{ textDecoration: 'underline' }}>Ya eres parte de Jarvis365</p>
            </div>
        </FormLayaut>
    );
}