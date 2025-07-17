import axiosStand from '../ajaxClient/axios.fetch';
import IP from '../ajaxClient/dataFecth';



export default function getScheduleRequest() {
    return new Promise((resolve, reject) => {
        axiosStand.get(`https://${IP}/schedule/all`)
            .then(response => {
                if (response.status === 200) resolve(response.data);
            })
            .catch(err => reject(err));
    });
}
