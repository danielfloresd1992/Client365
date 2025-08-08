'use client';
import { useContext } from 'react';
import { myUserContext } from '@/contexts/userContext';
import Image from 'next/image';


export default function ErrorServerAlert() {

    const sessionContext = useContext(myUserContext);


    if (sessionContext.dataSessionState.error?.status === 503) {
        return (
            <div className='fixed bottom-[50px] mx-auto z-[10000] overflow-hidden rotateAlert'>
                <div className='bg-red-500 h-[50px] p-4 flex rounded-full justify-center items-center gap-4'>
                    <div>
                        <Image src='/gif/icons8-high-risk.gif' height={45} width={45} alt='ico-error' draggable={false} />
                    </div>
                    <span className='text-white'>Sin comunicación con el servidor.</span>
                </div>
            </div>
        )
    }
    else {
        return null;
    }
}