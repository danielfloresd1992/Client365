'use client';
import { useEffect, useState } from 'react';
import BoxInputClient from './BoxInputClient';
import useAxios from '@/hook/useAxios';


export default function LocalForm({ data }) {

    const { requestAction } = useAxios();
    const [arrayClientlient, setArrayClient] = useState([]);



    useEffect(() => {
        requestAction({ url: `/localforCort`, action: 'GET' })
            .then(response => {
                if (response.status === 200) {
                    setArrayClient(response.data);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, []);




    return (
        arrayClientlient.length > 0 ?
            (
                arrayClientlient.map((item, index) => (
                    <BoxInputClient data={item} key={index} />
                ))

            )
            :
            (
                null
            )
    );
}