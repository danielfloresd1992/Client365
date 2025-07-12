'use client';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { isAxiosError } from 'axios';
import { setConfigModal } from '@/store/slices/globalModal';

//components
import Login from './login';
import CreatUser from './CreateUser';
import LegaceLoginForm from './legaceLoginForm';



//ajax
import { sendStatusDataCreateUserForJarvis, sendStatusDataUpdateUserForJarvis } from '@/libs/ajaxClient/HanddlerSendTextAndImgForAVA';



export default function ContentForm(){


    const [ typeFormState, setTypeFormState ] = useState('login');
    const dispatch = useDispatch();


    const changeTypeForm = type => {
        setTypeFormState(type);
    };

    
    const functionForCallback = (error, dataSubmit) => {
        if(isAxiosError(error)){
            let textError = '';
            if(error.response.status === 409) textError = 'El correo ya esta en uso, intente otro'
            console.log(error);
            showModal('error', 'Error', textError);
        }
        else{
            sendStatusDataCreateUserForJarvis(dataSubmit);
            changeTypeForm('login');
            showModal('successfull', 'Exito', 'Inicie sección con los datos enviados desde su mensajeria de texto');
        }
    };



    const upateData = (error, data) => {
        if(isAxiosError(error)){
            let textError = '';
            if(error?.response?.status === 403) textError = 'El usuario esta actualizado';
            if(error?.response?.status === 409) textError = 'El correo ya esta en uso, intente otro';
            console.log(error);
           
            showModal('error', 'Error', textError);
        }
        else{
            sendStatusDataUpdateUserForJarvis(data);
            changeTypeForm('login');
            showModal('successfull', 'Exito', 'Inicie sección con los datos enviados desde su mensajeria de texto');
        }
    };
    
    

    const showModal = (type, title, description, open = true) => {
        dispatch(setConfigModal({
            type: type,
            title: title,
            description:  description,
            modalOpen: open,
            callback: null
        }));
    };
  

    const Component = (data) => {
        const propData = {
            dataUserLegace:data
        }
        return <CreatUser setType={ changeTypeForm } callback={ upateData } update={ propData }/>
    };

    
    if(typeFormState === 'login') return <Login setType={ changeTypeForm } />
    else if(typeFormState === 'createUser') return <CreatUser setType={ changeTypeForm } callback={ functionForCallback }/>
    else if(typeFormState === 'updateUserAndLogin') return <LegaceLoginForm componentUpdateUser={ Component } />
}   