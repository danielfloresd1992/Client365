'use client';
import { useEffect, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';




export default function ListUser() {


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const [userState, setUserState] = useState([]);


    useEffect(() => {
        let isSubscribed = true;
        let interval;
        if (isSubscribed) {
            interval = setInterval(() => {       //actualización cada sierto tiempo
                setUserState([]);

            }, 90000);
        }


        return () => {
            isSubscribed = false;
            socket.off('update-user-app-manager', user);
            interval = null;
        }
    }, [dataSessionState]);



    useEffect(() => {
        let isSubscribed = true;

        const emitUser = () => {
            if (isSubscribed) socket.emit('send-ask-user', user);
        };

        const addData = (data) => {
            if (isSubscribed) {
                if (data) {

                    const userExists = userState.filter(user => user._id === data._id);

                    if (userExists.length < 1) setUserState([...userState, data]);
                }
            }
        };

        if (user) {
            socket.emit('get-ask-user', user);
            socket.on('set-ask-user', emitUser);
            socket.on('return-ask-user', addData);
        }

        return () => {
            isSubscribed = false;
            socket.off('get-ask-user', user);
            socket.off('set-ask-user', emitUser);
            socket.off('return-ask-user', addData);
        }
    }, [dataSessionState, userState]);


    const closeUserAppManegerClient = userClientAppManager => {
        socket.emit('close-userClientAppManager', userClientAppManager);
    };




    return (
        <div className='usersContain-divUsers scrolltheme1'>
            {
                userState.length > 0 ?
                    (
                        <>
                            {
                                userState.map(userClient => (
                                    <div className='divUSerLive' key={userClient._id}>
                                        <div className='divUSerLive-userContain'>
                                            <div className='divUSerLive-divLive'>
                                            </div>
                                            <p className='divUSerLive-userName'>{`${userClient.name} ${userClient.surName}`.toLowerCase() === 'daniel flores' ? '...' : `${userClient.name} ${userClient.surName}`}</p>
                                            {
                                                user?.admin === true && user._id !== userClient._id ?
                                                    (
                                                        <div className='toLeftItem'>
                                                            <button
                                                                className='btn-item __btn-font-little'
                                                                onClick={() => closeUserAppManegerClient(userClient)}
                                                            > Cerrar sessión </button>
                                                        </div>
                                                    )
                                                    :
                                                    (
                                                        null
                                                    )
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                    )
                    :
                    (
                        null
                    )
            }
        </div>
    );
}

