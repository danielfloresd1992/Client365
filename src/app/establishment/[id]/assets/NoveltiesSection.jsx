'use client';
import { useState, useEffect, useCallback } from 'react';
import { FiBell, FiChevronLeft, FiChevronRight, FiImage, FiVideo, FiUser, FiShield, FiThumbsUp, FiThumbsDown, FiFilter, FiX } from 'react-icons/fi';
import useAxios from '@/hook/useAxios';
import useImageViewer from '@/hook/useImageViewer';

export default function NoveltiesSection({ establishmentName }) {
    const [novelties, setNovelties] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const { requestAction } = useAxios();

    const fetchNovelties = useCallback(async (p = 0) => {
        if (!establishmentName) return;
        setLoading(true);
        try {
            let since = '0';
            let until = '0';
            if (showDateFilter && dateFrom && dateTo) {
                since = `${dateFrom} 00:00:00`;
                until = `${dateTo} 23:59:59`;
            }
            const res = await requestAction({
                url: `/noveltie/local=${encodeURIComponent(establishmentName)}/since=${since}/until=${until}/page=${p}`,
                action: 'GET',
            });
            setNovelties(res.data?.novelties || []);
            setTotal(res.data?.collection || 0);
        } catch {
            setNovelties([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [establishmentName, showDateFilter, dateFrom, dateTo]);

    useEffect(() => {
        setPage(0);
        fetchNovelties(0);
    }, [establishmentName, showDateFilter, dateFrom, dateTo]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchNovelties(newPage);
    };

    const clearDateFilter = () => {
        setShowDateFilter(false);
        setDateFrom('');
        setDateTo('');
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-bold text-gray-700 flex items-center gap-2'>
                    <FiBell className='w-4 h-4 text-orange-500' />
                    Últimas novedades
                    {total > 0 && (
                        <span className='text-[11px] text-gray-400 bg-gray-100 px-2 py-[1px] rounded-full'>
                            {total}
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => showDateFilter ? clearDateFilter() : setShowDateFilter(true)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        showDateFilter
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {showDateFilter ? <FiX className='w-3 h-3' /> : <FiFilter className='w-3 h-3' />}
                    {showDateFilter ? 'Quitar filtro' : 'Filtrar por fecha'}
                </button>
            </div>

            {/* Filtro de fecha (opcional) */}
            {showDateFilter && (
                <div className='flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100'>
                    <div className='flex-1'>
                        <label className='text-[11px] text-gray-400 block mb-1'>Desde</label>
                        <input
                            type='date'
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        />
                    </div>
                    <div className='flex-1'>
                        <label className='text-[11px] text-gray-400 block mb-1'>Hasta</label>
                        <input
                            type='date'
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        />
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className='flex flex-col gap-3'>
                    {[1, 2, 3].map(i => (
                        <div key={i} className='h-24 bg-gray-100 rounded-lg animate-pulse' />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && novelties && novelties.length === 0 && (
                <p className='text-sm text-gray-400 text-center py-8'>No hay novedades registradas</p>
            )}

            {/* List */}
            {!loading && novelties && novelties.length > 0 && (
                <div className='flex flex-col gap-3'>
                    {novelties.map((nov, idx) => (
                        <NoveltyCard key={nov._id || idx} novelty={nov} allNovelties={novelties} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-100'>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0}
                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                    >
                        <FiChevronLeft className='w-4 h-4' />
                        Anterior
                    </button>
                    <span className='text-xs text-gray-400'>
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages - 1}
                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                    >
                        Siguiente
                        <FiChevronRight className='w-4 h-4' />
                    </button>
                </div>
            )}
        </div>
    );
}


function NoveltyCard({ novelty, allNovelties }) {
    const { open } = useImageViewer();
    const hasImage = !!novelty.imageToShare || (novelty.imageUrl?.length > 0 && novelty.imageUrl[0]?.url);
    const hasVideo = !!novelty.videoUrl;
    const imgSrc = novelty.imageToShare || novelty.imageUrl?.[0]?.url;

    const handleImageClick = () => {
        if (!hasImage || !imgSrc) return;
        const allImages = allNovelties
            .map(n => n.imageToShare || n.imageUrl?.[0]?.url)
            .filter(Boolean);
        const currentIdx = allImages.indexOf(imgSrc);
        open({ images: allImages, index: currentIdx >= 0 ? currentIdx : 0, alt: novelty.title || '' });
    };

    const senderName = novelty.sharedByUser?.user?.nameUser;
    const senderImg = novelty.sharedByUser?.user?.id?.img;
    const validatorName = novelty.validationResult?.validatedByUser?.user?.nameUser;
    const isApproved = novelty.validationResult?.isApproved;
    const hasValidation = typeof isApproved === 'boolean';

    const formattedDate = novelty.date
        ? new Date(novelty.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className='rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow'>
            {/* Image/Video */}
            {(hasImage || hasVideo) && (
                <div className='relative w-full h-[140px] sm:h-[180px] bg-gray-100'>
                    {hasImage && imgSrc ? (
                        <img src={imgSrc} alt='' className='w-full h-full object-cover cursor-pointer' onClick={handleImageClick} />
                    ) : hasVideo ? (
                        <div className='w-full h-full flex items-center justify-center bg-gray-900'>
                            <FiVideo className='w-8 h-8 text-white/50' />
                        </div>
                    ) : null}
                    {/* Shift badge */}
                    {novelty.shift && (
                        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                            novelty.shift === 'day'
                                ? 'bg-amber-100/90 text-amber-700'
                                : 'bg-indigo-100/90 text-indigo-700'
                        }`}>
                            {novelty.shift === 'day' ? 'Diurno' : 'Nocturno'}
                        </span>
                    )}
                    {/* Media type badge */}
                    {hasVideo && (
                        <span className='absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center gap-1'>
                            <FiVideo className='w-3 h-3' /> Video
                        </span>
                    )}
                </div>
            )}

            {/* Content */}
            <div className='p-3'>
                {/* Title */}
                <p className='text-sm font-semibold text-gray-800 line-clamp-2'>
                    {novelty.title || 'Sin título'}
                </p>

                {/* Date */}
                {formattedDate && (
                    <p className='text-[11px] text-gray-400 mt-1'>{formattedDate}</p>
                )}

                {/* Sender & Validator */}
                <div className='flex flex-wrap items-center gap-2 mt-2.5'>
                    {/* Sender */}
                    {senderName && (
                        <div className='flex items-center gap-1.5 bg-gray-50 rounded-full pr-2.5 overflow-hidden'>
                            <div className='w-[24px] h-[24px] rounded-full bg-stone-400 flex items-center justify-center shrink-0 overflow-hidden'>
                                {senderImg ? (
                                    <img src={senderImg} alt='' className='w-full h-full object-cover' />
                                ) : (
                                    <FiUser className='w-3 h-3 text-white' />
                                )}
                            </div>
                            <div className='min-w-0'>
                                <p className='text-[10px] text-gray-400 leading-none'>Operador</p>
                                <p className='text-[11px] font-semibold text-gray-700 truncate max-w-[120px]'>{senderName}</p>
                            </div>
                        </div>
                    )}

                    {/* Validator */}
                    {validatorName && (
                        <div className='flex items-center gap-1.5 bg-gray-50 rounded-full pr-2.5 overflow-hidden'>
                            <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${
                                hasValidation
                                    ? isApproved ? 'bg-emerald-500' : 'bg-red-500'
                                    : 'bg-blue-500'
                            }`}>
                                {hasValidation ? (
                                    isApproved
                                        ? <FiThumbsUp className='w-3 h-3 text-white' />
                                        : <FiThumbsDown className='w-3 h-3 text-white' />
                                ) : (
                                    <FiShield className='w-3 h-3 text-white' />
                                )}
                            </div>
                            <div className='min-w-0'>
                                <p className='text-[10px] text-gray-400 leading-none'>Coordinador</p>
                                <p className='text-[11px] font-semibold text-gray-700 truncate max-w-[120px]'>{validatorName}</p>
                            </div>
                        </div>
                    )}

                    {/* Validation status */}
                    {hasValidation && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                            isApproved
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-600'
                        }`}>
                            {isApproved ? 'Aprobada' : 'Rechazada'}
                        </span>
                    )}
                </div>

                {/* No image/video - show shift inline */}
                {!hasImage && !hasVideo && novelty.shift && (
                    <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        novelty.shift === 'day'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-indigo-50 text-indigo-600'
                    }`}>
                        {novelty.shift === 'day' ? 'Diurno' : 'Nocturno'}
                    </span>
                )}
            </div>
        </div>
    );
}
