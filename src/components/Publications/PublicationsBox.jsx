import Publications from './assets/Publications.jsx';
//import getLastTeenNovelty from '@/libs/ajaxServer/getLastTeenNovelty.js';



export default function PublicationsBox({ filterSignal = null }) {

    //const dataFetchingNovelty = await getLastTeenNovelty();  // This is the server-side fetching

    return (
        <main className='main-contain lobby-feed-main'>
            <header className='lobby-feed-header'>
                <div>
                    <p className='lobby-feed-kicker'>Muro operacional</p>
                    <h2 className='lobby-feed-title'>Publicaciones en tiempo real</h2>
                </div>
            </header>

            <section className='lobby-feed-content'>
                <Publications dataPreRender={null} filterSignal={filterSignal} />
            </section>
        </main>
    );
}