'use client';
import { useState, useEffect } from 'react';
import useAuthOnServer from '@/hook/auth';
import { getUsersList, updateUserByRrhh } from '@/libs/ajaxClient/user.fecth';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

/*
 * Directorio de usuarios de la plataforma (ruta /user/config).
 *
 * LISTA paginada que consume GET /user/list (sin password). El input de arriba
 * busca por nombre/apellido con debounce; cada búsqueda vuelve a la página 1.
 *
 * Si el usuario EN SESIÓN es admin, cada fila muestra interruptores para editar
 * `admin`, `super` e `inabilited`. El cambio reutiliza PUT /user/:id
 * (updateUserByRrhh), que exige admin y ALMACENA quién hizo el cambio
 * (updateByUser). No se puede editar el propio perfil desde aquí (anti-bloqueo).
 */

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 350;

const initialsOf = (name = '', surName = '') =>
    `${name[0] ?? ''}${surName[0] ?? ''}`.toUpperCase() || '·';

// Avatar: foto si existe, iniciales (verde de marca suave) si no o si falla.
function UserAvatar({ user }) {
    const [broken, setBroken] = useState(false);
    const fullName = `${user.name ?? ''} ${user.surName ?? ''}`.trim();
    if (user.img && !broken) {
        return (
            <img src={user.img} alt={fullName} onError={() => setBroken(true)}
                className='w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0' />
        );
    }
    return (
        <span className='w-10 h-10 rounded-full shrink-0 grid place-items-center text-[12px] font-black bg-[#29c50c]/10 text-[#1f9a08] border border-[#29c50c]/20'>
            {initialsOf(user.name, user.surName)}
        </span>
    );
}

// Interruptor compacto (switch) con etiqueta debajo.
function FlagSwitch({ label, checked, onToggle, disabled, tone }) {
    const onColor = tone === 'indigo' ? 'bg-indigo-600' : tone === 'red' ? 'bg-red-500' : 'bg-[#29c50c]';
    return (
        <button
            type='button'
            role='switch'
            aria-checked={checked}
            aria-label={label}
            onClick={onToggle}
            disabled={disabled}
            className='flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none'
        >
            <span className={`relative w-8 h-[18px] rounded-full transition-colors ${checked ? onColor : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[14px]' : ''}`} />
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${checked ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
        </button>
    );
}

// Controles de edición (solo admins): 3 interruptores + estado guardando/error.
function AdminControls({ user, currentUserId, onToggle }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    // No editar el propio perfil desde aquí (evita quitarte tus permisos).
    const isSelf = currentUserId != null && String(user._id) === String(currentUserId);

    const toggle = async (field) => {
        setError(false);
        setSaving(true);
        try {
            await onToggle(user._id, { [field]: !user[field] });
        }
        catch {
            setError(true);
        }
        finally {
            setSaving(false);
        }
    };

    const lock = isSelf || saving;
    return (
        <div className='shrink-0 flex items-center gap-3' title={isSelf ? 'No puedes editar tu propio perfil aquí' : undefined}>
            <FlagSwitch label='Admin' tone='green' checked={!!user.admin} disabled={lock} onToggle={() => toggle('admin')} />
            <FlagSwitch label='Super' tone='indigo' checked={!!user.super} disabled={lock} onToggle={() => toggle('super')} />
            <FlagSwitch label='Inhab.' tone='red' checked={!!user.inabilited} disabled={lock} onToggle={() => toggle('inabilited')} />
            {error && <span className='text-[9px] font-semibold text-red-600 whitespace-nowrap'>Error</span>}
        </div>
    );
}

// Fila de un usuario. Para admins: interruptores de edición a la derecha;
// para el resto: CI/email + badge "Inhabilitado" (solo lectura).
function UserRow({ user, canEdit, currentUserId, onToggle }) {
    const department = user.jobInformation?.department;
    const position = user.jobInformation?.position;
    const fullName = `${user.name ?? ''} ${user.surName ?? ''}`.trim();
    return (
        <div className='flex items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-gray-50 transition-colors'>
            <UserAvatar user={user} />
            <div className='min-w-0 flex-1 leading-tight'>
                <p className='text-sm font-semibold text-gray-800 truncate'>{fullName || 'Sin nombre'}</p>
                <p className='text-[11px] text-gray-500 truncate'>
                    {department || 'Sin departamento'}{position ? ` · ${position}` : ''}
                </p>
            </div>

            {canEdit ? (
                <AdminControls user={user} currentUserId={currentUserId} onToggle={onToggle} />
            ) : (
                <>
                    <div className='hidden sm:block min-w-0 text-right leading-tight'>
                        <p className='text-[11px] text-gray-500 tabular-nums truncate'>{user.dni ? `CI ${user.dni}` : 's/CI'}</p>
                        {user.email && <p className='text-[11px] text-gray-400 truncate max-w-[240px]'>{user.email}</p>}
                    </div>
                    {user.inabilited && (
                        <span className='shrink-0 text-[9.5px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5'>
                            Inhabilitado
                        </span>
                    )}
                </>
            )}
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className='flex items-center gap-3 px-4 py-2.5' aria-hidden='true'>
            <div className='w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0' />
            <div className='flex-1 space-y-1.5'>
                <div className='h-3 w-44 bg-gray-100 rounded animate-pulse' />
                <div className='h-2.5 w-28 bg-gray-100 rounded animate-pulse' />
            </div>
        </div>
    );
}

export default function UsersDirectory() {

    const { dataSessionState } = useAuthOnServer();
    const currentUser = dataSessionState?.dataSession;
    const canEdit = currentUser?.admin === true;   // solo admins editan
    const currentUserId = currentUser?._id;

    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);   // null = cargando
    const [error, setError] = useState(null);

    // Debounce del texto; al cambiar la búsqueda se vuelve a la página 1.
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);
    useEffect(() => { setPage(1); }, [debounced]);

    // Carga desde la API cada vez que cambia la página o la búsqueda.
    useEffect(() => {
        let alive = true;
        setData(null);
        setError(null);
        getUsersList({ page, limit: PAGE_SIZE, search: debounced })
            .then(response => { if (alive) setData(response); })
            .catch(err => {
                if (!alive) return;
                setError(err?.response?.data?.message || err?.message || 'Error de conexión');
                setData({ users: [], totalUsers: 0, totalPages: 1 });
            });
        return () => { alive = false; };
    }, [page, debounced]);

    // Edita una bandera reutilizando PUT /user/:id (audita quién cambió) y, si
    // sale bien, refleja el cambio en la fila. Re-lanza el error para que la
    // fila lo muestre y NO altere el estado si falló.
    const handleToggle = async (id, patch) => {
        await updateUserByRrhh(id, patch);
        setData(prev => prev
            ? { ...prev, users: prev.users.map(u => (String(u._id) === String(id) ? { ...u, ...patch } : u)) }
            : prev);
    };

    const users = data?.users ?? [];
    const totalPages = data?.totalPages ?? 1;
    const totalUsers = data?.totalUsers ?? 0;
    const loading = data === null;

    return (
        // Ocupa el alto disponible que le da la página; NO genera scroll externo.
        <div className='flex-1 min-h-0 flex flex-col gap-4'>

            {/* Buscador (fijo arriba) */}
            <div className='shrink-0 bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3'>
                <span className='relative flex-1'>
                    <SearchIcon size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
                    <input
                        type='text'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder='Buscar por nombre o apellido…'
                        className='w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29c50c]'
                    />
                </span>
                <span className='shrink-0 text-xs font-semibold text-gray-500 tabular-nums'>
                    {loading ? '…' : `${totalUsers} usuario${totalUsers === 1 ? '' : 's'}`}
                </span>
            </div>

            {/* Error de carga */}
            {error && (
                <div className='shrink-0 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3'>
                    No se pudo cargar la lista de usuarios: {error}
                </div>
            )}

            {/* Card de la lista: ocupa el alto restante. El SCROLL vive SOLO en la
                zona de filas; la paginación queda fija abajo, dentro de la card. */}
            <div className='flex-1 min-h-0 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden'>

                {/* Filas — único scroll vertical */}
                <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
                    {loading ? (
                        Array.from({ length: 12 }, (_, i) => <RowSkeleton key={i} />)
                    ) : users.length === 0 ? (
                        <p className='py-12 text-center text-sm text-gray-400'>
                            {debounced ? `Sin coincidencias para "${debounced}".` : 'No hay usuarios registrados.'}
                        </p>
                    ) : (
                        users.map(user => (
                            <UserRow
                                key={user._id}
                                user={user}
                                canEdit={canEdit}
                                currentUserId={currentUserId}
                                onToggle={handleToggle}
                            />
                        ))
                    )}
                </div>

                {/* Paginación fija en el fondo de la lista */}
                {!loading && totalPages > 1 && (
                    <div className='shrink-0 border-t border-gray-100 flex items-center justify-center gap-3 py-2'>
                        <button
                            type='button'
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            aria-label='Página anterior'
                            className='h-9 w-9 grid place-items-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29c50c]/60'
                        >
                            <ChevronLeftIcon size={18} />
                        </button>
                        <span className='text-sm font-semibold text-gray-600 tabular-nums'>Página {page} de {totalPages}</span>
                        <button
                            type='button'
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            aria-label='Página siguiente'
                            className='h-9 w-9 grid place-items-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29c50c]/60'
                        >
                            <ChevronRightIcon size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
