import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { requestDataLegace } from '@/libs/ajaxClient/authFetch';

//types
import { ILegacePropsForm, LegaceDataUser } from '@/types/submitAuth';




export default function LegaceLoginForm({ componentUpdateUser }: ILegacePropsForm): React.ReactNode {


    const { register, handleSubmit } = useForm({ mode: "onTouched" });
    const [errorTextState, setErrorTextState] = useState<string>('');
    const [legaceDataState, setLegaceDataState] = useState<LegaceDataUser | null>();
    const router = useRouter();



    const submit = (data: Pick<LegaceDataUser, 'user' & 'password'>): void => {
        requestDataLegace(data, (error, dataSubmit) => {
            if (error) {
                if (isAxiosError(error)) {
                    if (error.response?.data) setErrorTextState(error.response.data.message);
                }
                console.log(error);
            }
            else {
                setLegaceDataState(dataSubmit);
            }
        });
    }


    if (legaceDataState) return componentUpdateUser(legaceDataState);
    else return (
        <form onSubmit={handleSubmit(submit)} className='auth-card auth-form-enter'>
            {/* Header */}
            <div className='auth-section-header'>
                <h1 className='auth-section-header__title'>Verificar datos anteriores</h1>
                <div className='auth-section-header__divider' />
                <p className='auth-logo__subtitle' style={{ marginTop: '0.5rem' }}>Ingresa tus credenciales del sistema anterior</p>
            </div>

            <div className='auth-fields'>
                {/* Username */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Usuario</label>
                    <div className='auth-input-wrapper'>
                        <input
                            className='auth-input'
                            type='text'
                            placeholder='Tu usuario anterior'
                            required
                            {...register('user')}
                        />
                    </div>
                </div>

                {/* Password */}
                <div className='auth-input-group'>
                    <label className='auth-input-label'>Contraseña</label>
                    <div className='auth-input-wrapper'>
                        <input
                            className='auth-input'
                            type='password'
                            placeholder='••••••••'
                            required
                            {...register('password')}
                        />
                    </div>
                </div>

                {/* Error */}
                {errorTextState && (
                    <div className='auth-error'>{errorTextState}</div>
                )}
            </div>

            {/* Actions */}
            <div className='auth-actions'>
                <button type='submit' className='auth-btn auth-btn--primary'>Consultar</button>
                <button type='button' className='auth-btn auth-btn--ghost' onClick={() => router.push('/')}>
                    ← Volver al inicio
                </button>
            </div>
        </form>
    )

}