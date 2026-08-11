'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ResourceAvatar from './ResourceAvatar';
import { viewOf } from './notificationViews';
import type { Notification, Decision, DecideResult } from './types';

/*
 * Una fila de la bandeja. Solo pinta: el estado vive en useNotifications.
 */

// Color del punto según la importancia que le dio la estrategia del backend.
const LEVEL_DOT: Record<string, string> = {
    success: 'bg-[#29c50c]',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
};

const desde = (fecha?: string) => {
    if (!fecha) return '';
    try { return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es }); }
    catch { return ''; }
};

interface Props {
    n: Notification;
    title: string;
    body: string;
    canDecide: boolean;
    deciding: boolean;
    onMarkRead: (id: string) => void;
    onNavigate: () => void;
    onDecide?: (id: string, decision: Decision) => Promise<DecideResult>;
}

export default function NotificationItem({
    n, title, body, canDecide, deciding, onMarkRead, onNavigate, onDecide,
}: Props) {
    const actor = `${n.actor?.name || ''} ${n.actor?.surName || ''}`.trim();
    const target = `${n.target?.name || ''} ${n.target?.surName || ''}`.trim();
    const pendiente = n.request?.status === 'pending';
    const estado = n.request?.status;
    const resuelta = estado === 'approved' || estado === 'rejected' || estado === 'withdrawn';
    const ETIQUETA_ESTADO: Record<string, string> = {
        approved: 'Aprobada',
        rejected: 'Rechazada',
        withdrawn: 'Retirada',
    };

    // La apariencia la decide la FAMILIA que declaró el backend, no este
    // componente: acá no se sabe qué es "schedule" ni qué es "resource".
    const view = viewOf(n);

    const contenido = (
        <div className='relative flex items-start gap-2.5'>
            {/* Punto de nivel; hace de indicador de no leída */}
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read
                ? 'bg-gray-200'
                : `jarvis-dot--unread ${LEVEL_DOT[n.level || 'info'] || LEVEL_DOT.info}`}`}
            />

            {/* Una familia puede pintar a las personas por su cuenta en su
                detalle; ahí el avatar chico de al lado sería la misma cara
                repetida. Lo decide la vista, no este componente. */}
            {!view.hideAvatar && <ResourceAvatar n={n} />}

            <div className='min-w-0 flex-1'>
                <p className={`text-[12.5px] leading-snug ${n.read ? 'font-semibold text-gray-600' : 'font-bold text-gray-800'}`}>
                    {title}
                </p>
                <p className='text-[11.5px] text-gray-500 leading-snug mt-0.5'>{body}</p>

                {/* Qué campos cambiaron */}
                {(n.changes?.length ?? 0) > 0 && (
                    <p className='text-[10.5px] text-gray-400 mt-1'>
                        {n.changes!.slice(0, 3).map(c => c.label || c.field).join(' · ')}
                        {(n.changes?.length ?? 0) > 3 && ` +${(n.changes?.length ?? 0) - 3}`}
                    </p>
                )}

                {/* En horario se nombra explícitamente a quién le cambiaron la
                    jornada: el cuerpo del texto ya lo dice, pero al ojear la
                    bandeja se busca el nombre, no la frase. */}
                {view.showTarget && target && (
                    <p className='text-[10.5px] text-gray-500 mt-1'>
                        <span className='font-bold text-gray-700'>{target}</span>
                        <span className='text-gray-400'> · lo cambió {actor || 'el sistema'}</span>
                    </p>
                )}

                {/* Bloque propio de la familia —las fotos del marcaje, por
                    ejemplo—. Acá no se sabe qué dibuja: lo decide su vista. */}
                {view.detail?.(n)}

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

                {resuelta && (
                    <p className={`text-[10.5px] font-bold mt-1.5 ${estado === 'approved'
                        ? 'text-[#1f9a08]'
                        : estado === 'withdrawn' ? 'text-gray-500' : 'text-rose-600'}`}
                    >
                        {ETIQUETA_ESTADO[estado!] || 'Resuelta'}
                        {/* Retirada la resuelve quien la pidió, así que decir
                            "por Fulano" repetiría el nombre que ya está arriba. */}
                        {estado !== 'withdrawn' && typeof n.request!.decidedBy === 'object' && n.request!.decidedBy?.name
                            ? ` por ${n.request!.decidedBy.name} ${n.request!.decidedBy.surName || ''}`.trimEnd()
                            : ''}
                    </p>
                )}
            </div>
        </div>
    );

    // El fondo de "no leída" y la franja de acento salen de la vista de la
    // familia. active:scale-[.99] da sensación de pulsación sin repintar.
    const clases = `relative block w-full text-left px-4 py-3 overflow-hidden transition-colors duration-150 active:scale-[.99] ${n.read
        ? 'hover:bg-gray-50'
        : `${view.unreadBg} ${view.unreadHoverBg}`}`;

    // Franja lateral de 3px con el color de la familia, dibujada con ::before
    // para no meter un nodo más por cada fila de la lista.
    const franja = `before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] ${view.accent} ${n.read ? 'before:opacity-30' : ''}`;

    return (
        <div className='jarvis-item-in border-b border-gray-50'>
            {/*
              El contenido navega; los botones NO van dentro. Anidar un <button>
              en un <a> es HTML inválido y el clic terminaría navegando en vez
              de decidir.
            */}
            {n.resource?.path ? (
                <Link href={n.resource.path} onClick={() => { onMarkRead(n._id); onNavigate(); }} className={`${clases} ${franja}`}>
                    {view.watermark}
                    {contenido}
                </Link>
            ) : (
                <button type='button' onClick={() => onMarkRead(n._id)} className={`${clases} ${franja}`}>
                    {view.watermark}
                    {contenido}
                </button>
            )}

            {canDecide && onDecide && (
                <div className='flex items-center gap-2 px-4 pb-3 -mt-1'>
                    <button
                        type='button'
                        disabled={deciding}
                        onClick={() => onDecide(n._id, 'approved')}
                        className='flex-1 h-8 rounded-lg text-[11px] font-bold text-white bg-[#29c50c] hover:bg-[#1f9a08] transition-colors disabled:opacity-60'
                    >
                        {deciding ? 'Procesando…' : 'Aceptar'}
                    </button>
                    <button
                        type='button'
                        disabled={deciding}
                        onClick={() => onDecide(n._id, 'rejected')}
                        className='flex-1 h-8 rounded-lg text-[11px] font-bold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60'
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Pendiente, pero este usuario no puede resolverla */}
            {pendiente && !canDecide && (
                <p className='px-4 pb-3 -mt-1 text-[10.5px] font-bold text-amber-600'>
                    Pendiente por aprobar
                </p>
            )}
        </div>
    );
}
