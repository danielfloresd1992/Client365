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
            bg-gradient-to-b from-[#0c2a1c] via-[#103a26] to-[#0f3322]
            text-white rounded-2xl overflow-hidden
            flex flex-col shadow-xl ring-1 ring-emerald-950/40
        '>

            {/* ── HEADER ───────────────────────────────────────────────── */}
            <div className='px-5 pt-5 pb-4'>
                <div className='flex items-center gap-3'>
                    <div className='w-11 h-11 bg-emerald-400/15 ring-1 ring-emerald-400/25 rounded-xl flex items-center justify-center shrink-0'>
                        <Image
                            src={icon}
                            alt={title}
                            width={22}
                            height={22}
                            style={{ filter: 'brightness(2)' }}
                        />
                    </div>
                    <div className='min-w-0'>
                        <h2 className='text-base font-semibold tracking-tight truncate text-white'>{title}</h2>
                        {subtitle && (
                            <p className='text-xs text-emerald-200/60 truncate mt-[1px]'>{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>


            {/* ── NAVEGACIÓN ───────────────────────────────────────────── */}
            <nav className='px-3 mb-1'>
                <p className='text-[10px] uppercase tracking-[0.15em] text-emerald-300/40 px-2 mb-2 font-semibold'>
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
                                relative w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-left
                                transition-all duration-200 mb-[3px]
                                ${active
                                    ? 'bg-emerald-400/15 text-white ring-1 ring-emerald-400/20'
                                    : 'text-emerald-50/60 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            {active && (
                                <span className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]' />
                            )}
                            <Image
                                src={link.icon}
                                alt={link.label}
                                width={18}
                                height={18}
                                style={{ filter: active ? 'brightness(2)' : 'brightness(1.6)', opacity: active ? 1 : 0.7 }}
                            />
                            <span className='text-sm font-medium'>{link.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className='mx-5 my-1 border-t border-white/[0.06]' />


            {/* ── CONTENIDO ESPECÍFICO DE LA SUBRUTA ────────────────────── */}
            <div className='px-4 py-3 flex-1 flex flex-col gap-4 overflow-y-auto'>
                {children}
            </div>


            {/* ── FOOTER ───────────────────────────────────────────────── */}
            {footerText && (
                <div className='px-4 py-3 bg-black/20 border-t border-white/[0.06]'>
                    <div className='flex items-center gap-2'>
                        <span className='w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_#34d399]' />
                        <p className='text-xs text-emerald-100/60 truncate'>{footerText}</p>
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
                <p className='text-[10px] uppercase tracking-[0.15em] text-emerald-300/40 mb-2 font-semibold'>
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
                group w-full flex items-center gap-3 px-3 py-[9px] rounded-xl
                text-emerald-50/70 text-sm font-medium
                hover:bg-emerald-400/10 hover:text-white
                transition-all duration-200 text-left
            '
        >
            <div className='w-7 h-7 bg-emerald-400/10 ring-1 ring-emerald-400/15 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-400/20 transition-colors'>
                <Image
                    src={icon}
                    alt={label}
                    width={15}
                    height={15}
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
        <div className='flex items-center gap-2 bg-white/[0.07] ring-1 ring-white/10 rounded-xl px-3 py-[8px] focus-within:ring-emerald-400/50 focus-within:bg-white/10 transition-all'>
            <img
                src='/ico/seach/search.svg'
                alt='buscar'
                className='w-[15px] h-[15px] opacity-50 shrink-0'
                style={{ filter: 'invert(1)' }}
                draggable={false}
            />
            <input
                ref={inputRef}
                className='bg-transparent w-full text-sm text-white outline-none placeholder:text-emerald-100/30'
                placeholder={placeholder}
                type='text'
                disabled={disabled}
                onChange={onChange}
            />
        </div>
    );
}
