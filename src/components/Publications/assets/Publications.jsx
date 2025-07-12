'use client';
import { useState, useEffect, useRef } from 'react';
import IP from '@/libs/dataFecth';
import { getInClientLastTeenNovelty } from '@/libs/ajaxClient/noveltyFetching.ts';
import { Noveltie } from '../../Publication/Noveltie';
import { Alert } from '../../Publication/Alert';
import LoandingData from '@/components/loandingComponent/loanding';
import socket from '@/libs/socketIo';
import useAxios from '@/hook/useAxios';



export default function Publications({ dataPreRender }) {

    const [publisher, setPublisher] = useState(null);
    const [awaitFetch, setAwait] = useState(false);
    const paginateRef = useRef(1);
    const boxRef = useRef(null);

    const { requestAction } = useAxios();

    console.error(dataPreRender)

    useEffect(() => {
        getInClientLastTeenNovelty((error, data) => {
            if (data) {
                setPublisher(data);
            }
        });
    }, []);


    useEffect(() => {
        let isSubscribed = true;
        const handleSendPublisher = data => {
            if (isSubscribed) {
                data.isNewData = true;
                setPublisher(prevPublisher => [data, ...prevPublisher]);
            }
        };
        socket.on('sendPublisher', handleSendPublisher);
        return () => {
            isSubscribed = false;
            socket.off('sendPublisher', handleSendPublisher);
        };
    }, []);



    const returnTypePublisher = (data, typePublishe) => {

        if (typePublishe.noveltie) {
            return (
                data ?
                    (
                        <Noveltie key={data._id} data={data} idNoveltie={typePublishe.noveltie} />
                    )
                    :
                    (
                        null
                    )
            )
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

    }



    const printPublications = () => {
        if (publisher?.length > 0) {
            return (
                <>
                    {
                        publisher.map(item => (
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
                                            getPublic();
                                            setAwait(true);
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
        else if (publisher?.length === 0) {
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
}