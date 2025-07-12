'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import useAxios from '@/hook/useAxios';
import { setConfigModal } from '@/store/slices/globalModal'; 
import { setTypeForm } from '@/store/slices/typeForm'; 
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import IP from '@/libs/dataFecth';



export default function FormFranchise(){

    const { register, watch, handleSubmit } = useForm();
    const dispatch = useDispatch();
    const { requestAction } = useAxios();


    const sendData = data => {
        requestAction({ url: `https://${ IP }/franchise`, body: data, action: 'POST' })
            .then( response => {
                if(response.status === 200){
                    dispatch(
                        setConfigModal({
                            modalOpen: true,
                            title: 'Enviado con éxito',
                            description: 'Se creo la franquicia',
                            isCallback: null,
                            type: 'successfull'
                        })
                    );
                    dispatch(setTypeForm(null));
                }
            })
            .catch(err => {
                console.log(err);
                dispatch(
                    setConfigModal({
                        modalOpen: true,
                        title: 'Error',
                        description: 'A ocurrido un error al enviar los datos',
                        isCallback: null,
                        type: 'error'
                    })
                );
            });
    };



    return(
        <>
            <form className='__margin-top form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap' onSubmit={ handleSubmit(sendData) }>
                <h2 className='text_center'>Fomulario para la nueva franquicia</h2>

                <InputBorderBlue 
                    textLabel='Nombre de la franquicia'
                    register={ register }
                    name='name'
                />


                <InputBorderBlue 
                    textLabel='Direción de la franquicia' 
                    type='select'
                    register={ register }
                    name='location'
                    childSelect={[{
                        value: 'Venezuela',
                        text: 'Venezuela'
                    },
                    {
                        value: 'Confidencial',
                        text: 'Confidencial'
                    },
                    {
                        value: 'USA',
                        text: 'USA'
                    },
                    {
                        value: 'Colombia',
                        text: 'Colombia'
                    }]}
                />


                <InputBorderBlue 
                    textLabel='Seleccione su lenguaje de orige' 
                    type='select'
                    register={ register }
                    name='lang'
                    childSelect={[{value: 'es', text: 'Castellano'}, {value: 'en', text: 'Ingles'}]}
                />

                <button className='btn-item' style={{ padding: '1rem 0' }}> Guardar </button>
            </form>
        </>
    )
}