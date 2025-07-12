'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthOnServer from '@/hook/auth';
import Image from 'next/image';


interface ILoandingProps{
    title: string
}



export default function LoandingPage({ title }: ILoandingProps): JSX.Element | null{

    const { dataSessionState } = useAuthOnServer();
    const router = useRouter();
    const pathName: string = usePathname();

    

    useEffect(() => {

        if(pathName === '/'){ 
            if(dataSessionState.stateSession === 'authenticated') router.push('/Lobby');
        }
        else if(pathName === '/auth'){ 
            if(dataSessionState.stateSession === 'authenticated') router.push('/Lobby');
        }
        else{ 
            if(dataSessionState.stateSession === 'unauthenticated') {
                router.push('/');
            }
        }
        
    }, [ dataSessionState ]);



    return(

        dataSessionState.stateSession
         === 'loading' ?
            <div className='__width-complete __center_center' style={{ height: '100%', width: '100%', top: '0', position: 'fixed', backgroundColor: '#fff', zIndex: 1000 }}>
                <div className='__center_center columns' style={{ gap: '1rem' }}>
                    <Image className='logo-loadingPage_animated' src='/logo-page-removebg.png' width={ 100 } height={ 100 } alt='logo-bg_transparent' />
                    <h3 className='text-intermittence' style={{ color: '#676767', textAlign: 'center' }} >{title}</h3>
                </div>
            </div>
        :
            null
    );
}
