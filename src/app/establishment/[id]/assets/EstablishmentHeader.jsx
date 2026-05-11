'use client';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiMapPin, FiGlobe, FiActivity, FiClock } from 'react-icons/fi';

export default function EstablishmentHeader({ establishment }) {
    const router = useRouter();

    const isActive = establishment?.isActive ?? establishment?.status === 'activo';

    return (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
            {/* Top bar con botón volver */}
            <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50'>
                <button
                    onClick={() => router.back()}
                    className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors'
                >
                    <FiArrowLeft className='w-4 h-4' />
                    <span className='hidden sm:inline'>Volver</span>
                </button>
                <div className='flex-1' />
                <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                    ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                `}>
                    <span className={`w-[6px] h-[6px] rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            {/* Contenido principal */}
            <div className='flex flex-col sm:flex-row gap-4 p-4 sm:p-6'>
                {/* Logo */}
                <div className='flex justify-center sm:justify-start shrink-0'>
                    <div className='w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center'>
                        {establishment?.image ? (
                            <img
                                src={establishment.image}
                                alt={`logo-${establishment.name}`}
                                className='w-full h-full object-contain'
                            />
                        ) : (
                            <span className='text-gray-300 text-xs text-center px-2'>Sin logo</span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className='flex-1 flex flex-col items-center sm:items-start gap-2'>
                    <h1 className='text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left'>
                        {establishment?.name}
                    </h1>

                    {establishment?.franchiseReference?.name_franchise && (
                        <span className='text-sm text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full font-medium'>
                            {establishment.franchiseReference.name_franchise}
                        </span>
                    )}

                    <div className='flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-1 text-sm text-gray-500'>
                        {establishment?.location && (
                            <span className='flex items-center gap-1'>
                                <FiMapPin className='w-3.5 h-3.5' />
                                {establishment.location}
                            </span>
                        )}
                        {establishment?.lang && (
                            <span className='flex items-center gap-1'>
                                <FiGlobe className='w-3.5 h-3.5' />
                                {establishment.lang.toUpperCase()}
                            </span>
                        )}
                        {establishment?.typeMonitoring && (
                            <span className='flex items-center gap-1'>
                                <FiActivity className='w-3.5 h-3.5' />
                                {establishment.typeMonitoring}
                            </span>
                        )}
                    </div>

                    {/* Stats rápidos */}
                    <div className='flex flex-wrap gap-2 mt-2'>
                        <MiniStat label='Gerentes' value={establishment?.managers?.length || 0} />
                        <MiniStat label='Orden' value={establishment?.order ?? '—'} />
                        <MiniStat label='Alertas' value={establishment?.alertLength === 'extended' ? 'Extendidas' : 'Simplificadas'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className='flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5'>
            <span className='text-xs text-gray-400'>{label}</span>
            <span className='text-xs font-bold text-gray-700'>{value}</span>
        </div>
    );
}
