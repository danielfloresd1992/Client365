'useClient';
import axiosStand from '../ajaxClient/axios.fetch';


export default function getRportLiveRequest() {
    return new Promise((resolve, reject) => {
        axiosStand.get(`/alertNoveltie/recordsLive`)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                resolve(err);
            });
    });
}