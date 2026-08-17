import { createElement } from 'react';
import {
    // General
    FaBell, FaExclamationTriangle, FaExclamationCircle, FaStar, FaFlag,
    FaClipboardCheck, FaChartBar, FaCalendarAlt, FaClock, FaStopwatch,
    FaHourglassHalf, FaBan, FaCommentDots, FaSmile, FaFrown,
    // Personal
    FaUsers, FaUserTie, FaUserClock, FaUserCheck, FaUserSlash, FaUserFriends,
    FaUserShield, FaHardHat, FaTshirt, FaIdBadge, FaHandsWash, FaRunning,
    FaBed, FaMobileAlt, FaHandshake, FaPeopleCarry, FaSignOutAlt,
    // Comida
    FaUtensils, FaUtensilSpoon, FaConciergeBell, FaPizzaSlice, FaHamburger,
    FaDrumstickBite, FaFish, FaBreadSlice, FaCheese, FaIceCream, FaCoffee,
    FaWineGlassAlt, FaBeer, FaGlassMartiniAlt, FaBlender, FaMortarPestle,
    FaEgg, FaCarrot, FaCookieBite, FaBirthdayCake,
    // Salón y caja
    FaChair, FaTable, FaReceipt, FaCashRegister, FaCreditCard, FaTabletAlt,
    // Instalaciones
    FaDoorOpen, FaDoorClosed, FaBuilding, FaWarehouse, FaStore,
    FaWindowMaximize, FaRestroom, FaSwimmingPool, FaSnowflake,
    FaThermometerHalf, FaPlug, FaLightbulb, FaFaucet, FaFireExtinguisher,
    FaLayerGroup,
    // Mercancía
    FaBoxOpen, FaBoxes, FaTruck, FaDolly, FaPallet, FaBarcode, FaWeightHanging,
    // Seguridad
    FaShieldAlt, FaCamera, FaVideo, FaKey, FaLock, FaEye, FaMapMarkerAlt,
    FaCarSide, FaMotorcycle, FaSmoking, FaGasPump, FaFireAlt, FaFirstAid,
    FaVolumeUp, FaMusic, FaBullhorn,
    // Limpieza
    FaBroom, FaTrashAlt, FaSoap, FaSprayCan, FaRecycle, FaTint,
    // Otros
    FaMoneyBillWave, FaCoins, FaWifi, FaPhone, FaTools, FaToolbox,
} from 'react-icons/fa';


// ══════════════════════════════════════════════════════════════════════
// DOS ÍCONOS DIBUJADOS ACÁ
// ══════════════════════════════════════════════════════════════════════
// Font Awesome 5 —el conjunto que usa todo lo demás de este archivo— no tiene
// ninguna PERSONA con casco: `FaHardHat` es el casco solo, sin nadie debajo. En
// un sistema cuyo reglamento habla de "seguimiento de personal" y de "protocolo
// de seguridad", la diferencia entre el objeto y quien lo lleva es justo la que
// hay que poder dibujar.
//
//
// POR QUÉ NO SE IMPORTAN DE OTRO CONJUNTO
//
// Existen en Material (`MdEngineering`) y en Font Awesome 6
// (`FaPersonDigging`), pero importarlos ROMPE EL BUILD. react-icons publica
// cada conjunto como un módulo único de miles de íconos, y sumar dos hace que
// webpack no llegue a emitir chunks del servidor.
//
// Está comprobado, no es una sospecha: con esos dos imports, dos builds limpios
// seguidos fallaron con "Cannot find module './645.js'" y "'./682.js'" en rutas
// que no se habían tocado; quitándolos, el build pasa.
//
// Así que se copia el trazo y se dibujan acá. Son unos cientos de bytes, no
// arrastran ningún paquete, y exponen la misma interfaz que react-icons
// —`size` y `color`— para que el selector no distinga unos de otros.

const iconoLocal = (viewBox, trazos) => {
    // Se arma con createElement y no con JSX porque este archivo es un
    // REGISTRO, no una vista: es el único de la carpeta `lib` y mantenerlo sin
    // JSX evita tener que renombrarlo a .jsx y perseguir los imports, que lo
    // referencian con la extensión escrita.
    const Icono = ({ size = '1em', color = 'currentColor', ...resto }) =>
        createElement(
            'svg',
            {
                viewBox,
                width: size,
                height: size,
                fill: color,
                stroke: 'none',
                'aria-hidden': 'true',
                focusable: 'false',
                ...resto,
            },
            trazos.map((d, i) => createElement('path', { key: i, d })),
        );
    return Icono;
};

/** Persona con casco. Trazo de Material Symbols "engineering". */
const IconoTrabajador = iconoLocal('0 0 24 24', [
    'M9 15c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM22.1 6.84c.01-.11.02-.22.02-.34 0-.12-.01-.23-.03-.34l.74-.58c.07-.05.08-.15.04-.22l-.7-1.21c-.04-.08-.14-.1-.21-.08l-.86.35c-.18-.14-.38-.25-.59-.34l-.13-.93A.182.182 0 0 0 20.2 3h-1.4c-.09 0-.16.06-.17.15l-.13.93c-.21.09-.41.21-.59.34l-.87-.35c-.08-.03-.17 0-.21.08l-.7 1.21c-.04.08-.03.17.04.22l.74.58a1.953 1.953 0 0 0 0 .68l-.74.58c-.07.05-.08.15-.04.22l.7 1.21c.04.08.14.1.21.08l.87-.35c.18.14.38.25.59.34l.13.93c.01.09.08.15.17.15h1.4c.09 0 .16-.06.17-.15l.13-.93c.21-.09.41-.21.59-.34l.87.35c.08.03.17 0 .21-.08l.7-1.21c.04-.08.03-.17-.04-.22l-.73-.58zm-2.6.91a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM19.92 11.68l-.5-.87c-.03-.06-.1-.08-.15-.06l-.62.25c-.13-.1-.27-.18-.42-.24l-.09-.66A.15.15 0 0 0 18 10h-1c-.06 0-.11.04-.12.11l-.09.66c-.15.06-.29.15-.42.24l-.62-.25c-.06-.02-.12 0-.15.06l-.5.87c-.03.06-.02.12.03.16l.53.41c-.01.08-.02.16-.02.24 0 .08.01.17.02.24l-.53.41c-.05.04-.06.11-.03.16l.5.87c.03.06.1.08.15.06l.62-.25c.13.1.27.18.42.24l.09.66c.01.07.06.11.12.11h1c.06 0 .12-.04.12-.11l.09-.66c.15-.06.29-.15.42-.24l.62.25c.06.02.12 0 .15-.06l.5-.87c.03-.06.02-.12-.03-.16l-.52-.41c.01-.08.02-.16.02-.24 0-.08-.01-.17-.02-.24l.53-.41c.05-.04.06-.11.04-.17zm-2.42 1.65c-.46 0-.83-.38-.83-.83 0-.46.38-.83.83-.83s.83.38.83.83c0 .46-.37.83-.83.83zM4.74 9h8.53c.27 0 .49-.22.49-.49v-.02a.49.49 0 0 0-.49-.49H13c0-1.48-.81-2.75-2-3.45v.95c0 .28-.22.5-.5.5s-.5-.22-.5-.5V4.14C9.68 4.06 9.35 4 9 4s-.68.06-1 .14V5.5c0 .28-.22.5-.5.5S7 5.78 7 5.5v-.95C5.81 5.25 5 6.52 5 8h-.26a.49.49 0 0 0-.49.49v.03c0 .26.22.48.49.48zM9 13c1.86 0 3.41-1.28 3.86-3H5.14c.45 1.72 2 3 3.86 3z',
]);

/** Persona trabajando con casco. Trazo de Font Awesome 6 "person-digging". */
const IconoTrabajando = iconoLocal('0 0 576 512', [
    'M208 64a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM9.8 214.8c5.1-12.2 19.1-18 31.4-12.9L60.7 210l22.9-38.1C99.9 144.6 129.3 128 161 128c51.4 0 97 32.9 113.3 81.7l34.6 103.7 79.3 33.1 34.2-45.6c6.4-8.5 16.6-13.3 27.2-12.8s20.3 6.4 25.8 15.5l96 160c5.9 9.9 6.1 22.2 .4 32.2s-16.3 16.2-27.8 16.2l-256 0c-11.1 0-21.4-5.7-27.2-15.2s-6.4-21.2-1.4-31.1l16-32c5.4-10.8 16.5-17.7 28.6-17.7l32 0 22.5-30L22.8 246.2c-12.2-5.1-18-19.1-12.9-31.4zm82.8 91.8l112 48c11.8 5 19.4 16.6 19.4 29.4l0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-74.9-60.6-26-37 111c-5.6 16.8-23.7 25.8-40.5 20.2S-3.9 486.6 1.6 469.9l48-144 11-33 32 13.7z',
]);


/**
 * Traduce el nombre de ícono que guarda la categoría al componente que se pinta.
 *
 * La base guarda un NOMBRE ('building'), no un componente: un componente de
 * React no cabe en un documento de Mongo. El nombre además deja libre al
 * servidor de la librería de íconos que use el front hoy — si mañana se cambia
 * react-icons por otra cosa, solo cambia este archivo.
 *
 * Los nombres son cortos y en español a propósito: quien crea una categoría
 * elige de esta lista, y 'plato' se entiende mejor que 'FaConciergeBell'.
 *
 *
 * ESTÁN AGRUPADOS, Y EL GRUPO SE VE EN LA PANTALLA
 *
 * Con veinte íconos una rejilla plana se recorre de un vistazo; con cien es un
 * muro donde nadie encuentra nada. Los grupos de abajo son los que dibuja el
 * selector, así que agregar un ícono es agregarlo a su grupo y aparece solo.
 *
 * Los temas salen del Reglamento de Registro de Bonos: sus cinco áreas son
 * atención al cliente, calidad del servicio, seguimiento de personal, seguridad
 * de los alimentos y protocolos perimetrales. Un ícono que no sirva para
 * ninguna de esas cosas no hace falta acá.
 */

const GRUPOS = [
    {
        titulo: 'General',
        iconos: {
            bell: FaBell,
            warning: FaExclamationTriangle,
            alert: FaExclamationCircle,
            star: FaStar,
            flag: FaFlag,
            clipboard: FaClipboardCheck,
            chart: FaChartBar,
            calendar: FaCalendarAlt,
            clock: FaClock,
            stopwatch: FaStopwatch,
            hourglass: FaHourglassHalf,
            ban: FaBan,
            comment: FaCommentDots,
            smile: FaSmile,
            frown: FaFrown,
        },
    },
    {
        titulo: 'Personal',
        iconos: {
            users: FaUsers,
            'user-tie': FaUserTie,
            'user-clock': FaUserClock,
            'user-check': FaUserCheck,
            'user-slash': FaUserSlash,
            'user-friends': FaUserFriends,
            'user-shield': FaUserShield,
            worker: IconoTrabajador,     // persona CON casco
            digging: IconoTrabajando,    // persona trabajando, con casco
            'hard-hat': FaHardHat,       // el casco solo, sin nadie
            uniform: FaTshirt,
            badge: FaIdBadge,
            hands: FaHandsWash,
            running: FaRunning,
            rest: FaBed,
            mobile: FaMobileAlt,
            handshake: FaHandshake,
            carry: FaPeopleCarry,
            exit: FaSignOutAlt,
        },
    },
    {
        titulo: 'Comida y bebida',
        iconos: {
            utensils: FaUtensils,
            spoon: FaUtensilSpoon,
            plate: FaConciergeBell,
            pizza: FaPizzaSlice,
            burger: FaHamburger,
            chicken: FaDrumstickBite,
            fish: FaFish,
            bread: FaBreadSlice,
            cheese: FaCheese,
            'ice-cream': FaIceCream,
            coffee: FaCoffee,
            wine: FaWineGlassAlt,
            beer: FaBeer,
            cocktail: FaGlassMartiniAlt,
            blender: FaBlender,
            mortar: FaMortarPestle,
            egg: FaEgg,
            carrot: FaCarrot,
            cookie: FaCookieBite,
            cake: FaBirthdayCake,
        },
    },
    {
        titulo: 'Salón y caja',
        iconos: {
            chair: FaChair,
            table: FaTable,
            receipt: FaReceipt,
            register: FaCashRegister,
            card: FaCreditCard,
            tablet: FaTabletAlt,
        },
    },
    {
        titulo: 'Instalaciones',
        iconos: {
            door: FaDoorOpen,
            'door-closed': FaDoorClosed,
            building: FaBuilding,
            warehouse: FaWarehouse,
            store: FaStore,
            window: FaWindowMaximize,
            restroom: FaRestroom,
            pool: FaSwimmingPool,
            cold: FaSnowflake,
            thermometer: FaThermometerHalf,
            plug: FaPlug,
            light: FaLightbulb,
            faucet: FaFaucet,
            extinguisher: FaFireExtinguisher,
            area: FaLayerGroup,
        },
    },
    {
        titulo: 'Mercancía',
        iconos: {
            box: FaBoxOpen,
            boxes: FaBoxes,
            truck: FaTruck,
            dolly: FaDolly,
            pallet: FaPallet,
            barcode: FaBarcode,
            weight: FaWeightHanging,
        },
    },
    {
        titulo: 'Seguridad',
        iconos: {
            shield: FaShieldAlt,
            camera: FaCamera,
            video: FaVideo,
            key: FaKey,
            lock: FaLock,
            eye: FaEye,
            location: FaMapMarkerAlt,
            car: FaCarSide,
            motorcycle: FaMotorcycle,
            smoking: FaSmoking,
            fuel: FaGasPump,
            fire: FaFireAlt,
            'first-aid': FaFirstAid,
            speaker: FaVolumeUp,
            music: FaMusic,
            megaphone: FaBullhorn,
        },
    },
    {
        titulo: 'Limpieza',
        iconos: {
            broom: FaBroom,
            trash: FaTrashAlt,
            soap: FaSoap,
            spray: FaSprayCan,
            recycle: FaRecycle,
            spill: FaTint,
        },
    },
    {
        titulo: 'Otros',
        iconos: {
            money: FaMoneyBillWave,
            coins: FaCoins,
            wifi: FaWifi,
            phone: FaPhone,
            tools: FaTools,
            toolbox: FaToolbox,
        },
    },
];


/**
 * Todos los íconos en un solo mapa, que es como los busca `iconOf`.
 *
 * Se deriva de los grupos y no se escribe a mano: con dos listas, la segunda se
 * olvida, y un ícono elegible desde el selector que `iconOf` no conoce saldría
 * como campana sin que nadie entienda por qué.
 */
const ICONOS = GRUPOS.reduce((todos, grupo) => ({ ...todos, ...grupo.iconos }), {});

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

/** Los nombres disponibles, planos. */
const NOMBRES_DE_ICONO = Object.keys(ICONOS);

/** Los grupos, para que el selector los dibuje con su título. */
const GRUPOS_DE_ICONO = GRUPOS.map(g => ({ titulo: g.titulo, nombres: Object.keys(g.iconos) }));


export { ICONOS, ICONO_POR_DEFECTO, iconOf, NOMBRES_DE_ICONO, GRUPOS_DE_ICONO };
