'use client';
import Aside from './assets/BannerConaint';
import ListClients from '@/components/TableClient/list_client';
import FormComponent from './assets/FormComponent';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';




export default function Content() {


    const { data, fetchData, loading } = useSingleFetch({ resource: '/establishment&compressed', method: 'get' }, true);
    const groupClients = groupByFranchiseComprehensive(data);


    return (
        <>
            <Aside clients={data} />
            <div className='w-[calc(100%-256px)] h-full overflow-y-scroll'>
                <ListClients clients={groupClients} />
            </div>

            <FormComponent />
        </>
    );
}