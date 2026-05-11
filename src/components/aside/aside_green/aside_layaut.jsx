'use client';
import { useEffect, useRef } from 'react';
import ButtonForBanner from '../../buttons/ButtonForBanner';
import Image from 'next/image';
import './style.css'




export default function AsideGreen({
    title = '',
    urlIco = '/ico/icons8-menú-50.png',
    hiddenBtnToBack = false,
    hiddenBtnBurger = false,
    w = 'w-[300px]',
    children
}) {


    const asideRef = useRef(null);
    const btnBurgerRef = useRef(null);



    useEffect(() => {
        if (!btnBurgerRef.current || !asideRef.current) return null;


        const handdlerClick = (e) => {
            asideRef.current.classList.toggle('hidden-aside');
            btnBurgerRef.current.classList.toggle('aside-buttonBurger-toLeft')
        };


        btnBurgerRef.current.addEventListener('click', handdlerClick);


        return () => {
            if (btnBurgerRef.current || asideRef.current) {
                btnBurgerRef.current.removeEventListener('click', handdlerClick);
            }
        }

    }, [btnBurgerRef, asideRef]);


    


    return (
        <aside className={`aside-green hidden-aside ${w}`} ref={asideRef} id='aside-green-01'>
            <div className='h-[98%] flex flex-col items-center gap-[2rem]  p-4'>
                <div className='w-full flex flex-col gap-[.5rem]'>
                    <div className='aside-contentHeader'>
                        {
                            urlIco ?
                                <button className={`aside-buttonBurger ${hiddenBtnBurger ? 'invisible' : ''}`} ref={btnBurgerRef}>
                                    <Image src={urlIco} alt={`ico-${title}`} width={20} height={20} />
                                </button>
                                :
                                null
                        }
                        <h1 className='font-bold text-center text-white'>{title}</h1>
                    </div>
                    <hr />
                </div>

                <div className='w-full flex flex-col gap-[.5rem]'>
                    {children}
                </div>
            </div>

            {
                hiddenBtnToBack ?
                    null
                    :
                    <div className='aside-buttonToBack '>
                        <ButtonForBanner url='' ico='/ico/gira-a-la-izquierda-32.png' value='volver' />
                    </div>
            }

        </aside>
    )

}