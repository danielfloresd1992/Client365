'use client';
/**
 * FormDish.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario de creación y edición de platos de un establecimiento.
 *
 *   • Crear  → POST /dishes?id=:localId
 *   • Editar → PUT  /dishes/id=:dishId   (cuando stateData.isPut === true)
 *
 * Props (IFormDishProp):
 *   establishment  – local al que pertenece el plato (aporta _id)
 *   putData        – plato a editar; si viene, el form arranca en modo edición
 *   pushData       – callback para añadir el plato recién creado a la lista
 *   close          – cierra el modal
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useDispatch }                from 'react-redux';
import { AxiosResponse }              from 'axios';

import { setConfigModal }    from '@/store/slices/globalModal';
import InputBorderBlue       from '@/components/inpust/InputBorderBlue';
import useAxios              from '@/hook/useAxios';
import timeToMilliseconds    from '@/libs/time/string_to_milliseconds';
import { IFormDishProp, IDish } from '@/interfaces/IDish';


/* ── Opciones de categoría del plato ───────────────────────────────────────── */
const CATEGORY_OPTIONS: any = [
    { value: 'desserts_and_sweets', text: 'postres y  dulces' },
    { value: 'drinks',              text: 'bebidas' },
    { value: 'food',                text: 'aperitivos' },
];


export default function FormDish({ establishment, putData, pushData, close }: IFormDishProp): JSX.Element {

    const { requestAction } = useAxios();
    const dispatch          = useDispatch();

    const [stateData, setStateData] = useState<IDish>({
        nameDishe: '',
        category: '',
        allDay: true,
        timeLimit:        { day: '00:05:00', night: '00:05:00' },
        timeLimitSeconds: { day: 300000,     night: 300000 },
        showDelaySubtraction: false,
        idLocalRef: establishment._id,
        requiresTableNumber: true,
        isPut: false,
    });


    /* ── Pre-rellenar en modo edición ──────────────────────────────────────── */
    useEffect(() => {
        if (putData) setStateData(putData);
    }, []);


    /* ── Envío del formulario ──────────────────────────────────────────────── */
    const handdlerSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        stateData.isPut ? putDish() : setDish();
    };

    const setDish = (): void => {
        requestAction({ url: `/dishes?id=${establishment._id}`, action: 'POST', body: stateData })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    pushData(response.data);
                    dispatch(setConfigModal({
                        title: 'Succeful', description: 'Recurso guardado',
                        type: 'successfull', callback: null, modalOpen: true,
                    }));
                    close();
                }
            })
            .catch((error: unknown) => console.error(error));
    };

    const putDish = (): void => {
        requestAction({ url: `/dishes/id=${stateData._id}`, action: 'PUT', body: { ...stateData, idLocalRef: establishment._id } })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    dispatch(setConfigModal({
                        title: 'Succeful', description: 'Recurso actualizado',
                        type: 'successfull', callback: null, modalOpen: true,
                    }));
                    close();
                }
            })
            .catch((error: unknown) => console.error(error));
    };


    /* ── Handlers de campos ────────────────────────────────────────────────── */
    const handdlerChangueInputDish: any     = (value: string)  => setStateData({ ...stateData, nameDishe: value });
    const handdlerChangueInputCategory: any = (value: string)  => setStateData({ ...stateData, category: value });
    const changeToggleShowDelaySubtraction: any = (value: boolean) => setStateData({ ...stateData, showDelaySubtraction: value });
    const changeToggle: any                 = (value: boolean) => setStateData({ ...stateData, allDay: value });
    const changeConfigNumberTable: any      = (value: boolean) => setStateData({ ...stateData, requiresTableNumber: value });

    const changeShiftDay: any = (value: string): void => setStateData({
        ...stateData,
        timeLimit:        { ...stateData.timeLimit,        day: value },
        timeLimitSeconds: { ...stateData.timeLimitSeconds, day: timeToMilliseconds(value) },
    });

    const changeShiftNight: any = (value: string): void => setStateData({
        ...stateData,
        timeLimit:        { ...stateData.timeLimit,        night: value },
        timeLimitSeconds: { ...stateData.timeLimitSeconds, night: timeToMilliseconds(value) },
    });


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <form
            className='__margin100px form_complete_andScroll bgWhite __border-smoothed __padding1rem __flexRowFlex __oneGap'
            onSubmit={handdlerSubmit}
        >
            <h2 className='text_center'>Creación de nuevo plato</h2>

            <div className='contentDoubleLabelFlex'>
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
                    childSelect={CATEGORY_OPTIONS}
                    eventChengue={handdlerChangueInputCategory}
                />
            </div>

            <hr />

            <p>Tiempo en formato: 00:00:00</p>
            <div className='contentDoubleLabelFlex'>
                <InputBorderBlue
                    textLabel='Diurno'
                    name='Diurno: 00:00:00'
                    value={stateData?.timeLimit?.day as any}
                    eventChengue={changeShiftDay}
                />
                <InputBorderBlue
                    textLabel='Nocturno'
                    name='Diurno: 00:00:00'
                    value={stateData?.timeLimit?.night as any}
                    eventChengue={changeShiftNight}
                />
            </div>

            <hr />

            <p>Tiempo en milisegundos</p>
            <div className='contentDoubleLabelFlex'>
                <InputBorderBlue
                    textLabel='Diurno'
                    name='Diurno: timeLimitSeconds'
                    value={stateData?.timeLimitSeconds?.day as any}
                    eventChengue={changeShiftDay}
                />
                <InputBorderBlue
                    textLabel='Nocturno'
                    name='Diurno: timeLimitSeconds'
                    value={stateData?.timeLimitSeconds?.night as any}
                    eventChengue={changeShiftDay}
                />
            </div>

            <hr />

            <div className='w-full'>
                <div className='w-[30%]'>
                    <InputBorderBlue
                        textLabel='Mostrar resta de la demora'
                        type='toogle'
                        name='restingDelay'
                        value={stateData.showDelaySubtraction as any}
                        eventChengue={changeToggleShowDelaySubtraction}
                    />
                </div>
                <br />
                <div className='w-[30%]'>
                    <InputBorderBlue
                        textLabel='Duración todo el día'
                        type='toogle'
                        name='allDay'
                        value={stateData.allDay as any}
                        eventChengue={changeToggle}
                    />
                </div>
            </div>

            <div className='w-full'>
                <InputBorderBlue
                    textLabel='¿añadir número de mesa?'
                    type='checkbox'
                    name=''
                    value={stateData.requiresTableNumber as any}
                    eventChengue={changeConfigNumberTable}
                />
            </div>

            <br />
            {stateData?.idLocalRef}
            <br />

            <button className='btn-item'>{stateData.isPut ? 'Actualizar' : 'Guardar'}</button>
        </form>
    );
}
