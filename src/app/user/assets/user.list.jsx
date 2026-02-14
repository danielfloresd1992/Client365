import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {  isSameDay,  getDay ,isBefore, startOfDay} from 'date-fns';
import { userById, } from '@/libs/ajaxClient/user.fecth';



export default forwardRef(function UserList({ user, daysRange, onEditClick }, ref) {


    const userState = user




    const remplazeUrl = (url) => {
        if(!url) return null;

        return 'https://amazona365.ddns.net:3006' +  url.split('https://amazona365.ddns.net')[1]
    };



    const updateUser = user => {
       
    };




    useImperativeHandle(ref, () => ({
        updateUserInList: updateUser
    }));



    return (
        <div className='flex border-b border-gray-300 hover:bg-gray-50 transition-colors'>

            {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
            <div className='relative sticky left-0 z-10 w-48 min-w-[12rem] bg-white border-r border-gray-300 p-2 flex items-center flex-col gap-2'>
                <div className='w-full flex items-center gap-3'>

                    <div className={`w-10 h-10 rounded-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600`}>
                        <img className='w-full h-full object-contain' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                        
                        {/*user.name.charAt(0)*/}
                    </div>
                    
                    <div>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.name}</p>
                        <p className='text-xs font-semibold text-gray-800 truncate'>{userState?.surName}</p>
                    </div>
                    <button 
                        onClick={() => onEditClick(userState)}
                        className='absolute right-[10px] pointer'                        >
                        <span className="text-[10px] text-[#001fff] font-bold">EDITAR</span>
                    </button>
                </div>
                <p className='text-xs text-gray-500'>{userState?.jobInformation?.position || 'Sin definir'}</p>
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
                        className={`flex-shrink-0 w-24 h-20 p-1 border-r border-gray-300  flex items-center justify-center 
                            ${day.isToday ? 'bg-blue-50/20' : ''}`}
                    >
    
                            <div className={`w-full h-full flex items-center justify-center bg-red-400 rounded-md'`}>
                             
                                <span className='text-black text-[10px] font-bold'>FALTA</span>
                             
                             </div>
                
                    </div>
                );
                

                return (
                    <div
                        key={`${user._id}-${day.fullDateISO}`}
                        className={`flex-shrink-0 w-24 h-20 p-1 border-r border-gray-300 flex items-center justify-center 
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