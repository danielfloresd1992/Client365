'use client';

let IP: string | undefined;



if (process.env.NODE_ENV === 'development') {

    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.201:3000' ?
            IP = 'https://amazona365.ddns.net:3006/api_jarvis_dev/v1'
            // IP = 'https://amazona365.ddns.net:443/api_jarvis/v1'
            :

            //IP = 'amazona365.ddns.net:3006/api_jarvis_dev/v1';
            IP = 'https://amazona365.ddns.net:443/api_jarvis/v1';
    }
}
else {

    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.254:3005' ?
            IP = 'https://72.68.60.254:443/api_jarvis/v1'
            :
            IP = 'https://amazona365.ddns.net:443/api_jarvis/v1';
    }
}


export default IP;