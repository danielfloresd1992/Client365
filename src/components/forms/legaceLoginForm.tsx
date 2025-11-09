import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { requestDataLegace } from '@/libs/ajaxClient/authFetch';
import IP from '@/libs/ajaxClient/dataFecth';

//components
import FormLayaut from './FormLayaut';



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
        <FormLayaut setSubmit={handleSubmit(submit)} style={null} >
            <div className="__width-complete">
                <h1 className='__text-center' style={{ fontWeight: '500', fontSize: '1.5rem' }}>Ingrese sus datos</h1>
            </div>

            <div className='__width-complete __padding1rem __center_center columns __oneGap'>
                <label className='form-label'>
                    <p className='form-label-p.intro'>UserName</p>
                    <div className='__width-complete flex content-input'>
                        <input
                            className='form-input'
                            type='user'
                            required={true}
                            style={{ backgroundImage: 'unset' }}
                            {...register('user')}
                        />
                    </div>
                </label>

                <label className='form-label'>
                    <p className='form-label-p.intro'>Contraseña</p>
                    <div className='__width-complete flex content-input'>
                        <input
                            className='form-input'
                            type={'password'}
                            id='user'
                            required={true}
                            style={{ backgroundImage: 'unset' }}
                            {...register('password')}
                        />
                    </div>
                </label>
                <span className='__text-center' style={{ fontSize: '0.9rem', color: 'red' }}>{errorTextState ? errorTextState : ''}</span>
            </div>


            <div className='__width-complete __center_center columns' style={{ gap: '1rem' }}>
                <button className='btn-item'>Consultar</button>

                <p onClick={() => router.push('/')} className='__pointer text-sm' style={{ textDecoration: 'underline' }}>Volver?</p>
            </div>
        </FormLayaut>
    )

}