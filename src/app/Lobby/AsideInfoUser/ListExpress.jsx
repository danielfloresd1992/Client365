'use client';
import { useEffect, useState } from 'react';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';




export default function ListUserExpress() {


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const [userState, setUserState] = useState([]);
    const totalOnline = userState.length;


    useEffect(() => {
        let isSubscribed = true;
        setInterval(() => {
            if (isSubscribed) {
                setUserState([])
                socket.emit('update-user-repost-express', user);
            }

        }, 90000);

        socket.emit('update-user-repost-express', user);

        return () => {
            isSubscribed = false;
            socket.off('update-user-repost-express', user);
        };
    }, []);




    useEffect(() => {
        let isSubscribed = true;

        const addUser = data => {
            if (isSubscribed) {
                const userExists = userState.findIndex(user => user.sessionId === data.sessionId);
                console.log(userExists);
                if (userExists < 0) {
                    ;
                    setUserState(preState => [...preState, data]);
                }
            }
        };
        socket.on('close-user-repost-express', data => {
        });

        socket.on('open-user-express', addUser);

        return () => {
            isSubscribed = false;
            socket.off('open-user-express', addUser);
        };
    }, []);




    return (
        <div className='lobby-live-wrap'>
            <div className='lobby-live-head'>
                <p className='lobby-live-subtitle'>Usuarios en línea</p>
                <span className='lobby-live-count'>{totalOnline}</span>
            </div>

            <div className='usersContain-divUsers scrolltheme1 lobby-live-list'>
                {
                    userState.length > 0 ?
                        (
                            userState.map((user, index) => (
                                <div className='divUSerLive lobby-live-item' key={user?.sessionId || index}>
                                    <div className='divUSerLive-userContain'>
                                        <div className='divUSerLive-divLive'></div>
                                        <p className='divUSerLive-userName'>{user?.user?.username || 'Usuario'}</p>
                                    </div>
                                    <div className='divUSerLive-localInfoCopntain'>
                                        <a className='divUSerLive-localName' href='*'>{user?.localInfo?.localname || 'Local no definido'}</a>
                                    </div>
                                </div>
                            ))
                        )
                        :
                        (<p className='lobby-live-empty'>Sin usuarios conectados</p>)
                }
            </div>
        </div>

    );
}

