import axiosStand from '../axios.fetch';
import { AxiosResponse } from 'axios';
import IP from '@/libs/dataFecth';


interface ICredentialArg{
    email: string,
    password: string,
    tel: string,
    user: string,
    name: string,
    surName: string
}


export default function fetchSaveNewUser(arg: ICredentialArg): Promise<unknown>{
    const url: string = `https://${IP}/auth/singin`;
    return new Promise((resolve, reject) => {
        axiosStand.post(url, arg)
            .then((response: AxiosResponse<unknown>) => {
                if(response.status === 200) resolve(response.data);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}