'use client';
import { io } from 'socket.io-client';


let IP;

if (process.env.NODE_ENV === 'development') {
    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.201:3000' ?
            IP = 'https://72.68.60.254:3000'
            :
            IP = 'https://amazona365.ddns.net:3000';
    }
}
else {
    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.254:3005' ?
            IP = 'https://72.68.60.254:3000'
            :
            IP = 'https://amazona365.ddns.net:3000';
    }
    else {
        IP = 'https://72.68.60.254:3000';
    }
}




const socket_jarvis = io(IP, {
    secure: true,
    rejectUnauthorized: false,
});


socket_jarvis.on('connect', () => {
    // console.log('Io is connect');
});


socket_jarvis.on('connect_error', error => {
    // console.log(error);
});


socket_jarvis.on('error', error => {
    //console.log(error);
});


export default socket_jarvis;