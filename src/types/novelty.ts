export type shift = 'day' | 'night';


export type DocumentCount = {
    total: number,
    totalDocumentAbbreviate: string
}

export type DateNovelty = {
    date: string
    title: string
    createdAt: string
    updatedAt: string
};

export type DateNoveltyArr = DateNovelty[];
