'use client';

import { thumbUrl } from '@/libs/image';

/**
 * Foto de perfil en miniatura, con la inicial de respaldo.
 *
 * Nació dentro de la grilla del horario, para la cadena de auditoría del
 * popover. Vive acá porque no tiene nada de esa pantalla: recibe un usuario y
 * dibuja su cara, que es algo que hace media aplicación.
 *
 * @param {{ user: { img?: string, name?: string } }} props
 */
export default function MiniAvatar({ user }) {
    return (
        <div className='w-5 h-5 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center'>
            {user?.img
                ? <img src={thumbUrl(user.img, 48)} className='w-full h-full object-cover' alt='' />
                : <span className='text-[8px] font-bold text-slate-600'>{user?.name?.[0] || 'A'}</span>}
        </div>
    );
}
