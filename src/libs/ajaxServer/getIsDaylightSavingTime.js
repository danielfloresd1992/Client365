import axiosStand from '@/libs/axios.fetch';
import IP from '@/libs/ajaxClient/dataFecth';


export default function getisDaylightSavingTime() {
    return new Promise((resolve, reject) => {
        axiosStand.get(`https://${IP}/time`)
            .then(response => {
                resolve(response);
            })
            .catch(error => {
                reject(error);
            })
    });
}