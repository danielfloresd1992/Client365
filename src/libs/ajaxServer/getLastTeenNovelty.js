import dataFecthServer from './dataFecthServer';



export default async function getLastTeenNovelty() {
    try {
        const url = `https://${dataFecthServer()}/user/publisher/paginate=0/items=10`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const sortedPublisher = data.length > 0 && data.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
        return sortedPublisher;
    }
    catch (error) {
        console.error('Error fetching last teen novelty:', error);
        return [];
    }
};