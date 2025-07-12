'use client';
import { memo } from 'react';
import Image from 'next/image';
import { Switch } from '@mui/material';



type PropsItem = {
    ico: string, 
    title: string, 
    valueText: string, 
    checked: boolean
}


function ItemInfo({ ico, title, valueText, checked }: PropsItem): React.ReactNode{




    return(
        <div className='w-full flex flex-row gap-2 items-center' title={ title }>
            <div className='w-full flex flex-row gap-2 items-center'>
                <div>
                    <Image src={ico} alt='logo-client' width='50' height='50' style={{ width: '18px', height: '18px' }} />
                </div>
                <p className='text-gray-500 text-sm'>{valueText}</p>

            </div>
            <Switch
                checked={checked}
                onChange={() => { }
                }
                inputProps={{ 'aria-label': 'controlled' }}
            />
        </div>
    )
}


export default memo(ItemInfo);