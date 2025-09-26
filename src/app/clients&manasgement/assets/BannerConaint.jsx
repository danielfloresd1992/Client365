'use client';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm';
import BannerBetween from '@/components/Header/BannerBetween';
import AsideGreen from '../../../components/aside/aside_green/aside_layaut';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';
import useAuthOnServer from '@/hook/auth';
import Image from 'next/image';



export default function BannerContain() {

    const dispatch = useDispatch();

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;


    const validateAuthorization = useCallback(callback => {
        if (!user?.admin) {
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tienes autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else {
            callback();
        }
    }, [dataSessionState]);



    return (
        <AsideGreen
            title='Gestion de clientes'
            urlIco='/ico/icons8-menú-50.png'
        >


            <div className='w-full flex flex-col items-center gap-[1.5rem]'>

                <div className='w-full'>
                    <div className='bg-[#0c6d33] p-[0_.4rem] border-[2px] border-[#ffffff] rounded-[5px] flex items-center'>
                        <div className=''>
                            <img style={{ filter: 'invert(1)' }} className='w-[17px] h-[17px]' draggable={false} src='/ico/seach/search.svg' />
                        </div>

                        <input className='bg-transparent w-full h-full text-[.7rem] p-[.4rem_1rem] text-white outline-none focus:outline-none active:outline-none' placeholder='Buscar establecimiento' type="text" name="" id="" />
                    </div>
                </div>

                <div className='w-full'>
                    <ButtonForBanner
                        ico='/ico/icons8-franquicia-50.png'
                        value='Crear Franquicia'
                        actionButton={() => {
                            validateAuthorization(() => {
                                dispatch(setTypeForm('create-franchise'));
                            })
                        }} />
                    <ButtonForBanner
                        ico='/ico/icons8-tienda-30.png'
                        value='Crear cliente'
                        actionButton={() => {
                            validateAuthorization(() => {
                                dispatch(setTypeForm('create-client'));
                            });
                        }} />
                </div>
            </div>


        </AsideGreen >
    );
}