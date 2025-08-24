'use client';
import { useDispatch } from 'react-redux';
import BoxConfigForWindow from '@/layaut/BoxConfigForWindow';
import socket from '@/libs/socket/socketIo';
import { setConfigModal } from '@/store/slices/globalModal';
import axios from 'axios';




export default function ResetClientsNow() {

    const dispatch = useDispatch();
    let connectionString = process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT || 'https://72.68.60.201:3009';


    const reset = () => {
        socket.emit('recive-reload-client-appmanager', null);
    };


    const resetExpress = () => {
        socket.emit('reset_client_jarvis', { client: 'express' });
    }



    const closeSessionExpressAjax = () => {
        axios.get(`${connectionString}/bot/AlertaExpress/close`)
            .then(response => {
                if (response.status === 200) {
                    dispatch(setConfigModal({
                        type: 'successfull',
                        title: 'Secciones cerradas',
                        descrition: '',
                        isCallback: null,
                        modalOpen: true
                    }));
                }
                else {
                    console.log(response);
                }
            })
            .catch(error => {
                console.log(error);
                dispatch(setConfigModal({
                    type: 'error',
                    title: 'Error al cerrar las sessiones',
                    descrition: 'No se ha podido establecer comunicación copn el servidor avaBot',
                    isCallback: null,
                    modalOpen: true
                }));
            });
    };

    return (
        <>
            <BoxConfigForWindow titleText='Refrescar tas las instancias pertenecientes a este cliente'>
                <div className='_center_center columns __flex-between __oneGap'>
                    <button style={{ padding: '.5rem', fontSize: '.8rem' }} className='btn-item' onClick={reset}>
                        <p className='t-white'>Resert now</p>
                    </button>
                </div>
            </BoxConfigForWindow>


            <BoxConfigForWindow titleText='Cerrar cuentas de Reportes Express'>
                <div className='_center_center columns __flex-between __oneGap'>
                    <button style={{ padding: '.5rem', fontSize: '.8rem' }} className='btn-item' onClick={closeSessionExpressAjax}>
                        <p className='t-white'>Close now</p>
                    </button>
                </div>
            </BoxConfigForWindow>


            <BoxConfigForWindow titleText='Cerrar cuentas de Reportes Express'>
                <div className='_center_center columns __flex-between __oneGap'>
                    <button style={{ padding: '.5rem', fontSize: '.8rem' }} className='btn-item' onClick={resetExpress}>
                        <p className='t-white'>Reiniciar todos los usuarios de express</p>
                    </button>
                </div>
            </BoxConfigForWindow>
        </>

    );
}