'use client';
/**
 * SharedAside.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Aside compartido para TODAS las subrutas de /clients&manasgement.
 * Garantiza un aspecto visual consistente con:
 *
 *   ┌─────────────────────┐
 *   │  Header (título)     │
 *   │  ─────────────────── │
 *   │  Navegación           │  ← links fijos (Establecimientos, Gerentes)
 *   │  ─────────────────── │
 *   │  {children}           │  ← contenido específico de cada subruta
 *   │                       │     (search, action buttons, etc.)
 *   │  ──── spacer ──────  │
 *   │  Footer (stats)       │
 *   └─────────────────────┘
 *
 * Props:
 *   title       {string}  – Título de la sección actual (ej. "Gerentes")
 *   subtitle    {string}  – Subtítulo descriptivo
 *   icon        {string}  – Ruta del icono del header
 *   footerText  {string}  – Texto informativo en el footer (opcional)
 *   children    {node}    – Contenido específico de la subruta
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useRouter, usePathname } from 'next/navigation';
import Image                      from 'next/image';


/* ── Rutas de navegación visibles en todas las páginas ─────────────────────── */
const NAV_LINKS = [
    {
        label:       'Establecimientos',
        href:        '/clients&manasgement',
        icon:        '/ico/icons8-tienda-30.png',
        description: 'Locales y clientes',
    },
    {
        label:       'Gerentes',
        href:        '/clients&manasgement/managers',
        icon:        '/ico/userList/patient_list.svg',
        description: 'Administrar gerentes',
    },
];


export default function SharedAside({
    title    = 'Clientes',
    subtitle = '',
    icon     = '/ico/clientes-integration.png',
    footerText,
    children,
}) {

    const router   = useRouter();
    const pathname = usePathname();

    /** Determina si una ruta de navegación está activa */
    const isActive = href => pathname === href;


    return (
        <aside className='
            relative w-[300px] shrink-0 h-full
            bg-gradient-to-b from-[#1a3c2a] to-[#235133]
            text-white rounded-xl overflow-hidden
            flex flex-col shadow-lg
        '>

            {/* ── HEADER ───────────────────────────────────────────────── */}
            <div className='px-5 pt-5 pb-3'>
                <div className='flex items-center gap-3 mb-1'>
                    <div className='w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0'>
                        <Image
                            src={icon}
                            alt={title}
                            width={20}
                            height={20}
                            style={{ filter: 'brightness(2)' }}
                        />
                    </div>
                    <div className='min-w-0'>
                        <h2 className='text-sm font-bold tracking-wide truncate'>{title}</h2>
                        {subtitle && (
                            <p className='text-[10px] text-emerald-300/70 truncate'>{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>


            {/* ── NAVEGACIÓN ───────────────────────────────────────────── */}
            <nav className='px-3 mb-2'>
                <p className='text-[10px] uppercase tracking-widest text-emerald-400/50 px-2 mb-2 font-semibold'>
                    Navegación
                </p>
                {NAV_LINKS.map(link => {
                    const active = isActive(link.href);
                    return (
                        <button
                            key={link.href}
                            onClick={() => router.push(link.href)}
                            title={link.description}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                                transition-all duration-200 mb-[2px]
                                ${active
                                    ? 'bg-emerald-500/25 text-white shadow-sm'
                                    : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            <Image
                                src={link.icon}
                                alt={link.label}
                                width={18}
                                height={18}
                                style={{ filter: active ? 'brightness(2)' : 'brightness(1.5)' }}
                            />
                            <span className='text-[13px] text-white font-medium'>{link.label}</span>
                            {active && (
                                <span className='ml-auto w-[6px] h-[6px] rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]' />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className='mx-5 border-t border-white/10' />


            {/* ── CONTENIDO ESPECÍFICO DE LA SUBRUTA ────────────────────── */}
            <div className='px-4 py-3 flex-1 flex flex-col gap-3 overflow-y-auto'>
                {children}
            </div>


            {/* ── FOOTER ───────────────────────────────────────────────── */}
            {footerText && (
                <div className='px-4 py-3 bg-black/15'>
                    <div className='flex items-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0' />
                        <p className='text-[11px] text-emerald-200/70 truncate'>{footerText}</p>
                    </div>
                </div>
            )}

        </aside>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * AsideSection — Sub-sección dentro del aside con título opcional.
 * Útil para separar "Buscar", "Acciones", etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AsideSection({ label, children }) {
    return (
        <div>
            {label && (
                <p className='text-[10px] uppercase tracking-widest text-emerald-400/50 mb-2 font-semibold'>
                    {label}
                </p>
            )}
            {children}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * AsideActionButton — Botón de acción estilizado para el aside.
 * Props: icon, label, onClick
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AsideActionButton({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className='
                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-emerald-100/80 text-[13px] font-medium
                hover:bg-emerald-500/20 hover:text-white
                transition-all duration-200 text-left
            '
        >
            <div className='w-6 h-6 bg-emerald-500/15 rounded-md flex items-center justify-center shrink-0'>
                <Image
                    src={icon}
                    alt={label}
                    width={14}
                    height={14}
                    style={{ filter: 'brightness(2)' }}
                />
            </div>
            {label}
        </button>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * AsideSearchInput — Input de búsqueda estilizado para el aside.
 * Props: placeholder, disabled, onChange, inputRef
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AsideSearchInput({ placeholder = 'Buscar...', disabled = false, onChange, inputRef }) {
    return (
        <div className='flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-[6px] focus-within:border-emerald-400/50 transition-colors'>
            <img
                src='/ico/seach/search.svg'
                alt='buscar'
                className='w-[14px] h-[14px] opacity-60 shrink-0'
                style={{ filter: 'invert(1)' }}
                draggable={false}
            />
            <input
                ref={inputRef}
                className='bg-transparent w-full text-xs text-white outline-none placeholder:text-emerald-200/40'
                placeholder={placeholder}
                type='text'
                disabled={disabled}
                onChange={onChange}
            />
        </div>
    );
}
