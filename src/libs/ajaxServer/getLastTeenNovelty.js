import dataFecthServer from './dataFecthServer';



export default async function getLastTeenNovelty(){
    const url = `https://${ dataFecthServer() }/user/publisher/paginate=0/items=10`;
    const response = await fetch(url, { 
        cache: 'no-store'
    });
    const data = await response.json();
    const sortedPublisher = data.sort(( a, b )=> {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return  dateB - dateA;
    });
    return sortedPublisher;
}