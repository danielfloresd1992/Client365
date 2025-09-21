'use client';
import { useState, memo } from 'react';
import Table from '@/components/tablet_component/Table.jsx';
import ClientBox from './assets/clientBox';
//mport getListClient from '@/libs/ajaxServer/getListClient';
import ItenCellClien from './assets/ItenCellClien';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { groupByFranchiseComprehensive } from '../../libs/parser/estableshment';



function ContentCliets() {


    const { data, fetchData, loading } = useSingleFetch({ resource: '/establishment&compressed', method: 'get' }, true);

    const groupClients = groupByFranchiseComprehensive(data);

    if (loading) return null;


    return groupClients && Object.entries(groupClients).map(([key, client]) => {


        return (
            <div className='w-full' key={key}>
                <div><p className='text-center'>{key}</p></div>
                <div className='w-full'>
                    {
                        client && client.map(items => {

                            return <ClientBox data={items} />
                        })
                    }
                </div>
            </div>
        );
    });
}


export default memo(ContentCliets)