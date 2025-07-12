'use client';
import { memo, useEffect, useState } from 'react';

import {
    LinePlot,
    MarkPlot,
    lineElementClasses,
    markElementClasses,
    LineChart
} from '@mui/x-charts/LineChart';
import { CircularProgress } from '@mui/material';
import { getCountDocument } from '@/libs/ajaxClient/noveltyFetching'
import { ChartContainer } from '@mui/x-charts/ChartContainer';


//types

import { DateNovelty, DateNoveltyArr, DocumentCount, shift } from '@/types/novelty';



type DataForLine = {
    label?: string | undefined,
    data: []
};


interface ILineChartProps {
    title: {
        glogal: string,
        chart: string
    },
    count: number,
    data: any,
    isDouble: true | false
};



const boxChar: React.CSSProperties = {
    width: '400px',
    height: '300px'
};



function LineChartComponent({ title, count, data, isDouble }: ILineChartProps): React.ReactNode {


    const [dataReload, setDataReload] = useState<any>();
    const [values, setValues] = useState<any>();

    useEffect(() => {
        if (Array.isArray(data)) {
           
            if (isDouble) {
                //setDataReload([{ type: 'line', data: parserNoveltyToDate(data.data).values }]);
            }
            else {
                setDataReload([
                    { type: 'line', label: 'Diurno', data: parserNoveltyToDate(filterBeforeFivePM(data, 'day')).values },
                    { type: 'line', label: 'Nocturno', data: parserNoveltyToDate(filterBeforeFivePM(data, 'night')).values }
                ]);
            }
            setValues([{ scaleType: 'point', data: parserNoveltyToDate(data).keys }]);
        }



    }, [data]);



    const parserNoveltyToDate = (data: any): any => {
        const countByDay: any = {};

        for (let i = 0; i < data.length; i++) {
            const date = new Date(data[i].createdAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' }).split(' ')[0]// Obtener 

            const date2 = new Date(data[i].date);

            const hour = date2.getHours();




            if (hour < 8) {
                let dateChild = new Date(date2);
                dateChild.setDate(dateChild.getDate() - 1);

                let subtractedDate = dateChild.toLocaleString('es-VE', { timeZone: 'America/Caracas' }).split(' ')[0]

                if (countByDay[subtractedDate]) {
                    countByDay[subtractedDate]++;
                }
                else {
                    countByDay[subtractedDate] = 1;
                }
            }
            else if (hour >= 8 && hour < 17) {
                if (countByDay[date]) {
                    countByDay[date]++;
                }
                else {
                    countByDay[date] = 1;
                }
            }
            else if (hour >= 17) {
                if (date === '2024-09-03') {
                }
                if (countByDay[date]) {

                    countByDay[date]++;
                }
                else {
                    countByDay[date] = 1;

                }

            }
        }
        return {
            keys: Object.keys(countByDay),
            values: Object.values(countByDay)
        };
    };






    const filterBeforeFivePM = (data: DateNoveltyArr, shift: shift): DateNoveltyArr | undefined => {
        if (Array.isArray(data)) {
            return data.filter((item: DateNovelty) => {
                const date = new Date(item.date);

                if (shift === 'day') {
                    return date.getHours() >= 8 && date.getHours() < 17;
                }
                else if (shift === 'night') {

                    return date.getHours() < 8 || date.getHours() >= 17;
                }
                else {
                    throw new Error('parametro inválido');
                }
            });
        }
    }

    if(!dataReload || !values) return 'loading';

    return (

        <div className='p-3 shadow-custom rounded-[5px] glass flex flex-col gap-2' style={boxChar}>
            <div className='w-full '>
                <p className='text-gray-500 text-sm'>{title?.glogal}</p>
                <b className='text-xl' title={`total: ${count}`}>{count}</b>
            </div>
            <hr />
            <div className='w-full'>
                <p className='text-gray-500 text-sm'>{title?.chart}</p>
                
                <LineChart
                    height={180}
                    margin={{
                        left: 25,
                        right: 25,
                        top: 25,
                        bottom: 25,
                    }}
                    series={ dataReload }
                    xAxis={ values }
                    sx={{
                        [`& .${lineElementClasses.root}`]: {
                            stroke: '#blue',
                            strokeWidth: 2,
                        },
                        [`& .${markElementClasses.root}`]: {
                            stroke: '#000',
                            scale: '0.6',
                            fill: 'red',
                            strokeWidth: 2,
                        },
                    }}

                >
                </LineChart >

            </div>
        </div>
    )
}


export default LineChartComponent;