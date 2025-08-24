'use client';
import { io } from 'socket.io-client';


let connectionString = process.env.NEXT_PUBLIC_SOCKET_JARVIS || 'https://72.68.60.201:3007';



const socket = io(connectionString, {
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