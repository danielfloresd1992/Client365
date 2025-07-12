import React, { ChangeEvent, useState, useEffect }  from 'react';
import WindowFormLayaut from '@/layaut/windowForForm';


interface Iprops {
    close: () => void,
    idLocal: string,
    dayNumber: number | undefined,
    pushDateDay: (day: any) => void,
};


interface Hours {
    start: string;
    end: string;
}
  
interface Day {
    key: string;
    hours: Hours;
    dayMonitoring: number | undefined,
    idLocal: string

}



export default function Form({  close, idLocal, dayNumber, pushDateDay }: Iprops) : JSX.Element{

    const days: string[] = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado' ];

    const defaultConfig: Day = {
        dayMonitoring: Number(dayNumber),
        hours: { 
            start: '',
            end: '', 
        },
        idLocal: idLocal,
        key: `${idLocal}-00:00:00-00:00:00`
    };
    const [ day, setDay ] = useState<Day | undefined>();



    useEffect(() => {
        setDay(defaultConfig);
    }, [ ]);

    
    const handdlerSubmit:(e: React.FormEvent) => void = e => {
        e.preventDefault(); 
        pushDateDay(day);
    }


    return(
        <>
            <WindowFormLayaut
                close={ close }
            >
                <form className='form-content' onSubmit={ handdlerSubmit } >
            
                    
                    <div className='contain-center'>
                        {
                            dayNumber ? 
                                <h3>Dia: { days[ dayNumber ] }</h3>
                            :
                                null
                        }
                    </div>
                    <label className='label-item label-item--mid'> Id local
                        <input 
                            className='input-item' 
                            type="text" 
                            disabled
                            value={ idLocal }
                        />
                    </label>

                    <label className='label-item label-item--mid'> Modalidad
                        <select 
                            className='input-item' 
                            required
                            disabled
                            onChange={e => {
                                
                            }}
                        >
                            <option className='option' value='extended'>Horario extendido</option>
                            <option className='option' value='fragmented'>Horario fragmentado</option>
                        </select>
                    </label>


                    <label className='label-item label-item--mid'> Inicio de monitoreo
                        <input 
                            className='input-item' 
                            type='text'
                            placeholder='00:00:00'
                            required
                            pattern='^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$'
                            maxLength={ 8 }
                            onChange={ (e: ChangeEvent<HTMLInputElement>) => {
                                if(dayNumber){
                                    setDay({ ...day,
                                            key: `${idLocal}-${e.target.value}-${day?.hours.end}-${days[dayNumber]}` ,
                                            hours: { 
                                            ...day?.hours,
                                            start: e.target.value
                                        } 
                                    } as Day );
                                }
                            }}
                        />
                    </label>

                    <label className='label-item label-item--mid'> Fin del monitoreo
                        <input 
                            className='input-item' 
                            type='text'
                            placeholder='23:59:59'
                            required
                            pattern='^(([0-1]\d)|(2[0-3]))(:[0-5]\d){2}$'
                            maxLength={ 8 }
                            onChange={ (e: ChangeEvent<HTMLInputElement>) => {
                                if(dayNumber){
                                    setDay({ 
                                        ...day, 
                                        key: `${idLocal}-${day?.hours.start}-${e.target.value}-${days[dayNumber]}` ,
                                        hours: { 
                                        ...day?.hours,
                                        end: e.target.value
                                        } 
                                    } as Day);
                                }
                            }}
                        />
                    </label>

                    <div className='contain-center'>
                        <button className='btn-item'>Guardar</button>
                    </div>
                </form>

            </WindowFormLayaut>
        </>
    );
}