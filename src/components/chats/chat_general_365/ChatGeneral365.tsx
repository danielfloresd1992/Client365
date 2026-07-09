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



type T_SharedAlert = {
    title?: string,
    menu?: string,
    validation?: string | null,
    localName?: string,
    image?: string
}

type T_ReplyTo = {
    messageId?: string,
    message?: string,
    name?: string
}

type Tmsm = {
    _id: string,
    message: string,
    submittedByUser: T_User,
    date: string,
    sharedAlert?: T_SharedAlert,
    replyTo?: T_ReplyTo
}


type T_Props = {
    openAside: () => void,
    addAlert: (alert: { title: string; description: string }) => void;
}






export default function ChatGeneral365({ openAside, addAlert }: T_Props) {



    const [message, setMessage] = useState<string>('');
    const [replyingTo, setReplyingTo] = useState<Tmsm | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const buttonOpenEmojiRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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





    // Acepta una imagen (venga del drag & drop o del botón de adjuntar) y genera su preview
    const acceptFile = useCallback((file: File | null | undefined) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            addAlert({ title: 'Chat365', description: 'Solo se pueden adjuntar imágenes' });
            return;
        }
        setPendingPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setPendingFile(file);
    }, [addAlert]);


    const clearPendingFile = useCallback(() => {
        setPendingPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);




    const sendMsm = useCallback(() => {
        if (keySubmit.current === false) return;
        if (message.trim() === '' && !pendingFile) return;
        keySubmit.current = false;

        // Publica el mensaje en el chat (con la URL de la imagen ya subida, si aplica)
        const postChat = (imageUrl?: string) => {
            fetchData({
                url: '/chat',
                method: 'post',
                callback: (response: any) => {
                    keySubmit.current = true;
                    if (!response) return; // el envío falló: se conserva lo escrito
                    setMessage('');
                    setReplyingTo(null);
                    clearPendingFile();
                },
                body: {
                    message: message,
                    ...(imageUrl ? { sharedAlert: { image: imageUrl, title: 'Imagen' } } : {}),
                    ...(replyingTo ? {
                        replyTo: {
                            messageId: replyingTo._id,
                            message: replyingTo.message || replyingTo.sharedAlert?.title || 'Alerta',
                            name: replyingTo.submittedByUser?.name
                        }
                    } : {})
                },
                autoGetData: false
            });
        };

        if (pendingFile) {
            // 1) sube la imagen al backend, 2) envía el mensaje con su URL
            const formData = new FormData();
            formData.append('img', pendingFile);
            fetchData({
                url: '/multimedia',
                method: 'post',
                autoGetData: false,
                body: formData,
                callback: (response: any) => {
                    if (!response) {
                        keySubmit.current = true;
                        addAlert({ title: 'Chat365', description: 'No se pudo subir la imagen' });
                        return;
                    }
                    postChat(response.data.url);
                }
            });
        }
        else {
            postChat();
        }
    }, [data, message, replyingTo, pendingFile]);




    const onHanddlerSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMsm();
    };



    const deleteMsm = useCallback((id: string) => {
        console.log(id);
    }, [data])


    if (!userContext) return <div>Loading...</div>;





    return (
        <div
            className='relative w-full h-full'
            onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={e => {
                e.preventDefault();
                // Solo cerrar el overlay al salir del contenedor (no al pasar entre hijos)
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
            }}
            onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                acceptFile(e.dataTransfer.files?.[0]);
            }}
        >
            {
                isDragOver && (
                    <div className='absolute inset-0 z-[60] bg-[#089300]/15 border-4 border-dashed border-[#089300] flex items-center justify-center pointer-events-none'>
                        <p className='bg-white/95 text-[#089300] font-semibold text-sm px-4 py-2 rounded-full shadow-lg'>
                            📎 Suelta la imagen para adjuntarla
                        </p>
                    </div>
                )
            }
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
                            data?.result && groupConsecutiveMessages(data?.result).map((group, index) => {
                                try {
                                    return (
                                        <div className='w-full flex flex-col gap-[.2rem]' key={index}>
                                            {
                                                Array.isArray(group) && group.toReversed().map((item: Tmsm, indexMsm: number) => (
                                                    <BoxMsm item={item} indexMsm={indexMsm} user={user} key={item._id} deleteProp={deleteMsm} onReply={setReplyingTo} />
                                                ))
                                            }
                                        </div>
                                    )
                                }
                                catch (error) {
                                    console.log(error);
                                    return null;
                                }
                            })
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

                {
                    (replyingTo || pendingPreview) && (
                        <div className='absolute bottom-full left-0 w-full flex flex-col'>
                            {
                                replyingTo && (
                                    <div className='w-full px-3 py-2 bg-[#d8d8d8] border-t border-[#bbb] flex items-center justify-between gap-2'>
                                        <div className='min-w-0 border-l-[3px] border-[#089300] pl-2'>
                                            <b className='block text-[0.72rem] text-[#089300] truncate'>Respondiendo a {replyingTo.submittedByUser?.name || ''}</b>
                                            <span className='block text-[0.72rem] text-[#555] truncate'>{replyingTo.message || replyingTo.sharedAlert?.title || 'Alerta'}</span>
                                        </div>
                                        <button
                                            type='button'
                                            className='shrink-0 text-[#666] hover:text-black text-xl leading-none px-1'
                                            onClick={() => setReplyingTo(null)}
                                            aria-label='Cancelar respuesta'
                                        >×</button>
                                    </div>
                                )
                            }
                            {
                                pendingPreview && (
                                    <div className='w-full px-3 py-2 bg-[#e6e6e6] border-t border-[#bbb] flex items-center gap-3'>
                                        <img src={pendingPreview} alt='Imagen adjunta' className='w-12 h-12 rounded-lg object-cover border border-[#bbb] shrink-0' />
                                        <div className='min-w-0 flex-1'>
                                            <b className='block text-[0.72rem] text-[#089300] truncate'>Imagen adjunta</b>
                                            <span className='block text-[0.72rem] text-[#555] truncate'>{pendingFile?.name}</span>
                                        </div>
                                        <button
                                            type='button'
                                            className='shrink-0 text-[#666] hover:text-black text-xl leading-none px-1'
                                            onClick={clearPendingFile}
                                            aria-label='Quitar imagen'
                                        >×</button>
                                    </div>
                                )
                            }
                        </div>
                    )
                }

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
                        className='w-full h-full resize-none bg-white rounded-xl border border-[#b9b9b9] p-[.6rem] text-sm text-black placeholder:text-[#9a9a9a] shadow-sm transition-colors focus:outline-none focus:border-[#089300] focus:ring-2 focus:ring-[#089300]/25'
                        placeholder={pendingFile ? 'Añade un comentario (opcional)…' : 'Escribe un mensaje...'}
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
                                    if (message !== '' || pendingFile) sendMsm();
                                }
                            }
                        }}
                    />
                </form>

                <div className='w-[20%] h-full grid grid-cols-2 grid-rows-2 gap-[.3rem]'>

                    <button
                        type='button'
                        title='Enviar mensaje'
                        aria-label='Enviar mensaje'
                        className='col-span-2 bg-[#089300] hover:bg-[#0aab00] active:scale-95 transition-all flex items-center justify-center rounded-xl shadow-sm'
                        onClick={sendMsm}
                    >
                        <div style={{
                            filter: 'invert(1)'
                        }}>
                            <Image src='/ico/icons8-enviar-30.png' width={20} height={20} alt='ico-send' />
                        </div>
                    </button>


                    <button
                        type='button'
                        title='Insertar emoji'
                        aria-label='Insertar emoji'
                        className='bg-white border border-[#b9b9b9] hover:bg-[#f0f0f0] active:scale-95 transition-all flex items-center justify-center rounded-xl shadow-sm'
                        ref={buttonOpenEmojiRef}
                    >
                        <div>
                            <Image src='/ico/icons8-winking-face-48.png' width={26} height={26} alt='ico-emoji' />
                        </div>
                    </button>


                    <button
                        type='button'
                        title='Adjuntar imagen'
                        aria-label='Adjuntar imagen'
                        className='bg-white border border-[#b9b9b9] hover:bg-[#f0f0f0] active:scale-95 transition-all flex items-center justify-center rounded-xl shadow-sm'
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Image src='/ico/icons8-adjuntar-50.png' width={20} height={20} alt='ico-add_document' />
                    </button>

                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={e => acceptFile(e.target.files?.[0])}
                    />
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
                /* Resalta el mensaje original al que se responde (2s) */
                @keyframes msgHighlightPulse {
                    0%   { background-color: rgba(8, 147, 0, 0.30); }
                    70%  { background-color: rgba(8, 147, 0, 0.30); }
                    100% { background-color: transparent; }
                }
                .msg-highlight {
                    animation: msgHighlightPulse 2s ease-out;
                    border-radius: 8px;
                }
                @media (prefers-reduced-motion: reduce) {
                    .msg-highlight { animation: none; }
                }
            `}</style>
        </div>
    )
}