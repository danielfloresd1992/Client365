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
    addDataRequest: (data: any) => void,
    // Reemplaza un rango existente (key original, rango nuevo). Opcional:
    // si no se pasa, las tarjetas de rango no son editables.
    updateDataRequest?: (key: string, data: any) => void,
    // Copia el horario completo de un día sobre otro (arrastrar y soltar).
    // Opcional: si no se pasa, las cabeceras de día no son arrastrables.
    copyDayRequest?: (sourceDay: number, targetDay: number) => void
};



interface IScheduleMethodos{
    idLocal: string,
    configLocalDate: () => void, 
    openSetForm: () => void,
    deleteHour: () => void
};



export type { IScheduleProps, IScheduleMethodos };