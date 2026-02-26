'use client';
import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Noveltie } from '../../Publication/Noveltie';
import { Alert } from '../../Publication/Alert';
import LoandingData from '@/components/loandingComponent/loanding';
import socket from '@/libs/socket/socketIo';
import autoAnimate from '@formkit/auto-animate'
import { FiRefreshCcw } from 'react-icons/fi';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';


//datos dargado desdel servidor desactivado
export default memo(function Publications({ dataPreRender, filterSignal = null }) {



    const fecthBooleanCurrent = useRef(true);
    const filterAlert = useSelector(state => state.filterClientList);
    const [publications, setPublications] = useState(dataPreRender);
    const [awaitFetch, setAwait] = useState(false);
    const [isLoadingFirstData, setIsLoadingFirstData] = useState(false);
    const [activeFilter, setActiveFilter] = useState({
        isApplied: false,
        dateFrom: '',
        dateUntil: '',
        establishmentId: '',
        establishmentName: ''
    });

    const paginateRef = useRef(0);
    const boxRef = useRef(null);


    const buildFetchUrl = useCallback((page = 0, filter = activeFilter) => {
        const baseUrl = `/user/publisher/paginate=${page}/items=10`;
        if (!filter?.isApplied) return baseUrl;

        const params = new URLSearchParams();
        params.set('since', filter.dateFrom);
        params.set('until', filter.dateUntil);
        if (filter.establishmentId) params.set('establishmentId', filter.establishmentId);
        if (filter.establishmentName) params.set('establishment', filter.establishmentName);

        return `${baseUrl}?${params.toString()}`;
    }, [activeFilter]);


    const getDateFromPublication = useCallback((item) => {
        const dateCandidate = item?.date || item?.createdAt || item?.noveltie?.date || item?.noveltie?.createdAt;
        if (!dateCandidate) return null;
        const parsedDate = new Date(dateCandidate);
        if (Number.isNaN(parsedDate.getTime())) return null;
        return parsedDate;
    }, []);


    const applyClientSideFilter = useCallback((list = [], filter = activeFilter) => {
        if (!filter?.isApplied) return list;
        const dateFromSelected = new Date(`${filter.dateFrom}T00:00:00`);
        const dateUntilSelected = new Date(`${filter.dateUntil}T23:59:59`);

        return list.filter((item) => {
            if (filter.establishmentId) {
                const localId = item?.local?.id || item?.local?.idLocal || item?.local?._id;
                if (localId !== filter.establishmentId) return false;
            }

            const dateItem = getDateFromPublication(item);
            if (!dateItem) return false;
            return dateItem >= dateFromSelected && dateItem <= dateUntilSelected;
        });
    }, [activeFilter, getDateFromPublication]);


    const fetchPublications = useCallback(async ({ page = 0, replace = false, filter = activeFilter, showFullLoading = false }) => {
        if (showFullLoading) setIsLoadingFirstData(true);
        setAwait(true);
        try {
            const url = buildFetchUrl(page, filter);
            const response = await axiosInstance.get(url);
            const newItems = Array.isArray(response?.data) ? response.data : [];

            setPublications(prevState => {
                if (replace || !Array.isArray(prevState)) return [...newItems];
                return [...prevState, ...newItems];
            });

            paginateRef.current = page + 1;
        } catch (error) {
            console.log(error);
            if (replace) setPublications([]);
        } finally {
            setAwait(false);
            if (showFullLoading) setIsLoadingFirstData(false);
        }
    }, [activeFilter, buildFetchUrl]);


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
            fetchPublications({ page: 0, replace: true, showFullLoading: true });
        }

    }, [fetchPublications]);




    //carga de datos en tiempo real
    useEffect(() => {

        let isSubscribed = true;
        const handleSendPublisher = data => {
            if (isSubscribed) {
                setPublications((prevState) => {
                    const currentList = Array.isArray(prevState) ? prevState : [];
                    const incomingList = [data, ...currentList];
                    return applyClientSideFilter(incomingList);
                });
            }
        };
        socket.on('sendPublisher', handleSendPublisher);
        return () => {
            isSubscribed = false;
            socket.off('sendPublisher', handleSendPublisher);
        };
    }, [applyClientSideFilter]);



    //carga de datos mediante paginación
    const updateData = async (page) => {
        await fetchPublications({ page, replace: false });
    };


    const filteredPublications = useMemo(() => {
        if (!Array.isArray(publications)) return publications;
        return applyClientSideFilter(publications);
    }, [publications, applyClientSideFilter]);


    useEffect(() => {
        if (!filterSignal || !filterSignal.action) return;

        if (filterSignal.action === 'apply') {
            if (!filterSignal.dateFrom || !filterSignal.dateUntil) return;

            const nextFilter = {
                isApplied: true,
                dateFrom: filterSignal.dateFrom,
                dateUntil: filterSignal.dateUntil,
                establishmentId: filterSignal.establishmentId || '',
                establishmentName: filterSignal.establishmentName || ''
            };

            setActiveFilter(nextFilter);
            paginateRef.current = 0;
            fetchPublications({ page: 0, replace: true, filter: nextFilter, showFullLoading: true });
            return;
        }

        if (filterSignal.action === 'clear') {
            const defaultFilter = {
                isApplied: false,
                dateFrom: '',
                dateUntil: '',
                establishmentId: '',
                establishmentName: ''
            };

            setActiveFilter(defaultFilter);
            paginateRef.current = 0;
            fetchPublications({ page: 0, replace: true, filter: defaultFilter, showFullLoading: true });
        }
    }, [filterSignal, fetchPublications]);



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
        if (filteredPublications?.length > 0) {
            return (
                <>
                    <div className='lobby-feed-list'>
                        {
                            filteredPublications.map(item => (
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
                                        disabled={awaitFetch}
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
        else if (Array.isArray(filteredPublications) && filteredPublications?.length === 0) {
            return (
                <div className='__center_center' style={{ height: '60vh', width: '100%' }}>
                    <p className='__text-center'>
                        {activeFilter.isApplied ? 'No hay novedades para el filtro seleccionado.' : 'No hay datos para mostrar'}
                    </p>
                </div>
            );
        }
        else {
            return <LoandingData title='Descargando últimas 10 novedades' />
        }
    }


    return (
        <section className='box-Noveltie lobby-feed-scroll' style={{ height: '100%' }} ref={boxRef}>
            {
                isLoadingFirstData ? <LoandingData title={activeFilter.isApplied ? 'Aplicando filtro de novedades' : 'Descargando últimas 10 novedades'} /> : printPublications()
            }
        </section>
    );
})