'use client';
import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Noveltie } from '../Publication/Noveltie';
import { Alert } from '../Publication/Alert';
import LoandingData from '@/components/loandingComponent/loanding';
import socket from '@/libs/socket/socketIo';
import { useFetch } from '@/hook/ajax_hook/useFetch';
import autoAnimate from '@formkit/auto-animate';


// Animación del muro (chat): una alerta nueva ENTRA deslizándose desde abajo
// y las anteriores se desplazan hacia arriba hasta su nueva posición.
const feedAnimation = (el, action, oldCoords, newCoords) => {
    let keyframes = [];
    if (action === 'add') {
        keyframes = [
            { transform: 'translateY(26px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
        ];
    } else if (action === 'remove') {
        keyframes = [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(26px)', opacity: 0 },
        ];
    } else {
        // 'remain': el elemento se movió; anima desde su posición anterior
        const deltaY = (oldCoords?.top ?? 0) - (newCoords?.top ?? 0);
        keyframes = [
            { transform: `translateY(${deltaY}px)` },
            { transform: 'translateY(0)' },
        ];
    }
    return new KeyframeEffect(el, keyframes, { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
};


// Pestañas del muro: filtran las alertas por estado de validación. "Todo" usa
// el feed por defecto (publicaciones mezcladas); el resto consulta las
// novedades por estado (/novelties/paginate con ?state=).
const FEED_TABS = [
    { key: 'todo',        label: 'Todo',        activeCls: 'bg-slate-700 text-white border-slate-700' },
    { key: 'validadas',   label: 'Validadas',   activeCls: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'invalidadas', label: 'Invalidadas', activeCls: 'bg-rose-600 text-white border-rose-600' },
    { key: 'ignoradas',   label: 'Ignoradas',   activeCls: 'bg-amber-500 text-white border-amber-500' },
];


// Muro de novedades en tiempo real. Antes la lógica vivía en un componente
// hijo (Publications); ahora está todo aquí, con su header.
export default function PublicationsBox({ filterSignal = null }) {

    const fecthBooleanCurrent = useRef(true);
    const filterAlert = useSelector(state => state.filterClientList);
    const paginateRef = useRef(0);
    const boxRef = useRef(null);
    const stickRef = useRef(true);   // ¿el usuario está pegado al fondo (chat)?
    const [feedState, setFeedState] = useState('todo');
    const feedStateRef = useRef('todo');
    feedStateRef.current = feedState;
    const firstStateRun = useRef(true);
    // Scroll infinito hacia arriba (paginación al subir, en vez de botón)
    const dataRef = useRef(null);
    const loadingMoreRef = useRef(false);
    const noMoreRef = useRef(false);
    const pendingAdjustRef = useRef(null);
    const prevLenRef = useRef(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // URL del feed según la pestaña activa
    const buildFeedUrl = (page) => feedState === 'todo'
        ? `/user/publisher/paginate=${page}/items=10`
        : `/novelties/paginate=${page}/items=10?state=${feedState}`;

    // Hook personalizado para manejo de fetch
    const { data, fetchData, setItem, resetData } = useFetch(`/user/publisher/paginate=${paginateRef.current}/items=10`);
    dataRef.current = data;

    // Carga la siguiente página (más viejas) al llegar arriba. fetchData
    // ACUMULA (append): las viejas quedan al final del array y, por el
    // column-reverse, se renderizan ARRIBA. El ref evita disparos repetidos.
    const loadMore = useCallback(() => {
        const el = boxRef.current;
        const arr = dataRef.current;
        if (!el || loadingMoreRef.current || noMoreRef.current) return;
        if (!Array.isArray(arr) || arr.length === 0) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        pendingAdjustRef.current = el.scrollHeight;   // conservar la posición
        prevLenRef.current = arr.length;
        const page = paginateRef.current;
        const url = feedStateRef.current === 'todo'
            ? `/user/publisher/paginate=${page}/items=10`
            : `/novelties/paginate=${page}/items=10?state=${feedStateRef.current}`;
        fetchData(url);
        paginateRef.current = page + 1;
    }, [fetchData]);

    // Tras cargar viejas (que entran ARRIBA), conserva la posición de scroll
    // desplazándolo por el alto agregado, y detecta si ya no hay más páginas.
    useLayoutEffect(() => {
        if (pendingAdjustRef.current == null) return;
        const el = boxRef.current;
        if (el) {
            const added = el.scrollHeight - pendingAdjustRef.current;
            if (added > 0) el.scrollTop = el.scrollTop + added;
        }
        if (Array.isArray(data) && data.length - prevLenRef.current < 10) noMoreRef.current = true;
        pendingAdjustRef.current = null;
        loadingMoreRef.current = false;
        setLoadingMore(false);
    }, [data]);


    // autoAnimate va en la LISTA (no en el scroll): así anima cada alerta al
    // entrar/salir. Se adjunta cuando el nodo de la lista se monta.
    const attachFeedAnimate = useCallback((node) => {
        if (node) autoAnimate(node, feedAnimation);
    }, []);


    // Rebote de borde (edge): al topar el límite superior o inferior y seguir
    // rodando la rueda, el contenedor se desplaza 10px a la izquierda y vuelve.
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        let timer;
        const onWheel = (e) => {
            const atTop = el.scrollTop <= 0;
            const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
            if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                el.classList.remove('is-edge');
                void el.offsetWidth;        // reinicia la animación
                el.classList.add('is-edge');
                clearTimeout(timer);
                timer = setTimeout(() => el.classList.remove('is-edge'), 420);
            }
        };
        el.addEventListener('wheel', onWheel, { passive: true });
        return () => {
            el.removeEventListener('wheel', onWheel);
            clearTimeout(timer);
        };
    }, []);


    // Primera carga de datos del cliente
    useEffect(() => {
        if (fecthBooleanCurrent.current) {
            fecthBooleanCurrent.current = false;
            fetchData();
            paginateRef.current = paginateRef.current + 1;
        }
    }, []);


    // Cambio de pestaña: reinicia el feed y trae la primera página del estado.
    useEffect(() => {
        if (firstStateRun.current) { firstStateRun.current = false; return; }
        resetData();
        noMoreRef.current = false;
        paginateRef.current = 0;
        fetchData(buildFeedUrl(0));
        paginateRef.current = 1;
        stickRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedState]);


    // Filtro por rango de fechas / establecimiento (o limpiar)
    useEffect(() => {
        if (!filterSignal) return;
        noMoreRef.current = false;
        paginateRef.current = paginateRef.current = 0;
        if (filterSignal?.dateFrom && filterSignal.dateUntil) {
            resetData()
            const before = new Date(filterSignal.dateFrom).toISOString();
            const after = new Date(filterSignal.dateUntil).toISOString();
            const establishment = filterSignal?.establishmentName !== '' ? `&establishment=${filterSignal?.establishmentName}` : ''
            const quiery = `/user/publisher/paginate=${paginateRef.current}/items=10?before=${before}&after=${after}${establishment}`;
            fetchData(quiery);
        }

        if (filterSignal.action === 'clear') {
            resetData();
            fetchData(`/user/publisher/paginate=${paginateRef.current}/items=10`);
        }
    }, [filterSignal]);


    // Carga de datos en tiempo real
    useEffect(() => {
        let isSubscribed = true;
        const handleSendPublisher = data => {
            // Solo en "Todo": los ítems del socket son del feed mezclado y no
            // corresponden a las vistas filtradas por estado.
            if (isSubscribed && feedStateRef.current === 'todo') {
                setItem(data?.doc, 'shift');
            }
        };
        socket.on('created_Alert', handleSendPublisher);
        return () => {
            isSubscribed = false;
            socket.off('created_Alert', handleSendPublisher);
        };
    }, []);


    // Chat: marca si el usuario está cerca del fondo, y pagina (carga más
    // viejas) cuando llega ARRIBA del todo.
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const onScroll = () => {
            stickRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 120;
            if (el.scrollTop < 80) loadMore();
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [loadMore]);

    // Por defecto el scroll queda ABAJO; al llegar novedades, si el usuario
    // sigue cerca del fondo, baja para ver lo último (si subió a leer, respeta).
    useEffect(() => {
        const el = boxRef.current;
        if (!el || !stickRef.current) return;
        const toBottom = () => { el.scrollTop = el.scrollHeight; };
        toBottom();
        requestAnimationFrame(toBottom);
    }, [data]);


    // Determina el tipo de publicación a renderizar
    const returnTypePublisher = useCallback((data, typePublishe) => {
        if (typePublishe.noveltie) {

            // Filtrado de alertas desde el estado global "filterAlert"
            if (filterAlert.isActivated && filterAlert?.clientList?.length > 0) {
                if (filterAlert?.clientList.indexOf(data?.local?.id) > -1) return <Noveltie key={data._id} data={data} idNoveltie={typePublishe.noveltie} />;
            }
            else {
                // Con "filterAlert" apagado entran todas las alertas
                return (
                    <Noveltie key={data._id} data={data} idNoveltie={typePublishe.noveltie} />
                )
            }
        }
        else if (typePublishe.alert) {
            return (
                <Alert key={data._id} data={data} idPublisher={typePublishe.alert} />
            );
        }
        else if (typePublishe.corte) {
            return null;
        }
        else {
            return null;
        }
    }, [filterAlert])


    // Imprime las publicaciones (lista, vacío o cargando)
    const printPublications = () => {
        if (data?.length > 0) {
            return (
                <div className='lobby-feed-list' ref={attachFeedAnimate}>
                    {feedState === 'todo'
                        ? data.map(item => (
                            returnTypePublisher(item, { noveltie: item.noveltie, alert: item.alert, corte: item.corte })
                        ))
                        : data.map(n => (
                            <Noveltie key={n._id} data={n} idNoveltie={n._id} />
                        ))
                    }
                </div>
            )
        }
        else if (Array.isArray(data) && data?.length === 0) {
            return (
                <div className='__center_center' style={{ height: '60vh', width: '100%' }}>
                    <p className='__text-center'>No hay datos para mostrar</p>
                </div>
            );
        }
        else {
            return <LoandingData title='Descargando últimas 10 novedades' />
        }
    }


    return (
        <main className='main-contain lobby-feed-main'>
            <header className='lobby-feed-header flex items-center justify-between flex-wrap gap-2'>
                <div>
                    <p className='lobby-feed-kicker'>Muro operacional</p>
                    <h2 className='lobby-feed-title'>Publicaciones en tiempo real</h2>
                    <p className='text-[11px] font-semibold text-gray-400 mt-0.5'>
                        <b className='text-gray-700 tabular-nums text-[13px]'>{Array.isArray(data) ? data.length : 0}</b> alertas en el muro
                    </p>
                </div>
                <div className='flex items-center gap-1 flex-wrap'>
                    {FEED_TABS.map(t => {
                        const active = feedState === t.key;
                        return (
                            <button
                                key={t.key}
                                type='button'
                                onClick={() => setFeedState(t.key)}
                                aria-pressed={active}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${active ? t.activeCls : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            <section className='lobby-feed-content'>
                <section className='box-Noveltie lobby-feed-scroll' style={{ height: '95%' }} ref={boxRef}>
                    {loadingMore && (
                        <div className='absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 shadow-md'>
                            <span className='w-3.5 h-3.5 border-2 border-gray-300 border-t-[#29c50c] rounded-full animate-spin' aria-hidden='true' />
                            <span className='text-[11px] font-semibold text-gray-600'>Cargando más alertas…</span>
                        </div>
                    )}
                    {printPublications()}
                </section>
            </section>
        </main>
    );
}
