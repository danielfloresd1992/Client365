'use client';
import { FiFlag, FiMapPin } from 'react-icons/fi';

export default function FranchiseInfo({ establishment }) {
    const franchiseName = establishment?.franchiseReference?.name_franchise;

    if (!franchiseName) {
        return (
            <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
                <h3 className='text-sm font-bold text-gray-700 mb-3 flex items-center gap-2'>
                    <FiFlag className='w-4 h-4 text-blue-500' />
                    Franquicia
                </h3>
                <p className='text-sm text-gray-400'>Sin franquicia asignada</p>
            </div>
        );
    }

    return (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <h3 className='text-sm font-bold text-gray-700 mb-3 flex items-center gap-2'>
                <FiFlag className='w-4 h-4 text-blue-500' />
                Franquicia
            </h3>

            <div className='flex flex-col gap-2'>
                <div className='bg-blue-50 border border-blue-100 rounded-lg p-3'>
                    <p className='text-sm font-semibold text-blue-800'>{franchiseName}</p>
                </div>

                {establishment?.location && (
                    <div className='flex items-center gap-2 text-sm text-gray-500 px-1'>
                        <FiMapPin className='w-3.5 h-3.5 shrink-0' />
                        <span>{establishment.location}</span>
                    </div>
                )}

                <div className='flex flex-wrap gap-2 mt-1'>
                    <InfoChip label='Idioma' value={establishment?.lang?.toUpperCase() || '—'} />
                    <InfoChip label='Zona horaria' value={establishment?.DST?.TimeZone || '—'} />
                    <InfoChip label='Horario verano' value={establishment?.DST?.isActive ? 'Sí' : 'No'} />
                </div>
            </div>
        </div>
    );
}

function InfoChip({ label, value }) {
    return (
        <span className='text-[11px] bg-gray-50 border border-gray-100 rounded px-2 py-1 text-gray-600'>
            <span className='text-gray-400'>{label}:</span> <span className='font-medium'>{value}</span>
        </span>
    );
}
