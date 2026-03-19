import React from 'react'

interface AttendanceRecord {
    _id: string
    date: string | Date
    checkIn?: string | Date
    checkOut?: string | Date
    status: string // 'presente' | 'ausente' | 'pendiente' | 'franco-trabajado'
    isLate?: boolean
    isJustified?: boolean
    lateJustification?: string
    isExtraDay?: boolean
    scheduleOverride?: {
        workType?: string
        shift?: string
        startTime?: string
        endTime?: string
    }
}

interface AttendanceTableProps {
    rows: AttendanceRecord[]
    loading?: boolean
    onExportPDF?: () => void
}

export default function AttendanceTable({ rows, loading, onExportPDF }: AttendanceTableProps) {
    // Estado de carga
    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 min-h-[200px]">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-400 text-sm">Cargando registros...</p>
            </div>
        )
    }

    // Estado vacío
    if (!rows || rows.length === 0) {
        return null // O un mensaje vacío si prefieres, pero el page.tsx ya maneja un EmptyState
    }

    // Helpers de formato
    const formatDate = (d: string | Date) => {
        if (!d) return '-'
        const date = new Date(d)
        // Formato: Vie, 13 Mar
        return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
    }

    const formatTime = (d?: string | Date) => {
        if (!d) return <span className="text-gray-300">--:--</span>
        const date = new Date(d)
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    const getStatusBadge = (status: string, isLate?: boolean) => {
        const baseClass = "px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"

        if (isLate) {
            return <span className={`bg-yellow-50 text-yellow-700 border border-yellow-100 ${baseClass}`}>Tardanza</span>
        }

        switch (status) {
            case 'presente': return <span className={`bg-green-50 text-green-700 border border-green-100 ${baseClass}`}>Presente</span>
            case 'ausente': return <span className={`bg-red-50 text-red-700 border border-red-100 ${baseClass}`}>Ausente</span>
            case 'franco-trabajado': return <span className={`bg-purple-50 text-purple-700 border border-purple-100 ${baseClass}`}>Extra</span>
            case 'pendiente': return <span className={`bg-gray-100 text-gray-600 ${baseClass}`}>Pendiente</span>
            default: return <span className={`bg-gray-50 text-gray-600 ${baseClass}`}>{status}</span>
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Cabecera opcional de la tabla si se desea agrupar acciones aquí */}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-center">Entrada</th>
                            <th className="px-6 py-3 text-center">Salida</th>
                            <th className="px-6 py-3">Observación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {formatDate(row.date)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {getStatusBadge(row.status, row.isLate)}
                                        {row.isExtraDay && row.status !== 'franco-trabajado' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-medium">Extra</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-gray-700">
                                    {formatTime(row.checkIn)}
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-gray-700">
                                    {formatTime(row.checkOut)}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={row.lateJustification || ''}>
                                    {row.lateJustification || (row.scheduleOverride ? `Horario: ${row.scheduleOverride.workType}` : '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}