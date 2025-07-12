import Publications from './assets/Publications.jsx';
import getLastTeenNovelty from '@/libs/ajaxServer/getLastTeenNovelty.js';
import { getInClientLastTeenNovelty } from '@/libs/ajaxClient/noveltyFetching.ts';



export default function PublicationsBox() {

    //const dataFetchingNovelty = await getLastTeenNovelty();  // This is the server-side fetching



    return (
        <main className='main-contain' style={{ height: '100vh' }}>
            <Publications dataPreRender={null} />
        </main>
    );
}