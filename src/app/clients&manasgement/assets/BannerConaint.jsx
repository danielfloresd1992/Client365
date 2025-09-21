'use client';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm';
import BannerBetween from '@/components/Header/BannerBetween';
import AsideGreen from '../../../components/aside/aside_layaut';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';
import useAuthOnServer from '@/hook/auth';




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
        </AsideGreen >
    );
}