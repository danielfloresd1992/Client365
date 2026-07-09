'use client';
import { useRef, useCallback, useEffect, use } from 'react';
import Image from 'next/image';
import DataFormart from '@/libs/time/dateFormat';




export default function BoxMsm({ item, indexMsm, user, deleteProp, onReply }: any) {



    const boxRef = useRef<HTMLDivElement>(null);
    const buttonOptionsRef = useRef<HTMLDivElement>(null);
    const MY_MESSAGES: boolean = item?.submittedByUser?.userId === user?._id;
    const FIRST = indexMsm === 0;
    // "Cachito" de la burbuja (triángulo estilo WhatsApp) dibujado con el
    // pseudo-elemento after: — solo se aplica al primer mensaje del grupo
    const message_from_others_cacho_styles = "z-[100] after:content-[''] after:block after:absolute after:left-[-10px] after:rotate-[27deg] after:top-[-4px] after:ml-[0px] after:w-0 after:h-0 after:border-t-[8px] after:border-b-[8px] after:border-r-[15px] after:border-t-transparent after:border-b-transparent after:border-r-white";
    const my_message_cacho_styles = "z-[100] after:content-[''] after:block after:absolute after:right-[-5px] after:rotate-[27deg] after:top-[-4px] after:ml-[0px] after:w-0 after:h-0 after:border-t-[8px] after:border-b-[8px] after:border-r-[15px] after:border-t-transparent after:border-b-transparent after:border-r-[#98fb98]";
    const refContextMenu = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (!buttonOptionsRef.current || !refContextMenu.current) return;


        const handdleContextMenu = (e: MouseEvent) => {
            if (refContextMenu.current) refContextMenu.current.style.display = 'block';
        }


        const hiddenContextMenu = (e: MouseEvent) => {
            if (refContextMenu.current && !refContextMenu.current.contains(e.target as Node)) {
                refContextMenu.current.style.display = 'none';
            }
        }


        buttonOptionsRef.current && buttonOptionsRef.current.addEventListener('click', handdleContextMenu);
        document.addEventListener('mousedown', hiddenContextMenu);


        return () => {
            buttonOptionsRef.current && buttonOptionsRef.current.removeEventListener('click', handdleContextMenu);
            document.removeEventListener('mousedown', hiddenContextMenu);
        }
    }, [buttonOptionsRef, refContextMenu]);





    const handleMouseEnter = () => {
        if (buttonOptionsRef.current) {
            buttonOptionsRef.current.style.visibility = 'visible';
        }
    };


    const handleMouseLeave = () => {
        if (buttonOptionsRef.current) {
            buttonOptionsRef.current.style.visibility = 'hidden';
        }
    };


    const handdlerClickDelete = () => {
        deleteProp(item._id);
        if (refContextMenu.current) refContextMenu.current.style.display = 'none';
    };


    const handdlerClickReply = () => {
        if (onReply) onReply(item);
        if (refContextMenu.current) refContextMenu.current.style.display = 'none';
    };


    // Al clicar la cita, hace scroll hasta el mensaje original y lo resalta 2s
    const scrollToRepliedMessage = () => {
        const targetId = item?.replyTo?.messageId;
        if (!targetId) return;
        const el = document.querySelector(`[data-msg-id="${targetId}"]`) as HTMLElement | null;
        if (!el) return; // el mensaje original aún no está cargado en pantalla
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('msg-highlight');
        void el.offsetWidth; // reflow para re-disparar la animación si ya estaba
        el.classList.add('msg-highlight');
        setTimeout(() => el.classList.remove('msg-highlight'), 2000);
    };


    return (
        <div className='w-full flex p-[0rem_.4rem] relative'
            data-msg-id={item?._id}
            style={{
                justifyContent: MY_MESSAGES ? 'flex-end' : 'flex-start',
            }}
        >
            <div className={`shadow-[1px_1px_6px_0px_#cfcece] bg-[#ffffff] p-[.2rem_.5rem] rounded-[5px] w-[80%] relative ${!MY_MESSAGES && FIRST ? message_from_others_cacho_styles : (MY_MESSAGES && FIRST ? my_message_cacho_styles : null)}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    backgroundColor: MY_MESSAGES ? '#98fb98' : '#ffffff'
                }}
            >
                <div className='w-full h-full flex gap-2 flex-col' >
                    <div className='w-full flex justify-between'>
                        {
                            // El nombre se muestra SIEMPRE en mensajes de otras personas;
                            // en los propios solo 'Tu' al inicio del grupo (la burbuja verde ya los identifica)
                            (!MY_MESSAGES || FIRST) ?

                                <b className='font-semibold font-[sans-serif_monospace] text-[0.8rem] text-[#089300]'>{MY_MESSAGES ? 'Tu' : (item.submittedByUser?.name || 'Usuario')}</b>
                                :
                                <div></div>
                        }
                        <div className=''>
                            <div
                                className='cursor-pointer'
                                style={{
                                    filter: 'opacity(0.5)',
                                    visibility: 'hidden',
                                }}
                                ref={buttonOptionsRef}
                            >
                                <Image src='/ico/icons8-flecha-ampliar-50.png' width={15} height={15} alt='arrow-down-ico' />

                            </div>
                            <div className='absolute w-[180px] bg-[#ffffff] none z-[2] block bg-white rounded-[5px] shadow-[1px_3px_5px_#7b6161] right-0 overflow-hidden' ref={refContextMenu}>
                                <ul className='bg-[#ffffff] text-[#696868] font-light text-[0.9rem] flex flex-col text-'>
                                    <li className='p-[.5rem_1rem] hover:bg-gray-200'>
                                        <button className='w-full h-full text-left'>Editar</button>
                                    </li>
                                    <li className='p-[.5rem_1rem] hover:bg-gray-200'>
                                        <button className='w-full h-full text-left' onClick={handdlerClickReply}>Responder</button>
                                    </li>
                                    <li className='p-[.5rem_1rem] hover:bg-gray-200'>
                                        <button className='w-full h-full text-left'>Reaccionar</button>
                                    </li>
                                    {
                                        MY_MESSAGES ?
                                            <li className='p-[.5rem_1rem] hover:bg-gray-200'>
                                                <button className='w-full h-full text-left' onClick={handdlerClickDelete}>Eliminar</button>
                                            </li>
                                            :
                                            null
                                    }
                                </ul>
                            </div>
                        </div>


                    </div>

                    <div className='w-full min-w-0'>
                        {
                            item.replyTo && (item.replyTo.message || item.replyTo.name) && (
                                <div
                                    className='mb-1 border-l-[3px] border-[#089300] bg-[#eef7ee] rounded-[4px] px-2 py-1 cursor-pointer hover:bg-[#e2f0e2] transition-colors'
                                    onClick={scrollToRepliedMessage}
                                    title='Ir al mensaje original'
                                >
                                    <b className='block text-[0.68rem] text-[#089300] truncate'>{item.replyTo.name || 'Mensaje'}</b>
                                    <span className='block text-[0.7rem] text-[#555] truncate'>{item.replyTo.message}</span>
                                </div>
                            )
                        }
                        {
                            item.sharedAlert && (
                                <div className='mb-1 rounded-[6px] overflow-hidden border border-[#e0e0e0] bg-[#f6f6f6]'>
                                    {
                                        item.sharedAlert.image ?
                                            <img src={item.sharedAlert.image} alt='alerta compartida' className='w-full max-h-[160px] object-cover' loading='lazy' decoding='async' />
                                            : null
                                    }
                                    <div className='p-[.4rem_.5rem] flex flex-col gap-[2px]'>
                                        <div className='flex items-center justify-between gap-2'>
                                            <b className='text-[0.8rem] text-[#089300] truncate'>{item.sharedAlert.title || 'Alerta'}</b>
                                            {
                                                item.sharedAlert.validation === 'true' ?
                                                    <span className='shrink-0 text-[0.6rem] px-[6px] py-[1px] rounded-full bg-[#dcfce7] text-[#166534]'>Aprobada</span>
                                                    : item.sharedAlert.validation === 'false' ?
                                                        <span className='shrink-0 text-[0.6rem] px-[6px] py-[1px] rounded-full bg-[#fee2e2] text-[#991b1b]'>Rechazada</span>
                                                        : <span className='shrink-0 text-[0.6rem] px-[6px] py-[1px] rounded-full bg-[#f3f4f6] text-[#6b7280]'>Pendiente</span>
                                            }
                                        </div>
                                        {
                                            item.sharedAlert.localName ?
                                                <span className='text-[0.65rem] text-[#6b7280]'>{item.sharedAlert.localName}</span>
                                                : null
                                        }
                                        {
                                            item.sharedAlert.menu ?
                                                <p className='text-[0.72rem] text-[#374151] whitespace-pre-wrap break-words [overflow-wrap:anywhere] line-clamp-4'>{item.sharedAlert.menu}</p>
                                                : null
                                        }
                                    </div>
                                </div>
                            )
                        }
                        {
                            item.message ?
                                <p className='text-[0.9rem] text-black system-ui whitespace-pre-wrap break-words [overflow-wrap:anywhere]'>{item.message}</p>
                                : null
                        }
                    </div>
                    <p className='text-right text-[0.6rem] text-[#5d5d5d]'>{DataFormart.formatDateApp(item.date)}</p>
                </div>
            </div>
        </div>

    );
}