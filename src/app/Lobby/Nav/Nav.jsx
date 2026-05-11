'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import ListClient from './ListClient.jsx';
import LiItemGrey from '@/components/ListItem/LiItemGray.jsx';


export default function Nav() {
    const [open, setOpen] = useState(false);
    const navRef = useRef(null);
    const touchStart = useRef(null);
    const touchCurrent = useRef(null);
    const dragging = useRef(false);

    const SWIPE_THRESHOLD = 60;

    const close = useCallback(() => setOpen(false), []);

    // Close on route change (back button, link click, etc.)
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, close]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // --- Swipe to open: detect left-swipe from right edge ---
    useEffect(() => {
        const handleTouchStart = (e) => {
            const x = e.touches[0].clientX;
            if (x > window.innerWidth - 30 && !open) {
                touchStart.current = { x, y: e.touches[0].clientY };
            }
        };
        const handleTouchMove = (e) => {
            if (!touchStart.current || open) return;
            const dx = touchStart.current.x - e.touches[0].clientX;
            const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
            if (dx > SWIPE_THRESHOLD && dy < dx) {
                setOpen(true);
                touchStart.current = null;
            }
        };
        const handleTouchEnd = () => {
            touchStart.current = null;
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [open]);

    // --- Swipe to close: detect right-swipe on the nav panel ---
    const onNavTouchStart = (e) => {
        touchCurrent.current = e.touches[0].clientX;
        dragging.current = true;
    };
    const onNavTouchMove = (e) => {
        if (!dragging.current) return;
        const dx = e.touches[0].clientX - touchCurrent.current;
        if (dx > SWIPE_THRESHOLD) {
            close();
            dragging.current = false;
        }
    };
    const onNavTouchEnd = () => {
        dragging.current = false;
    };

    return (
        <>
            {/* Hamburger button — only visible on mobile */}
            <button
                className='nav-hamburger'
                onClick={() => setOpen(true)}
                aria-label='Abrir menú'
            >
                <span className='nav-hamburger__line' />
                <span className='nav-hamburger__line' />
                <span className='nav-hamburger__line' />
            </button>

            {/* Overlay */}
            <div
                className={`nav-overlay${open ? ' nav-overlay--visible' : ''}`}
                onClick={close}
            />

            {/* Sidebar nav */}
            <nav
                ref={navRef}
                className={`listRoute border10 rounded-sm overflow-hidden${open ? ' open-aside-bar' : ''}`}
                onTouchStart={onNavTouchStart}
                onTouchMove={onNavTouchMove}
                onTouchEnd={onNavTouchEnd}
            >
                {/* Close button inside sidebar — mobile only */}
                <button className='nav-close-btn' onClick={close} aria-label='Cerrar menú'>
                    ✕
                </button>

                <div className='aside-contents'>
                    <div className='listRoute-a-menuTitle'>
                        <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                            <div className='lobby-title-icon'>
                                <Image width={20} height={20} alt='ico-cubo' src='/img/cubo-50.png' />
                            </div>
                            <p className='usersContain-title lobby-title-text'>Centro de operaciones</p>
                        </div>
                        <ul className='listRoute-a-menuTitle scrolltheme1'>
                            <LiItemGrey urlImage='/img/aceptar-la-base-de-datos-30.png' textTitle='Corte por hora' urlLink='/Corte365' />
                            <LiItemGrey urlImage='/img/corporate-67.png' textTitle='Gestión de clientes' urlLink='/clients&manasgement' />
                            <LiItemGrey urlImage='/img/carta-50.png' textTitle='Gestión de alertas' urlLink='/alertmanasgement' />
                            <LiItemGrey urlImage='/img/analistica-web-48.png' textTitle='Panel analítico' urlLink='/#' />
                            <LiItemGrey urlImage='/ico/icons8-grupo-de-usuario-24.png' textTitle='Gestión del personal' urlLink='/user' />
                        </ul>
                    </div>
                </div>
                <div className='aside-contents'>
                    <div className='listRoute-a-menuTitle'>
                        <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                            <div className='lobby-title-icon'>
                                <Image width={20} height={20} alt='ico-global' src='/img/grupos-de-usuarios-50.png' />
                            </div>
                            <p className='usersContain-title lobby-title-text'>Clientes activos</p>
                        </div>

                        <ListClient />
                    </div>
                </div>
            </nav>
        </>
    );
}
