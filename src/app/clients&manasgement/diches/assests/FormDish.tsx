'use client';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { ScheduleBox } from '@/components/box/ScheduleBox';

import InputBorderBlue from '@/components/inpust/InputBorderBlue';
import BoxHours from '@/components/box/BoxHours';
import BoxButtonAddItem from '@/components/box/BoxButtonAddItem';
import useAxios from '@/hook/useAxios';
import { AxiosResponse } from 'axios';
import IP from '@/libs/ajaxClient/dataFecth';

import { IFormDishProp, IDish } from '@/interfaces/IDish';




export default function FormDish({ establishment, pushData, close }: IFormDishProp): JSX.Element {


    const [stateData, setStateData] = useState<IDish>({
        nameDishe: 'default',
        category: '',
        dayActivate: 'all'
    });

    const arrChillOption: any = [
        { value: 'drinks', text: 'bebidas' },
        { value: 'foods', text: 'aperitivos' },
    ]


    const { requestAction } = useAxios();
    const dispatch = useDispatch();



    const setDish: (event: React.FormEvent) => void = e => {
        e.preventDefault();
        requestAction({ url: `/dishes?id=${establishment._id}`, action: 'POST', body: stateData })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    pushData(response.data);
                    dispatch(setConfigModal({
                        title: 'Succeful',
                        description: 'Recurso guardado',
                        type: 'successfull',
                        callback: null,
                        modalOpen: true
                    }));

                }
            })
            .catch((error: unknown) => {
                console.log(error);
                if (error instanceof Error) {
                    console.error(error);
                }
            })
            .finally(() => {
                close();
            });
    }


    const handdlerChangueInputDish: any = (value: string) => {
        setStateData({ ...stateData, nameDishe: value });
    }


    const handdlerChangueInputCategory: any = (value: string) => {
        setStateData({ ...stateData, nameDishe: value });
    }


    return (
        <form
            className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap'
            onSubmit={setDish}
        >
            <h2 className='text_center'>Creación de nuevo plato</h2>

            <div
                className='contentDoubleLabelFlex'
            >
                <InputBorderBlue
                    textLabel='Nombre del platillo o bebida'
                    name='nameDishe'
                    value={stateData.nameDishe as any}
                    eventChengue={handdlerChangueInputDish}
                />

                <InputBorderBlue
                    textLabel='Categoria'
                    type='select'
                    name='category'
                    value={stateData.category as any}
                    childSelect={arrChillOption}
                    eventChengue={handdlerChangueInputCategory}
                />
            </div>
            <button className='btn-item'> Guardar </button>
        </form>
    );
}