'use client';
import { useSelector } from 'react-redux';
import AppManagerConfigStorange from '@/libs/app_manager_config_DB';
import BoxConfigForWindow from '@/layaut/BoxConfigForWindow';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';


export default function ListDayGoal(){

    
    const isAdminSession = useSelector(state => state.isAdminSession);


    return(
        isAdminSession ?
            <BoxConfigForWindow 
                titleText='Configuración de metas del dia para el reporte de alertas'
                style={{ display: isAdminSession ? 'block' : 'none' }}
            >
                <div className='__width-complete flex __midGap __wrap __onePadding'>
                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Lunes D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-1-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-1-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Lunes N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-1-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-1-nocturno', value);
                            }}
                        />
                    </div>
                    
                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Martes D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-2-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-2-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Martes N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-2-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-2-nocturno', value);
                            }}
                        />
                    </div>

                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Miercoles D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-3-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-3-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Miercoles N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-3-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-3-nocturno', value);
                            }}
                        />
                    </div>

                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Jueves D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-4-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-4-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Jueves N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-4-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-4-nocturno', value);
                            }}
                        />
                    </div>

                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Viernes D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-5-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-5-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Viernes N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-5-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-5-nocturno', value);
                            }}
                        />
                    </div>

                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Sabado D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-6-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-6-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Sabado N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-6-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-6-nocturno', value);
                            }}
                        />
                    </div>

                    <div className='flex __midGap' style={{ width: '100%' }}>
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Domingo-D'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-0-diurno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-0-diurno', value);
                            }}
                        />
                        <InputBorderBlue
                            type='number'
                            important={ true }
                            disable={ !isAdminSession }
                            textLabel='Domingo N'
                            value={ Number(AppManagerConfigStorange.get('goalAlert-0-nocturno')) || '' }
                            eventChengue={value => {
                                AppManagerConfigStorange.set('goalAlert-0-nocturno', value);
                            }}
                        />
                    </div>
                    
                </div>

                <div>
                    <blockquote className='t-black t-09rem'>Nota: Solo aplica para sessiones con cuentas de admistrador</blockquote>
                </div>
            </BoxConfigForWindow>
        :
            null
    );
}