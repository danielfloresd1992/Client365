'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useAxios from '@/hook/useAxios';



import EstablishmentHeader from './assets/EstablishmentHeader';
import NoveltiesSection from './assets/NoveltiesSection';
import ReportsSection from './assets/ReportsSection';
import FranchiseInfo from './assets/FranchiseInfo';
import ManagersSection from './assets/ManagersSection';




export default function EstablishmentDetailPage() {



    const params = useParams();
    const id = params.id;

    const [establishment, setEstablishment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { requestAction } = useAxios();


    
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        requestAction({ url: `/local&manager/id=${id}`, action: 'GET' })
            .then(res => {
                if (res.status === 200 && res.data) {
                    setEstablishment(res.data);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);


    if (loading) {
        return (
            <div className='max-w-[1200px] mx-auto flex flex-col gap-6 p-4'>
                {/* Skeleton header */}
                <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse'>
                    <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='w-[120px] h-[120px] bg-gray-200 rounded-xl shrink-0 mx-auto sm:mx-0' />
                        <div className='flex-1 flex flex-col gap-3'>
                            <div className='h-6 bg-gray-200 rounded w-2/3' />
                            <div className='h-4 bg-gray-100 rounded w-1/3' />
                            <div className='h-4 bg-gray-100 rounded w-1/2' />
                            <div className='flex gap-2'>
                                <div className='h-8 bg-gray-100 rounded-lg w-24' />
                                <div className='h-8 bg-gray-100 rounded-lg w-24' />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Skeleton body */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 flex flex-col gap-6'>
                        <div className='h-[300px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse' />
                        <div className='h-[200px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse' />
                    </div>
                    <div className='flex flex-col gap-6'>
                        <div className='h-[150px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse' />
                        <div className='h-[200px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse' />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !establishment) {
        return (
            <div className='flex flex-col items-center justify-center h-full gap-4 py-20'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
                    <span className='text-2xl text-gray-300'>?</span>
                </div>
                <p className='text-gray-500 text-sm'>No se encontró el establecimiento</p>
                <button
                    onClick={() => window.history.back()}
                    className='text-sm text-blue-600 hover:underline'
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className='max-w-[1200px] mx-auto flex flex-col gap-6 p-4'>
            <EstablishmentHeader establishment={establishment} />

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Main content */}
                <div className='lg:col-span-2 flex flex-col gap-6'>
                    <NoveltiesSection establishmentName={establishment.name} />
                    <ReportsSection establishmentName={establishment.name} />
                </div>

                {/* Sidebar */}
                <div className='flex flex-col gap-6'>
                    <FranchiseInfo establishment={establishment} />
                    <ManagersSection managers={establishment.managers} />
                </div>
            </div>
        </div>
    );
}
