'use client';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import BannerConfigAlert from './assets/BannerConfig';
import ContainForm from './assets/ContainForm/ContentForm.jsx';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';


export default function AlertInputLive() {


    const clients = useSelector(store => store.clients);



    return (
        <div className='w-full h-full flex flex-col'>
            <header className='w-full h-[80px] w-full bg-[rgb(237_237_237)] p-[.5rem] flex items-center justify-between'>
                <div className='h-full flex justify-start items-center flex- gap-[.5rem]'>
                    <h2 className='text-black'>Reporte de alertas</h2>
                </div>

                <div className=''>
                    <button
                        className='__pointer'
                        style={{}}
                        title='Generar reporte'

                    >
                        <img className='__never-pointer' style={{ width: '20px' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAyUlEQVR4nO3UsU4CURCF4duBoSD0WKGdLwc+hiIPRG2C76AEKBYjtfVnNk7lks2u3NvxV5u9yTnJzJ9J6UppMMQKR1R4qf/lLFhpssxZcIzQOR7juypRsMhegBtsz4zoKUf4COsI/MZXLPkZg4tswBivEX7AfTYbMMFbvO8wu8SGNt4x7RQeBfVY/trQxgdu+xQsu9jgd0SbeN/jrmvBMEqqVhtSY8n1aB9SbjQ1PWW/RRjELoreos/St6gqdov62Pdv9LDvSjrHD3ImK1d4iq3tAAAAAElFTkSuQmCC' alt="" />
                    </button>
                </div>
            </header>

            <div className='w-full h-[calc(100%_-_80px)] overflow-y-scroll'>
                {
                    Object.entries(groupByFranchiseComprehensive(clients)).map(([franchiseName, franchiseRestaurants]) => (
                        <div key={franchiseName} className="p-[.5rem]">
                            <div className='w-full flex items-center justify-between mb-[.5rem]'>
                                <h3 className='font-medium text-sm text-justify'>{franchiseName}</h3>
                                <div className='flex items-center gap-[.5rem]'>
                                    <p className='text-sm text-justify' htmlFor={`input-${franchiseName}`} >Total: {0}</p>
                                </div>

                            </div>

                            <div className="grid gap-[.5rem] grid-cols-1">
                                {franchiseRestaurants.map(restaurant => (
                                    <div key={restaurant._id} className='w-full flex items-center justify-between'>
                                        <div className='flex justify-center items-center gap-[.5rem]'>
                                            {
                                                console.log(restaurant)
                                            }
                                            <div className='w-[20px] h-[20px] rounded-full overflow-hidden bg-[#dddddd]'>

                                            </div>
                                            <label className='text-[0.8rem] text-[#595959] font-normal cursor-pointer' htmlFor={`input-${restaurant.name}-alert`} >{restaurant.name}</label>
                                        </div>

                                        <div className='flex flex-row gap-[.5rem]'>
                                            <input className='cursor-pointer w-[50px] text-center' min='0' max='100' value='0' type='number' name={`${restaurant.name}-alert`} id={`input-${restaurant.name}-alert`} />
                                            <input className='cursor-pointer w-[50px] text-center' min='0' max='100' value='0' type='number' name={`${restaurant.name}-highlighter`} id={`input-${restaurant.name}-highlighter`} />
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}