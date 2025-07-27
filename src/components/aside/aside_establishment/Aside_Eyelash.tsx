'use client';
import { useRef, ReactNode } from 'react'
import Image from 'next/image';



type Prop = {
    position: 'l' | 'r' | undefined
    title: string,
    urlIco: string | undefined | null
    eyelash: 0 | 1 | 2 | 3
    children: ReactNode
}




export default function Aside_Eyelash({ position, title, urlIco, eyelash, children }: Prop) {


    const styleInit: any = {};
    const refElement = useRef<HTMLDivElement>(null);


    if (position === 'r' || position === undefined) {
        styleInit.right = '0';
        styleInit.transform = 'translateX(100%)';
    }
    if (position === 'l') {
        styleInit.left = '0';
        styleInit.transform = 'translateX(-100%)';
    }



    const handdlerOnMouseEnter = () => {
        if (refElement.current) {
            refElement.current.style.transform = 'translateX(0%)';
            refElement.current.style.zIndex = '101';
        }
    };



    const handdlerOnMouseLeave = () => {
        if (refElement.current) {
            if (position === 'r') {
                refElement.current.style.transform = 'translateX(100%)';
            }
            else {
                refElement.current.style.transform = 'translateX(-100%)';
            }
            refElement.current.style.zIndex = '100';
        }
    };



    const seletColor = (colorSelect: number) => {
        if (colorSelect === 0) return { color: '#db6b36', position: '0%' }
        if (colorSelect === 1) return { color: '#2ad424ff', position: '25%' }
        if (colorSelect === 2) return { color: '#810ac5ff', position: '50%' }
        if (colorSelect === 3) return { color: '#c50a0aff', position: '75%' }
        return { color: '#6e6e6eff', position: 0 }
    };


    const returnImage = () => {
        return urlIco ?
            <div
                style={{
                    transform: 'rotate-[271deg]',
                    filter: 'invert(1)'
                }}
            > <Image height={20} width={20} src={urlIco} alt='ico-aside' /></div>
            :
            null
    };


    return (
        <aside
            className='fixed w-[400px] h-full top-0 left-[1200] z-[100] shadow-[1px_10px_20px_7px_#00000094] bg-white flex justify-center items-center transition duration-300 ease-in-out hover:scale-105'
            style={styleInit}
            ref={refElement}
            onMouseEnter={handdlerOnMouseEnter}
            onMouseLeave={handdlerOnMouseLeave}
        >
            <div className='absolute w-[120%] h-[80%] bg-[#db6b36] rounded-[30px] shadow-[1px_10px_20px_7px_#00000094] p-[.4rem]'
                style={{
                    height: '25%',
                    top: seletColor(eyelash).position,
                    backgroundColor: seletColor(eyelash).color,
                }}
            >
                <div className='w-full h-full flex justify-between items-center '>
                    <div className='flex gap-[0.5rem] flex flex-col justify-center items-center'>
                        {returnImage()}
                        <h2 className='text-white [writing-mode:vertical-rl] [text-orientation:mixed] whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(16px, 3vw, 24px)] '>{title}</h2>
                    </div>
                    <div className='flex gap-[0.5rem] flex flex-col justify-center items-center'>
                        {returnImage()}
                        <h2 className='text-white [writing-mode:sideways-lr] [text-orientation:mixed] whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(16px, 3vw, 24px)]'>{title}</h2>

                    </div>
                </div>
            </div>

            <div className='w-full h-full bg-white z-[200] flex justify-center items-center p-[40px_0px_30px_0] '>
                <div className='w-full h-full overflow-y-scroll flex justify-center items-center'>
                    {children}
                </div>
            </div>
        </aside >
    );
}