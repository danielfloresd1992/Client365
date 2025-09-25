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

import PieceLoader from '../../../components/loandingComponent/piece_loader';
import ListManager from './list_manager';


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


    console.log(client);


    return (
        <div className='w-full flex' id={data?.name}>
            <div className='w-[190px] min-h-[250px] flex flex-col items-center gap-[.5rem] shadow-[5px_5px_10px_#656565]' ref={ref}>
                {
                    client ?
                        <>
                            <div className='w-full p-[.5rem_0] bg-[#ddd] flex items-center justify-center'>
                                <div className='w-[160px] h-[120px]'>
                                    <img className='w-full h-full bg-[#ddd]' src={client?.image} alt={`logo-${client?.name}`} />
                                </div>
                            </div>

                            <div>
                                <p className='text-black'>{client?.name}</p>
                            </div>
                            <div className='w-full flex flex-col gap-[.5rem] p-[.5rem]'>
                                <div className='w-full flex justify-center'>
                                    <button
                                        className='flex itens-center gap-[.3rem] p-[.1rem_.4rem] text-[0.7rem] border border-solid border-[#3349e1] text-[#3349e1] rounded-[3px] font-medium'
                                        onClick={hadlerClickEditClient}
                                    >
                                        <img className='w-[5px]' src='/ico/lapiz_ico.png' alt='edit-ico' />Editar parametros
                                    </button>
                                </div>
                                <div className='text-[.8rem] w-full'>
                                    <p className='text-[#636262]'>Monitoreo: <span>{client?.status}</span></p>
                                </div>
                            </div>
                        </>
                        :
                        <PieceLoader />
                }

            </div>
            {/*
       
           
            <td>
                <button
                    onClick={() => router.push(`/clients&manasgement/time_monitoring?id=${data._id}`)}
                    className={client?.schedules ? 'btn-item __btn-item-transparent __btn-item-green' : 'btn-item __btn-item-transparent'}
                    title={client?.schedules ? 'Click aquí para editar la configuración existente' : 'Aun no existe una configuración para el horario'}
                >Gestionar</button>
            </td>
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




            <div className='w-[calc(100%-190px)] h-full p-[0rem_1rem]'>
                <div>
                    <h2 className='text-center text-black text-[.9rem]'>Ficha informativa</h2>
                </div>
                <div className='h-full overflow-scroll'>
                    <div>
                        <div>
                            <p>lista de gerentes</p>
                        </div>
                        <div>
                            <ListManager list={client?.managers ?? []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}