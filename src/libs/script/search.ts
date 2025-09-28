import Fuse from "fuse.js"




export default function key_search(list: any[], keys: string[], value: string): any[] {

    const option = {
        includeScore: true,
        keys: keys,
        threshold: 0.2
    }

    const fuse = new Fuse(list, option);
    const resultSearch = fuse.search(value);
    const pureResult = resultSearch.map(items => items.item);
    return pureResult;
}