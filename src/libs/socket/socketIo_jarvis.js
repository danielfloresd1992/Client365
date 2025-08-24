'use client';
import { io } from 'socket.io-client';


let connectionString = process.env.NEXT_PUBLIC_SOCKET_AVA || 'https://72.68.60.254:3000';






const socket_jarvis = io(connectionString, {
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