'use client';

import { useState, useEffect } from 'react';
import { BellIcon, BellOffIcon } from '@/components/icons';
import useNotifications from './useNotifications';
import NotificationPanel from './NotificationPanel';

/*
 * NotificationBell — la campana completa: botón, contador, animaciones y
 * bandeja.
 *
 * Se monta con una sola línea. AppDock no sabe qué es una notificación, ni
 * llama al hook, ni conoce el panel: solo le presta sus clases para que la fila
 * encaje con el resto del riel.
 *
 * Las animaciones (jarvis-bell--alert, jarvis-bell--shake, jarvis-badge-*)
 * viven en styles.css y animan SOLO transform y opacity. Es una regla dura del
 * proyecto: animar box-shadow o width dejó a Reportes Express consumiendo 20%
 * de CPU en reposo, y esta campana vive abierta todo el día.
 */

interface Props {
    /** Clases del riel, para que la fila se vea igual que las demás. */
    rowClass?: string;
    iconBoxClass?: string;
    labelClass?: string;
}

export default function NotificationBell({
    rowClass = '', iconBoxClass = '', labelClass = '',
}: Props) {
    const {
        notifications, unread, loading, loadingMore, error, hasMore,
        load, loadMore, markRead, markAllRead, decide, deciding,
        textOf, pulseKey, hasNew, markSeen, isAdmin,
    } = useNotifications();

    const [open, setOpen] = useState(false);

    // DOS estados distintos, y de ahí sale toda la apariencia:
    //   hasUnread → hay pendientes: se muestra el número. Solo lo apaga LEER.
    //   hasNew    → además, todavía no te enteraste: suena la alarma. La apaga
    //               abrir la bandeja, sin marcar nada como leído.
    const hasUnread = unread > 0;

    // La lista se pide al ABRIR y CADA vez que se abre: el contador viene de un
    // endpoint que no trae documentos, así que quien nunca abre la campana no
    // paga por cargarla, y quien la reabre no se queda con una lista vieja.
    const toggle = () => {
        setOpen(abierto => {
            if (!abierto) load();
            return !abierto;
        });
    };

    // Abrir la bandeja es enterarse. Se mantiene mientras siga abierta —
    // `markSeen` cambia de identidad al cambiar el contador— para que algo que
    // llegue con la bandeja a la vista tampoco dispare la alarma.
    useEffect(() => {
        if (open) markSeen();
    }, [open, markSeen]);

    return (
        <>
            <button
                type='button'
                onClick={toggle}
                aria-expanded={open}
                aria-label='Notificaciones'
                title={hasUnread
                    ? `Tienes ${unread} notificación${unread === 1 ? '' : 'es'} sin leer${hasNew ? ' · hay novedades' : ''}`
                    : 'Sin notificaciones nuevas'}
                className={`${rowClass} w-[calc(100%-14px)] ${hasNew
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
            >
                <span className={`${iconBoxClass} relative`}>
                    <span className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${hasNew ? 'bg-rose-100' : ''}`}>
                        {/*
                          DOS CAPAS, no una con dos animaciones: ambas animan
                          `transform` y sobre el mismo elemento se pisarían.
                          Anidadas, sus transformaciones se componen.

                          · Externa: repique periódico mientras haya NOVEDAD.
                          · Interna: sacudida de UNA pasada al llegar algo.
                            `key={pulseKey}` la remonta, que es lo único que
                            relanza una animación CSS ya terminada. Con pulseKey
                            en 0 no lleva clase, así no sacude al recargar.

                          Las dos se apagan al abrir la bandeja. El ícono, en
                          cambio, sigue siendo la campana ACTIVA mientras queden
                          pendientes: tacharla diría "no hay nada" junto a un
                          número que dice lo contrario.
                        */}
                        <span className={`flex ${hasNew ? 'jarvis-bell--alert' : ''}`}>
                            <span key={pulseKey} className={`flex ${pulseKey > 0 && hasNew ? 'jarvis-bell--shake' : ''}`}>
                                {hasUnread ? <BellIcon size={18} /> : <BellOffIcon size={18} />}
                            </span>
                        </span>
                    </span>

                    {/* El halo late: es alarma pura, no información. Solo con
                        novedad sin ver. */}
                    {hasNew && (
                        <span className='absolute top-0.5 right-1 flex h-[9px] w-[9px]' aria-hidden='true'>
                            <span className='jarvis-badge-halo absolute inline-flex h-full w-full rounded-full bg-rose-400'></span>
                            <span className='relative inline-flex rounded-full h-[9px] w-[9px] bg-rose-500 ring-2 ring-white'></span>
                        </span>
                    )}
                </span>

                <span className={`${labelClass} flex-1 flex items-center justify-between`}>
                    <span>Notificaciones</span>
                    {hasUnread && (
                        // El número se queda mientras haya sin leer, pero se
                        // apaga a gris en cuanto dejan de ser novedad: sigue
                        // informando cuántas faltan sin tirar del ojo.
                        //
                        // key={unread}: el golpe seco se repite cada vez que
                        // cambia la cuenta, no solo al aparecer.
                        <span
                            key={unread}
                            className={`mr-2 text-[10px] font-black text-white rounded-full px-1.5 py-0.5 leading-none transition-colors ${hasNew
                                ? 'jarvis-badge-pop bg-rose-500'
                                : 'bg-gray-400'}`}
                        >
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </span>
            </button>

            <NotificationPanel
                open={open}
                onClose={() => setOpen(false)}
                notifications={notifications}
                unread={unread}
                loading={loading}
                loadingMore={loadingMore}
                error={error}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRetry={load}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                textOf={textOf}
                onDecide={decide}
                deciding={deciding}
                isAdmin={isAdmin}
            />
        </>
    );
}
