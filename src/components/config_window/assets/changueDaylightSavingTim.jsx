'use client';
import { useState, useEffect } from 'react';
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import IP from '@/libs/ajaxClient/dataFecth';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import BoxConfigForWindow from '@/layaut/BoxConfigForWindow';

export default function ChangueDaylightSavingTime() {

    const [state, setState] = useState(null);

    useEffect(() => {
        axiosStand.get(`https://${IP}/time`)
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    setState(response.data.IsDaylightSavingTime);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, []);


    const handlerRequestChangeDaylightSaving = async value => {
        try {
            const response = await axiosStand.put(`https://${IP}/time?newBooleranValue=${value}`);
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
    };


    return (
        state !== null ?
            <BoxConfigForWindow titleText='Configuración cuenta '>
                <div className='_center_center columns __flex-between __oneGap'>
                    <InputBorderBlue
                        type='checkbox'
                        textLabel='¿Horario de invierno?'
                        value={state}
                        eventChengue={value => {
                            handlerRequestChangeDaylightSaving(value);
                        }}
                    />
                </div>
            </BoxConfigForWindow>
            :
            null
    );
}