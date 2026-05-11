'use client';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { isAxiosError } from 'axios';
import { setConfigModal } from '@/store/slices/globalModal';

//components
import Login from './login';
import CreatUser from '../../../components/forms/CreateUser';
import LegaceLoginForm from '../../../components/forms/legaceLoginForm';
import '../auth.css'

//login
import useAuthOnServer from '@/hook/auth'


//ajax
import { sendStatusDataCreateUserForJarvis, sendStatusDataUpdateUserForJarvis } from '@/libs/ajaxClient/HanddlerSendTextAndImgForAVA';
import { useRouter, usePathname } from 'next/navigation';



export default function ContentForm() {

    const { signIn, dataSessionState } = useAuthOnServer();
    const [typeFormState, setTypeFormState] = useState('login');
    const router = useRouter();
    const dispatch = useDispatch();
    const errorState = false;
    const status = dataSessionState.errorHttp.message !== 'Your session has expired' ? dataSessionState.errorHttp.status : 0



    useEffect(() => {
        if (errorState) {
            dispatch(setConfigModal({
                type: 'error',
                title: '',
                description: '',
                modalOpen: false,
            }));
        }
        else {
            if (dataSessionState.stateSession !== 'loading') {
                dispatch(setConfigModal({
                    type: '',
                    title: '',
                    description: '',
                    modalOpen: false,
                }));
            }
        }
    }, [dataSessionState]);




    const loginUser = async data => {

        dispatch(setConfigModal({
            type: 'await',
            title: 'Iniciando sessión',
            description: 'Espere...',
            modalOpen: true,
        }));

        const { email, password } = data;

        signIn({ email, password }, () => {
            router.replace('/Lobby');
        });
    };






    const changeTypeForm = type => {
        setTypeFormState(type);
    };


    const functionForCallback = (error, dataSubmit) => {
        if (isAxiosError(error)) {
            let textError = '';
            if (error.response.status === 409) textError = 'El correo ya esta en uso, intente otro'
            showModal('error', 'Error', textError);
        }
        else {
            sendStatusDataCreateUserForJarvis(dataSubmit);
            changeTypeForm('login');
            showModal('successfull', 'Exito', 'Inicie sección con los datos enviados desde su mensajeria de texto');
        }
    };



    const upateData = (error, data) => {
        if (isAxiosError(error)) {
            let textError = '';
            if (error?.response?.status === 403) textError = 'El usuario esta actualizado';
            if (error?.response?.status === 409) textError = 'El correo ya esta en uso, intente otro';

            showModal('error', 'Error', textError);
        }
        else {
            sendStatusDataUpdateUserForJarvis(data);
            changeTypeForm('login');
            showModal('successfull', 'Exito', 'Inicie sección con los datos enviados desde su mensajeria de texto');
        }
    };



    const showModal = (type, title, description, open = true) => {
        dispatch(setConfigModal({
            type: type,
            title: title,
            description: description,
            modalOpen: open,
            callback: null
        }));
    };


    const Component = (data) => {
        const propData = {
            dataUserLegace: data
        }
        return <CreatUser setType={changeTypeForm} callback={upateData} update={propData} />
    };




    if (typeFormState === 'login') return (
        <Login
            eventSubmit={loginUser}
            errorHttp={status}
            setType={changeTypeForm}
        />
    )
    else if (typeFormState === 'createUser') return <CreatUser setType={changeTypeForm} callback={functionForCallback} />
    else if (typeFormState === 'updateUserAndLogin') return <LegaceLoginForm componentUpdateUser={Component} />
}   