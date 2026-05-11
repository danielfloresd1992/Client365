'use client';
import React, { memo } from 'react';
import Image from 'next/image';
import { IButtonForBannerProps } from '@/interfaces/Ibutton';
import { useRouter } from 'next/navigation';


function ButtonForBanner({ url, ico, value, actionButton }: IButtonForBannerProps): JSX.Element {


    const router = useRouter();

    const navivate: () => void = () => {
        if (url !== undefined) {
            console.log(value)
            if (value.toLocaleLowerCase() === 'volver') {
                router.back();
            }
            else {
                router.push(url);
            }
        }
    };

    //
    return (
        <button
            className='p-[.5rem] w-full text-[.8rem] flex items-center gap-[.5rem] rounded-[4px] hover:bg-[#0c6d33]'
            onClick={url !== undefined ? navivate : actionButton}

        >
            {
                ico ?
                    <Image className='w-[20px] h-[20px]' src={ico} alt={`ico-${value}`} width={20} height={20} />
                    :
                    <div className='w-[20px]'></div>
            }
            <div>
                <p className='text-left text-white'>{value}</p>
            </div>
        </button>
    );
}


export default memo(ButtonForBanner);