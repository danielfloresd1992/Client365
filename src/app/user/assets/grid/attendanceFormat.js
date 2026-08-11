// ══════════════════════════════════════════════════════════════════════
// LECTURA DEL REGISTRO DE ASISTENCIA
// ══════════════════════════════════════════════════════════════════════
// Funciones PURAS: reciben el documento del día y devuelven texto o clases.
// Sin React y sin estado, así que se pueden leer —y probar— sueltas.

// Etiquetas en español para los campos de scheduleOverride en editedBy.change
export const OVERRIDE_FIELD_LABELS = {
    workType: 'Tipo',
    shift: 'Turno',
    startTime: 'Entrada',
    endTime: 'Salida',
};

// Helpers puros del popover (solo dependen del registro de asistencia)
export function calculateWorkDuration(attendanceData) {
    if (!attendanceData?.checkIn || !attendanceData?.checkOut) return null;
    const checkIn = new Date(attendanceData.checkIn);
    const checkOut = new Date(attendanceData.checkOut);
    const diffMs = checkOut - checkIn;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

export function getStatusColor(attendanceData) {
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType === 'falta') return 'bg-red-50 border-red-200 text-red-700';
    // Override asignado sin marcaje: color según el tipo (mismo sistema de la celda)
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType) {
        const colors = {
            laboral: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            extra: 'bg-green-50 border-green-200 text-green-800',
            descanso: 'bg-gray-100 border-gray-300 text-gray-700',
            permiso: 'bg-purple-50 border-purple-200 text-purple-700',
            vacaciones: 'bg-cyan-50 border-cyan-200 text-cyan-700',
        };
        return colors[attendanceData.scheduleOverride.workType] || 'bg-gray-50 border-gray-200 text-gray-700';
    }
    if (attendanceData?.status === 'presente') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (attendanceData?.isLate) return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.status === 'falta') return 'bg-red-50 border-red-200 text-red-700';
    if (attendanceData?.isJustified) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
}

export function getStatusLabel(attendanceData) {
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType === 'falta') return '✗ Falta asignada';
    // Override asignado sin marcaje: etiqueta según el tipo
    if (!attendanceData?.checkIn && attendanceData?.scheduleOverride?.workType) {
        const labels = {
            laboral: '✦ Guardia asignada',
            extra: '✦ Día extra asignado',
            descanso: '✦ Descanso asignado',
            permiso: '✦ Permiso asignado',
            vacaciones: '✦ Vacaciones asignadas',
        };
        return labels[attendanceData.scheduleOverride.workType] || '✦ Horario modificado';
    }
    if (attendanceData?.status === 'presente') return '✓ Presente';
    if (attendanceData?.isLate) return '⚠️ Llegada Tarde';
    if (attendanceData?.status === 'falta') return '✗ Falta';
    if (attendanceData?.isJustified) return '✓ Justificado';
    return 'Sin estado';
}
