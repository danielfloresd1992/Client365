import Publications from './assets/Publications.jsx';
//import getLastTeenNovelty from '@/libs/ajaxServer/getLastTeenNovelty.js';



export default function PublicationsBox() {

    //const dataFetchingNovelty = await getLastTeenNovelty();  // This is the server-side fetching

    return (
        <main className='main-contain'>
            <Publications dataPreRender={null} />
        </main>
    );
}