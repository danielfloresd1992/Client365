interface IEstablishment{
    _id: string | undefined
}

interface IFormDishProp{
    establishment: IEstablishment,
    pushData: (data: any) => void
    close: () => void
}


interface IDish{
    nameDishe: string | null,
    category: string | undefined,
    dayActivate: string | undefined
}



export type { IFormDishProp, IDish }