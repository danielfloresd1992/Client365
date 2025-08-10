'use client';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';




export default function AlertInputLive() {


    const clients = useSelector(store => store.clients);
    const filterAlert = useSelector(state => state.filterClientList);


    return (
        <div className='w-full h-full flex flex-col'>
            <header className='w-full h-[80px] w-full bg-[rgb(237_237_237)] p-[.5rem] flex flex-col items-center justify-between'>
                <div className='w-full flex justify-start items-center flex- gap-[.5rem]'>
                    <h2 className='text-black'>Reporte de alertas</h2>
                </div>
                <div className='w-full flex justify-start items-center flex- gap-[.5rem]'>
                    <button className='px-[0.2rem] py-[0.1rem] text-[.8rem] text-[green] border border-solid rounded-[5px]'>Generar indicador</button>
                    <button className='px-[0.2rem] py-[0.1rem] text-[.8rem] text-[red] border border-solid rounded-[5px]'>Generar nuevo turno</button>
                </div>
            </header>

            <div className='w-full h-[calc(100%_-_80px)] overflow-y-scroll'>
                {
                    Object.entries(groupByFranchiseComprehensive(clients)).map(([franchiseName, franchiseRestaurants]) => (
                        <div key={franchiseName} className='p-[.5rem] flex flex-col gap-[1rem]'>
                            <div className='w-full flex items-center justify-between mb-[.5rem]'>
                                <h3 className='font-medium text-sm text-justify'>{franchiseName}</h3>
                                <div className='flex items-center gap-[.5rem]'>
                                    <p className='text-sm text-justify' htmlFor={`input-${franchiseName}`} >Total: {0}</p>
                                </div>

                            </div>

                            <div className="grid gap-[.5rem] grid-cols-1">
                                {franchiseRestaurants.map(restaurant => {
                                    if (filterAlert.isActivated && filterAlert?.clientList?.length > 0 && filterAlert?.clientList.indexOf(restaurant._id) < 0) return null;
                                    return (
                                        <div key={restaurant._id} className='w-full flex items-center justify-between'>
                                            <div className='flex justify-center items-center gap-[.5rem]'>
                                                <div className='w-[30px] h-[30px] overflow-hidden bg-[#dddddd] flex justify-center items-center'>
                                                    <img src={restaurant?.image ?? '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'} alt='ico-restaurastnr' />
                                                </div>
                                                <label className='text-[0.8rem] text-[rgb(51_48_48)] font-normal cursor-pointer' htmlFor={`input-${restaurant.name}-alert`} >{restaurant.name}</label>
                                            </div>

                                            <div className='flex flex-row gap-[.5rem]'>
                                                <input className='cursor-pointer w-[50px] text-center' min='0' max='100' value='0' type='number' name={`${restaurant.name}-alert`} id={`input-${restaurant.name}-alert`} />
                                                <input className='cursor-pointer w-[50px] text-center' min='0' max='100' value='0' type='number' name={`${restaurant.name}-highlighter`} id={`input-${restaurant.name}-highlighter`} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='w-full flex items-center gap-[.5rem] flex justify-between'>
                                <p className='font-medium text-sm text-justify text-black'>Locales caidos:</p>
                                <input className='w-[50px] p-[0_1rem_0_0] text-center' type='text' value={0} readOnly />
                            </div>
                            <hr style={{ color: '#000' }} />
                        </div>
                    ))
                }
            </div>
        </div>
    );
}