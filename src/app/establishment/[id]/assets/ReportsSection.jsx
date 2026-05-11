'use client';
import { useState, useEffect } from 'react';
import { FiFileText, FiClock, FiUser } from 'react-icons/fi';
import useAxios from '@/hook/useAxios';

const SHIFT_LABELS = {
    day: { text: 'Diurno', color: 'bg-amber-100 text-amber-700' },
    night: { text: 'Nocturno', color: 'bg-indigo-100 text-indigo-700' },
    all: { text: 'Diario', color: 'bg-gray-100 text-gray-600' },
};

const TYPE_LABELS = {
    'complete-shift': 'Turno completo',
    'resume-shift': 'Resumen de turno',
};

export default function ReportsSection({ establishmentName }) {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const { requestAction } = useAxios();

    useEffect(() => {
        if (!establishmentName) return;
        setLoading(true);
        requestAction({
            url: `/document/paginate?page=0&limit=5&establishment=${encodeURIComponent(establishmentName)}`,
            action: 'GET',
        })
            .then(res => setReports(res.data?.data || []))
            .catch(() => setReports([]))
            .finally(() => setLoading(false));
    }, [establishmentName]);

    return (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <h3 className='text-sm font-bold text-gray-700 mb-3 flex items-center gap-2'>
                <FiFileText className='w-4 h-4 text-emerald-500' />
                Últimos reportes
            </h3>

            {loading && (
                <div className='flex flex-col gap-2'>
                    {[1, 2, 3].map(i => (
                        <div key={i} className='h-16 bg-gray-100 rounded-lg animate-pulse' />
                    ))}
                </div>
            )}

            {!loading && (!reports || reports.length === 0) && (
                <p className='text-sm text-gray-400 text-center py-6'>No hay reportes registrados</p>
            )}

            {!loading && reports && reports.length > 0 && (
                <div className='flex flex-col gap-2'>
                    {reports.map((report, idx) => {
                        const shiftInfo = SHIFT_LABELS[report.shift] || SHIFT_LABELS.all;
                        return (
                            <div
                                key={report._id || idx}
                                className='flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'
                            >
                                {/* Date */}
                                <div className='shrink-0 text-center min-w-[50px]'>
                                    <p className='text-xs font-bold text-gray-700'>{formatDateShort(report.date)}</p>
                                </div>

                                {/* Info */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2 flex-wrap'>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${shiftInfo.color}`}>
                                            {shiftInfo.text}
                                        </span>
                                        <span className='text-[10px] text-gray-400'>
                                            {TYPE_LABELS[report.type] || report.type}
                                        </span>
                                    </div>
                                    {report.createdDocument?.nameUser && (
                                        <p className='text-xs text-gray-500 mt-1 flex items-center gap-1 truncate'>
                                            <FiUser className='w-3 h-3 shrink-0' />
                                            {report.createdDocument.nameUser}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
}
