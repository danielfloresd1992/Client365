'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useInView } from 'react-intersection-observer';
import useAxios from '@/hook/useAxios';


import { setTypeForm } from '@/store/slices/typeForm';
import { setConfigModal } from '@/store/slices/globalModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useAuthOnServer from '@/hook/auth';

import ContentResponsive from '@/components/layaut/layaut_clients/section'
import ListManager from './list_manager';


import Break_layaut from '@/components/layaut/break_layaut'
import Card from './box/card';


export default function ClientBox({ data, index }) {



    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const [client, setClient] = useState(null);
    const dispatch = useDispatch();
    const { requestAction } = useAxios();
    const router = useRouter();


    const { ref, inView } = useInView({
        triggerOnce: true
    });




    useEffect(() => {
        if (inView) {
            requestAction({ url: `/local/id=${data._id}`, action: 'GET' })
                .then(response => {
                    if (response.status === 200) setClient(response.data);
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }, [inView]);




    const validateAuthorization = useCallback(callback => {
        if (!user.admin) {
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tiene autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else {
            callback();
        }
    }, [user]);




    const hadlerClickEditClient = () => {
        validateAuthorization(() => {
            dispatch(setTypeForm({ type: 'create-client', idData: data._id }))
        });
    };





    return (
        <div className='w-full' ref={ref}>
            <ContentResponsive id={`${data._id}-${data?.name}`}>

                <Card
                    client={client}
                    editFunction={hadlerClickEditClient}
                />

                {/*
       
           
          
            <td>
                <button
                    className='btn-item __btn-item-transparent __btn-item-green'
                    title='Click aquí para editar la configuración existente'
                > Gestionar</button>
            </td>
            <td>
                <button
                    className='btn-item __btn-item-transparent __btn-item-green'
                    title='Click aquí para editar la configuración existente'
                    onClick={() => router.push(`/clients&manasgement/diches?id=${data._id}`)}
                > Editar </button>
            </td>
            */}



                <Break_layaut
                    height='100%'
                    width='calc(100% - 190px)'
                >

                    <div className='w-full h-full min-h-[300px] p-[0rem_1rem]'>
                        <div className='w-full'>
                            <h2 className='text-center text-black text-[.9rem] text-center font-medium'>Ficha informativa</h2>
                        </div>
                        <hr />


                        <div className='flex justify-between w-full p-[.5rem] flex w-full gap-[2rem] h-full scrolltheme1'>

                            <div className='w-[150px] pt-2 pr-2 pb-[0.8rem] pl-2'>
                                <div className='flex gap-[.5rem] flex-col'>
                                    <div className='flex items-center gap-[.5rem]'>
                                        <p className='text-[.88rem] font-medium'>lista de gerentes</p>
                                        <button className='' title='Modificar o Agregar'>
                                            <img className='w-[10px] h-[10px]' src='/ico/lapiz_ico.png' alt='edit-ico' />
                                        </button>
                                    </div>
                                    <div className=''>
                                        <ListManager list={client?.managers ?? []} />
                                    </div>
                                </div>
                            </div>


                            <div className='min-w-[150px] pt-2 pr-2 pb-[0.8rem] pl-2'>
                                <div className='flex gap-[.5rem] flex-col'>
                                    <div className='flex items-center gap-[.5rem]'>
                                        <p className='text-[.88rem] font-medium'>Horario moniroteo</p>
                                        <button className='' title='Modificar o Agregar'>
                                            <img className='w-[10px] h-[10px]' src='/ico/lapiz_ico.png' alt='edit-ico' />
                                        </button>
                                    </div>
                                    <div className='h-full flex items-center justify-center'>
                                        <button
                                            onClick={() => router.push(`/clients&manasgement/time_monitoring?id=${data._id}`)}
                                            className={client?.schedules ? 'btn-item __btn-item-transparent __btn-item-green' : 'btn-item __btn-item-transparent'}
                                            title={client?.schedules ? 'Click aquí para editar la configuración existente' : 'Aun no existe una configuración para el horario'}
                                        >Gestionar</button>
                                    </div>
                                </div>
                            </div>

                            <div className='min-w-[150px] pt-2 pr-2 pb-[0.8rem] pl-2'>
                                <div className='flex gap-[.5rem] flex-col'>
                                    <div className='flex items-center gap-[.5rem]'>
                                        <p className='text-[.88rem] font-medium'>Configuración de menú</p>
                                        <button className='' title='Modificar o Agregar'>
                                            <img className='w-[10px] h-[10px]' src='/ico/lapiz_ico.png' alt='edit-ico' />
                                        </button>
                                    </div>
                                    <div className='h-full flex items-center justify-center'>
                                        <button
                                            className='btn-item __btn-item-transparent __btn-item-green'
                                            title='Click aquí para editar la configuración existente'
                                            onClick={() => router.push(`/clients&manasgement/diches?id=${data._id}`)}
                                        > Editar </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </Break_layaut>
            </ContentResponsive>
        </div>
    );
}