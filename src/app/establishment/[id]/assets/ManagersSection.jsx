'use client';
import { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiPhone } from 'react-icons/fi';
import useAxios from '@/hook/useAxios';

export default function ManagersSection({ managers }) {
    if (!managers || managers.length === 0) {
        return (
            <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
                <h3 className='text-sm font-bold text-gray-700 mb-3 flex items-center gap-2'>
                    <FiUsers className='w-4 h-4 text-violet-500' />
                    Gerentes
                </h3>
                <p className='text-sm text-gray-400 text-center py-4'>No hay gerentes registrados</p>
            </div>
        );
    }

    return (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <h3 className='text-sm font-bold text-gray-700 mb-3 flex items-center gap-2'>
                <FiUsers className='w-4 h-4 text-violet-500' />
                Gerentes
                <span className='text-[11px] text-gray-400 bg-gray-100 px-2 py-[1px] rounded-full'>
                    {managers.length}
                </span>
            </h3>
            <div className='flex flex-col gap-3'>
                {managers.map(mgr => (
                    <ManagerCard key={mgr._id} manager={mgr} />
                ))}
            </div>
        </div>
    );
}

function ManagerCard({ manager }) {
    const [imgSrc, setImgSrc] = useState(null);
    const { requestAction } = useAxios();

    useEffect(() => {
        if (!manager?._id) return;
        requestAction({ url: `/managerLocalAndImgById/id=${manager._id}`, action: 'GET' })
            .then(res => {
                const mgrData = res.data?.[0];
                if (mgrData?.managerimg?.img?.[0]) {
                    const imgObj = mgrData.managerimg.img[0];
                    const base64 = typeof imgObj.data === 'string'
                        ? imgObj.data
                        : btoa(String.fromCharCode(...new Uint8Array(imgObj.data.data || imgObj.data)));
                    setImgSrc(`data:${imgObj.contentType || 'image/png'};base64,${base64}`);
                }
            })
            .catch(() => {});
    }, [manager?._id]);

    const statusColor = manager?.status === 'activo'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-gray-100 text-gray-500';

    return (
        <div className='flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'>
            {/* Avatar */}
            <div className='w-[48px] h-[48px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center'>
                {imgSrc ? (
                    <img src={imgSrc} alt={manager.name} className='w-full h-full object-cover' />
                ) : (
                    <FiUser className='w-5 h-5 text-gray-300' />
                )}
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-gray-800 truncate'>{manager.name || 'Sin nombre'}</p>
                <p className='text-xs text-gray-500 truncate'>{manager.burden || 'Sin cargo'}</p>
                {manager.numberManager && (
                    <p className='text-xs text-gray-400 flex items-center gap-1 mt-0.5'>
                        <FiPhone className='w-3 h-3' />
                        {manager.numberManager}
                    </p>
                )}
            </div>

            {/* Status badge */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                {manager.status || '—'}
            </span>
        </div>
    );
}
