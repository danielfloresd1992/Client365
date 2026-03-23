'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeViewer, setViewerIndex } from '@/store/slices/imageViewer';
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiRotateCw } from 'react-icons/fi';

export default function ImageViewer() {
    const dispatch = useDispatch();
    const { isOpen, src, alt, images, currentIndex } = useSelector(state => state.imageViewer);

    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const hasMultiple = images.length > 1;
    const currentSrc = images[currentIndex] || src;

    // Reset transform on image change
    useEffect(() => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    }, [currentIndex, isOpen]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Keyboard controls
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === 'Escape') dispatch(closeViewer());
            if (e.key === 'ArrowLeft' && hasMultiple) dispatch(setViewerIndex(Math.max(0, currentIndex - 1)));
            if (e.key === 'ArrowRight' && hasMultiple) dispatch(setViewerIndex(Math.min(images.length - 1, currentIndex + 1)));
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(5, z + 0.25));
            if (e.key === '-') setZoom(z => Math.max(0.25, z - 0.25));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, currentIndex, hasMultiple, images.length, dispatch]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        setZoom(z => {
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            return Math.min(5, Math.max(0.25, z + delta));
        });
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) dispatch(closeViewer());
    };

    const handleMouseDown = (e) => {
        if (zoom <= 1) return;
        setDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setDragging(false);

    const handleTouchStart = (e) => {
        if (zoom <= 1) return;
        const touch = e.touches[0];
        setDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    };

    if (!isOpen) return null;

    return (
        <div
            className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm'
            onClick={handleBackdropClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Top bar */}
            <div className='absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10'>
                <div className='flex items-center gap-2 text-white/70 text-sm'>
                    {hasMultiple && (
                        <span className='bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium'>
                            {currentIndex + 1} / {images.length}
                        </span>
                    )}
                    {alt && <span className='truncate max-w-[200px]'>{alt}</span>}
                </div>
                <button
                    onClick={() => dispatch(closeViewer())}
                    className='w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors'
                >
                    <FiX className='w-5 h-5' />
                </button>
            </div>

            {/* Navigation arrows */}
            {hasMultiple && currentIndex > 0 && (
                <button
                    onClick={() => dispatch(setViewerIndex(currentIndex - 1))}
                    className='absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors'
                >
                    <FiChevronLeft className='w-6 h-6' />
                </button>
            )}
            {hasMultiple && currentIndex < images.length - 1 && (
                <button
                    onClick={() => dispatch(setViewerIndex(currentIndex + 1))}
                    className='absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors'
                >
                    <FiChevronRight className='w-6 h-6' />
                </button>
            )}

            {/* Image */}
            <img
                src={currentSrc}
                alt={alt || ''}
                draggable={false}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className='max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-150'
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                }}
            />

            {/* Bottom controls */}
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1.5'>
                <ControlBtn onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title='Alejar'>
                    <FiZoomOut className='w-4 h-4' />
                </ControlBtn>
                <span className='text-white/70 text-xs font-medium min-w-[40px] text-center'>
                    {Math.round(zoom * 100)}%
                </span>
                <ControlBtn onClick={() => setZoom(z => Math.min(5, z + 0.25))} title='Acercar'>
                    <FiZoomIn className='w-4 h-4' />
                </ControlBtn>
                <div className='w-px h-5 bg-white/20 mx-1' />
                <ControlBtn onClick={() => setRotation(r => r + 90)} title='Rotar'>
                    <FiRotateCw className='w-4 h-4' />
                </ControlBtn>
                <ControlBtn onClick={() => { setZoom(1); setRotation(0); setPosition({ x: 0, y: 0 }); }} title='Restablecer'>
                    <span className='text-[10px] font-bold'>1:1</span>
                </ControlBtn>
            </div>

            {/* Thumbnail strip */}
            {hasMultiple && (
                <div className='absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg p-1.5 max-w-[80vw] overflow-x-auto'>
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => dispatch(setViewerIndex(i))}
                            className={`w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                                i === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                            }`}
                        >
                            <img src={img} alt='' className='w-full h-full object-cover' />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ControlBtn({ onClick, children, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className='w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors'
        >
            {children}
        </button>
    );
}
