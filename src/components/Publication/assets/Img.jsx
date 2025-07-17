'use client';
import { useState, useEffect } from 'react';
import useAxios from '@/hook/useAxios';
import IP from '@/libs/ajaxClient/dataFecth';
import { arrayBufferToBase64 } from '@/libs/arrayTo64';


export default function Img({ idLocal }) {

    const [imgLogo, setImgLogo] = useState(null);
    const { requestAction } = useAxios();

    useEffect(() => {
        requestAction({ url: `https://${IP}/local/id=${idLocal}`, action: 'GET' })
            .then(res => {
                if (res.status === 200) {
                    setImgLogo(arrayBufferToBase64(res.data.img.data.data, 'image/png'));
                }
            })
            .catch(err => {
                console.log(err);
            });
    }, []);

    return (
        <img
            className='divContentNovelties-img'
            src={imgLogo}
            onClick={() => {
                // setImg( localImgLogoReg.current.src );
            }}
        />
    );
}
