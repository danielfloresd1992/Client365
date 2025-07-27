'use client'
import { useSingleFetch } from '@/hook/ajax_hook/useFetch'




export default function Content() {



    const { data, error } = useSingleFetch({ resource: '/localLigth', method: 'get' }, true);

    console.log(error)
    console.log(data);


    return (
        <div className='w-full h-full'>

        </div>
    )
}