'useClient';
import axiosStand from '../ajaxClient/axios.fetch';
import IP from '../ajaxClient/dataFecth';

export default function getRportLiveRequest() {
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