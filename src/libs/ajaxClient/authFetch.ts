import axiosInstance from '../axios.config';
import { AxiosResponse } from 'axios';
import { LegaceDataUser, DateToCreateComplete,  DataToCreateUserBasic  } from '@/types/submitAuth';
import IP from '@/libs/dataFecth';




// create and update usert

export async function handdlerCreateUserFetch(data :DateToCreateComplete, callback:(error: unknown, dataForCallback:DateToCreateComplete | null) => void ){
    try{
        const response: AxiosResponse<unknown> = await axiosInstance.post(`https://${IP}/auth/singin`, data);
        callback(null, data);
    }
    catch(err: unknown){
        callback(err, null);
    }
}



export async function handdlerUpdateUserFetch(data :DateToCreateComplete, callback:(error: unknown, dataForCallback:DateToCreateComplete | null) => void ){
    try{
        const response: AxiosResponse<unknown> = await axiosInstance.put(`https://${IP}/auth/update-user-data`, data);
        callback(null, data);
    }
    catch(err: unknown){
        callback(err, null);
    }
}



export async function requestDataLegace(data: Pick<LegaceDataUser, 'user' & 'password'>, callback:(error: unknown, dataForCallback: LegaceDataUser | null) => void ): Promise<void>{
    try{
        const response:AxiosResponse = await axiosInstance.post(`https://${IP}/auth/preUpdate`, data);
        callback(null, response.data);
    }
    catch(err){
        callback(err, null);
    }   
};


// login and query  of user session



export async function requestLogin(data: DataToCreateUserBasic, callback: (error: any, dataResponse: any) => void ){
    try {
        
        const response: AxiosResponse = await axiosInstance.post(`https://${IP}/auth/login`, data);
        callback(null, response.data);

    } 
    catch(error: unknown){
        callback(error, null)
    }
}



export async function checkIfSessionExists(callback: (error: any, dataResponse: any) => void ){
    try{
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/auth/isAuth`);
        callback(null, response.data);
    }
    catch(error: unknown){
        callback(error, null)
    }
}



export async function closeSession(callback: (error: any, dataResponse: any) => void ){
    try{
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/auth/logout`);
        callback(null, response.data);
    }
    catch(error: unknown){
        callback(error, null)
    }
}