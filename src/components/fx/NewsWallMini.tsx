'use client';
import { useEffect, useState } from 'react';
import type { Post } from '@/types/newsWall';

/**
 * NewsWallMini — Representación pequeña y "en vivo" del muro de novedades
 * (feed tipo Publications/Noveltie): tarjetas con avatar, nombre, hora, texto,
 * imagen y reacciones, en scroll continuo. Pensado como fondo difuminado.
 * Real-time: las marcas de tiempo avanzan vía estado de React.
 */

const POSTS: Post[] = [
    { user: 'Sucursal Centro', initials: 'SC', color: '#29c50c', tag: 'Operación', text: 'Reporte de turno cerrado sin incidencias.', img: true, up: 12, down: 0, min: 2 },
    { user: 'María G.', initials: 'MG', color: '#d9a441', tag: 'Inventario', text: 'Inventario actualizado · faltante detectado en bodega.', img: false, up: 8, down: 1, min: 6 },
    { user: 'Auditoría 365', initials: 'AU', color: '#b5763b', tag: 'Calidad', text: 'Checklist de calidad completado al 94%.', img: true, up: 20, down: 0, min: 11 },
    { user: 'Soporte 365', initials: 'S3', color: '#2fb00d', tag: 'Alertas', text: 'Alerta crítica resuelta en 3 minutos.', img: false, up: 15, down: 0, min: 18 },
    { user: 'Gerencia', initials: 'GE', color: '#7bbf2a', tag: 'Metas', text: 'Meta semanal de servicio alcanzada.', img: true, up: 31, down: 2, min: 27 },
];

function Thumb({ up }: { up?: boolean }) {
    return (
        <svg viewBox='0 0 24 24' className='w-2.5 h-2.5' fill='currentColor' style={up ? undefined : { transform: 'rotate(180deg)' }}>
            <path d='M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z' />
        </svg>
    );
}

export default function NewsWallMini({ className = '' }: { className?: string }) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 5000);
        return () => clearInterval(id);
    }, []);

    const cards = POSTS.map((p, i) => (
        <div key={i} className='rounded-lg border border-[#e6dcc6] bg-[#fbf6ea] p-2.5 shadow-sm'>
            <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0' style={{ background: p.color }}>{p.initials}</div>
                <div className='flex-1 min-w-0'>
                    <p className='text-[10px] font-semibold text-slate-600 truncate leading-none'>{p.user}</p>
                    <p className='text-[8px] text-slate-400 mt-0.5'>hace {p.min + tick} min</p>
                </div>
                <span className='text-[8px] font-semibold px-1.5 py-0.5 rounded-full' style={{ color: p.color, background: `${p.color}1a` }}>{p.tag}</span>
            </div>
            <p className='mt-1.5 text-[9px] text-slate-500 leading-snug'>{p.text}</p>
            {p.img && <div className='mt-1.5 h-12 rounded-md bg-gradient-to-br from-[#eadfca] to-[#dccba2] border border-[#e6dcc6]' />}
            <div className='mt-1.5 flex items-center gap-3 text-[8px] text-slate-400'>
                <span className='inline-flex items-center gap-0.5 text-[#29c50c]'><Thumb up /> {p.up}</span>
                <span className='inline-flex items-center gap-0.5 text-[#b5763b]'><Thumb /> {p.down}</span>
            </div>
        </div>
    ));

    return (
        <div className={className} aria-hidden='true'>
            <div className='ldnews-track'>
                {cards}
                {cards}
            </div>
            <style>{`
                .ldnews-track{ display:flex; flex-direction:column; gap:8px; padding:10px; will-change:transform; animation:ldnews-scroll 26s linear infinite; }
                @keyframes ldnews-scroll{ from{ transform:translateY(0); } to{ transform:translateY(-50%); } }
                @media (prefers-reduced-motion: reduce){ .ldnews-track{ animation:none; } }
            `}</style>
        </div>
    );
}
