'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import moment from 'moment-timezone';



export default function ItemInfoTime(): React.ReactNode {


    const timeRef = useRef('America/Caracas');
    const [ timeState, setTimeState ] = useState<string>('');


    useEffect(() => {

        let interval = setInterval(() => {

            setTimeState(moment().tz(timeRef.current).format('YYYY-MM-DD HH:mm:ss'))

        }, 1000);

        return () => {
            clearInterval(interval);
        }
    }, []);


    return (
        <div className='w-full flex flex-col gap-2 items-center' title='Acticavión de horario de invierno'>
            <div className='w-full flex flex-row gap-2 items-center'>
                <div className='w-full flex flex-row gap-2 items-center'>
                    <div>
                        <Image src='/ico/icons8-mundo-50.png' alt='logo-client' width='50' height='50' style={{ width: '18px', height: '18px' }} />
                    </div>
                    <p className='text-gray-500 text-sm'>Zona horaria: America/Caracas</p>

                </div>
            </div>
            <p className='text-sm font-bold'>{ timeState }</p>
        </div>
    );
}