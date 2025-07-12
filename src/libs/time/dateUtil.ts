type DateIn = `${string}-${string}-${string}` | undefined



interface IFormtDate {
    dateIn: DateIn | undefined,
    date30DaysAgo: (format: boolean) => void,
    getDatesFrom: () => [ DateIn ],
    getTodayDateNow:() => DateIn
}



export class FormtDate implements IFormtDate {

    dateIn: DateIn = undefined;


    
    
    
    constructor(date: DateIn) {  
        const dateDefault: DateIn  = this.getTodayDateNow();
        date ? this.dateIn = date : this.dateIn = dateDefault;
    }

    
    public date30DaysAgo = (format: boolean = false): string => {
        const now = new Date();
        now.setDate(now.getDate() - 30);
        if(format){
            /*
                DATE FOR THE NEXT CONSULTATION 
                EXAPLE:  https://jarvis365.net:3006/api_jarvis_dev/v1/noveltie/since=08-02-2024/until=09-13-2024/establishments=Francisca%20Doral
            */
                const date = now.toISOString().split('T')[0].split('-');
            return `${date[1]}-${date[2]}-${date[0]}`
        }
        else {
            return now.toString();
        }
    }


    public getDatesFrom = ():any => {
        const dates = [];
        if(this.dateIn){
            const [month, day, year] = this.dateIn.split('-');
            const baseDate = new Date(`${year}-${month}-${day}`);
        
            for (let i = 0; i < 30; i++) {
                const date = new Date(baseDate);
                date.setDate(baseDate.getDate() - i);
                const formattedDay = String(date.getDate()).padStart(2, '0');
                const formattedMonth = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son 0-indexados
                const formattedYear = date.getFullYear();
                dates.push(`${formattedMonth}-${formattedDay}-${formattedYear}`);
            }
        }
    
        return dates.toReversed();
    }


    getTodayDateNow = (): DateIn => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son 0-indexados
        const year = today.getFullYear();
        return `${month}-${day}-${year}`;
    }
}



