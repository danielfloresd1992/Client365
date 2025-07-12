'use client';
import axios from 'axios';

export default function sendTextJarvis(text, number, boolean, mentionsId, img){
    return new Promise((resolve, reject) => {
        const formData = new FormData();

        if(img){
            formData.append('my-file', img.split(';base64,')[1]);
            formData.append('type', 'image/png');
        }
        if(text) formData.append('my-text', text);
        if(boolean) formData.append('mentions', mentionsId);

        axios.post(`https://72.68.60.254:4000/bot/imgV2/number=${ number }`, formData)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err);
            })
    });
}