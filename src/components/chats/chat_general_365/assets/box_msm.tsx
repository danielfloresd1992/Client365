
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import DataFormart from '@/libs/time/dateFormat';







export default function BoxMsm({ item, indexMsm, user }: any) {


    const boxRef = useRef<HTMLDivElement>(null);
    const buttonOptionsRef = useRef<HTMLDivElement>(null);
    const MY_MESSAGES: boolean = item.submittedByUser.userId === user._id;




    const handleMouseEnter = () => {
        if (buttonOptionsRef.current) {
            buttonOptionsRef.current.style.visibility = 'visible';
        }
    };


    const handleMouseLeave = () => {
        if (buttonOptionsRef.current) {
            buttonOptionsRef.current.style.visibility = 'hidden';
        }
    }



    return (
        <div className='w-full flex'
            style={{
                justifyContent: MY_MESSAGES ? 'flex-end' : 'flex-start',
            }}
        >
            <div className='shadow-[1px_1px_6px_0px_#cfcece] bg-[#ffffff] p-[0rem_.5rem] rounded-[5px] w-[80%]'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    backgroundColor: MY_MESSAGES ? '#98fb98' : '#ffffff'
                }}
            >
                <div className='w-full h-full flex gap-2 flex-col' >
                    <div className='w-full flex justify-between'>
                        {
                            indexMsm === 0 ?

                                <b className='font-semibold font-[sans-serif_monospace] text-[0.8rem] text-[#089300]'>{MY_MESSAGES ? 'Tu' : item.submittedByUser.name}</b>
                                :
                                <div></div>
                        }
                        <div
                            className='cursor-pointer'
                            style={{
                                filter: 'opacity(0.5);',
                                visibility: 'hidden',
                            }}
                            ref={buttonOptionsRef}
                        >
                            <Image src='/ico/icons8-flecha-ampliar-50.png' width={15} height={15} alt='arrow-down-ico' />
                        </div>
                    </div>

                    <div className='w-full'>
                        <p className='text-[0.9rem] text-black system-ui'>{item.message}</p>
                    </div>
                    <p className='text-right text-[0.6rem] text-[#5d5d5d]'>{DataFormart.formatDateApp(item.date)}</p>
                </div>
            </div>
        </div>

    );
}