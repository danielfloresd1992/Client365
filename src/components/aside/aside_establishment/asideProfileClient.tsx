'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
//import { Switch, Button } from '@mui/material';
import ItemInfo from '@/components/aside/aside_establishment/assest/asidebarItem';
import ItemInfoTime from '@/components/aside/aside_establishment/assest/asidebarItemTineZone';



export default function AsideProfileEstablishment(): React.ReactNode {

    const searchParams = useSearchParams()




    return (
        <aside className='min-w-[300px] max-w-[300px] flex flex-col justify-between gap-5 h-[calc(100%-40px)] bg-white text-white p-4 border-left border-gray-500 pad[1]'>
            <div className='w-full flex flex-col gap-4'>

                <nav className='w-full flex flex-col gap-4'>
                    <div className='w-full 32 flex items-center gap-3'>
                        <div className=''>
                            <Image className='divContentNovelties-img' src='/images.png' alt='logo-client' width='50' height='50' style={{ width: '40px', height: '40px', objectFit: 'none' }} />
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-blue-950 text-sm font-medium'>{'Bocas house Doral'}</span>
                            <span className='text-gray-500 text-xs'>{'Bocas Grout'}</span>
                        </div>
                    </div>

                </nav>
                <hr />

                <article className='w-full flex flex-col gap-1 text-sm'>
                    <h2 className='text-center'>Información de configuración</h2>

                    <ItemInfoTime />

                    <ItemInfo ico='/ico/clock/clock.svg' title='Acticavión de horario de invierno' valueText='DST' checked={false} />
                    <hr />
                    <ItemInfo ico='/ico/camara-de-bala-64.png' title={`Estatatus de monitoreo: activo`} valueText='Monitoreo activo' checked={true} />
                    <hr />
                </article>
            </div>
            <div className='w-full'>

                <button className='btn-item btn-item_back-transparent-gray btn-item_cancel-style'><img src='/ico/icons8-configuración-64.png' style={{ width: '30px' }} /> <p>Editar configuración</p></button>
            </div>
        </aside>
    );
}
