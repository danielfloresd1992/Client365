'use client';
import { useState } from 'react';

import axiosStand from '@/libs/ajaxClient/axios.fetch';



interface requestActionProps {
    email: string,
    password: string
}



export default function useAuthClient() {


    const [resAuthState, setResAuthState] = useState(null);
    const [errorState, setErrorState] = useState(null);



    const requestAuth: (body: requestActionProps) => Promise<any> = body => {

        return new Promise((resolve, reject) => {
            axiosStand.post(`/auth/login`, body)
                .then((response: any) => {
                    if (response.status === 200) {
                        setResAuthState(response.data);
                        resolve(response.data);
                    }
                    else {
                        console.log(response);
                    }
                })
                .catch((error: any) => {
                    reject(error);
                    setErrorState(error.response.data);
                });
        });

    }



    return { requestAuth, resAuthState, errorState };
}