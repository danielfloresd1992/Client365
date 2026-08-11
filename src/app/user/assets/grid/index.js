// ══════════════════════════════════════════════════════════════════════
// GRILLA DEL HORARIO
// ══════════════════════════════════════════════════════════════════════
// Puerta única de la grilla. Quien la use monta la fila y el resumen:
//
//     import UserRow, { AttendanceSummaryRow } from './assets/grid';
//
// Todo esto vivía en un solo archivo de 2297 líneas con ocho componentes
// dentro. Se repartió por responsabilidad —fila, celda, ficha, resumen— sin
// tocar el comportamiento; lo que cada pieza necesitaba de otra pasó a ser un
// import explícito, que además deja a la vista quién depende de quién.

export { default } from './UserRow';
export { default as UserRow } from './UserRow';
export { default as AttendanceCell } from './AttendanceCell';
export { default as AttendanceSummaryRow } from './AttendanceSummaryRow';
export { default as DetailPopover } from './DetailPopover';
export { default as CommentComposer } from './CommentComposer';

export { CELL_COLOR_SYSTEM, NEW_EMPLOYEE_BASE_RGB, NEW_EMPLOYEE_FADE_DAYS } from './cellAppearance';
export {
    OVERRIDE_FIELD_LABELS, calculateWorkDuration, getStatusColor, getStatusLabel,
} from './attendanceFormat';
