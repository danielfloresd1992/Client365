'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useAxios from '@/hook/useAxios';

import { arrayBufferToBase64 } from '@/libs/script/arrayTo64';
import { setTypeForm } from '@/store/slices/typeForm';
import { setConfigModal } from '@/store/slices/globalModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useAuthOnServer from '@/hook/auth';




export default function CellClient({ data, index }) {



    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const [client, setClient] = useState(null);
    const dispatch = useDispatch();
    const { requestAction } = useAxios();
    const router = useRouter();


    useEffect(() => {
        requestAction({ url: `/local/id=${data._id}`, action: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    setClient(response.data);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, []);



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
        <>
            <td>
                {index}
            </td>
            <td>
                <div className='__center_center __midGap __pointer'>
                    <Image width={15} height={15} src='/ico/lapiz_ico.png' alt='edit' onClick={hadlerClickEditClient} />
                    <p>{data.order}</p>
                </div>
            </td>
            <td><p>{data.name}</p></td>
            <td>
                <img src={
                    client?.img ?
                        arrayBufferToBase64(client.img.data.data, 'image/png')
                        :
                        client?.image
                }
                    style={{ width: 45, height: 33 }}
                />

            </td>
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
        </>
    );
}