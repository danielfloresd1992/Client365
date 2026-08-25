'use client';

import { useState } from 'react';
import {
    PlugIcon, KeyIcon, PlusIcon, EyeIcon, EyeOffIcon,
    CopyIcon, CheckIcon, TrashIcon, AlertIcon,
} from '@/components/icons';
import useApiKeys from './assets/useApiKeys';

/**
 * /integraciones — HERRAMIENTA DE INTEGRACIONES.
 *
 * Acá se emiten y se revocan las llaves con las que un PROGRAMA consulta la API
 * de Jarvis: el asistente de IA, un panel, un script. Una llave no es un
 * usuario — no tiene sesión ni contraseña —, viaja en una cabecera y se puede
 * apagar sin tocar a nadie más.
 *
 *
 * LA PANTALLA GIRA ALREDEDOR DE UN MOMENTO
 *
 * El secreto de una llave existe UNA sola vez: el servidor lo devuelve al
 * crearla y después solo guarda su firma. Por eso lo recién emitido no aparece
 * como una fila más de la tabla sino en un panel propio que hay que descartar a
 * mano. Si se pierde, no hay forma de recuperarlo: se revoca y se emite otra.
 *
 * Pero el secreto NACE TAPADO. Esta pantalla se abre en una oficina, se
 * comparte por pantalla y termina en capturas: dejar la llave a la vista por
 * defecto la filtra sin que nadie haya decidido filtrarla. Copiar funciona con
 * el secreto tapado —que es el caso normal— y revelarlo es un gesto aparte,
 * para cuando hay que teclearlo en otra máquina.
 *
 * El permiso de administrador NO se comprueba acá: la ruta está en ADMIN_ROUTES
 * (libs/auth/routes.config), así que el menú la oculta y LoadingGuard devuelve
 * un 403 a quien escriba la URL. Duplicar la comprobación acá solo agregaría un
 * segundo lugar donde desincronizarla.
 */
export default function IntegracionesPage() {

    const { llaves, cargando, error, llaveNueva, guardando, emitir, revocar, descartarLlaveNueva } = useApiKeys();

    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [nombre, setNombre] = useState('');
    const [caducidad, setCaducidad] = useState('');
    const [confirmando, setConfirmando] = useState(null);

    const enviar = async (evento) => {
        evento.preventDefault();
        const creada = await emitir({
            name: nombre.trim(),
            expiresAt: caducidad ? new Date(caducidad).toISOString() : null,
        });
        if (creada) {
            setNombre('');
            setCaducidad('');
            setFormularioAbierto(false);
        }
    };

    return (
        <div className='w-full h-full bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden'>

            <header className='shrink-0 px-5 pt-3 border-b border-gray-200'>
                <div className='flex items-center gap-3 pb-2.5'>
                    <span className='shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#29c50c]/10 text-[#1f9a08]'>
                        <PlugIcon size={20} />
                    </span>
                    <div className='min-w-0'>
                        <h1 className='text-base font-semibold text-slate-900 leading-tight'>Herramienta de integraciones</h1>
                        <p className='text-xs text-slate-500 leading-tight'>
                            Llaves con las que otros sistemas consultan la API de Jarvis365.
                        </p>
                    </div>

                    <button
                        type='button'
                        onClick={() => setFormularioAbierto(v => !v)}
                        disabled={guardando}
                        className='ml-auto shrink-0 inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-lg text-sm font-medium bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none'
                    >
                        <PlusIcon size={16} strokeWidth={2.5} className={formularioAbierto ? 'rotate-45 transition-transform' : 'transition-transform'} />
                        {formularioAbierto ? 'Cancelar' : 'Nueva llave'}
                    </button>
                </div>
            </header>

            <div className='flex-1 overflow-y-auto p-5 space-y-4'>

                {error && (
                    <div className='flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'>
                        <AlertIcon size={18} className='shrink-0 mt-px' />
                        <span>{error}</span>
                    </div>
                )}

                {llaveNueva && (
                    <SecretoRecienCreado llave={llaveNueva} onDescartar={descartarLlaveNueva} />
                )}

                {formularioAbierto && (
                    <form onSubmit={enviar} className='rounded-xl border border-gray-200 bg-slate-50/60 p-4 space-y-3'>
                        <div className='grid gap-3 sm:grid-cols-2'>
                            <label className='block'>
                                <span className='block text-xs font-medium text-slate-700 mb-1'>¿Para qué es?</span>
                                <input
                                    type='text'
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder='Asistente de IA'
                                    minLength={3}
                                    maxLength={80}
                                    required
                                    autoFocus
                                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                                />
                                <span className='block text-[11px] text-slate-500 mt-1'>
                                    Un nombre que después permita saber cuál apagar.
                                </span>
                            </label>

                            <label className='block'>
                                <span className='block text-xs font-medium text-slate-700 mb-1'>Caduca el (opcional)</span>
                                <input
                                    type='date'
                                    value={caducidad}
                                    onChange={e => setCaducidad(e.target.value)}
                                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c50c]/40 focus:border-[#29c50c]'
                                />
                                <span className='block text-[11px] text-slate-500 mt-1'>
                                    En blanco, no caduca.
                                </span>
                            </label>
                        </div>

                        <button
                            type='submit'
                            disabled={guardando || nombre.trim().length < 3}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-[#29c50c] text-white hover:bg-[#1f9a08] transition-colors disabled:opacity-50 disabled:pointer-events-none'
                        >
                            <KeyIcon size={16} />
                            {guardando ? 'Creando…' : 'Crear llave'}
                        </button>
                    </form>
                )}

                <TablaDeLlaves
                    llaves={llaves}
                    cargando={cargando}
                    guardando={guardando}
                    confirmando={confirmando}
                    onPedirConfirmacion={setConfirmando}
                    onRevocar={async (id) => { await revocar(id); setConfirmando(null); }}
                />
            </div>
        </div>
    );
}


/**
 * El panel del secreto. Existe una vez por llave y no vuelve.
 *
 * Nace TAPADO. El identificador —la parte antes del punto— sí se ve: es público,
 * ya sale en la tabla, y es lo que permite confirmar de un vistazo que se está
 * copiando la llave correcta sin destapar nada.
 */
function SecretoRecienCreado({ llave, onDescartar }) {

    const [copiado, setCopiado] = useState(false);
    const [revelado, setRevelado] = useState(false);

    // La llave es `jk_<identificador>.<secreto>`. Solo se tapa el secreto.
    const punto = llave.plaintext.indexOf('.');
    const identificador = punto > 0 ? llave.plaintext.slice(0, punto + 1) : '';
    const secreto = punto > 0 ? llave.plaintext.slice(punto + 1) : llave.plaintext;
    const tapado = '•'.repeat(Math.min(secreto.length, 48));

    const copiar = async () => {
        try {
            // Se copia SIEMPRE la llave completa, esté revelada o no: tapar es
            // para la vista, no para el portapapeles.
            await navigator.clipboard.writeText(llave.plaintext);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        }
        catch {
            // Sin permiso de portapapeles queda revelarla y seleccionarla a
            // mano. No es motivo para romper nada.
            setRevelado(true);
        }
    };

    return (
        <div className='rounded-xl border border-[#29c50c] bg-gradient-to-b from-[#29c50c]/[0.07] to-transparent p-4 space-y-3'>

            <div className='flex items-start gap-2.5'>
                <span className='shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-[#29c50c] text-white'>
                    <KeyIcon size={17} />
                </span>
                <div className='min-w-0'>
                    <h2 className='text-sm font-semibold text-slate-900 leading-tight'>
                        Llave creada: {llave.name}
                    </h2>
                    <p className='flex items-center gap-1 text-xs text-rose-700 font-medium mt-0.5'>
                        <AlertIcon size={13} className='shrink-0' />
                        Copiala ahora. Es la única vez que se muestra.
                    </p>
                </div>
            </div>

            <div className='flex items-stretch gap-2'>
                <code className='flex-1 min-w-0 flex items-center overflow-x-auto rounded-lg bg-slate-900 text-slate-100 px-3 py-2.5 text-xs font-mono whitespace-nowrap'>
                    <span className='text-slate-400'>{identificador}</span>
                    <span className={revelado ? '' : 'tracking-[0.15em] text-slate-500 select-none'}>
                        {revelado ? secreto : tapado}
                    </span>
                </code>

                <button
                    type='button'
                    onClick={() => setRevelado(v => !v)}
                    title={revelado ? 'Ocultar' : 'Revelar'}
                    aria-label={revelado ? 'Ocultar la llave' : 'Revelar la llave'}
                    className='shrink-0 grid place-items-center w-10 rounded-lg border border-gray-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors'
                >
                    {revelado ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                </button>

                <button
                    type='button'
                    onClick={copiar}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                        copiado
                            ? 'bg-[#29c50c] text-white'
                            : 'bg-slate-900 text-white hover:bg-slate-700'
                    }`}
                >
                    {copiado ? <CheckIcon size={15} strokeWidth={2.5} /> : <CopyIcon size={15} />}
                    {copiado ? 'Copiado' : 'Copiar'}
                </button>
            </div>

            <div className='text-[11px] text-slate-600 space-y-1'>
                <p>Se manda en la cabecera de cada petición:</p>
                <code className='block rounded-lg bg-white border border-gray-200 px-2.5 py-1.5 font-mono text-slate-700 overflow-x-auto whitespace-nowrap'>
                    Authorization: Bearer <span className='text-slate-400'>{identificador}</span>
                    <span className={revelado ? '' : 'tracking-[0.15em] text-slate-400 select-none'}>
                        {revelado ? secreto : tapado}
                    </span>
                </code>
            </div>

            <button
                type='button'
                onClick={onDescartar}
                className='text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2'
            >
                Ya la copié, ocultar
            </button>
        </div>
    );
}


/** La lista. Sin secretos: solo lo que hace falta para decidir cuál apagar. */
function TablaDeLlaves({ llaves, cargando, guardando, confirmando, onPedirConfirmacion, onRevocar }) {

    if (cargando) {
        return (
            <div className='rounded-xl border border-gray-200 py-12 text-center'>
                <p className='text-sm text-slate-500'>Cargando llaves…</p>
            </div>
        );
    }

    if (llaves.length === 0) {
        return (
            <div className='rounded-xl border border-dashed border-gray-300 py-12 text-center'>
                <span className='inline-grid place-items-center w-11 h-11 rounded-xl bg-slate-100 text-slate-400 mb-3'>
                    <KeyIcon size={22} />
                </span>
                <p className='text-sm font-medium text-slate-700'>Todavía no hay ninguna llave</p>
                <p className='text-xs text-slate-500 mt-1 max-w-sm mx-auto'>
                    Creá una para que un programa pueda consultar la API sin ser un usuario con sesión.
                </p>
            </div>
        );
    }

    return (
        <div className='overflow-hidden rounded-xl border border-gray-200'>
            <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='bg-slate-50 border-b border-gray-200'>
                        <tr className='text-[11px] uppercase tracking-wider text-slate-500'>
                            <th className='text-center font-semibold px-4 py-2.5'>Nombre</th>
                            <th className='text-center font-semibold px-4 py-2.5'>Identificador</th>
                            <th className='text-center font-semibold px-4 py-2.5'>Creada por</th>
                            <th className='text-center font-semibold px-4 py-2.5'>Último uso</th>
                            <th className='text-center font-semibold px-4 py-2.5'>Usos</th>
                            <th className='px-4 py-2.5'></th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                        {llaves.map(llave => {
                            const caducada = llave.expiresAt && new Date(llave.expiresAt).getTime() <= Date.now();
                            const apagada = !llave.active || caducada;

                            return (
                                <tr key={llave._id} className='hover:bg-slate-50/70 transition-colors'>

                                    <td className='px-4 py-3'>
                                        <div className='flex items-center justify-center gap-2.5'>
                                            <span className={`shrink-0 grid place-items-center w-8 h-8 rounded-lg ${
                                                apagada ? 'bg-slate-100 text-slate-400' : 'bg-[#29c50c]/10 text-[#1f9a08]'
                                            }`}>
                                                <KeyIcon size={16} />
                                            </span>
                                            <div className='min-w-0 text-left'>
                                                <span className={`block font-medium truncate ${apagada ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {llave.name}
                                                </span>
                                                {llave.expiresAt && (
                                                    <span className={`block text-[11px] ${caducada ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                                                        {caducada ? 'caducada el ' : 'caduca el '}{formatearFecha(llave.expiresAt, true)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className='px-4 py-3 text-center'>
                                        <code className='inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600'>
                                            {llave.pista}
                                        </code>
                                    </td>

                                    <td className='px-4 py-3 text-center text-slate-600'>{llave.createdByName || '—'}</td>

                                    <td className='px-4 py-3 text-center'>
                                        {llave.lastUsedAt ? (
                                            <span className='text-slate-600'>{formatearFecha(llave.lastUsedAt)}</span>
                                        ) : (
                                            <span className='inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700'>
                                                sin usar
                                            </span>
                                        )}
                                    </td>

                                    <td className='px-4 py-3 text-center tabular-nums text-slate-600'>
                                        {llave.usageCount ?? 0}
                                    </td>

                                    <td className='px-4 py-3 text-center whitespace-nowrap'>
                                        {confirmando === llave._id ? (
                                            <span className='inline-flex items-center gap-1.5'>
                                                <span className='text-xs text-slate-600'>¿Seguro?</span>
                                                <button
                                                    type='button'
                                                    disabled={guardando}
                                                    onClick={() => onRevocar(llave._id)}
                                                    className='px-2.5 py-1 rounded-md text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50'
                                                >
                                                    Sí, eliminar
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => onPedirConfirmacion(null)}
                                                    className='px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-100 transition-colors'
                                                >
                                                    No
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={() => onPedirConfirmacion(llave._id)}
                                                title='Eliminar esta llave'
                                                className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors'
                                            >
                                                <TrashIcon size={15} />
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


const formatearFecha = (valor, soloFecha = false) => {
    try {
        return new Date(valor).toLocaleString('es-VE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            ...(soloFecha ? {} : { hour: '2-digit', minute: '2-digit' }),
        });
    }
    catch {
        return '—';
    }
};
