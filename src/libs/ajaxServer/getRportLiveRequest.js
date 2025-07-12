'useClient';
import axiosStand from '../axios.fetch';
import IP from '../dataFecth';

export default function getRportLiveRequest(){
    return new Promise((resolve, reject) => {
        axiosStand.get(`https://${IP}/alertNoveltie/recordsLive`)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                resolve(err);
            });
    });
}