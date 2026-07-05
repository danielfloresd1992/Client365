import axiosInstance from '@/libs/ajaxClient/axios.fetch';
import axios from 'axios'
import blobToFileAndUrl from '@/libs/script/blobToFile'
import apiUrl from '@/libs/ajaxClient/dataFecth'



let connectionString = process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT || 'https://72.68.60.201:3009';


export default function typeShareJarvis(res, GROUP_KEY) {
    return new Promise((resolve, reject) => {
        let menu = res[0].menu;
        // La URL del media viene guardada con otro host (amazona365.ddns.net sin puerto)
        // y la cookie de sesión solo viaja al host del API (NEXT_PUBLIC_API_URL).
        // Se reescribe el origen para que la descarga vaya autenticada (evita el 401).
        const apiOrigin = (apiUrl.match(/^https?:\/\/[^/]+/) || [''])[0];
        const rawMediaUrl = res[0].videoUrl ? res[0].videoUrl : res[0].imageToShare;
        const mediaUrl = apiOrigin ? rawMediaUrl.replace(/^https?:\/\/[^/]+/, apiOrigin) : rawMediaUrl;
        const URL = `${connectionString}/bot/imgV2/number=${GROUP_KEY}`;
        const configRes = {
            withCredentials: true,
            responseType: 'blob',
            headers: {
                'Source-Application': 'Jarvis365',
                'Version-App': '1.1',
            }
        };
        axiosInstance.get(mediaUrl, configRes)
            .then(response => {
                blobToFileAndUrl(response.data, data => {
                    // Tipo MIME robusto: si el blob no trae uno válido, se infiere por la extensión
                    let mediaType = data.file.type;
                    if (!mediaType || mediaType === 'application/octet-stream') {
                        const ext = (mediaUrl.split('?')[0].split('.').pop() || '').toLowerCase();
                        const extToMime = {
                            mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
                            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
                            webp: 'image/webp', gif: 'image/gif'
                        };
                        mediaType = extToMime[ext] || mediaType || 'application/octet-stream';
                    }

                    const formData = new FormData();
                    formData.append('my-file', data.base64.split(';base64,')[1]);
                    formData.append('type', mediaType);
                    formData.append('my-text', menu || '');

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