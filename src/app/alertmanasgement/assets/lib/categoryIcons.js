import {
    FaBell, FaUsers, FaClock, FaDoorOpen, FaUserTie, FaTools, FaUtensils,
    FaExclamationTriangle, FaBuilding, FaBoxOpen, FaClipboardCheck, FaTrashAlt,
    FaShieldAlt, FaCamera, FaKey, FaMoneyBillWave, FaTruck, FaFireAlt, FaWifi,
    FaStar, FaFlag, FaLock, FaChartBar, FaCalendarAlt, FaPhone, FaBroom,
} from 'react-icons/fa';

/**
 * Traduce el nombre de ícono que guarda la categoría al componente que se pinta.
 *
 * La base guarda un NOMBRE ('building'), no un componente: un componente de
 * React no cabe en un documento de Mongo. El nombre además deja libre al
 * servidor de la librería de íconos que use el front hoy — si mañana se cambia
 * react-icons por otra cosa, solo cambia este archivo.
 *
 * Los nombres son cortos y descriptivos a propósito: quien crea una categoría
 * elige de esta lista, y 'puerta' se entiende mejor que 'FaDoorOpen'.
 */
const ICONOS = {
    bell:      FaBell,
    users:     FaUsers,
    clock:     FaClock,
    door:      FaDoorOpen,
    'user-tie': FaUserTie,
    tools:     FaTools,
    utensils:  FaUtensils,
    warning:   FaExclamationTriangle,
    building:  FaBuilding,
    box:       FaBoxOpen,
    clipboard: FaClipboardCheck,
    trash:     FaTrashAlt,
    shield:    FaShieldAlt,
    camera:    FaCamera,
    key:       FaKey,
    money:     FaMoneyBillWave,
    truck:     FaTruck,
    fire:      FaFireAlt,
    wifi:      FaWifi,
    star:      FaStar,
    flag:      FaFlag,
    lock:      FaLock,
    chart:     FaChartBar,
    calendar:  FaCalendarAlt,
    phone:     FaPhone,
    broom:     FaBroom,
};

/** Se usa cuando la categoría trae un nombre de ícono que no está en la lista. */
const ICONO_POR_DEFECTO = FaBell;

/**
 * Devuelve siempre un componente pintable.
 *
 * Nunca falla: una categoría creada con un ícono que este cliente no conoce
 * —porque se agregó después de la última publicación— sale con la campana en
 * lugar de romper la lista entera.
 */
const iconOf = (nombre) => ICONOS[nombre] || ICONO_POR_DEFECTO;

/** Los nombres disponibles, para el selector de ícono al crear una categoría. */
const NOMBRES_DE_ICONO = Object.keys(ICONOS);


export { ICONOS, ICONO_POR_DEFECTO, iconOf, NOMBRES_DE_ICONO };
