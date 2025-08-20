interface IEstablishment {
    _id: string | undefined
}

interface IFormDishProp {
    establishment: IEstablishment,
    putData: any,
    pushData: (data: any) => void
    close: () => void
}


interface IDish {
    nameDishe: string | null,
    category: string | undefined,
    allDay: boolean
    timeLimit: any
    timeLimitSeconds: any
    idLocalRef: string | null | undefined
    showDelaySubtraction: boolean
    isPut: boolean
}



export type { IFormDishProp, IDish }