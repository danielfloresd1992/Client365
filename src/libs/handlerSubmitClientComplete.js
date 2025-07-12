'use client';
import axiosStand from './axios.fetch';
import IP from './dataFecth';


export default function handlerSubmitClientComplete(id){
    return new Promise((resolve, reject) => {
        axiosStand.get(`https://${IP}/local/id=${id}`)
            .then(response => {
                resolve(response);
            })
            .catch(error => {
                reject(error);
            })
    });
}