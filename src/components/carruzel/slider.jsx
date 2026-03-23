'use client';
import { memo } from 'react';
import dynamic from 'next/dynamic';
import changeHostNameForImg from '@/libs/script/changeHostName';
import Image from 'next/image';

import { useInView } from 'react-intersection-observer';
import useImageViewer from '@/hook/useImageViewer';


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

    const { ref, inView } = useInView();
    const { open: openImageViewer } = useImageViewer();



    const setting = {
        className: "center",
        centerMode: false,
        infinite: true,
        centerPadding: "0",
        slidesToShow: 1,
        speed: 800,
        adaptiveHeight: true,
        prevArrow: video || imageGroup?.length > 1 ? <CustomArrow direction='prev' /> : null,
        nextArrow: video || imageGroup?.length > 1 ? <CustomArrow direction='next' /> : null,
        autoplay: inView,    // Activa el movimiento automático
        autoplaySpeed: 4000, // Tiempo entre slides (3 segundos)
        pauseOnHover: true
    }



    return (
        <div
            className='h-[55vw] md:h-[500px] min-h-[200px] max-h-[500px] relative bg-black'
            ref={ref}
        >
            <DynamicSlider {...setting}>
                <img
                    className='h-[55vw] md:h-[500px] min-h-[200px] max-h-[500px] object-contain cursor-pointer'
                    src={changeHostNameForImg(imageShare)}
                    alt='share-image'
                    onClick={() => {
                        const allImgs = [changeHostNameForImg(imageShare)];
                        if (Array.isArray(imageGroup)) imageGroup.forEach(img => allImgs.push(changeHostNameForImg(img.url)));
                        openImageViewer({ images: allImgs, index: 0 });
                    }}
                />
                {
                    video ?
                        <video className='h-[55vw] md:h-[500px] min-h-[200px] max-h-[500px] w-full' controls>
                            <source src={changeHostNameForImg(video)} autoPlay={true} loop={true} type="video/mp4" />
                        </video>
                        : null
                }
                {
                    Array.isArray(imageGroup) && imageGroup.length > 1 ?
                        <div className='h-[55vw] md:h-[500px] min-h-[200px] max-h-[500px] w-full'>
                            <div className='w-full h-full flex flex-wrap direction-row justify-center items-center'>
                                {
                                    imageGroup.map((img, index) => (
                                        <div className='h-[50%] w-[50%] relative' key={`${img.caption}-${index}`}>

                                            <img
                                                className='h-full w-full object-cover cursor-pointer'
                                                src={changeHostNameForImg(img.url)}
                                                key={index}
                                                alt='novelty-sequence'
                                                onClick={() => {
                                                    const allImgs = [changeHostNameForImg(imageShare)];
                                                    imageGroup.forEach(g => allImgs.push(changeHostNameForImg(g.url)));
                                                    openImageViewer({ images: allImgs, index: index + 1 });
                                                }}
                                            />
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