'use client';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
//import { getInClientLastTeenNovelty } from '@/libs/ajaxClient/noveltyFetching.ts';
import { Noveltie } from '../../Publication/Noveltie';
import { Alert } from '../../Publication/Alert';
import LoandingData from '@/components/loandingComponent/loanding';
import socket from '@/libs/socket/socketIo';
import { useFetch } from '@/hook/ajax_hook/useFetch';
import autoAnimate from '@formkit/auto-animate'
import { FiRefreshCcw } from 'react-icons/fi';


//datos dargado desdel servidor desactivado
export default memo(function Publications({ dataPreRender, filterSignal }) {



    const fecthBooleanCurrent = useRef(true);
    const filterAlert = useSelector(state => state.filterClientList);
    const [awaitFetch, setAwait] = useState(false);
    const paginateRef = useRef(0);
    const boxRef = useRef(null);


    // Hook personalizado para manejo de fetch
    const { data, fetchData, setItem, resetData } = useFetch(`/user/publisher/paginate=${paginateRef.current}/items=10`);



    //Animación de entrada y salida de elementos
    useEffect(() => {
        boxRef.current && autoAnimate(boxRef.current, {
            duration: 1000,
            easing: 'ease-in-out',
            disrespectUserMotionPreference: false
        });
    }, []);




    //primera carga de datos de del cliente
    useEffect(() => {
        if (fecthBooleanCurrent.current) {
            fecthBooleanCurrent.current = false;
            fetchData();
            paginateRef.current = paginateRef.current + 1;
        }

    }, []);



    useEffect(() => {
        if(!filterSignal) return;
        paginateRef.current = paginateRef.current = 0;
        if(filterSignal?.dateFrom && filterSignal.dateUntil){
            resetData()
            const before = new Date(filterSignal.dateFrom).toISOString();
            const after = new Date(filterSignal.dateUntil).toISOString();
            const establishment = filterSignal?.establishmentName !== '' ? `&establishment=${filterSignal?.establishmentName}` : ''
            const quiery = `/user/publisher/paginate=${paginateRef.current}/items=10?before=${before}&after=${after}${establishment}`;
           fetchData(quiery);
        }

        if(filterSignal.action === 'clear')  {
            resetData();
            fetchData(`/user/publisher/paginate=${paginateRef.current}/items=10`);
        }

    }, [filterSignal]);



    //carga de datos en tiempo real
    useEffect(() => {

        let isSubscribed = true;
        const handleSendPublisher = data => {
            if (isSubscribed) {
                //  data.isNewData = true;
                setItem(data, 'shift');
            }
        };
        socket.on('sendPublisher', handleSendPublisher);
        return () => {
            isSubscribed = false;
            socket.off('sendPublisher', handleSendPublisher);
        };
    }, []);



    //carga de datos mediante paginación
    const updateData = async (page) => {
        setAwait(true);
        try {
            await fetchData(`/user/publisher/paginate=${page}/items=10`)
            paginateRef.current = paginateRef.current + 1;
        } 
        finally {
            setAwait(false);
        }
    };



    //función para determinar el tipo de publicación
    const returnTypePublisher = useCallback((data, typePublishe) => {
        if (typePublishe.noveltie) {

            //# FILTRADO DE ALERTAS DESDEL ESTADO GLOBAL "filterAlert"
            if (filterAlert.isActivated && filterAlert?.clientList?.length > 0) {
                if (filterAlert?.clientList.indexOf(data?.local?.id) > -1) return <Noveltie key={data._id} data={data} idNoveltie={typePublishe.noveltie} />;
            }
            else {
                //# AL ESTAR APAGADO "filterAlert" ENTRARÁ TODAS LAS ALERTAS
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
            return (
                null
            )
        }
        else {
            return (
                null
            )
        }

    }, [filterAlert])




    //función para imprimir las publicaciones
    const printPublications = () => {
        if (data?.length > 0) {
            return (
                <>
                    <div className='lobby-feed-list'>
                        {
                            data.map(item => (
                                returnTypePublisher(item, { noveltie: item.noveltie, alert: item.alert, corte: item.corte })
                            ))
                        }
                    </div>

                    <div className='lobby-feed-actions'>
                        {
                            awaitFetch ?
                                (
                                    <div className='divContentNovelties-boxAwait'>
                                        <div className='divContentNovelties-boxAwaitspinner'></div>
                                    </div>
                                )
                                :
                                (
                                    <button
                                        onClick={() => {
                                            updateData(paginateRef.current);
                                        }}
                                        className='lobby-feed-loadmore'
                                    >
                                        <FiRefreshCcw size={16} />
                                        Cargar más publicaciones
                                    </button>
                                )
                        }
                    </div>
                </>
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
        <section className='box-Noveltie lobby-feed-scroll' style={{ height: '95%' }} ref={boxRef}>
            {
                printPublications()
            }
        </section>
    );
})