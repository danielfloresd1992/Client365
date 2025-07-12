'use client';
import { useEffect, useState } from 'react';
import IP from '@/libs/dataFecth';
import { arrayBufferToBase64 } from '@/libs/arrayTo64';
import useAxios from '@/hook/useAxios';
import Link from 'next/link';



export default function List({ data }){

    const [ locality, setLocality ] = useState(null);
    const { requestAction } = useAxios();

    useEffect(() => {
        requestAction({ url: `https://${ IP }/local/id=${ data._id }`, action: 'GET' })
            .then(response => {
                if(response?.status === 200){
                    setLocality(response.data);
                }
            })
            .catch(err => {
                console.log(err);
            });
    }, []);
    
    
    return(
        <li style={{order: data.order}}>
            <a className='listRoute-a'>
                <div>
                    <img 
                        style={{ backgroundColor: '#6f6f6f', width: '25px' }}
                        src={ locality?.img ? arrayBufferToBase64(locality.img.data.data, 'image/png' ) : locality?.image } />
                </div>
                <p className='__textGrayForList' >{data.name}</p>
            </a>
        </li>
       
    )
}