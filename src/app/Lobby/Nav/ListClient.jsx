import List from './List.jsx';
import getListClient from '@/libs/ajaxServer/getListClient';


export default async function ListClient(){

    const listClient = await getListClient(false);

    return (
        <>
            <ul className='listRoute-a-menuTitle scrolltheme1 flex columns'>
                {
                    Array.isArray(listClient) ?
                        listClient.map((item, index) => (
                            <List data={item} key={index} />
                        ))
                    :
                        null
                }
            </ul>
        </>
    );
}