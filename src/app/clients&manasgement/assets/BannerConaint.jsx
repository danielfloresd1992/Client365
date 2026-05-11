'use client';
/**
 * BannerConaint.jsx — Aside de /clients&manasgement (página principal)
 * ─────────────────────────────────────────────────────────────────────────────
 * Usa SharedAside para mantener el mismo aspecto visual que el resto
 * de subrutas. Añade: buscador de establecimientos + acciones de creación.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useCallback, useRef } from 'react';
import { useDispatch }                    from 'react-redux';
import { setConfigModal }                 from '@/store/slices/globalModal';
import { setTypeForm }                    from '@/store/slices/typeForm';
import useAuthOnServer                    from '@/hook/auth';
import key_search                         from '@/libs/script/search';

import SharedAside, {
    AsideSection,
    AsideActionButton,
    AsideSearchInput,
} from './SharedAside';


export default function BannerContain({ clients }) {

    const [searchResult, setSearchResult] = useState({ result: [], open: false });
    const refSearch = useRef(null);
    const dispatch  = useDispatch();

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;


    /* ── Autorización ──────────────────────────────────────────────────────── */
    const validateAuth = useCallback(callback => {
        if (!user?.admin) {
            dispatch(setConfigModal({
                title: 'Sin autorización', description: 'No tienes permisos para esta acción',
                type: 'error', modalOpen: true, isCallback: null,
            }));
        } else { callback(); }
    }, [user]);


    /* ── Búsqueda client-side ──────────────────────────────────────────────── */
    const handleSearch = e => {
        const text = e.target.value;
        if (!text) return setSearchResult({ result: [], open: false });
        const result = key_search(clients, ['name'], text);
        setSearchResult({ result, open: true });
    };

    const handleSelectResult = item => {
        setSearchResult({ result: [], open: false });
        refSearch.current.value = '';
        const el = document.getElementById(`${item._id}-${item.name}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.add('seleted-element');
        }
    };


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <SharedAside
            title='Clientes'
            subtitle='Gestión de establecimientos'
            icon='/ico/clientes-integration.png'
            footerText={`${Array.isArray(clients) ? clients.length : 0} establecimientos`}
        >

            {/* ── Buscador ─────────────────────────────────────────── */}
            <AsideSection label='Buscar'>
                <div className='relative'>
                    <AsideSearchInput
                        placeholder='Nombre del establecimiento...'
                        disabled={!(Array.isArray(clients) && clients.length > 0)}
                        onChange={handleSearch}
                        inputRef={refSearch}
                    />

                    {/* Dropdown de resultados */}
                    {searchResult.open && searchResult.result.length > 0 && (
                        <div className='absolute z-20 top-[38px] left-0 w-full bg-[#1a3c2a] border border-emerald-600/40 rounded-lg shadow-xl max-h-[220px] overflow-y-auto'>
                            {searchResult.result.map(item => (
                                <button
                                    key={item._id}
                                    onClick={() => handleSelectResult(item)}
                                    className='w-full text-left text-xs px-3 py-2 text-emerald-100 hover:bg-emerald-600/30 transition-colors flex items-center gap-2'
                                >
                                    <span className='w-[5px] h-[5px] rounded-full bg-emerald-400 shrink-0' />
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </AsideSection>

            {/* ── Acciones ─────────────────────────────────────────── */}
            <AsideSection label='Acciones'>
                <AsideActionButton
                    icon='/ico/icons8-franquicia-50.png'
                    label='Crear Franquicia'
                    onClick={() => validateAuth(() => dispatch(setTypeForm('create-franchise')))}
                />
                <AsideActionButton
                    icon='/ico/icons8-tienda-30.png'
                    label='Crear Establecimiento'
                    onClick={() => validateAuth(() => dispatch(setTypeForm('create-client')))}
                />
            </AsideSection>

        </SharedAside>
    );
}
