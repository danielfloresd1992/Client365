'use client';
import { useEffect, useState } from 'react';
import socket from '@/libs/socketIo';
import useAuthOnServer from '@/hook/auth';




export default function ListUserExpress(){


    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const [ userState, setUserState ] = useState([]);
    

    useEffect(() => {
        let isSubscribed = true;
        setInterval(() => {
            if(isSubscribed){
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
            if(isSubscribed){
                const userExists = userState.findIndex(user => user.sessionId === data.sessionId );
                console.log(userExists);
                if( userExists < 0 ){ ;
                    setUserState(preState => [ ...preState, data ]);
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




    return(
        <div className='usersContain-divUsers scrolltheme1'>
            {
                userState.length > 0 ?
                (
                    userState.map((user, index) => (
                        <div className='divUSerLive'  key={ index }>
                            <div className='divUSerLive-userContain'>
                                <div className='divUSerLive-divLive'></div>
                                <p className='divUSerLive-userName'>{ user.user.username }</p>
                            </div>
                                <div className='divUSerLive-localInfoCopntain'>
                                <a className='divUSerLive-localName' href='*'>{ user.localInfo.localname }</a>
                            </div>
                        </div>
                    ))
                )
                :
                (null)
            }
        </div>
       
    );
}

