'use client';
import { useRef, useCallback, useEffect, use } from 'react';
import Image from 'next/image';
import DataFormart from '@/libs/time/dateFormat';




export default function BoxMsm({ item, indexMsm, user, deleteProp }: any) {



    const boxRef = useRef<HTMLDivElement>(null);
    const buttonOptionsRef = useRef<HTMLDivElement>(null);
    const MY_MESSAGES: boolean = item?.submittedByUser?.userId === user?._id;
    const FIRST = indexMsm === 0;
    const message_from_others_cacho_styles = "relative z-[100] after:content-[''] after:block after:absolute after:left-[-10px] after:rotate-[27deg] after:top-[-4px] after:ml-[0px] after:w-0 after:h-0 after:border-t-[8px] after:border-b-[8px] after:border-r-[15px] after:border-t-transparent after:border-b-transparent after:border-r-white";
    const my_message_cacho_styles = "relative z-[100] after:content-[''] after:block after:absolute after:right-[-5px] after:rotate-[27deg] after:top-[-4px] after:ml-[0px] after:w-0 after:h-0 after:border-t-[8px] after:border-b-[8px] after:border-r-[15px] after:border-t-transparent after:border-b-transparent after:border-r-[#98fb98]";
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


    return (
        <div className='w-full flex p-[0rem_.4rem] relative'
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
                            FIRST ?

                                <b className='font-semibold font-[sans-serif_monospace] text-[0.8rem] text-[#089300]'>{MY_MESSAGES ? 'Tu' : item.submittedByUser.name}</b>
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
                                        <button className='w-full h-full text-left'>Responder</button>
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

                    <div className='w-full'

                    >
                        <p className='text-[0.9rem] text-black system-ui whitespace-pre-wrap' >{item.message}</p>
                    </div>
                    <p className='text-right text-[0.6rem] text-[#5d5d5d]'>{DataFormart.formatDateApp(item.date)}</p>
                </div>
            </div>
        </div>

    );
}