'use client';
import { useState, useEffect } from 'react';
import useAxios from '@/hook/useAxios';
import IP from '@/libs/ajaxClient/dataFecth';
import { arrayBufferToBase64 } from '@/libs/script/arrayTo64';


export default function Img({ idLocal, style = null }) {

    const [imgLogo, setImgLogo] = useState(null);
    const { requestAction } = useAxios();



    useEffect(() => {
        requestAction({ url: `https://${IP}/local/id=${idLocal}`, action: 'GET' })
            .then(res => {
                if (res.status === 200) {
                    setImgLogo(res.data?.img ? arrayBufferToBase64(res.data?.img?.data?.data, 'image/png') : `https://72.68.60.201:3006/local/image=${idLocal}`);
                }
            })
            .catch(err => {
                console.log(err);
            });
    }, []);

    return (
        <img
            className='divContentNovelties-img'
            style={style ? style : {}}
            src={imgLogo}
            onClick={() => {
                // setImg( localImgLogoReg.current.src );
            }}
        />
    );
}
