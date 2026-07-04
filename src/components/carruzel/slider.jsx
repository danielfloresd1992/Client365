'use client';
import { memo, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import changeHostNameForImg from '@/libs/script/changeHostName';
import Image from 'next/image';

import { useInView } from 'react-intersection-observer';
import useImageViewer from '@/hook/useImageViewer';


const DynamicSlider = dynamic(
    () => import('react-slick').then((mod) => mod.default),
    { ssr: false } // 👈 Desactiva SSR para el carrusel
);


// Altura uniforme de cada slide (evita repetir la clase en varios lugares)
const SLIDE_HEIGHT = 'h-[55vw] md:h-[500px] min-h-[200px] max-h-[500px]';


const CustomArrow = ({ onClick, direction }) => {

    const isPrev = direction === 'prev';

    const styles = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: isPrev ? 0 : 'unset',
        right: isPrev ? 'unset' : 0,
        zIndex: 100,
        margin: 'auto',
        width: '40px',
        height: '40px',
        backgroundColor: '#81818199',
        color: '#fff',
        borderRadius: '50%',
        cursor: 'pointer'
    };

    return (
        <button
            type='button'
            onClick={onClick}
            aria-label={isPrev ? 'Imagen anterior' : 'Imagen siguiente'}
            className={`flex justify-center items-center custom-arrow ${direction}`}
            style={styles}
        >
            {
                isPrev
                    ? <Image src='/prev.png' alt='' width={15} height={15} />
                    : <Image src='/next.png' alt='' width={20} height={20} />
            }
        </button>
    );
};




export default memo(function MemoizedSlide({ imageShare, video, imageGroup, isDrag }) {

    const { ref, inView } = useInView();
    const { open: openImageViewer } = useImageViewer();
    const videoRef = useRef(null);

    const hasGroup = Array.isArray(imageGroup) && imageGroup.length > 1;
    const hasArrows = !!video || hasGroup;

    // URLs ya resueltas: no recalcular changeHostNameForImg en cada render / click
    const shareUrl = useMemo(
        () => (imageShare ? changeHostNameForImg(imageShare) : null),
        [imageShare]
    );
    const groupUrls = useMemo(
        () => (Array.isArray(imageGroup) ? imageGroup.map(img => changeHostNameForImg(img.url)) : []),
        [imageGroup]
    );
    // Colección para el visor de imágenes (principal + grupo)
    const viewerImages = useMemo(
        () => [shareUrl, ...groupUrls].filter(Boolean),
        [shareUrl, groupUrls]
    );

    // Pausa el video cuando el slide sale de la pantalla (ahorra CPU/batería)
    useEffect(() => {
        const el = videoRef.current;
        if (el && !inView) el.pause();
    }, [inView]);


    const setting = {
        className: 'center',
        centerMode: false,
        infinite: true,
        centerPadding: '0',
        slidesToShow: 1,
        speed: 800,
        adaptiveHeight: true,
        prevArrow: hasArrows ? <CustomArrow direction='prev' /> : null,
        nextArrow: hasArrows ? <CustomArrow direction='next' /> : null,
        // El autoplay atropellaría al video: solo se activa si NO hay video
        autoplay: inView && !video,
        autoplaySpeed: 4000,
        pauseOnHover: true
    };


    // Se arma el arreglo de slides y se filtran los nulos para no dejar slides vacíos en slick
    const slides = [];

    if (shareUrl) {
        slides.push(
            <img
                key='share'
                className={`${SLIDE_HEIGHT} object-contain cursor-pointer`}
                src={shareUrl}
                alt='Imagen principal de la novedad'
                loading='lazy'
                decoding='async'
                onClick={() => openImageViewer({ images: viewerImages, index: 0 })}
            />
        );
    }

    if (video) {
        slides.push(
            <video
                key='video'
                ref={videoRef}
                className={`${SLIDE_HEIGHT} w-full`}
                src={changeHostNameForImg(video)}
                poster={shareUrl || undefined}
                controls
                playsInline
                preload='metadata'
            />
        );
    }

    if (hasGroup) {
        slides.push(
            <div key='group' className={`${SLIDE_HEIGHT} w-full overflow-hidden`}>
                <div className='w-full h-full grid grid-cols-2 auto-rows-fr gap-[2px]'>
                    {
                        imageGroup.map((img, index) => (
                            <div className='relative w-full h-full overflow-hidden' key={img.url || index}>
                                <img
                                    className='h-full w-full object-cover cursor-pointer'
                                    src={groupUrls[index]}
                                    alt={img.caption || 'Imagen de la novedad'}
                                    loading='lazy'
                                    decoding='async'
                                    onClick={() => openImageViewer({ images: viewerImages, index: (shareUrl ? 1 : 0) + index })}
                                />
                                {
                                    img.caption ?
                                        <div
                                            className='bottom-[0] left-[0] absolute p-[.1rem_1rem] flex justify-center items-center'
                                            style={{ backgroundColor: '#43c700a6', border: '2px solid #fff' }}
                                        >
                                            <p style={{ color: '#fff', fontSize: '.9rem' }}>{img.caption}</p>
                                        </div>
                                        : null
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }


    return (
        <div className={`${SLIDE_HEIGHT} relative bg-black`} ref={ref}>
            <DynamicSlider {...setting}>
                {slides}
            </DynamicSlider>
        </div>
    );
});
