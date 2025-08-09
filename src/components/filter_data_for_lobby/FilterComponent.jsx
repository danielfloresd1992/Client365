'use client';
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';
import { arrGroup } from '@/libs/data/group';
import { addGropupIdWhatsapp, addClientFilterList, removeClientFilterList, clearClientFilters, toogleActivateFilter, addRankByFranchise, removeRankByFranchise, loadLocalStorage } from '@/store/slices/filterAlert';
import InputBorderBlue from '@/components/inpust/InputBorderBlue';

import { setConfigModal } from '@/store/slices/globalModal';



export default function FilterNoveltyForLobby({ addAlert, openAside }) {


    const clientsStore = useSelector((store) => store.clients);
    const filterClient = useSelector((store) => store.filterClientList);
    const dispatch = useDispatch();
    const isMounted = useRef(true);
    const isMessageAlertRef = useRef(true);


    useEffect(() => {
        if (filterClient.isActivated && isMessageAlertRef.current) {
            isMessageAlertRef.current = false;
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Filtros de alertas',
                description: 'El filtrado de alertas está activado, lo que significa que solo se mostrarán las alertas de los establecimientos seleccionados.',
                type: 'warning',
            }));

            addAlert({
                title: 'Filtros de alertas',
                description: 'Seleccione los filtros de alertas que desea aplicar',
            })
            openAside();
        }

        if (isMounted.current) {
            dispatch(loadLocalStorage());
            isMounted.current = false;
        }

    }, [filterClient]);





    const handdlerOnChange = (e, id) => {
        const activator = e.target.checked;
        if (activator) {
            dispatch(addClientFilterList(id));
        }
        else {
            dispatch(removeClientFilterList(id));
        }
    };



    const checkActivate = (list, list2) => {
        const newArray = [];
        list.forEach(item => {
            const result = list2.indexOf(item);
            if (result > -1) newArray.push(item);
        });

        return list2.length === newArray.length;
    }



    const handdlerCliclResetFilter = () => {
        if (filterClient.isActivated && filterClient.clientList.length > 0) {
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Reset filtros de alertas',
                description: 'El filtrado de alertas se reseteara y se de desactivará, ¿seguro que continuar con la siguiente opción?',
                type: 'warning',
                isCallback: resetAlertAndDesactivate
            }));
        }
    };



    const resetAlertAndDesactivate = () => {
        dispatch(clearClientFilters());
        dispatch(setConfigModal({
            modalOpen: true,
            title: 'Completado',
            description: 'El filtrado de alertas se restauró',
            type: 'successfull',
            isCallback: null
        }))
    };



    if (!clientsStore || clientsStore.length === 0) {
        return <div className='w-full h-full flex items-center justify-center'>No hay datos disponibles</div>;
    }



    return (
        <div className='w-full h-full'>

            <header className='w-full h-[80px] w-full bg-[rgb(237_237_237)] p-[.5rem] flex items-center justify-between'>
                <div className='h-full w-full flex justify-start items-center flex-col gap-[.5rem]'>
                    <div className='w-full flex justify-between items-center'>
                        <div className='flex justify-start items-center flex- gap-[.5rem]'>
                            <Image src='/ico/icons8-filtro-vacío-30.png' width={30} height={30} alt='icoFILTRO' />
                            <h2 className='text-black'>filtro de alertas</h2>
                        </div>

                        <div className='flex items-center justify-center flex-row gap-[.5rem]'>
                            <div>
                                <InputBorderBlue
                                    type='toogle'
                                    disableLabelText={true}
                                    value={filterClient.isActivated}
                                    eventChengue={value => {
                                        dispatch(toogleActivateFilter(value));
                                    }}
                                />
                            </div>
                            <p style={{ color: filterClient.isActivated ? 'green' : 'red' }} className='block text-[0.8rem]'>{filterClient.isActivated ? 'filtro activado' : 'filtro apagado'}</p>
                        </div>
                    </div>
                    <div className='w-full flex justify-between items-center'>
                        <div>
                            <p className='text-[.7rem]'>Locales de entrada: {filterClient.isActivated ? filterClient.clientList.length : 0}</p>
                        </div>

                        <div>
                            <button className='flex flex-row items-center justify-center gap-[.5rem] text-[#ff0000] text-[.7rem] border border-solid rounded-[5px] p-[0.1rem]' onClick={handdlerCliclResetFilter}>
                                <Image src='/ico/icons8-cita-recurrente-48.png' width={15} height={15} alt='ico-reset' />
                                Reset
                            </button>
                        </div>
                    </div>

                </div>


            </header>

            <div className='w-full h-[calc(100%_-_380px)] bg-[#ffffff]'>
                <div className='w-full h-full overflow-y-scroll flex flex-col gap-[.5rem]'>
                    {Object.entries(groupByFranchiseComprehensive(clientsStore)).map(([franchiseName, franchiseRestaurants]) => (
                        <div key={franchiseName} className="p-[.5rem]">
                            <div className='w-full flex items-center justify-between mb-[.5rem]'>
                                <h3 className='font-medium text-sm text-justify'>{franchiseName}</h3>
                                <div className='flex items-center gap-[.5rem]'>
                                    <label className='text-sm text-justify' htmlFor={`input-${franchiseName}`} >Todos</label>
                                    <input
                                        className='cursor-pointer'
                                        type='checkbox'
                                        name={franchiseName}
                                        id={`input-${franchiseName}`}
                                        disabled={!filterClient.isActivated}
                                        //*     checked={checkActivate(filterClient.clientList, franchiseRestaurants.map(item => item._id))}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            const listFranchise = franchiseRestaurants.map(item => item._id);
                                            if (checked) {
                                                dispatch(addRankByFranchise(listFranchise));
                                            }
                                            else {
                                                dispatch(removeRankByFranchise(listFranchise));
                                            }
                                        }}
                                    />
                                </div>

                            </div>

                            <div className="grid gap-[.5rem] grid-cols-1">
                                {franchiseRestaurants.map(restaurant => (
                                    <div key={restaurant._id} className='flex items-center justify-between'>
                                        <label
                                            className='text-[0.8rem] text-[#595959] font-normal cursor-pointer'
                                            htmlFor={`input-${restaurant.name}`}>{restaurant.name}</label>
                                        <input
                                            className='cursor-pointer'
                                            type='checkbox'
                                            name={restaurant.name}
                                            id={`input-${restaurant.name}`}
                                            checked={filterClient.clientList.indexOf(restaurant._id) > -1 ? true : false}
                                            onChange={(e) => {
                                                handdlerOnChange(e, restaurant._id);
                                            }}
                                            disabled={!filterClient.isActivated}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            <div className='w-full h-[300px] bg-[rgb(237_237_237)] p-[1rem] flex gap-[1rem] flex-col'>
                <div className='w-full'>
                    <p className='text-black'>Lista de grupo de Whatsapp</p>
                    <p className='text-[0.7rem]'>Selecione un grupo para el envio de alertas</p>
                    <hr />
                </div>
                <div className='w-full flex flex-col gap-[.4rem]'>
                    {
                        arrGroup.map((group, index) => (
                            <div className='w-full' key={group.name}>
                                <div key={index} className='flex items-center justify-between mb-[.5rem]'>
                                    <div className='flex justify-center items-center flex-row gap-[.5rem]'>
                                        <div className='w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center'>
                                            <Image src={group.ico} width={30} height={30} alt='ico-group-whatsapp' />
                                        </div>
                                        <label className='text-[0.8rem] text-[#595959] font-normal' htmlFor={`input-${group.name}`}>{group.name}</label>
                                    </div>

                                    <input
                                        className='cursor-pointer'
                                        type='checkbox'
                                        checked={filterClient?.groupIdWhatsapp?.name === group.name ? true : false}
                                        name={group.name}
                                        id={`input-${group.name}`}
                                        onChange={() => dispatch(addGropupIdWhatsapp(group))}
                                    />
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}