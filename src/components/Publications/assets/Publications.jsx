'use client';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
//import { getInClientLastTeenNovelty } from '@/libs/ajaxClient/noveltyFetching.ts';
import { Noveltie } from '../../Publication/Noveltie';
import { Alert } from '../../Publication/Alert';
import LoandingData from '@/components/loandingComponent/loanding';
import socket from '@/libs/socket/socketIo';
import { useFetch } from '@/hook/ajax_hook/useFetch';



//datos dargado desdel servidor desactivado
export default memo(function Publications({ dataPreRender }) {



    const fecthBooleanCurrent = useRef(true);
    const filterAlert = useSelector(state => state.filterClientList);
    const [awaitFetch, setAwait] = useState(false);
    const paginateRef = useRef(0);
    const boxRef = useRef(null);

    const { data, fetchData, setItem } = useFetch(`/user/publisher/paginate=${paginateRef.current}/items=10`);



    //primera carga de datos de del cliente
    useEffect(() => {
        if (fecthBooleanCurrent.current) {
            fecthBooleanCurrent.current = false;
            fetchData();
            paginateRef.current = paginateRef.current + 1;
        }

    }, []);




    //carga de datos en tiempo real
    useEffect(() => {

        let isSubscribed = true;
        const handleSendPublisher = data => {
            if (isSubscribed) {
                data.isNewData = true;
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
    const updateData = (page) => {
        setAwait(false);
        fetchData(`/user/publisher/paginate=${page}/items=10`)
        paginateRef.current = paginateRef.current + 1;
    };




    const returnTypePublisher = useCallback((data, typePublishe) => {
        if (typePublishe.noveltie) {

            //# FILTRADO DE ALERTAS DESDEL ESTADO GLOBAL "filterAlert"
            if (filterAlert.isActivated && filterAlert?.clientList?.length > 0) {
                if (filterAlert?.clientList.indexOf(data.local.id) > -1) return <Noveltie key={data._id} data={data} idNoveltie={typePublishe.noveltie} />;
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




    const printPublications = () => {
        if (data?.length > 0) {
            return (
                <>
                    {
                        data.map(item => (
                            returnTypePublisher(item, { noveltie: item.noveltie, alert: item.alert, corte: item.corte })
                        ))
                    }
                    <div className='btn-contain'>
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
                                            setAwait(true);
                                            updateData(paginateRef.current);
                                        }}
                                        className='btn-item'
                                        style={{ width: '250px' }}
                                    >
                                        <img
                                            className='divContentNovelties-pDateImg'
                                            src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADJElEQVR4nO2Zy0tVURTGf+otu1CEaRRKRMMielk56g+IjCisYQ6SJk2alfQgyKRh+RgERQ8h6DUomzhLalwgUgOFtAbeHjYK06CMBevCYnPl7L3P9d4b3A82XI7n+85e++yz9lqfUEUVVRQDNcB+4BzwCHgPzAC/gN/AD2AceAp0A21ALRWAZuA6MAUsBo7PQC/QUo6J1wN9wHzExN0xDwwC60oZwJkCE/kG3AZOAbuBDcAqYAXQBLQCJ4E7ur0K8U+UKoCDwF998BvgMJAJ4Mu97cCrAoEMBGpFY4+udDEWY8IJ4gWQ5T/CauBBgSCK8iZkD5cKl50g+tMKHgHmgHfAWsoTREeskEw4Z4QORGhkIrfBkHnuV6AhQoMbRmRKc38IdgCzwHdge8Q3MZlmKzVrCZAXOBYqAFwwfPkdk50WzWEnc/LGJUMeJQ5XjIb8jsGo0bjmS6oDpg3xeBkDaDca074FYKsh5VKk0WIEkHESiVS8iThrCHK4UMYABHeNjpTriXhiCKcpfwCdRkfmloi3hiD1TrkD2Gt0xnwInwxhUwUEsN4puRMxZwjZCgig3jkPErFgCCsrIICs0ZHFTcSsITRWQAAbjY50cokYNwQ5E0KwDejS7DVsdIb1mvxta6DmvtCP+JkhSA/riy3O97PUmNN7fdFluA99CN2GIA24L3Z5uhAydgbo3gs9yNqcPRdSz99yJvpBh70m9/gio+V40JauVdMpTzoU+MARJ+1Z72gkcEGOOsWcOIBe6DVEsT5COzmbCPJjPKItfW34PSHEFmflpLkIwWbHvJrRa6H9+KJ5k5JOgzBoBCa0zQtNfzM65HcI1gAf07oTjVp7pCmtayNc6BqnIv4S29SjXqXdx2J5LDd6imWr5DFQoiBqgKvOs8QZSY2M2nxWeCjim0gq2B47z3heTFcwWyCIyYjstBT6HO2XET6U15voL5DfR9U9SGPE3jd6N5fbXu/QzOAGktMGvFPbwCbtJ+o8GqMG4GLgqZ8KDfo2fP/F9EeTQcWhWR0z20cvNX5SwahV0+m8HkJj2tkt6OrnfEvhKqqogiD8A3juiiX4pie0AAAAAElFTkSuQmCC' style={{ filter: 'invert(1)' }} />
                                        Mas publicaciones
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
        <section className='box-Noveltie' style={{ height: '100%' }} ref={boxRef}>
            {
                printPublications()
            }
        </section>
    );
})