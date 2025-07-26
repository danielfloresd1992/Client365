'use client';
import { useState, useEffect, useRef } from 'react'


type Prop = {
    position: 'l' | 'r' | undefined
}


export default function AsideAlertCount({ position }: Prop) {

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




    useEffect(() => {

    }, []);




    const handdlerOnMouseEnter = () => {
        if (refElement.current) refElement.current.style.transform = 'translateX(0%)';
    };



    const handdlerOnMouseLeave = () => {
        if (refElement.current) {
            if (position === 'r') {
                refElement.current.style.transform = 'translateX(100%)';
            }
            else {

                refElement.current.style.transform = 'translateX(-100%)';
            }
        }
    };




    return (
        <aside
            className='fixed w-[370px] h-full top-0 left-[1200] p-[40px_0px_30px_0] z-[100] shadow-[1px_10px_20px_7px_#00000094] bg-white flex justify-center items-center transition duration-300 ease-in-out hover:scale-105'
            style={styleInit}
            ref={refElement}
            onMouseEnter={handdlerOnMouseEnter}
            onMouseLeave={handdlerOnMouseLeave}
        >

            <div className='absolute w-[120%] h-[80%] bg-[#db6b36] rounded-[50px] shadow-[1px_10px_20px_7px_#00000094]'>
                <div className='w-full h-full flex justify-between items-center'>
                    <div>
                        <h2 className='text-white [writing-mode:vertical-rl] [text-orientation:mixed] text-lg'>Reportes de alertas</h2>
                    </div>
                    <div>
                        <h2 className='text-white [writing-mode:sideways-lr] [text-orientation:mixed] text-lg'>Reportes de alertas</h2>
                    </div>
                </div>
            </div>
            <div className='w-full h-full bg-white z-[200] overflow-y-scroll flex justify-center items-center'>
                <h1>coming soon...</h1>
            </div>
        </aside >
    )
}