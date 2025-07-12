import axiosInstance from '../axios.config';
import { AxiosResponse } from 'axios';

import IP from '@/libs/dataFecth';


import { ParamsFetchEstablishment } from '@/types/establishment';



export async function getListFrancise(callback: (error: any, dataResponse: any) => void ){
    try{
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/franchise`);
        callback(null, response.data);
    }
    catch(error: unknown){
        callback(error, null);
    }
}




export async function getLightEstablishment(params: ParamsFetchEstablishment, callback: (error: any, dataResponse: any) => void ){
    try{
        const { all } = params;
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/establishment?AllEstablishment=${ all }`);
        callback(null, response.data);
    }
    catch(error: unknown){
        callback(error, null);
    }
}


export async function getEstablishmentById(id: string, callback: (error: any, dataResponse: any) => void ){
    try {
        const response: AxiosResponse = await axiosInstance.get(`https://${ IP }/local/id=${ id }`);
        callback(null, response.data);
    } 
    catch(error){
        callback(error, null);
    }
}