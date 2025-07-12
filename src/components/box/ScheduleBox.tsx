'use client';
import React, { useState, useRef } from 'react';
import { IScheduleProps } from '@/interfaces/ISchedule';
import BoxHours from '@/components/box/BoxHours';
import BoxButtonAddItem from '@/components/box/BoxButtonAddItem';
import Form from '@/components/box/Form';


const ScheduleBox: React.FC<IScheduleProps> = ({ idLocal, configLocalDate , openSetForm, deleteHour, addDataRequest }) =>{

    const [ openForm, setOpenForm  ] = useState<boolean>(false);
    const dayRef = useRef<number | undefined>(undefined);

    const style_for_file = {
        backgroundColor: '#fff',
        outline: '1px solid #919191',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '.5rem'
    };
    
    
    const file_title = {
        textAlign: 'center',
        padding: '1rem',
        backgroundColor: '#ddd',
        width: '100%',
    };


    const openSetFormHook: (day: number) => void = (day) => {
        dayRef.current = day;
        setOpenForm(true);
    };


    const closeSetFormHook: () => void = () => {
        dayRef.current = undefined;
    };
    

    const pushDateDay: (dataForRequest : any) => void = dataForRequest => {
        addDataRequest(dataForRequest);
        closeSetFormHook();
    } 

    
    return(
        <>
        <section className='content-seach'
            style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
            } as React.CSSProperties}
        >
            <div className='filesContains'
                style={{
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    width: '100%'
                } as React.CSSProperties}
            >
                <div className='file' style={style_for_file as React.CSSProperties} >
                    <p className='file-title' style={file_title as React.CSSProperties} >Lunes</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 1) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={1} openSetForm={ openSetFormHook } />
                </div>

                <div className='file' style={style_for_file as React.CSSProperties}>
                    <p className='file-title' style={file_title as React.CSSProperties} >Martes</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 2) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={2} openSetForm={ openSetFormHook } />
                </div >
                    
                <div className='file' style={style_for_file as React.CSSProperties}>
                    <p className='file-title' style={file_title as React.CSSProperties}  >Miercoles</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 3) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={3} openSetForm={ openSetFormHook } />
                </div>

                <div className='file' style={style_for_file as React.CSSProperties}>
                    <p className='file-title' style={file_title as React.CSSProperties}  >Jueves</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 4) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={4} openSetForm={ openSetFormHook } />
                </div>

                <div className='file' style={style_for_file as React.CSSProperties}>
                    <p className='file-title' style={file_title as React.CSSProperties}  >Viernes</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 5) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={5} openSetForm={ openSetFormHook } />
                </div>
                    
                <div className='file' style={style_for_file as React.CSSProperties}>
                    <p className='file-title' style={file_title as React.CSSProperties}  >Sabado</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 6) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={6} openSetForm={ openSetFormHook } />
                </div>

                <div className='file' style={style_for_file as React.CSSProperties} >
                    <p className='file-title' style={file_title as React.CSSProperties}  >Domingo</p>
                    <BoxHours arr={ configLocalDate.filter(day => day.dayMonitoring === 0) } deleteHour={ deleteHour } />
                    <BoxButtonAddItem day={0} openSetForm={ openSetFormHook } />
                </div>
            </div>
        </section>
        {

            openForm  ? 
                (
                    <Form 
                        close={ closeSetFormHook }
                        idLocal={ idLocal } 
                        dayNumber={ Number(dayRef.current)  } 
                        pushDateDay={ pushDateDay } 
                    />
                )
                :
                (
                    null
                )
        
        }
        </>
    );
}

export { ScheduleBox }