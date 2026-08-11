// ══════════════════════════════════════════════════════════════════════
// APARIENCIA DE LA CELDA
// ══════════════════════════════════════════════════════════════════════
// Los colores del día en la grilla, en un solo sitio: al retocar la paleta
// no hay que ir a buscarlos dentro de un componente de ochocientas líneas.

// ══════════════════════════════════════════════════════════════
// SISTEMA DE COLORES DE LA CELDA (fondos claros + texto con contraste)
// La jerarquía de aplicación vive en renderDaySchedule():
//   falta > extra > descanso > cambio de guardia > empleado nuevo > guardia
// ══════════════════════════════════════════════════════════════
export const CELL_COLOR_SYSTEM = {
    falta:    { bg: 'bg-red-600',    text: 'text-white',      accent: 'text-red-100' },    // Rojo pleno: falta (texto blanco)
    extra:    { bg: 'bg-green-100',  text: 'text-green-900',  accent: 'text-green-700' },  // Verde: día extra
    cambio:   { bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'text-yellow-700' }, // Amarillo: cambio de guardia (override)
    descanso: { bg: 'bg-gray-200',   text: 'text-gray-700',   accent: 'text-gray-500' },   // Gris: descanso
    permiso:  { bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'text-yellow-700' }, // Amarillo: permiso (con comentario obligatorio)
    vacaciones: { bg: 'bg-cyan-100', text: 'text-cyan-900',   accent: 'text-cyan-700' },   // Cian: vacaciones
    nuevo:    { bg: 'bg-purple-200', text: 'text-purple-950', accent: 'text-purple-700' }, // Morado: empleado nuevo (el fondo real es el degradado continuo NEW_EMPLOYEE_BASE_RGB)
    guardia:  { bg: 'bg-white',      text: 'text-gray-800',   accent: 'text-teal-600' },   // Blanco: guardia por defecto (modelo user)
    // turno: { bg: 'bg-blue-900',  text: 'text-white',      accent: 'text-blue-200' },   // Azul oscuro: quien lleva el turno (futura implementación)
};

// Degradado CONTINUO de antigüedad: máxima intensidad el día 1 y
// desvanecimiento lineal hasta blanco a los 3 meses (90 días).
// Base: purple-800 (#6b21a8); la intensidad se aplica como alpha.
export const NEW_EMPLOYEE_BASE_RGB = '107, 33, 168';
export const NEW_EMPLOYEE_FADE_DAYS = 90;
