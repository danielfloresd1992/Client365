'use client';
import {
    FaTag, FaFileAlt, FaAlignLeft, FaLanguage, FaClipboardList, FaClock,
    FaCamera, FaCog, FaUserTie, FaFileContract,
} from 'react-icons/fa';
import { slug } from '../../lib/format.js';

/**
 * Secciones del formulario, en el mismo orden en que se renderizan.
 *
 * `full` DEBE coincidir carácter a carácter con el `label` del SectionHeader
 * correspondiente: el ancla se calcula con slug(full) en ambos lados.
 */
const NAV_SECTIONS = [
    { full: 'Categoría y referencia',                                       short: 'Categoría',   Icon: FaTag },
    { full: 'Título para documento de reporte',                             short: 'Título rep.', Icon: FaFileAlt },
    { full: 'Encabezado textual',                                           short: 'Encabezado',  Icon: FaAlignLeft },
    { full: 'Títulos de la alerta (ES / EN)',                               short: 'Títulos',     Icon: FaLanguage },
    { full: 'Datos requeridos',                                             short: 'Requeridos',  Icon: FaClipboardList },
    { full: 'Tipo de tiempo',                                               short: 'Tiempo',      Icon: FaClock },
    { full: 'Fotografías y subtítulos',                                     short: 'Fotos',       Icon: FaCamera },
    { full: 'Configuración especial de tiempo',                             short: 'T. especial', Icon: FaCog },
    { full: 'Datos adicionales',                                            short: 'Adicionales', Icon: FaClipboardList },
    { full: 'Configuración de Gerentes o MAnagers en título y referencias', short: 'Gerentes',    Icon: FaUserTie },
    { full: 'Configuración de reporte y alerta en vivo',                    short: 'Reporte',     Icon: FaFileContract },
];

/** Salta a una sección haciendo scroll dentro del cuerpo del modal. */
const goToSection = full =>
    document.getElementById(slug(full))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Barra de navegación por secciones (fija entre la cabecera y el cuerpo). */
export default function FormNav() {
    return (
        <div style={{
            flexShrink:   0,
            display:      'flex',
            gap:          '6px',
            overflowX:    'auto',
            padding:      '8px 14px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            background:   'rgba(255,255,255,0.4)',
        }}>
            {NAV_SECTIONS.map(sec => (
                <button
                    key={sec.full}
                    type='button'
                    title={sec.full}
                    onClick={() => goToSection(sec.full)}
                    style={{
                        flexShrink:   0,
                        display:      'inline-flex',
                        alignItems:   'center',
                        gap:          '5px',
                        padding:      '5px 10px',
                        borderRadius: '999px',
                        border:       '1px solid #e6dcc6',
                        background:   '#fff',
                        color:        '#4b5563',
                        fontSize:     '11px',
                        fontWeight:   600,
                        cursor:       'pointer',
                        whiteSpace:   'nowrap',
                    }}
                >
                    <sec.Icon size={10} /> {sec.short}
                </button>
            ))}
        </div>
    );
}
