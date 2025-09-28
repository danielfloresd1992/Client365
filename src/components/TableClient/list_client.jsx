'use client';
import { useState, memo } from 'react';
import Table from '@/components/tablet_component/Table.jsx';
import ClientBox from './assets/clientBox';
//mport getListClient from '@/libs/ajaxServer/getListClient';
import ItenCellClien from './assets/ItenCellClien';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { groupByFranchiseComprehensive } from '../../libs/parser/estableshment';



function ContentCliets({ clients }) {


  
    if (!clients) return null;


    return clients && Object.entries(clients).map(([key, clients]) => {


        return (
            <div className='w-full' key={key}>
                <div className='w-full bg-[#dddddd] p-[.5rem]'><p className='text-center font-medium text-[#636262]'>{key}</p></div>
                <div className='w-full p-[2rem] flex items-center justify-center gap-[3rem] flex-wrap'>
                    {
                        clients && clients.map(items => {

                            return <ClientBox data={items} key={items._id} />
                        })
                    }
                </div>
            </div>
        );
    });
}


export default memo(ContentCliets)