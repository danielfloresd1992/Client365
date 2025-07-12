'use client';
import { memo } from 'react';
import dynamic from 'next/dynamic';
import changeHostNameForImg from '@/libs/changeHostName';
import Image from 'next/image';



const DynamicSlider = dynamic(
    () => import('react-slick').then((mod) => mod.default),
    { ssr: false } // 👈 Desactiva SSR para el carrusel
);



const CustomArrow = ({ onClick, direction }) => {
    const styles = {
        left: direction === "prev" ? 0 : 'unset',
        right: direction !== "prev" ? 0 : 'unset',
        position: 'absolute',
        top: '0',
        bottom: '0',
        zIndex: '100',
        margin: 'auto',
        width: '40px',
        height: '40px',
        backgroundColor: '#81818199',
        top: 0,
        bottom: 0,
        color: '#fff',
        borderRadius: '50%',
        cursor: 'pointer'
    }


    return (
        <button
            onClick={onClick}
            className={`flex justify-center items-center custom-arrow ${direction}`}
            style={styles}
        >
            {
                direction === "prev" ? 
                <Image src='/prev.png' alt='prev-ico' width={15} height={15} />
                : 
                <Image src='/next.png' alt='prev-ico' width={20} height={20} />
            }
        </button>
    )
}





export default memo(function MemoizedSlide({ imageShare, video, imageGroup, isDrag }) {



    const setting = {
        className: "center",
        centerMode: false,
        infinite: true,
        centerPadding: "0",
        slidesToShow: 1,
        speed: 500,
        adaptiveHeight: true,
        prevArrow: <CustomArrow direction='prev' />,
        nextArrow: <CustomArrow direction='next' />,
        autoplay: true,    // Activa el movimiento automático
        autoplaySpeed: 3000, // Tiempo entre slides (3 segundos)
        pauseOnHover: true
    }



    return (
        <div className='h-[500px] relative bg-black'>
            <DynamicSlider {...setting}>
                <img className='h-[500px] object-contain' src={changeHostNameForImg(imageShare)} alt='share-image' />
                {
                    video ?
                        <video className='h-[500px]' controls>
                            <source src={changeHostNameForImg(video)} autoPlay={true} loop={true} type="video/mp4" />
                        </video>
                        : null
                }
                {
                    Array.isArray(imageGroup) && imageGroup.length > 0 ?
                        <div className='h-[500px] w-full'>
                            <div className='w-full h-full flex flex-wrap direction-row justify-center items-center'>
                                {
                                    imageGroup.map((img, index) => (
                                        <div className='h-[50%] w-[50%] relative' key={`${img.caption}-${index}`}>
                                            
                                            <img className='h-full w-full' src={changeHostNameForImg(img.url)} key={index} alt='novelty-sequence' />
                                            <div className='bottom-[0] left-[0] absolute p-[.1rem_1rem] flex justify-center items-center'
                                                style={{
                                                    backgroundColor: '#43c700a6',
                                                    border: '2px solid #fff'
                                                }}
                                            >
                                                <p className='color-white' style={{ color: '#fff', fontSize: '.9rem' }}>
                                                    {img.caption}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                        </div>
                        : null
                }
            </DynamicSlider>
        </div>
    );
})