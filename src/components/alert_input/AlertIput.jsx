'use client';
import { useRef } from 'react';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';



export default function AlertInputLive() {


    const containerRef = useRef(null);



    return (
        <div
            className='absolute left-0 bottom-0 overflow-x-hidden h-[30px] h-[70vh] z-[1000]'
            onMouseEnter={() => {
                if (containerRef.current) {
                    containerRef.current.classList.remove('h-[30px]');
                    containerRef.current.classList.add('h-[70vh]');
                }
            }}
            onMouseLeave={() => {
                if (containerRef.current) {
                    containerRef.current.classList.remove('h-[70vh]');
                    containerRef.current.classList.add('h-[30px]');
                }
            }}
            ref={containerRef}
        >
            <div
                style={{
                    width: '570px',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}
            >

                <ContainForm />
                <BannerConfigAlert />
            </div>
        </div>
    );
}