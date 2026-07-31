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

export type { AttendanceRecord, AttendanceTableProps }
