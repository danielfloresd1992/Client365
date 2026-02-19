import { useState, useEffect, useImperativeHandle, forwardRef, useContext } from 'react';
import { myUserContext } from '@/contexts/userContext';
import {  isSameDay,  getDay ,isBefore, startOfDay} from 'date-fns';
import { userById, } from '@/libs/ajaxClient/user.fecth';



export default forwardRef(function UserList({ user, daysRange, onEditClick }, ref) {


    const userState = user

    const {dataSessionState} = useContext(myUserContext);


    const remplazeUrl = (url) => {
        if(!url) return null;

        return 'https://amazona365.ddns.net:3006' +  url.split('https://amazona365.ddns.net')[1]
    };



    const updateUser = user => {
       
    };




    useImperativeHandle(ref, () => ({
        updateUserInList: updateUser
    }));


    if(user.workSchedule.outForkSchedule) return null;


    return (
        <div className='flex border-b border-gray-300 hover:bg-gray-50 transition-colors'>

            {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
            <div className='sticky left-0 z-9 w-48 min-w-[12rem] bg-white border-r border-gray-300 flex items-center flex-col gap-2'>
                <div className='w-full flex items-center gap-3'>

                    <div className={`w-[60px] h-[65px] rounded-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600`} title={dataSessionState?.dataSession?.name === 'Sorielis' && userState?.name === 'Sorielis' ? 'Te quiero mucho💝' : userState?.dni}>
                        <img className='w-full h-full object-cover' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                        
                        {/*user.name.charAt(0)*/}
                    </div>
                    
                    <div>
                        <p className='text-xs font-semibold text-[16px] text-gray-800 truncate'>{userState?.name}</p>
                        <p className='text-xs font-semibold text-[12px] text-gray-800 truncate'>{userState?.surName}</p>
                        <p className='text-xs text-gray-500'>{userState?.jobInformation?.position || 'Sin definir'}</p>
                    </div>
                    <button 
                        onClick={() => onEditClick(userState)}
                        className='absolute top-[5px] right-[5px] pointer'>
                        <img className='w-[30px] opacity-30 hover:opacity-100' src='/ico/icons8-configuración-48.png' alt='config-ico-09' />
                    </button>
                </div>
               
            </div>

            {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
            {daysRange.map((day) => {
                const today = startOfDay(new Date());
                const currentCellDate = startOfDay(day.dateObj);


                const isPast = isBefore(currentCellDate, today); // ¿Ya pasó?
                const isToday = isSameDay(currentCellDate, today); // ¿Es hoy?
                const isFuture = !isPast && !isToday; // ¿Es un día futuro?
                // const data = getCellData(user.id, day.dateObj);
                // 1. Obtenemos el número del día actual de la celda (0-6)
                const currentDayNumber = getDay(day.dateObj);

                // 2. Obtenemos los días libres del usuario (asegurando que sea un array)
                // Si aún no ha cargado userState, asumimos array vacío []
                const restDays = userState?.workSchedule?.restDays || [];
               
                let isRestDay = restDays[currentDayNumber] ? true : false; // TOCA EL DÍA LIBRE
                const isWeekend = day.dayName === 'dom' || day.dayName === 'sáb';
   

                if(isPast) return(
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 p-1 border-r border-gray-300  flex items-center justify-center 
                            ${day.isToday ? 'bg-blue-50/20' : ''}`}
                    >
                            {/*
                                <div className={`w-full h-full flex items-center justify-center bg-red-400 rounded-md'`}>
                                    <span className='text-black text-[12px] font-bold'>FALTA</span>
                                </div>
                            */}
                        <div title='No hay registro del usuario en este día' className={`w-full h-full flex items-center justify-center bg-gray-200 rounded-md'`}>
                            <span className='text-gray-600 text-[12px] font-bold'>Sin registro</span>
                        </div>
                
                    </div>
                );
                

                return (
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 p-1 border-r border-gray-300 flex items-center justify-center 
                            ${day.isToday ? 'bg-blue-50/20' : ''}`}
                    >
    
                            <div className={`w-full h-full flex items-center justify-center ${isRestDay ? 'bg-stripes rounded-md' : ''}`}>
                                {isRestDay ? (
                                    <span className='text-green-600 text-[10px] font-bold'>LIBRE</span>
                                ) : (
                                    /* 3. Día laborable normal sin info aún */
                                    <span className='text-gray-500 text-[12px]'>Guardia</span>
                                )}
                            </div>
                
                    </div>
                );
            })}
        </div>
    );
});