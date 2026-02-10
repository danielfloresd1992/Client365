'use client';

import { useState } from 'react';
import { addDays, subDays, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';


export const generate30DayRange = (baseDate) => {
    const startDate = subDays(baseDate, 15); // 15 días atrás
    const endDate = addDays(baseDate, 15);   // 15 días adelante

    // Genera un array con todos los objetos Date entre inicio y fin
    const range = eachDayOfInterval({ start: startDate, end: endDate });

    return range.map(date => ({
        fullDateISO: date.toISOString(), // Para buscar en la DB
        dayNumber: format(date, 'd'),
        dayName: format(date, 'eee', { locale: es }), // lun, mar...
        monthName: format(date, 'MMM', { locale: es }),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        day: date.getDate(),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    }));
};




export default function User() {

    const [pivotDate, setPivotDate] = useState(new Date());
    const daysRange = useMemo(() => generate30DayRange(pivotDate), [pivotDate]);

    console.log(daysRange);

    return (
        <div>
            <h1>Página de usuarios</h1>
        </div>
    );
}