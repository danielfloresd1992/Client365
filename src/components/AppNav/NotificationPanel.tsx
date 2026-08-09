'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { StoreIcon } from '@/components/icons';

/*
 * NotificationPanel — el desplegable de la campana del AppDock.
 *
 * Va en posición fija junto al riel y no dentro de él: el dock mide 52px en
 * reposo y crece solo al pasar el mouse, así que un panel anidado quedaría
 * recortado por su `overflow-hidden`.
 *
 * Solo pinta. El estado, el socket y las lecturas viven en useNotifications.
 */

// Color del punto según la importancia que le dio la estrategia del backend.
const LEVEL_DOT: Record<string, string> = {
    success: 'bg-[#29c50c]',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
};

interface Notificacion {
    _id: string;
    level?: string;
    read?: boolean;
    createdAt?: string;
    scope?: string;
    actor?: { name?: string; surName?: string; img?: string | null };
    resource?: { name?: string; path?: string; img?: string | null; kind?: string };
    changes?: { label?: string; field?: string; from?: unknown; to?: unknown }[];
    target?: { name?: string; surName?: string };
    request?: {
        status?: 'none' | 'pending' | 'approved' | 'rejected';
        decidedBy?: { name?: string; surName?: string } | string | null;
        decidedAt?: string | null;
        note?: string;
    };
}


/**
 * Avatar de la notificación: el RECURSO manda, la persona es la insignia.
 *
 * En un aviso sobre un establecimiento lo que se reconoce de un vistazo es su
 * logo, no la foto de quien lo tocó. Por eso el logo va grande y el actor como
 * marca pequeña encima: se responde "qué" y "quién" sin leer una palabra.
 *
 * Sin logo —una franquicia, por ejemplo— se cae a un ícono según el tipo de
 * recurso, y solo si tampoco hay tipo se muestra al actor solo. Así las
 * notificaciones anteriores a este cambio, que no traen `resource.img`, siguen
 * viéndose bien.
 */
function ResourceAvatar({ n }: { n: Notificacion }) {
    const iniciales = (n.actor?.name?.[0] || '') + (n.actor?.surName?.[0] || '');
    const kind = n.resource?.kind || '';
    const tieneSujeto = Boolean(n.resource?.img) || Boolean(kind);

    // Sin recurso reconocible: el actor ocupa todo, como antes.
    if (!tieneSujeto) {
        return (
            <span className='w-9 h-9 rounded-full bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center'>
                {n.actor?.img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={n.actor.img} alt='' className='w-full h-full object-cover' />
                    : <span className='text-[11px] font-bold text-slate-500'>{iniciales}</span>}
            </span>
        );
    }

    return (
        <span className='relative w-9 h-9 shrink-0'>
            {/* Sujeto: cuadrado redondeado, no círculo — un logo no es una cara */}
            <span className='block w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-gray-200'>
                {n.resource?.img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={n.resource.img} alt='' className='w-full h-full object-cover' />
                    : kind === 'system'
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src='/logo-page-removebg.png' alt='' className='w-6 h-6 object-contain' />
                        : <StoreIcon size={17} />}
            </span>

            {/* Quién lo hizo: insignia sobre la esquina */}
            <span className='absolute -bottom-1 -right-1 w-[17px] h-[17px] rounded-full bg-slate-200 overflow-hidden flex items-center justify-center ring-2 ring-white'>
                {n.actor?.img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={n.actor.img} alt='' className='w-full h-full object-cover' />
                    : <span className='text-[8px] font-black text-slate-600 leading-none'>{iniciales || '·'}</span>}
            </span>
        </span>
    );
}

interface Props {
    open: boolean;
    onClose: () => void;
    notifications: Notificacion[];
    unread: number;
    loading: boolean;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    textOf: (n: Notificacion) => { title: string; body: string };
    onDecide?: (id: string, decision: 'approved' | 'rejected') => Promise<{ ok: boolean; message?: string }>;
    deciding?: string | null;
    isAdmin?: boolean;
}

const desde = (fecha?: string) => {
    if (!fecha) return '';
    try { return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es }); }
    catch { return ''; }
};


export default function NotificationPanel({
    open, onClose, notifications, unread, loading, onMarkRead, onMarkAllRead, textOf,
    onDecide, deciding, isAdmin,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);

    // Cierre al hacer clic fuera y con Escape. Sin esto el panel queda abierto
    // sobre el contenido y hay que volver a la campana para cerrarlo.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={ref}
            role='dialog'
            aria-label='Notificaciones'
            /* `jarvis-panel` fija la separación respecto del footer y el alto
               máximo (ver --app-footer-h en styles.css). El z-index sube por
               encima del footer, que usa 1000. */
            className='jarvis-panel jarvis-panel-in fixed left-[62px] z-[1010] w-[370px] max-w-[calc(100vw-80px)] flex flex-col bg-white border border-gray-200 rounded-xl shadow-[10px_0_34px_-6px_rgba(15,23,42,0.30)] overflow-hidden'
        >
            {/* Cabecera */}
            <div className='shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100'>
                <p className='text-sm font-bold text-gray-800'>Notificaciones</p>
                {unread > 0 && (
                    <span className='text-[10px] font-black text-white bg-rose-500 rounded-full px-1.5 py-0.5 leading-none'>
                        {unread}
                    </span>
                )}
                {unread > 0 && (
                    <button
                        type='button'
                        onClick={onMarkAllRead}
                        className='ml-auto text-[11px] font-bold text-[#1f9a08] hover:underline'
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {/* Lista */}
            <div className='flex-1 min-h-0 overflow-y-auto'>
                {loading && notifications.length === 0 && (
                    <p className='px-4 py-8 text-center text-xs text-gray-400'>Cargando…</p>
                )}

                {!loading && notifications.length === 0 && (
                    <div className='px-4 py-10 text-center'>
                        <p className='text-sm font-semibold text-gray-500'>Sin notificaciones</p>
                        <p className='text-[11px] text-gray-400 mt-1'>
                            Acá aparecerán los cambios del sistema.
                        </p>
                    </div>
                )}

                {notifications.map(n => {
                    const { title, body } = textOf(n);
                    const actor = `${n.actor?.name || ''} ${n.actor?.surName || ''}`.trim();
                    const contenido = (
                        <>
                            <div className='flex items-start gap-2.5'>
                                {/* Punto de nivel: sirve de indicador de no leída */}
                                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-200' : `jarvis-dot--unread ${LEVEL_DOT[n.level || 'info'] || LEVEL_DOT.info}`}`} />

                                {/* Qué (logo del recurso) y quién (insignia) */}
                                <ResourceAvatar n={n} />

                                <div className='min-w-0 flex-1'>
                                    <p className={`text-[12.5px] leading-snug ${n.read ? 'font-semibold text-gray-600' : 'font-bold text-gray-800'}`}>
                                        {title}
                                    </p>
                                    <p className='text-[11.5px] text-gray-500 leading-snug mt-0.5'>{body}</p>

                                    {/* Detalle de los campos que cambiaron */}
                                    {(n.changes?.length ?? 0) > 0 && (
                                        <p className='text-[10.5px] text-gray-400 mt-1'>
                                            {n.changes!.slice(0, 3).map(c => c.label || c.field).join(' · ')}
                                            {(n.changes?.length ?? 0) > 3 && ` +${(n.changes?.length ?? 0) - 3}`}
                                        </p>
                                    )}

                                    <div className='flex items-center gap-2 mt-1'>
                                        <span className='text-[10px] text-gray-400'>{desde(n.createdAt)}</span>
                                        {n.scope === 'personal' && (
                                            <span className='text-[9px] font-bold uppercase tracking-wider text-blue-500'>para ti</span>
                                        )}
                                        {n.scope === 'admin' && (
                                            <span className='text-[9px] font-bold uppercase tracking-wider text-amber-600'>solo admin</span>
                                        )}
                                        {actor && <span className='text-[10px] text-gray-300 truncate'>· {actor}</span>}
                                    </div>

                                    {/* Estado de la solicitud, ya resuelta */}
                                    {(n.request?.status === 'approved' || n.request?.status === 'rejected') && (
                                        <p className={`text-[10.5px] font-bold mt-1.5 ${n.request.status === 'approved' ? 'text-[#1f9a08]' : 'text-rose-600'}`}>
                                            {n.request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                                            {typeof n.request.decidedBy === 'object' && n.request.decidedBy?.name
                                                ? ` por ${n.request.decidedBy.name} ${n.request.decidedBy.surName || ''}`.trimEnd()
                                                : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    );

                    // active:scale-[.99] da la sensación de pulsación sin tocar
                    // nada que obligue a repintar.
                    const clases = `block w-full text-left px-4 py-3 transition-colors duration-150 active:scale-[.99] ${n.read ? 'hover:bg-gray-50' : 'bg-[#29c50c]/[0.04] hover:bg-[#29c50c]/[0.09]'}`;

                    // Solicitud pendiente que ESTE usuario puede resolver.
                    const puedeDecidir = Boolean(
                        isAdmin && onDecide && n.request?.status === 'pending',
                    );
                    const enCurso = deciding === n._id;

                    return (
                        <div key={n._id} className='jarvis-item-in border-b border-gray-50'>
                            {/*
                              El contenido navega; los botones NO van dentro.
                              Anidar un <button> en un <a> es HTML inválido y el
                              clic terminaría navegando en vez de decidir.
                            */}
                            {n.resource?.path ? (
                                <Link
                                    href={n.resource.path}
                                    onClick={() => { onMarkRead(n._id); onClose(); }}
                                    className={clases}
                                >
                                    {contenido}
                                </Link>
                            ) : (
                                <button type='button' onClick={() => onMarkRead(n._id)} className={clases}>
                                    {contenido}
                                </button>
                            )}

                            {puedeDecidir && (
                                <div className='flex items-center gap-2 px-4 pb-3 -mt-1'>
                                    <button
                                        type='button'
                                        disabled={enCurso}
                                        onClick={() => onDecide!(n._id, 'approved')}
                                        className='flex-1 h-8 rounded-lg text-[11px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors disabled:opacity-60'
                                    >
                                        {enCurso ? 'Procesando…' : 'Aceptar'}
                                    </button>
                                    <button
                                        type='button'
                                        disabled={enCurso}
                                        onClick={() => onDecide!(n._id, 'rejected')}
                                        className='flex-1 h-8 rounded-lg text-[11px] font-bold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {/* Pendiente pero sin permiso para resolverla */}
                            {n.request?.status === 'pending' && !puedeDecidir && (
                                <p className='px-4 pb-3 -mt-1 text-[10.5px] font-bold text-amber-600'>
                                    Pendiente por aprobar
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
