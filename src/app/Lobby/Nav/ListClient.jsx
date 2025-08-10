'use client';
import List from './List.jsx';
import { useSelector } from 'react-redux';



export default function ListClient() {


    const client = useSelector(store => store.clients);

    return (
        <>
            <ul className='listRoute-a-menuTitle scrolltheme1 flex columns'>
                {
                    Array.isArray(client) ?
                        client.map((item) => (
                            <List data={item} key={item._id} />
                        ))
                        :
                        null
                }
            </ul>
        </>
    );
}