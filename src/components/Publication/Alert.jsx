import { useEffect, useState } from "react";

import IP from '@/libs/ajaxClient/dataFecth';
import useAxios from "@/hook/useAxios.jsx";
import { arrayBufferToBase64 } from '@/libs/script/arrayTo64.js';
import DataFormart from "@/libs/time/dateFormat";


export function Alert({ data, idPublisher }) {


    const [dataFetch, setData] = useState(null);
    const { requestAction } = useAxios();

    useEffect(() => {
        requestAction({ url: `https://${IP}/user/publisherAndArticleById/id=${data._id}`, action: 'GET' })
            .then(response => {

                if (response.status === 200) setData(response.data);

            })
            .catch(err => {
                console.log(err);
            })

        return () => {

        };
    }, []);


    return (
        <div className='divContentNovelties' style={{ minHeight: '400px' }}>
            {
                dataFetch ?
                    (
                        <>
                            <div className='divContentNovelties-divTitle'>
                                <div className='divContentNovelties-textContain'>
                                    <p className='divContentNovelties-pTitle'>Reporte de alertas</p>
                                    <p className='divContentNovelties-pDate'>{DataFormart.formatDateApp(dataFetch.date)}
                                        <img className='divContentNovelties-pDateImg' src='ico/clock/clock.svg' />
                                    </p>
                                    <hr />
                                </div>
                            </div>
                            <div className='divContentNovelties-carouselDiv'>
                                <div className='divContentNovelties-imgDiv center divContentNovelties-carouselDiv--bgBlack'>
                                    <img className='divContentNovelties-carouselImg divContentNovelties-carouselImg--midWid' src={arrayBufferToBase64(dataFetch.alert.img.data.data, dataFetch.alert.img.contentType)} />
                                </div>
                            </div>
                        </>
                    )
                    :
                    (
                        <div className='divContentNovelties-boxAwait'>
                            <div className='divContentNovelties-boxAwaitspinner'></div>
                        </div>
                    )
            }
        </div>
    );
}


