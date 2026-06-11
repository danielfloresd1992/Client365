'use client';
/**
 * page.jsx — /clients&manasgement
 * ─────────────────────────────────────────────────────────────────────────────
 * Página principal de gestión de clientes / establecimientos.
 *
 * Flujo de datos:
 *   1. Hace fetch de los establecimientos (/establishment&compressed).
 *   2. Los agrupa por franquicia (groupByFranchiseComprehensive).
 *   3. Calcula los conteos para el encabezado (totales de locales y franquicias).
 *
 * Estructura del render (este archivo renderiza solo el contenido; el aside
 * lateral lo aporta el layout de la ruta):
 *
 *   <main>
 *     ├─ <PageHeader>        título "Establecimientos" + StatPills (totales)
 *     ├─ <LoadingState>      spinner mientras carga          (condicional)
 *     ├─ <EmptyState>        aviso si no hay establecimientos (condicional)
 *     └─ <FranchiseSection>· una por franquicia:
 *            ├─ encabezado (nombre + nº de locales)
 *            └─ grid de <ClientBox> (una tarjeta por establecimiento)
 *   <FormComponent>          modal de alta/edición (franquicia / cliente)
 *
 * El cuerpo se divide en subcomponentes pequeños (PageHeader, LoadingState,
 * EmptyState, FranchiseSection, StatPill) para mantener legible el componente
 * principal `Content`.
 * ─────────────────────────────────────────────────────────────────────────────
 */



import FormComponent  from './assets/FormComponent';
import ClientBox      from './assets/client/clientBox';

import { useSingleFetch }                from '@/hook/ajax_hook/useFetch';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';




export default function Content() {

    /* ── Fetch de establecimientos ─────────────────────────────────────────── */
    const { data, loading } = useSingleFetch(
        { resource: '/establishment&compressed', method: 'get' },
        true,
    );

    /** Agrupa los establecimientos por franquicia para el render */
    const groupClients = groupByFranchiseComprehensive(data);

    /** Conteos rápidos para el encabezado */
    const totalClients   = Array.isArray(data) ? data.length : 0;
    const totalFranchise = groupClients ? Object.keys(groupClients).length : 0;

    /* ── Estados de la vista ───────────────────────────────────────────────── */
    const isLoading = loading && !data;
    const isEmpty   = !loading && totalClients === 0;


    return (
        <>
            <main className='flex-1 h-full overflow-y-auto'>

                <PageHeader
                    totalClients={totalClients}
                    totalFranchise={totalFranchise}
                />

                {isLoading && <LoadingState />}
                {isEmpty   && <EmptyState />}

                {/* Grid de establecimientos agrupado por franquicia */}
                {groupClients && Object.entries(groupClients).map(([franchise, items]) => (
                    <FranchiseSection key={franchise} franchise={franchise} items={items} />
                ))}

            </main>

            {/* Modal de formularios (franquicia / cliente) */}
            <FormComponent />
        </>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * PageHeader — Título de la página + estadísticas rápidas.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function PageHeader({ totalClients, totalFranchise }) {
    return (
        <div className='mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-4 border-b border-slate-200'>
            <h1 className='text-2xl font-semibold text-slate-800 mb-1 tracking-tight'>
                Establecimientos
            </h1>
            <p className='text-sm text-slate-400 mb-4'>
                Vista general de todos los locales y sus configuraciones
            </p>

            <div className='flex flex-wrap gap-3'>
                <StatPill value={totalClients}   label='Establecimientos' color='emerald' />
                <StatPill value={totalFranchise} label='Franquicias'      color='blue'    />
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * LoadingState — Indicador mientras se cargan los establecimientos.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function LoadingState() {
    return (
        <div className='flex items-center gap-2 text-slate-400 text-sm py-12 justify-center'>
            <span className='w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
            Cargando establecimientos…
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * EmptyState — Mensaje cuando no hay establecimientos registrados.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function EmptyState() {
    return (
        <div className='text-center text-slate-400 py-16'>
            <div className='mx-auto mb-3 w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center'>
                <img
                    src='/ico/icons8-tienda-30.png'
                    alt='sin datos'
                    className='opacity-40 w-7 h-7'
                />
            </div>
            <p className='text-sm'>No hay establecimientos registrados aún.</p>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * FranchiseSection — Encabezado de una franquicia + sus tarjetas de local.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function FranchiseSection({ franchise, items }) {
    return (
        <section className='mb-6'>

            {/* Encabezado de franquicia */}
            <div className='flex items-center gap-2 mb-3'>
                <span className='w-[7px] h-[7px] rounded-full bg-emerald-500' />
                <h2 className='text-[13px] font-semibold text-slate-600 uppercase tracking-[0.08em]'>
                    {franchise}
                </h2>
                <span className='text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-[2px] rounded-full ring-1 ring-slate-200/70'>
                    {items.length}
                </span>
                <div className='flex-1 border-t border-slate-200 ml-2' />
            </div>

            {/* Cards de establecimientos */}
            <div className='flex flex-wrap gap-4'>
                {items.map(client => (
                    <ClientBox data={client} key={client._id} />
                ))}
            </div>
        </section>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * StatPill — Badge de estadística compacto.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const pillColors = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    blue:    'bg-blue-50 text-blue-700 ring-blue-200',
    red:     'bg-red-50 text-red-700 ring-red-200',
};

function StatPill({ value, label, color = 'emerald' }) {
    return (
        <div className={`flex items-center gap-2 ring-1 rounded-full pl-3 pr-4 py-[7px] ${pillColors[color] ?? pillColors.emerald}`}>
            <span className='text-lg font-bold leading-none tabular-nums'>{value}</span>
            <span className='text-xs font-medium'>{label}</span>
        </div>
    );
}
