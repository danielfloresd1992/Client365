'use client';
import { useEffect, useRef } from 'react';
import { CartPresentationProps } from '@/types/layauts';



const styleContentCar: React.CSSProperties = {
    width: '250px',
    height: '300px',
    backgroundColor: '#2d2c2c',
    borderRadius: '5px',
    overflow: 'hidden',
    borderBottom: '5px solid #1f4e77'
}

const styleContentItemImg: React.CSSProperties = {
    height: '90px',
    width: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative'

}

const styleItemImg: React.CSSProperties = {
    width: '70%'
}



export default function CardPresentation({ urlImg, title, description }: CartPresentationProps): React.ReactNode {


    const elelentRef = useRef<any>();


    useEffect(() => {

        //    classStyleName.current = 'rotar';
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.5, 1.0]
        }

        let observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(elelentRef.current);

    }, []);


    const handleIntersect = (entries: any): void => {
        entries.forEach((enrtrie: any) => {
            if(enrtrie.intersectionRatio === 1){
                elelentRef.current.classList.remove('pre-rotar');
                elelentRef.current.classList.add('rotar');
            }
            else{
               
            }
        });
    }




    return (
        <div className='pre-rotar' ref={ elelentRef } style={styleContentCar}>
            <div className='flex w-full h-[50%] flex-col items-center justify-center'>
                <div style={styleContentItemImg}>
                    <img style={styleItemImg} src={urlImg} />
                </div>
                <h1 className='text-white font-bold'>{title}</h1>
            </div>
            <div className='w-full  h-[50%] flex-col items-center justify-center p-2' style={{ background: 'rgb(197 197 197)' }}>
                <p className='text-center leading-tight'>{description}</p>
            </div>
        </div>
    )
}