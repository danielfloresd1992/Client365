'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import DataFormart from '@/libs/time/dateFormat.js';
//   {DataFormart.formatDateApp(noveltyState.date)}

export default function ChatGeneral365({ addAlert }) {


    const { data, error, fetchData } = useSingleFetch({ resource: `/chat?page=${0}&limit=${10}`, method: 'get' }, true);


    console.log('data', data);



    useEffect(() => {
        addAlert({ title: 'Chat365', description: 'Este es el chat' })
    }, []);




    return (
        <div className='w-full h-full'>
            <div className='w-full h-[calc(100%_-_100px)] bg-[#ffffff]'>
                <div className='w-full h-full flex p-2 flex flex-col-reverse gap-4'
                    style={{
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {
                        data?.result && data?.result.map((item) => (
                            <div key={item._id}>
                                <div>
                                    <bold>{item.submittedByUser.name}</bold>
                                    <p>{item.message}</p>
                                </div>
                                <p>{DataFormart.formatDateApp(item.date)}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className='w-full h-[100px] bg-[#cdcdcd] flex items-center justify-center gap-2 p-2'>
                <textarea className='w-[80%] h-full resize-none bg-[#dddddd] rounded-[10px] p-[.5rem] text-black focus:outline-none active:outline-none' name="" id=""></textarea>
                <div className='w-[20%] h-full'>
                    <button className='w-[50%] h-[40%] bg-[#a5f963] flex items-center justify-center bg-[#0ef313] rounded-[10px]'>
                        <div style={{
                            filter: 'invert(1)'
                        }}>
                            <Image src='/ico/icons8-enviar-30.png' width={20} height={20} alt='ico-send' />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}