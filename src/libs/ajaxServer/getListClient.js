import axiosStand from '@/libs/ajaxClient/axios.fetch';
import dataFecthServer from './dataFecthServer';




export default async function getListClient(all = true) {
    try {
        const response = await axiosStand.get(`https://${dataFecthServer()}/localligth?all=${all}`, { headers: { 'Cache-Control': 'no-store' } });
        return response.data;
    }
    catch (error) {
        console.log(error);
    }
};