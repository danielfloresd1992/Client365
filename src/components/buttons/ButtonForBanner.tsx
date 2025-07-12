'use client';
import React, { memo } from 'react';
import Image from 'next/image';
import { IButtonForBannerProps } from '@/interfaces/Ibutton';
import { useRouter } from 'next/navigation';


function ButtonForBanner({ url, ico, value, actionButton }:IButtonForBannerProps): JSX.Element {


    const router = useRouter();

    const navivate: () => void = () => {
        if(url !== undefined){
            console.log(value)
            if(value.toLocaleLowerCase() === 'volver'){
                router.back();
            }
            else{
                router.push(url);
            }
        }
    };

    
    return(
        <button 
            className='btn-item  btn-item__wid300-green'
            onClick={ url !== undefined ? navivate : actionButton }
           
        >
            {value}
            {
                ico ?
                    <Image className='' src={ico} alt={`ico-${value}`} width={20} height={20} />
                :
                    null
            }
        </button>
    );
}


export default memo(ButtonForBanner);