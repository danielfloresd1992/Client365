'use client';
import Aside from './assets/BannerConaint';
import ListClients from '@/components/TableClient/list_client';
import FormComponent from './assets/FormComponent';
import Section from '@/components/contentMain_nextToAside/Content';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';



import ClientBox from '@/components/TableClient/assets/clientBox'



export default function Content() {


    const { data, fetchData, loading } = useSingleFetch({ resource: '/establishment&compressed', method: 'get' }, true);
    const groupClients = groupByFranchiseComprehensive(data);


    return (
        <>
            <Aside clients={data} />
            <Section spaceToSubtract={300}>

                {
                    groupClients && Object.entries(groupClients).map(([key, clientGroup]) => {

                        return (
                            <div className='w-full' key={key}>
                                <div className='w-full bg-[#dddddd] p-[.5rem]'><p className='text-center font-medium text-[#636262]'>{key}</p></div>
                                <div className='w-full p-[2rem] flex items-center justify-center gap-[3rem] flex-wrap'>
                                    {
                                        clientGroup && clientGroup.map(items => {

                                            return <ClientBox data={items} key={items._id} />
                                        })
                                    }
                                </div>
                            </div>
                        )

                    })
                }

            
            </Section>
            <FormComponent />
        </>
    );
}