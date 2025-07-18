'use client';
import { useState } from 'react';
import axios from 'axios';
import https from 'https';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { useRouter } from 'next/navigation';
import useAuthOnServer from '@/hook/auth';
import IP from '@/libs/ajaxClient/dataFecth';


const useAxios = (config) => {

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const jar = new CookieJar();
    const router = useRouter();
    const { logOut } = useAuthOnServer();

    const instance = {
        jar, httpsAgent: new https.Agent({ rejectUnauthorized: false }), headers: {
            'Source-Application': 'Jarvis365',
            'Version-App': '1.1'
        }
    };

    if (config?.withCredentials === undefined || config?.withCredentials) instance.withCredentials = true;

    instance.baseURL = IP;

    const axiosInstance = wrapper(axios.create(instance));



    if (config?.isInterceptors === undefined || config?.isInterceptors) {
        axiosInstance.interceptors.response.use(
            (response) => {
                return Promise.resolve(response);
            },
            (error) => {
                console.log(error)
                if (error.response && error.response.status === 401) {
                    if (error.response?.data?.message === 'Your session has expired') {
                        dispatch(setConfigModal({
                            modalOpen: true,
                            title: 'Sesión caducada',
                            description: 'Ha permanecido un tiempo de 10 minuto sin actividad',
                            isCallback: () => {
                                router.push('/');
                                logOut('/');
                            },
                            type: 'exit'
                        }));
                    }
                    if (error.response?.data?.message === 'Unauthorized, you must log in') {
                        logOut('/');
                        router.push('/');
                    }
                    return Promise.reject(error);
                }

                else {
                    return Promise.reject(error);
                }
            }
        );
    }


    const requestAction = ({ url, action, body }) => {
        return new Promise((resolve, reject) => {

            if (!action) throw new Error('The prop "action" must not be undefined. Please set an HTTP verb.');
            if (!url) throw new Error('The prop "url" must not be undefined. Please set an url.');
            if (typeof url !== 'string') throw new Error('The "action" and "url" props must be of type URL.')

            axiosInstance[action.toLowerCase()](url, body ? body : null)
                .then(response => {
                    resolve(response);
                })
                .catch(err => {
                    reject(err);
                })
        });
    }



    return { data, error, requestAction };
};


export default useAxios;