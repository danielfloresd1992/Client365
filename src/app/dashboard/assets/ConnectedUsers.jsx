'use client';
import useAuthOnServer from '@/hook/auth';
import { useConnectedUsers } from '@/contexts/connectedUsersContext';

/*
 * "Conectados · App Manager" — vista del panel analítico. Solo PRESENTA la
 * lista que mantiene el provider global (useConnectedUsers): avatar con punto
 * verde de "en línea", contador de contorno y cierre de sesión remoto para
 * administradores. La lógica de socket vive en connectedUsersContext, que
 * sobrevive a la navegación entre rutas.
 */

// Avatar con iniciales + punto "en línea"
function OnlineAvatar({ name }) {
    const initials = (name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    return (
        <span className='relative shrink-0'>
            <span className='w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-700 flex items-center justify-center text-[11px] font-black'>
                {initials}
            </span>
            <span className='absolute -bottom-0.5 -right-0.5 flex h-[9px] w-[9px]' title='En línea'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-[9px] w-[9px] bg-emerald-500 ring-2 ring-white'></span>
            </span>
        </span>
    );
}

export default function ConnectedUsers() {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    // La lista y el cierre remoto los mantiene el provider global (persiste al
    // navegar). Aquí solo se presenta.
    const { connectedUsers: userState, closeRemoteSession } = useConnectedUsers();
    const totalOnline = userState.length;

    return (
        <>
            {/* Cabecera con contador en vivo */}
            <div className='shrink-0 px-4 pt-2 pb-1.5 border-b border-gray-100 flex items-center gap-2'>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-3.5 h-3.5 text-gray-400 shrink-0'>
                    <circle cx='12' cy='12' r='10'></circle>
                    <path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'></path>
                    <path d='M2 12h20'></path>
                </svg>
                <h2 className='text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap'>Conectados · App Manager</h2>
                <span className='ml-auto flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 tabular-nums'>
                    <span className='relative flex h-[6px] w-[6px]'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-[6px] w-[6px] bg-emerald-500'></span>
                    </span>
                    <b className='text-[11px] font-black'>{totalOnline}</b> en línea
                </span>
            </div>

            {/* Lista de conectados */}
            <div className='flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-1.5'>
                {userState.length > 0 ? userState.map(userClient => {
                    const fullName = `${userClient.name || ''} ${userClient.surName || ''}`.trim();
                    const displayName = fullName.toLowerCase() === 'daniel flores' ? '···' : (fullName || 'Usuario');
                    const canClose = user?.admin === true && user._id !== userClient._id;
                    return (
                        <div key={userClient._id} className='group flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 hover:border-gray-200 transition-colors'>
                            <OnlineAvatar name={fullName} />
                            <span className='min-w-0 flex-1 leading-tight'>
                                <span className='block text-[12px] font-semibold text-gray-700 truncate'>{displayName}</span>
                                <span className='block text-[10px] font-bold uppercase tracking-wider text-emerald-600'>en línea</span>
                            </span>
                            {canClose && (
                                <button
                                    type='button'
                                    onClick={() => closeRemoteSession(userClient)}
                                    title='Cerrar sesión de este usuario'
                                    aria-label='Cerrar sesión remota'
                                    className='shrink-0 flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md px-1.5 py-1 transition-colors'
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-3.5 h-3.5'>
                                        <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'></path>
                                        <polyline points='16 17 21 12 16 7'></polyline>
                                        <line x1='21' y1='12' x2='9' y2='12'></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                }) : (
                    <div className='flex-1 flex flex-col items-center justify-center text-center py-6 text-gray-300'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='w-7 h-7 mb-1.5'>
                            <circle cx='12' cy='12' r='10'></circle>
                            <path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'></path>
                            <path d='M2 12h20'></path>
                        </svg>
                        <p className='text-[11px] font-semibold text-gray-400'>Sin usuarios conectados</p>
                    </div>
                )}
            </div>
        </>
    );
}
