import GROUP_KEY from '@/libs/ajaxClient/API_JARVIS.js';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';
import axios from 'axios'
import blobToFileAndUrl from '@/libs/script/blobToFile'
import changeHostNameForImg from '@/libs/script/changeHostName';



export default function typeShareJarvis(res) {
    return new Promise((resolve, reject) => {
        let menu = res[0].menu;
        const URL = changeHostNameForImg(process.env.NODE_ENV === 'development' ? `https://amazona365.ddns.net:${3009}/bot/imgV2/number=${GROUP_KEY}` : `https://amazona365.ddns.net:${4000}/bot/imgV2/number=${GROUP_KEY}`);
        const configRes = {
            withCredentials: true,
            responseType: 'blob',
            headers: {
                'Source-Application': 'Jarvis365',
                'Version-App': '1.1',
            }
        };
        axiosInstance.get(res[0].videoUrl ? changeHostNameForImg(res[0].videoUrl) : changeHostNameForImg(res[0].imageToShare), configRes)
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