'use client';
import List from './List.jsx';
import { useSelector } from 'react-redux';



export default function ListClient() {


    const client = useSelector(store => store.clients);
    const clientList = Array.isArray(client) ? client : [];
    const totalClients = clientList.length;

    return (
        <div className='lobby-client-list-wrap'>
            <div className='lobby-client-list-head'>
                <p className='lobby-client-list-subtitle'>Directorio operativo</p>
                <span className='lobby-client-list-count'>{totalClients}</span>
            </div>

            <ul className='listRoute-a-menuTitle scrolltheme1 flex columns lobby-client-list'>
                {
                    totalClients > 0 ?
                        clientList.map((item) => (
                            <List data={item} key={item._id} />
                        ))
                        :
                        <li className='lobby-client-empty'>No hay clientes para mostrar</li>
                }
            </ul>
        </div>
    );
}