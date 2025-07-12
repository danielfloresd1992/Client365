
import axiosInstance from '../axios.config';
import { AxiosResponse } from 'axios';
import IP from '@/libs/dataFecth';


type Calback = (error: unknown, data: any) => void


export async function getCountDocument(id: string | null, callback: Calback) {
    try {
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/noveltie/coundDocuments?id=${id}`);
        callback(null, response.data);
    }
    catch (error: unknown) {
        callback(error, null);
    }
}




export const getInClientLastTeenNovelty = async (numberPage: number, callback: Calback): Promise<[]> => {
    try {
        const response: AxiosResponse = await axiosInstance.get(`https://${IP}/user/publisher/paginate=${numberPage}/items=10`);
        const sortedPublisher = response.data.length > 0 && response.data.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });

        if (typeof callback === 'function') callback(null, sortedPublisher);

        return sortedPublisher;

    } catch (error: unknown) {
        if (typeof callback === 'function') callback(error, null);
        return [];
    }
}; 