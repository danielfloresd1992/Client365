'use client';
import { useSelector, useDispatch } from 'react-redux';
import useAuthOnServer from '@/hook/auth';
import Image from 'next/image';
import { useEffect } from 'react';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { setClient } from '@/store/slices/Client';




interface ILoandingProps {
    title: string,
    children: any
}



export default function LoandingPage({ title, children }: ILoandingProps): JSX.Element | null {

    const { dataSessionState, errorState } = useAuthOnServer();
    if (errorState?.error_connection) return <h1>Error de conexión con el servidor</h1>

    const clientsStore = useSelector((store: any) => store.clients);
    const dispatch = useDispatch();

    const { error, fetchData, setChangeData } = useSingleFetch({ resource: '/localLigth', method: 'get' }, false);



    useEffect(() => {
        if (!clientsStore || Array.isArray(clientsStore) && clientsStore.length < 1) {
            fetchData({
                url: '/localLigth',
                method: 'get',
                autoGetData: false,
                callback: (response: any) => {
                    dispatch(setClient(response.data));
                }

            })
        }
    }, [clientsStore])






    if (dataSessionState?.stateSession === 'loading' && clientsStore && Array.isArray(clientsStore) && clientsStore.length > 0) {
        return (
            <div className='__width-complete __center_center' style={{ height: '100%', width: '100%', top: '0', position: 'fixed', backgroundColor: '#fff', zIndex: 1000 }}>
                <div className='__center_center columns' style={{ gap: '1rem' }}>
                    <Image className='logo-loadingPage_animated' src='/logo-page-removebg.png' width={100} height={100} alt='logo-bg_transparent' />
                    <h3 className='text-intermittence' style={{ color: '#676767', textAlign: 'center' }} >{title}</h3>
                </div>
            </div>
        );
    }
    return children
}
