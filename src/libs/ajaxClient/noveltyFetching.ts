import axiosInstance from '../axios.config';
import { AxiosResponse } from 'axios';
import IP from '@/libs/dataFecth';


type Calback = (error: unknown, data: any) => void 


export async function getCountDocument(id: string | null, callback: Calback){
    try{
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/noveltie/coundDocuments?id=${id}`);
        callback(null, response.data);
    }
    catch(error: unknown){
        callback(error, null);
    }
}