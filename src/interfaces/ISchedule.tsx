interface Ihours{
    start: string;
    end: string;
};



interface IObjectDate{
    dayMonitoring: number | undefined,
    key: string,
    hours: Ihours,
    idLocal: string
};



interface IScheduleProps extends HTMLFormElement{
    
    idLocal: string,
    configLocalDate: IObjectDate[], // Reemplaza 'any' con el tipo de datos que se almacenará en el arreglo
    openSetForm: () => void, // Reemplaza 'void' con el tipo de retorno del método, si hay alguno
    deleteHour: () => void, // Reemplaza 'void' con el tipo de retorno del método, si hay alguno
    pushDateDay: () => void,
    addDataRequest: (data: any) => void
};



interface IScheduleMethodos{
    idLocal: string,
    configLocalDate: () => void, 
    openSetForm: () => void,
    deleteHour: () => void
};



export type { IScheduleProps, IScheduleMethodos };