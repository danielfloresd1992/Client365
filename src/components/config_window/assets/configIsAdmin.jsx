'use client';
import { useEffect } from 'react'; 
import { useSelector, useDispatch } from 'react-redux';
import { setChangueStateIsAdmin } from '@/store/slices/boolean_admin_session';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import AppManagerConfigStorange from '@/libs/app_manager_config_DB';
import BoxConfigForWindow from '@/layaut/BoxConfigForWindow';

export default function ConfigIsAdmin(){

    const isSessionAdminState = useSelector(store => store.isAdminSession);
    const dispatch = useDispatch();
    
    useEffect(() => {
        const isSessionAdmin = AppManagerConfigStorange.get('admin_session');
        dispatch(setChangueStateIsAdmin(Boolean(isSessionAdmin)));
    }, [ isSessionAdminState ]);


    return(
        <BoxConfigForWindow titleText='Configuración cuenta'>
            <div className='_center_center columns __flex-between __oneGap'>
                <InputBorderBlue 
                    type='checkbox'
                    textLabel='¿Sección Administrador de turno?'
                    value={ Boolean(isSessionAdminState) }
                    eventChengue={value => {
                        AppManagerConfigStorange.set('admin_session', value);
                        dispatch(setChangueStateIsAdmin(value));
                    }}
                />
            </div>  
        </BoxConfigForWindow>
    );
}