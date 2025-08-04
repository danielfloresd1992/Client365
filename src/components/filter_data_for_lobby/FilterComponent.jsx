'use client';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';


export default function FilterNoveltyForLobby({ }) {


    const clientsStore = useSelector((store) => store.clients);








    return (
        <div className='w-full h-full'>
            <header className='w-full h-[80px] w-full bg-[rgb(237_237_237)] p-[.5rem]'>
                <div className='h-full flex justify-start items-center flex- gap-[.5rem]'>
                    <Image src='/ico/icons8-filtro-vacío-30.png' width={30} height={30} />
                    <h2 className='text-black'>filtro de alertas</h2>
                </div>

            </header>

            <div className='w-full h-[calc(100%_-_100px)]'>
                <div className='w-full h-full overflow-y-scroll flex flex-col'>
                    {Object.entries(groupByFranchiseComprehensive(clientsStore)).map(([franchiseName, franchiseRestaurants]) => (
                        <div key={franchiseName} className="p-[.5rem]">
                            <h3 className='text-center'>{franchiseName}</h3>
                            <div className="restaurant-grid">
                                {franchiseRestaurants.map(restaurant => (
                                    <div key={restaurant._id} className="restaurant-card">
                                        <h3>{restaurant.name}</h3>
                                       
                                    
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}