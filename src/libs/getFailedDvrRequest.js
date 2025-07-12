import axiosStand from './axios.fetch';
import IP from './dataFecth';

export default function getFiledDvrRequest () {
    return new Promise((resolve, reject) => {
        axiosStand.get(`https://${IP}/failed/all`) 
            .then(response => {
                if(response.status === 200) resolve(response.data);
            })
            .catch(err => {
                reject(err);
            });
    });
}