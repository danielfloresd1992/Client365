'use client';

import { useRef, useContext, useEffect } from 'react';

import IP from '@/libs/dataFecth.js';
import axiosStand from '@/libs/axios.fetch.js';
import { UserContext } from '@/contexts/userContext.js';
import { useRouter } from 'next/navigation.js';
import useAxios from '@/hook/useAxios';
import { useDispatch } from 'react-redux';
import { setConfigModal, closeModal } from '@/store/slices/globalModal';


function Form(){

    const router = useRouter();
    const { login } = useContext(UserContext);
    const imgVisivilityRef = useRef();
    const inputUserRef = useRef(null);
    const inputPassword = useRef();
    const dataSection = useRef({ username: null, password: null });
    const { requestAction } = useAxios({ isInterceptor: false });
    const dispatch = useDispatch();

    
    useEffect(() => {
        axiosStand.get(`https://${ IP }/user/protected`)
            .then(response => {
                if(response.status === 200){
                    console.log(response);
                    const userSession = response.data;
                    userSession.userSessionId = `${response.data._id}-${new Date().getTime()}`;
                    login(userSession);
                    localStorage.setItem('user-newappmanager2.5', JSON.stringify(response.data));
                    router.push('/Lobby');
                }
            })
            .catch(err => {
                console.log(err);
            });
    }, []) ;


    const changeImgBtn = target => {
        const typeInputPassword = inputPassword.current.getAttribute('type');
    
        if(typeInputPassword === 'password'){
            target.children[0].src = '/ico/visibility/visibility.svg';
            inputPassword.current.type = 'text';       
        }
        else{
            target.children[0].src = '/ico/visibility/visibility_off.svg';
            inputPassword.current.type = 'password';
        }
    };
    
    function loginUser(dataUser) {
        const response = requestAction({ url: `https://${ IP }/user/login`, action: 'POST', body: { user: dataUser.username, password: dataUser.password }});
        return response;
    };

    const handlerLogin = async e => {
        e.preventDefault();
        dispatch(setConfigModal(
            {
                modalOpen: true,
                title: 'Esperando repuesta',
                description: '',
                isCallback: null,
                type: 'await'
            }
        ));
        try{
            const loginResponse = await loginUser({ username: inputUserRef.current.value, password: inputPassword.current.value });
            if(loginResponse.status === 200){
                const userSession = loginResponse.data;
                userSession.userSessionId = `${loginResponse.data._id}-${new Date().getTime()}`;
                login(userSession);
                router.push('/Lobby');
                dispatch(closeModal());
            }
        }
        catch(err){
            console.log(err);
            let configModal;
            if(err.response?.status === 400){
                configModal = {
                    modalOpen: true,
                    title: 'Contraseña invalida',
                    description: 'Al tercer intento su cuenta sera bloqueada por motivo de seguridad',
                    isCallback: null,
                    type: 'error'
                };
            }
            else if(err.response?.status === 403){
                configModal = {
                    modalOpen: true,
                    title: 'Usuario Inabilitado',
                    description: 'Usted ha sido baneado por infringir los términos y condiciones de uso. Comunicarse con el administrador.',
                    isCallback: null,
                    type: 'warning'
                };
            }
            else if(err.response?.status === 404){
                configModal = {
                    modalOpen: true,
                    title: 'usuario invalido',
                    description: 'El nombre de usuario es invalido o no exisiste',
                    isCallback: null,
                    type: 'error'
                };
            }
            else{
                configModal = {
                    modalOpen: true,
                    title: 'Error al iniciar sessión',
                    description: 'Comunicarse con el personal de sistema.',
                    isCallback: null,
                    type: 'error'
                };
            }
            dispatch(setConfigModal( configModal ));
        }
    };


    return(
        <>
            <form className='presentation __flexRowFlex __padding1rem' onSubmit={ e => handlerLogin(e) }>
                <article className="textContainForm">
                    <h1 className="textContainForm-h1">Gestion General de sistemas</h1>
                    <p className="textContainForm-p">
                    Controla y asegura los procesos, novedades y actividades diaria de
                    los locales.
                    </p>
                </article>

                <div className="form-itemsContent">
                    <p className="form-p t-white">Iniciar sessión</p>
                    <label className="form-label">
                        <p className="form-label-p.intro t-white">Usuario </p>
                        <input
                            ref={ inputUserRef }
                            className="form-input t-white"
                            type="text"
                            id="user"
                            required={ true }
                            
                        />
                    </label>

                    <label className="form-labe">
                        <p className="form-label-p.intro t-white">Password</p>
                        <div className="inputBtnContain">
                            <input
                                ref={ inputPassword }
                                className="form-input password t-white"
                                type="password"
                                name="password"
                                id="password"
                                required={true}
                                onChange={ e => dataSection.current.password =  e.target.value }
                            />
                            <button 
                                className="btnPassword" 
                                id="btn-input" 
                                type="button"
                                onClick={ e => changeImgBtn(e.target) }
                            >
                                <img
                                    className="btnPassword-img"
                                    id="btn-input-img" 
                                    src='/ico/visibility/visibility_off.svg'
                                    draggable="false"
                                    ref={ imgVisivilityRef }
                                />
                            </button>
                        </div>
                    </label>
                    <button className="form-btnSubmit" type="submit">Iniciar sesión</button>
                    <p className="text-mens" id="text-mens"></p>
                </div>
                <img
                    className="logo-amazonas"
                    src="/img/LOGO-SLIDER.png"
                    draggable="false"
                />
            </form>
        </>
    );
}

export default Form;