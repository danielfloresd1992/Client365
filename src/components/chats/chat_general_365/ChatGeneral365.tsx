'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import socket_jarvis from '@/libs/socket/socketIo_jarvis';
import Image from 'next/image';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import DataFormart from '@/libs/time/dateFormat.js';
import twemoji from 'twemoji';
import emojis from '@/libs/data/emojis';



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
    addAlert: (alert: { title: string; description: string }) => void;
}






export default function ChatGeneral365({ addAlert }: T_Props) {



    const { data, error, fetchData, setChangeData } = useSingleFetch({ resource: `/chat?page=${0}&limit=${10}`, method: 'get' }, true);
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containEmojisRef = useRef<HTMLDivElement>(null);
    console.log('data', data);





    /*  ///  EXAPLE FOR POST DATA
    export const setMessageForChat = (body) => {
    return new Promise((resolve, reject) => {
        console.log(body)
        axiosInstance.post(`${IP}/chat`, body)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};
     */


    useEffect(() => {
        let key = true;

        const recibeData = (message: Tmsm) => {
            if (key) {
                setChangeData(message);
                addAlert({ title: 'Chat365', description: 'Este es el chat' })
            }
        };
        socket_jarvis.on('receive_message', recibeData)

        return () => {
            socket_jarvis.off('receive_message', recibeData);
            key = false;
        }
    }, []);



    const parseEmojis = useCallback((text: string) => {
        return twemoji.parse(text, {
            folder: 'svg',
            ext: '.svg',
            className: 'twemoji',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
        });
    }, []);



    const addEmoji = (emoji: string) => {
        setMessage(prev => prev + emoji);
        textareaRef.current?.focus();
    };



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

        // Añadir el último grupo
        if (currentGroup.length > 0) {
            grouped.push([...currentGroup]);
        }

        return grouped;
    }, []);



    return (
        <div className='w-full h-full'>
            <header className='h-[80px] w-full bg-[#037303] p-[.5rem]'>
                <div className='w-full h-full flex flex-row justify-start items-center gap-4'>
                    <div>
                        <div className='w-[50px] h-[50px] rounded-[50%] bg-white'>
                            <Image width={50} height={50} src='/logo-page-removebg.png' alt='co-chatt' />
                        </div>
                    </div>
                    <div>
                        <div>
                            <h2 className='text-white'>Chat General</h2>
                            <p className='text-white'>en linea</p>
                        </div>
                    </div>
                </div>
            </header>
            <div className='w-full h-[calc(100%_-_180px)] bg-[rgb(245_245_245)]'>
                <div className='w-full h-full flex p-2 flex flex-col-reverse gap-[.4rem]'
                    style={{
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {
                        data?.result && groupConsecutiveMessages(data?.result).map((group, index) => (
                            <div className='w-full flex flex-col gap-[.2rem]' key={index}>
                                {
                                    group.map((item: Tmsm, indexMsm: number) => (
                                        <div className='shadow-[1px_1px_6px_0px_#cfcece] bg-[#ffffff] p-[0rem_.5rem] rounded-[5px] w-[80%]' key={item._id}>
                                            <div className='w-full h-full flex gap-2 flex-col' >
                                                <div className='w-full flex justify-between'>
                                                    {
                                                        indexMsm === 0 ?

                                                            <b className='font-semibold font-[sans-serif_monospace] text-[0.8rem] text-[#089300]'>{item.submittedByUser.name}</b>
                                                            :
                                                            <div></div>
                                                    }
                                                    <div
                                                        className='cursor-pointer'
                                                        style={{
                                                            filter: 'opacity(0.5);'
                                                        }}
                                                    >
                                                        <Image src='/ico/icons8-flecha-ampliar-50.png' width={15} height={15} alt='arrow-down-ico' />
                                                    </div>
                                                </div>

                                                <div>
                                                    <p>{item.message}</p>
                                                </div>
                                                <p className='text-right text-[0.6rem] text-[#5d5d5d]'>{DataFormart.formatDateApp(item.date)}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ))
                    }
                </div>
            </div>


            <div className=' relative w-full h-[100px] bg-[#cdcdcd] flex items-center justify-center gap-2 p-2'>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='w-[80%] h-full resize-none bg-white rounded-[10px] p-[.5rem] text-black focus:outline-none active:outline-none'
                    placeholder='Escribe un mensaje...'
                    ref={textareaRef}
                ></textarea>
                <div className='w-[20%] h-full flex flex-col flex-wrap justify-start gap-[.2rem]'>

                    <button className='w-[48%] h-[48%] bg-[rgb(78_217_40)] flex items-center justify-center rounded-[10px]'>
                        <div style={{
                            filter: 'invert(1)'
                        }}>
                            <Image src='/ico/icons8-enviar-30.png' width={20} height={20} alt='ico-send' />
                        </div>
                    </button>



                    {showEmojiPicker && (
                        <div
                            ref={containEmojisRef}
                            className="absolute w-full h-[200px] bottom-[100px] left-0 bg-white p-3 border-t flex flex-wrap gap-2 overflow-y-scroll"
                            onBlur={(e) => {
                                // Verificar que el elemento es un HTMLElement antes de acceder a .id
                                const target = e.target as HTMLElement;
                                const parent = target.parentNode as HTMLElement | null;

                                if (parent && parent.id !== 'contain-emojis') {
                                    setShowEmojiPicker(false);
                                }
                            }}
                            tabIndex={-1}
                            id='contain-emojis'
                        >
                            {emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    className="text-2xl hover:bg-gray-100 rounded-lg p-1"
                                    onClick={() => addEmoji(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}



                    <button className='w-[48%] h-[48%]  bg-[rgb(147_147_147)] flex items-center justify-center rounded-[10px]'
                        onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker)
                            //  containEmojisRef.current?.focus();
                        }}>
                        <div>
                            <Image src='/ico/icons8-winking-face-48.png' width={30} height={30} alt='ico-emoji' />
                        </div>
                    </button>



                    <button className='w-[48%] h-[48%] bg-[rgb(147_147_147)] flex items-center justify-center  rounded-[10px]'

                    >
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