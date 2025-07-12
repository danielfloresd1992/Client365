'use client';
import {  useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm'; 
import BannerBetween from '@/components/Header/BannerBetween';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';
import useAuthOnServer from '@/hook/auth';



export default function BannerContain(){
    
    const dispatch = useDispatch();
    
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;


    const validateAuthorization = useCallback(callback => {
        if(!user?.admin){
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tienes autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else{
            callback();
        }
    }, [ dataSessionState ]);
    


    return(
        <BannerBetween>
            <h3>Gestion de clientes</h3>
            <div className='flex __midGap'>
               <ButtonForBanner value='Crear Franquicia' actionButton={() => {
                    validateAuthorization(() => {
                        dispatch(setTypeForm('create-franchise'));
                    })
                }}/>
                <ButtonForBanner value='Crear cliente' actionButton={() => {
                    validateAuthorization(() => {
                        dispatch(setTypeForm('create-client'));
                    });
                }}/>
                <ButtonForBanner url='' ico='/ico/gira-a-la-izquierda-32.png' value='volver' />
            </div>
            
        </BannerBetween>
    );
}