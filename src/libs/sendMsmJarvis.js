'use client';
import axios from 'axios';

let connectionString = process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT || 'https://72.68.60.201:3009';


export default function sendTextJarvis(text, number, boolean, mentionsId, img) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();

        if (img) {
            formData.append('my-file', img.split(';base64,')[1]);
            formData.append('type', 'image/png');
        }
        if (text) formData.append('my-text', text);
        if (boolean) formData.append('mentions', mentionsId);

        axios.post(`${connectionString}/bot/imgV2/number=${number}`, formData)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err);
            })
    });
}