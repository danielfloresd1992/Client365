import axiosInstance from '@/libs/ajaxClient/axios.fetch';
import axios from 'axios'
import blobToFileAndUrl from '@/libs/script/blobToFile'



let connectionString = process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT || 'https://72.68.60.201:3009';


export default function typeShareJarvis(res, GROUP_KEY) {
    return new Promise((resolve, reject) => {
        let menu = res[0].menu;
        const URL = `${connectionString}/bot/imgV2/number=${GROUP_KEY}`;
        const configRes = {
            withCredentials: true,
            responseType: 'blob',
            headers: {
                'Source-Application': 'Jarvis365',
                'Version-App': '1.1',
            }
        };
        axiosInstance.get(res[0].videoUrl ? res[0].videoUrl : res[0].imageToShare, configRes)
            .then(response => {
                blobToFileAndUrl(response.data, data => {
                    const formData = new FormData();
                    formData.append('my-file', data.base64.split(';base64,')[1]);
                    formData.append('type', data.file.type);
                    formData.append('my-text', menu);

                    axios.post(URL, formData)
                        .then(response => {
                            resolve(response);
                        })
                        .catch(error => {
                            reject(error);
                        });
                });
            })
            .catch(error => {
                reject(error);
            })
    });
};