'use client';
import { memo, useRef, useEffect, useMemo, useState } from 'react';
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


/*
 * Reproductor de video de la novedad — a medida:
 *   · Se reproduce SOLO y en LOOP mientras el slide esté activo y a la vista
 *     (arranca silenciado, que es lo único que permite autoplay el navegador).
 *   · Pausa al salir de vista o al cambiar de slide (ahorra CPU/batería).
 *   · Controles propios: play/pausa al tocar, botón de sonido y barra de
 *     progreso arrastrable — más limpio que los `controls` nativos.
 */
function NoveltyVideo({ src, poster, active }) {

    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    // Reproduce/pausa según el slide esté activo y visible
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (active) el.play().catch(() => { /* autoplay bloqueado: se ignora */ });
        else el.pause();
    }, [active]);

    const togglePlay = () => {
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) el.play().catch(() => {}); else el.pause();
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const el = videoRef.current;
        if (!el) return;
        el.muted = !el.muted;
        setMuted(el.muted);
    };

    const onTimeUpdate = () => {
        const el = videoRef.current;
        if (el && el.duration) setProgress((el.currentTime / el.duration) * 100);
    };

    const seek = (e) => {
        e.stopPropagation();
        const el = videoRef.current;
        if (!el || !el.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        el.currentTime = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * el.duration;
    };

    return (
        <div className={`${SLIDE_HEIGHT} relative w-full bg-black select-none group/vid`} onClick={togglePlay}>
            <video
                ref={videoRef}
                className='w-full h-full object-contain'
                src={src}
                poster={poster}
                muted={muted}
                loop
                playsInline
                preload='metadata'
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
            />

            {/* Botón central play (aparece al pausar) */}
            {!playing && (
                <span className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <span className='w-16 h-16 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#fff' className='w-7 h-7 ml-1'>
                            <polygon points='6 3 20 12 6 21 6 3' />
                        </svg>
                    </span>
                </span>
            )}

            {/* Barra de controles inferior */}
            <div className='absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/60 to-transparent'>
                <div className='flex items-center gap-2.5'>
                    <button
                        type='button'
                        onClick={toggleMute}
                        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                        title={muted ? 'Activar sonido' : 'Silenciar'}
                        className='w-8 h-8 shrink-0 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors'
                    >
                        {muted ? (
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                                <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
                                <line x1='22' y1='9' x2='16' y2='15' />
                                <line x1='16' y1='9' x2='22' y2='15' />
                            </svg>
                        ) : (
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                                <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
                                <path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
                                <path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
                            </svg>
                        )}
                    </button>
                    <div className='flex-1 h-1.5 rounded-full bg-white/25 cursor-pointer overflow-hidden' onClick={seek}>
                        <div className='h-full rounded-full bg-[#29c50c]' style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}




export default memo(function MemoizedSlide({ imageShare, video, imageGroup, isDrag }) {

    const { ref, inView } = useInView();
    const { open: openImageViewer } = useImageViewer();
    // Slide actual (para saber si el video está a la vista dentro del carrusel)
    const [current, setCurrent] = useState(0);

    const hasGroup = Array.isArray(imageGroup) && imageGroup.length > 1;
    const hasArrows = !!video || hasGroup;

    // URLs ya resueltas: no recalcular changeHostNameForImg en cada render / click
    const shareUrl = useMemo(
        () => (imageShare ? changeHostNameForImg(imageShare) : null),
        [imageShare]
    );
    const videoUrl = useMemo(
        () => (video ? changeHostNameForImg(video) : null),
        [video]
    );
    const groupUrls = useMemo(
        () => (Array.isArray(imageGroup) ? imageGroup.map(img => changeHostNameForImg(img.url)) : []),
        [imageGroup]
    );
    // Colección para el visor de imágenes (principal + grupo; el video no entra)
    const viewerImages = useMemo(
        () => [shareUrl, ...groupUrls].filter(Boolean),
        [shareUrl, groupUrls]
    );


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
        // El autoplay del carrusel atropellaría al video: solo si NO hay video
        autoplay: inView && !video,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        beforeChange: (_old, next) => setCurrent(next),
    };


    // Se arma el arreglo de slides. Si HAY VIDEO, va PRIMERO (principal); si no,
    // la imagen principal encabeza. Se filtran nulos para no dejar slides vacíos.
    const slides = [];

    if (videoUrl) {
        // El video es el slide 0 → activo cuando el carrusel está a la vista y es el actual
        slides.push(
            <NoveltyVideo
                key='video'
                src={videoUrl}
                poster={shareUrl || undefined}
                active={inView && current === 0}
            />
        );
    }

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