'use client';
import { useState, useRef, useCallback, useEffect, useContext, FormEvent } from 'react';
import socket from '@/libs/socket/socketIo';
import { myUserContext } from '@/contexts/userContext';
import Image from 'next/image';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import EmojiContainer from '@/components/emojis/emojis_seletion'

import BoxMsm from './assets/box_msm';




type T_User = {
    name: string;
    userId: string;
}



type Tmsm = {
    _id: string,
    message: string,
    submittedByUser: T_User,
    date: string
}


type T_Props = {
    openAside: () => void,
    addAlert: (alert: { title: string; description: string }) => void;
}






export default function ChatGeneral365({ openAside, addAlert }: T_Props) {



    const [message, setMessage] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const buttonOpenEmojiRef = useRef<HTMLButtonElement>(null);
    const pageRef = useRef(0);


    const keySubmit = useRef<boolean>(true);
    const keyInitFetchDataRef = useRef(true);
    const userContext = useContext(myUserContext);
    const user = userContext?.dataSessionState?.dataSession;

    const { data, error, fetchData, setChangeData } = useSingleFetch({ resource: `/chat?page=${pageRef.current}&limit=${10}`, method: 'get', body: { message: message, establishment: null } }, false);





    useEffect(() => {

        if (userContext?.dataSessionState?.stateSession === 'authenticated' && !data?.result && keyInitFetchDataRef.current) {
            keyInitFetchDataRef.current = false;
            fetchData({
                url: `/chat?page=${pageRef.current}&limit=${10}`,
                callback: null,
                method: 'get',
                autoGetData: true
            });
            pageRef.current = pageRef.current + 1;
        }
    }, [userContext]);




    useEffect(() => {
        let key = true;

        const recibeMsm = (message: Tmsm) => {
            if (key) {
                setChangeData({ result: [message, ...data.result] });
                if (user._id !== message.submittedByUser.userId) {
                    addAlert({ title: 'Chat365', description: 'Este es el chat' });
                    openAside();
                }
            }
        };
        socket.on('receive_message', recibeMsm);


        const deletedMsm = (id: string) => {

        };




        return () => {
            socket.off('receive_message', recibeMsm);
            key = false;
        }
    }, [data, userContext]);





    const groupConsecutiveMessages = useCallback((messages: Tmsm[]) => {
        if (!messages || messages.length === 0) return [];
        const grouped: Tmsm[][] = [];
        let currentGroup: Tmsm[] = [];
        let currentUser = messages[0].submittedByUser.userId;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const prevMsg = i > 0 ? messages[i - 1] : null;

            // Calcular diferencia de tiempo con mensaje anterior
            const timeDiff = prevMsg ?
                (new Date(msg.date).getTime() - new Date(prevMsg.date).getTime()) / (1000 * 60) :
                null;
            // Agrupar si mismo usuario y tiempo menor a 5 minutos
            if (msg.submittedByUser.userId === currentUser &&
                timeDiff !== null && timeDiff < 5) {
                currentGroup.push(msg);
            } else {
                if (currentGroup.length > 0) {
                    grouped.push([...currentGroup]);
                }
                currentGroup = [msg];
                currentUser = msg.submittedByUser.userId;
            }
        }

        if (currentGroup.length > 0) {
            grouped.push([...currentGroup]);
        }
        return grouped;
    }, []);





    const geLastMsm = useCallback(() => {
        fetchData({
            url: `/chat?page=${pageRef.current}&limit=${10}`,
            method: 'get',
            callback: (dataResponse: any) => {
                setChangeData({ result: [...data.result, ...dataResponse.data.result,] });
                pageRef.current = pageRef.current + 1;
            },
            autoGetData: false
        });

    }, [data, pageRef.current]);





    const sendMsm = useCallback(() => {
        if (keySubmit.current === false) return;
        keySubmit.current = false;
        if (message.trim() !== '') {
            fetchData({
                url: '/chat',
                method: 'post',
                callback: () => {
                    setMessage('');
                    keySubmit.current = true;
                    //    setShowEmojiPicker(false);
                },
                body: {
                    message: message
                },
                autoGetData: false
            });
        }
    }, [data, message]);




    const onHanddlerSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMsm();
    };



    const deleteMsm = useCallback((id: string) => {
        console.log(id);
    }, [data])


    if (!userContext) return <div>Loading...</div>;





    return (
        <div className='w-full h-full'>
            <header className='h-[80px] w-full bg-[rgb(237_237_237)] p-[.5rem]'>
                <div className='w-full h-full flex flex-row justify-start items-center gap-4'>
                    <div>
                        <div className='w-[50px] h-[50px] rounded-[50%] bg-white'>
                            <Image width={50} height={50} src='/logo-page-removebg.png' alt='co-chatt' />
                        </div>
                    </div>
                    <div>
                        <div>
                            <h2 className='text-black'>Chat General</h2>
                            <p className='text-[rgb(83_79_79)]'>en linea</p>
                        </div>
                    </div>
                </div>
            </header>


            <div className='w-full h-[calc(100%_-_180px)] bg-[rgb(245_245_245)]'>
                <div className='w-full h-full flex flex-col-reverse p-2'
                    style={{
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <div className='w-full flex flex-col-reverse gap-[.4rem]'>
                        {
                            data?.result && groupConsecutiveMessages(data?.result).map((group, index) => (
                                <div className='w-full flex flex-col gap-[.2rem]' key={index}>
                                    {
                                        group.toReversed().map((item: Tmsm, indexMsm: number) => (
                                            <BoxMsm item={item} indexMsm={indexMsm} user={user} key={item._id} deleteProp={deleteMsm} />
                                        ))
                                    }
                                </div>
                            ))
                        }
                    </div>
                    <div className='w-full flex items-center justify-center p-[.5rem]'>
                        <button onClick={geLastMsm} type='button'>
                            <div>
                                <span className='text-center text-[0.7rem] text-[rgb(99_97_97)]'>Cargar mas mensajes</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>



            <div className=' relative w-full h-[100px] bg-[#cdcdcd] flex items-center justify-center gap-2 p-2'>

                <form className='w-[80%] h-full ' action="" onSubmit={onHanddlerSubmit}>


                    <div className='relative w-full h-auto bottom-[0]'>
                        <EmojiContainer
                            getEmoji={(emoji) => {
                                setMessage(emoji)
                            }}
                            buttonRef={buttonOpenEmojiRef.current}
                            elementTexttHtml={textareaRef.current}
                        />
                    </div>

                    <textarea
                        value={message}
                        className='w-full h-full resize-none bg-white rounded-[10px] p-[.5rem] text-black focus:outline-none active:outline-none'
                        placeholder='Escribe un mensaje...'
                        ref={textareaRef}

                        onChange={(e) => {
                            setMessage(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {


                                e.preventDefault();
                                if (e.shiftKey) {
                                    setMessage((message: string): any => {
                                        return message + '\n'
                                    });
                                }
                                else {
                                    if (message !== '') sendMsm();
                                }
                            }
                        }}
                    />
                </form>

                <div className='w-[20%] h-full flex flex-col flex-wrap justify-start gap-[.2rem]'>

                    <button className='w-[48%] h-[48%] bg-[rgb(78_217_40)] flex items-center justify-center rounded-[10px]'
                        onClick={sendMsm}
                    >
                        <div style={{
                            filter: 'invert(1)'
                        }}>
                            <Image src='/ico/icons8-enviar-30.png' width={20} height={20} alt='ico-send' />
                        </div>
                    </button>





                    <button
                        className='w-[48%] h-[48%]  bg-[rgb(147_147_147)] flex items-center justify-center rounded-[10px]'
                        ref={buttonOpenEmojiRef}
                    >
                        <div>
                            <Image src='/ico/icons8-winking-face-48.png' width={30} height={30} alt='ico-emoji' />
                        </div>
                    </button>



                    <button className='w-[48%] h-[48%] bg-[rgb(147_147_147)] flex items-center justify-center rounded-[10px]'>
                        <div style={{
                            filter: 'invert(1)'
                        }}>
                            <Image src='/ico/icons8-adjuntar-50.png' width={20} height={20} alt='ico-add_document' />
                        </div>
                    </button>
                </div>
            </div>
            <style jsx global>{`
                .twemoji {
                    height: 1.2em;
                    width: 1.2em;
                    margin: 0 .05em 0 .1em;
                    vertical-align: -0.2em;
                    display: inline-block;
                }
                .message-content {
                    line-height: 1.4;
                    word-break: break-word;
                }
            `}</style>
        </div>
    )
}