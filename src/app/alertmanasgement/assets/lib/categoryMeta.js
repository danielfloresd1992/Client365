/**
 * Metadatos visuales de las categorías de alerta y del multiplicador de bono.
 *
 * Se comparten entre la lista (ícono del círculo, pills de filtro, encabezado de
 * cada grupo) y cualquier otra vista que necesite representar una categoría.
 * Las claves coinciden con `category.value` de ../model/category.js.
 */
import {
    FaBell,                 // fallback / genérico
    FaUsers,                // client        — atención al cliente
    FaClock,                // delay         — demoras
    FaDoorOpen,             // door          — puerta
    FaUserTie,              // employee      — empleados
    FaTools,                // failed        — fallas
    FaUtensils,             // food          — comidas
    FaExclamationTriangle,  // incident      — incidencias
    FaBuilding,             // localIncident — incidencias en el local
    FaBoxOpen,              // merchandise   — mercancía
    FaClipboardCheck,       // protocol      — protocolos
    FaTrashAlt,             // trash         — basura
    FaShieldAlt,            // perimeter     — perimetral
} from 'react-icons/fa';

/**
 * Por categoría: ícono + paleta.
 *   bg    → fondo del círculo / pill inactiva
 *   color → color del ícono, del texto y de la pill activa
 */
const CATEGORY_META = {
    client:        { Icon: FaUsers,                bg: '#dbeafe', color: '#1d4ed8' },
    delay:         { Icon: FaClock,                bg: '#fef9c3', color: '#854d0e' },
    door:          { Icon: FaDoorOpen,             bg: '#f3e8ff', color: '#7e22ce' },
    employee:      { Icon: FaUserTie,              bg: '#d1fae5', color: '#065f46' },
    failed:        { Icon: FaTools,                bg: '#fee2e2', color: '#991b1b' },
    food:          { Icon: FaUtensils,             bg: '#fff7ed', color: '#9a3412' },
    incident:      { Icon: FaExclamationTriangle,  bg: '#ffedd5', color: '#c2410c' },
    localIncident: { Icon: FaBuilding,             bg: '#e0f2fe', color: '#0369a1' },
    merchandise:   { Icon: FaBoxOpen,              bg: '#fdf4ff', color: '#7c3aed' },
    protocol:      { Icon: FaClipboardCheck,       bg: '#ecfdf5', color: '#047857' },
    trash:         { Icon: FaTrashAlt,             bg: '#f1f5f9', color: '#475569' },
    perimeter:     { Icon: FaShieldAlt,            bg: '#fef2f2', color: '#b91c1c' },
};

/** Se usa cuando la categoría del documento no está mapeada arriba. */
const CATEGORY_FALLBACK = { Icon: FaBell, bg: '#f3f4f6', color: '#374151' };

/** Devuelve siempre metadatos válidos para una categoría. */
const metaOf = category => CATEGORY_META[category] ?? CATEGORY_FALLBACK;

/**
 * Badge del multiplicador de bono (bonusCalculationRules.defaultRule.worth):
 * X1 azul / X2 ámbar / X3 naranja / X5 rojo.
 */
const BONUS_BADGE = {
    1: { bg: '#dbeafe', color: '#1e40af', label: 'X1' },
    2: { bg: '#fef9c3', color: '#92400e', label: 'X2' },
    3: { bg: '#ffedd5', color: '#c2410c', label: 'X3' },
    5: { bg: '#fee2e2', color: '#991b1b', label: 'X5' },
};

export { CATEGORY_META, CATEGORY_FALLBACK, metaOf, BONUS_BADGE };