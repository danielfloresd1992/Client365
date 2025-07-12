import Publications from './assets/Publications.jsx';
import getLastTeenNovelty from '@/libs/ajaxServer/getLastTeenNovelty.js';


export default async function PublicationsBox(){

    const dataFetchingNovelty = await getLastTeenNovelty();

    return(
        <main className='main-contain' style={{ height: '100vh' }}>
            <Publications dataPreRender={ dataFetchingNovelty } />
        </main>
    );
}