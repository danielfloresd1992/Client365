'use client';
/**
 * page.jsx — /clients&manasgement
 * ─────────────────────────────────────────────────────────────────────────────
 * Página principal de gestión de clientes / establecimientos.
 *
 * Estructura visual:
 *   ┌─────────────┬──────────────────────────────────────────────┐
 *   │  Aside      │  Resumen (stats)                             │
 *   │  (nav +     │  ───────────────────────────                  │
 *   │  search +   │  [ Franquicia A ]                             │
 *   │  actions)   │     ┌──────┐ ┌──────┐ ┌──────┐              │
 *   │             │     │ Card │ │ Card │ │ Card │              │
 *   │             │     └──────┘ └──────┘ └──────┘              │
 *   │             │  [ Franquicia B ]                             │
 *   │             │     ┌──────┐ ┌──────┐                        │
 *   │             │     │ Card │ │ Card │                        │
 *   │             │     └──────┘ └──────┘                        │
 *   └─────────────┴──────────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */
import Aside          from './assets/BannerConaint';
import FormComponent  from './assets/FormComponent';
import ClientBox      from '@/components/TableClient/assets/clientBox';

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


    return (
        <>
            {/* ── ASIDE LATERAL ────────────────────────────────────────── */}
            <Aside clients={data} />

            {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────── */}
            <main className='flex-1 h-full overflow-y-auto p-4 sm:p-6'>

                {/* ── Header + stats rápidos ───────────────────────────── */}
                <div className='mb-6'>
                    <h1 className='text-xl font-bold text-gray-800 mb-1'>
                        Establecimientos
                    </h1>
                    <p className='text-sm text-gray-400 mb-4'>
                        Vista general de todos los locales y sus configuraciones
                    </p>

                    {/* Mini stats */}
                    <div className='flex flex-wrap gap-3'>
                        <StatPill
                            value={totalClients}
                            label='Establecimientos'
                            color='emerald'
                        />
                        <StatPill
                            value={totalFranchise}
                            label='Franquicias'
                            color='blue'
                        />
                    </div>
                </div>

                {/* ── Loading ──────────────────────────────────────────── */}
                {loading && !data && (
                    <div className='flex items-center gap-2 text-gray-400 text-sm py-12 justify-center'>
                        <span className='w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin' />
                        Cargando establecimientos…
                    </div>
                )}

                {/* ── Vacío ────────────────────────────────────────────── */}
                {!loading && totalClients === 0 && (
                    <div className='text-center text-gray-400 py-16'>
                        <img
                            src='/ico/icons8-tienda-30.png'
                            alt='sin datos'
                            className='mx-auto mb-3 opacity-30 w-12 h-12'
                        />
                        <p className='text-sm'>No hay establecimientos registrados aún.</p>
                    </div>
                )}

                {/* ── Grid por franquicia ───────────────────────────────── */}
                {groupClients && Object.entries(groupClients).map(([franchise, items]) => (
                    <section key={franchise} className='mb-6'>

                        {/* Encabezado de franquicia */}
                        <div className='flex items-center gap-2 mb-3'>
                            <span className='w-[6px] h-[6px] rounded-full bg-emerald-500' />
                            <h2 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                                {franchise}
                            </h2>
                            <span className='text-[11px] text-gray-400 bg-gray-100 px-2 py-[1px] rounded-full'>
                                {items.length}
                            </span>
                            <div className='flex-1 border-t border-gray-200 ml-2' />
                        </div>

                        {/* Cards de establecimientos */}
                        <div className='flex flex-wrap gap-4'>
                            {items.map(client => (
                                <ClientBox data={client} key={client._id} />
                            ))}
                        </div>
                    </section>
                ))}

            </main>

            {/* ── Modal de formularios (franquicia / cliente) ──────────── */}
            <FormComponent />
        </>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
 * StatPill — Badge de estadística compacto
 * ─────────────────────────────────────────────────────────────────────────────
 */
const pillColors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    red:     'bg-red-50 text-red-700 border-red-200',
};

function StatPill({ value, label, color = 'emerald' }) {
    return (
        <div className={`flex items-center gap-2 border rounded-full px-4 py-[6px] ${pillColors[color] ?? pillColors.emerald}`}>
            <span className='text-lg font-bold leading-none'>{value}</span>
            <span className='text-xs font-medium'>{label}</span>
        </div>
    );
}
