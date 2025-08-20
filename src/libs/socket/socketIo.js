'use client';
import { io } from 'socket.io-client';


let IP;


if (process.env.NODE_ENV === 'development') {

    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.201:3000' ?
            //IP = 'https://amazona365.ddns.net:455'
            IP = 'https://72.68.60.201:3007'
            :
            IP = 'https://amazona365.ddns.net:3007';
        //IP = 'https://amazona365.ddns.net:455';
    }
}
else {      // PRODUCTION

    if (typeof window !== 'undefined') {
        window.location.host === '72.68.60.254:3005' ?
            IP = 'https://72.68.60.254:455'
            :
            IP = 'https://amazona365.ddns.net:455';
    }
    else {
        IP = 'https://72.68.60.201:3007';
    }
}




const socket = io(IP, {
    secure: true,
    rejectUnauthorized: false,
});


socket.on('connect', () => {
    console.log('Io is connect');
    socket.emit('join_room', 'lobby');
});


socket.on('connect_error', error => {
    //console.log(error);
});


socket.on('error', error => {
    // console.log(error);
});



socket.emit('join_room', 'lobby');






export default socket;