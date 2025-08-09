'use client';
import { useState, useRef, ReactNode, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';



type T_Alert = {
    title: string
    description: string,
    id: string
}




type Prop = {
    position: 'l' | 'r' | undefined
    title: string,
    urlIco: string | undefined | null
    eyelash: 0 | 1 | 2 | 3
    open: true | undefined
    children: ReactNode | ((addAlert: any) => ReactNode);
    scrollY: Boolean,
    isDrag: boolean,
}




export default function Aside_Eyelash({ position, title, urlIco, eyelash, open, scrollY, children, isDrag = false }: Prop) {


    const [alertState, setAlertState] = useState<T_Alert[]>([]);


    const styleInit: any = {};
    const refElement = useRef<HTMLDivElement>(null);
    const elementContentChildren = useRef<HTMLDivElement>(null);


    if (position === 'r' || position === undefined) {
        styleInit.right = '0';
        styleInit.transform = 'translateX(100%)';
    }
    if (position === 'l') {
        styleInit.left = '0';
        styleInit.transform = 'translateX(-100%)';
    }

    if (open) {
        styleInit.transform = 'translateX(0)';
        styleInit.zIndex = 101
    }





    useEffect(() => {

        if (!refElement.current) return;



        //event hover
        const handdlerMouseenter = (e: MouseEvent) => {
            e.preventDefault();
            if (!open) openAside();
        };

        const handdlerMouseleave = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setAlertState([]);
            if (!open) closeAside();
        };

        refElement.current.addEventListener('mouseenter', handdlerMouseenter);
        refElement.current.addEventListener('mouseleave', handdlerMouseleave);




        //event drag and drop for file
        const handdlerMouseDown = (e: MouseEvent) => {

        };

        const handdlerDragEnter = (e: MouseEvent) => {
            e.preventDefault();
            openAside();
        };

        const handdlerDragover = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handdlerLeave = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (refElement.current && !refElement.current.contains(e.target as Node)) {
                closeAside();
            }
        };

        const handdlerDrop = (e: MouseEvent) => {
            e.preventDefault();
        };

        isDrag && refElement.current.addEventListener('mousedown', handdlerMouseDown);

        isDrag && refElement.current.addEventListener('dragenter', handdlerDragEnter);

        isDrag && refElement.current.addEventListener('dragover', handdlerDragover);

        isDrag && document.addEventListener('dragleave', handdlerLeave);

        isDrag && refElement.current.addEventListener('drop', handdlerDrop);



        return () => {
            //remove event open aside for hover
            refElement.current?.removeEventListener('mouseenter', handdlerMouseenter);
            refElement.current?.removeEventListener('mouseleave', handdlerMouseleave);

            //remove event open aside for drag and drop
            isDrag && refElement.current?.removeEventListener('mousedown', handdlerMouseDown);

            isDrag && refElement.current?.removeEventListener('dragenter', handdlerDragEnter);

            isDrag && refElement.current?.removeEventListener('dragover', handdlerDragover);

            isDrag && document?.removeEventListener('dragleave', handdlerLeave);

            isDrag && refElement.current?.removeEventListener('drop', handdlerDrop);
        }
    }, [open, alertState.length]);





    useEffect(() => {
        if (elementContentChildren.current) {
            if (scrollY) elementContentChildren.current.classList.add('scrolltheme1');
            elementContentChildren.current.style.overflowX = 'hidden';
        }
    }, []);




    const addAlert = (alert: T_Alert): void => {
        setAlertState(prev => [...prev, { ...alert, id: uuidv4() }]);
    };





    const seletColor = (colorSelect: number): { color: string, position: `${number}%` } => {
        if (colorSelect === 0) return { color: '#db6b36', position: '0%' }
        if (colorSelect === 1) return { color: '#2ad424ff', position: '25%' }
        if (colorSelect === 2) return { color: '#810ac5ff', position: '50%' }
        if (colorSelect === 3) return { color: '#c50a0aff', position: '75%' }
        return { color: '#6e6e6eff', position: '0%' }
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



    const openAside = (): void => {
        if (refElement.current) {
            refElement.current.style.transform = 'translateX(0%)';
            refElement.current.style.zIndex = '101';
        }
    };



    const closeAside = (): void => {
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




    const printNotifications = useCallback(() => {
        return (
            <div className='w-full h-full  absolute flex items-start justify-between top-[10px] p-[0.2rem]'>
                {
                    alertState.map((item, count) => (
                        <>
                            <div className='relative'>
                                <div className='w-[20px] h-[20px] bg-[#ff0000;] border border-solid border-red-500 flex justify-center items-center rounded-[50%] wobble-hor-top'>
                                    <div className='wobble-hor-bottom' style={{
                                        filter: 'invert(1)',
                                    }}>
                                        <Image src={'/ico/icons8-campana-25.png'} width={15} height={15} alt='ico-alert' />
                                    </div>

                                </div>
                                <b className='absolute top-[10px] right-[-5px] text-white'>{count + 1}</b>
                            </div>

                            <div className='relative'>
                                <div className='w-[20px] h-[20px] bg-[#ff0000] flex justify-center items-center rounded-[50%] wobble-hor-top'>
                                    <div style={{
                                        filter: 'invert(1)',
                                    }}>
                                        <Image src={'/ico/icons8-campana-25.png'} width={18} height={18} alt='ico-alert' />
                                    </div>

                                </div>
                                <b className='absolute top-[6px] right-[-3px] text-white'>{count + 1}</b>
                            </div>
                        </>
                    ))
                }
            </div>
        );
    }, [alertState]);




    return (
        <aside
            className='fixed w-[400px] h-full top-0 left-[1200] z-[100] shadow-[1px_10px_20px_7px_#00000094] bg-white flex justify-center items-center transition duration-300 ease-in-out hover:scale-105'
            style={styleInit}
            ref={refElement}
        >
            <div className='absolute w-[120%] h-[80%] bg-[#db6b36] rounded-[30px] shadow-[1px_10px_20px_7px_#00000094] p-[.4rem]'
                style={{
                    height: '25%',
                    top: seletColor(eyelash).position,
                    backgroundColor: seletColor(eyelash).color,
                }}
            >
                <div className='relative w-full h-full flex justify-between items-center '>

                    <div className='flex gap-[0.5rem] flex flex-col justify-center items-center'>
                        {returnImage()}
                        <h2 className='text-white [writing-mode:vertical-rl] [text-orientation:mixed] whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(16px, 3vw, 24px)] '>{title}</h2>
                    </div>

                    {printNotifications()}

                    <div className='flex gap-[0.5rem] flex flex-col justify-center items-center'>
                        {returnImage()}
                        <h2 className='text-white [writing-mode:sideways-lr] [text-orientation:mixed] whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(16px, 3vw, 24px)]'>{title}</h2>
                    </div>

                </div>
            </div>

            <div className='w-full h-full bg-white z-[200] flex justify-center items-center p-[40px_0px_30px_0] '>
                <div className='w-full h-full flex justify-center items-center'
                    ref={elementContentChildren}
                >
                    {typeof children === 'function' ? children({ addAlert, openAside }) : children}
                </div>
            </div>
        </aside >
    );
}