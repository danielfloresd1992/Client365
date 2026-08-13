import UsersDirectory from './assets/UsersDirectory';
import ExportUsersButton from './assets/ExportUsersButton';
import { UsersIcon } from '@/components/icons';

// Página /user/config - Gestión de perfiles: directorio de usuarios de la
// plataforma (lista paginada + buscador). El grueso vive en assets/UsersDirectory.
export default function ConfigPage() {
    return (
        <div className='w-full h-full p-4 sm:p-6 bg-gray-50 flex flex-col gap-4 overflow-hidden'>

            {/* Encabezado */}
            <div className='shrink-0 bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3'>
                <span className='shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                    <UsersIcon size={20} />
                </span>
                <div>
                    <h1 className='text-lg font-bold text-gray-800'>Gestión de perfiles</h1>
                    <p className='text-xs text-gray-500'>Directorio de usuarios de la plataforma</p>
                </div>

                {/* La descarga va en la cabecera, no dentro del directorio: no
                    exporta lo que hay en pantalla —que está paginado y filtrado
                    por el buscador— sino la plantilla activa completa. */}
                <div className='ml-auto'>
                    <ExportUsersButton />
                </div>
            </div>

            <UsersDirectory />
        </div>
    );
}
