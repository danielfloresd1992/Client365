'use client';
import List from './List.jsx';
import { useSingleFetch } from '@/hook/ajax_hook/useFetch'




export default function ListClient() {

    const { data, error } = useSingleFetch({ resource: '/localLigth', method: 'get' }, true);

    return (
        <>
            <ul className='listRoute-a-menuTitle scrolltheme1 flex columns'>
                {
                    Array.isArray(data) ?
                        data.map((item) => (
                            <List data={item} key={item._id} />
                        ))
                        :
                        null
                }
            </ul>
        </>
    );
}