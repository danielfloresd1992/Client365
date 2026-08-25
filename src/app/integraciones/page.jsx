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


/**
 * La lista. Sin secretos: solo lo que hace falta para decidir cuál apagar.
 *
 * Tres decisiones que la separan de una tabla corriente:
 *
 *   1. QUIÉN LA CREÓ Y CUÁNDO SE USÓ bajan a una segunda línea bajo el nombre.
 *      Eran dos columnas que casi siempre repetían el mismo nombre y dejaban la
 *      tabla llena de aire; juntas ocupan menos y se leen mejor.
 *
 *   2. EL ESTADO ES UN PUNTO DE COLOR, no una palabra en una celda. Se lee sin
 *      leer, que es lo que uno quiere al abrir esta pantalla: ¿hay algo raro?
 *
 *   3. LA PAPELERA SOLO SE TIÑE en la fila donde está el cursor. Una columna de
 *      botones rojos grita desde todas las filas y acaba ignorándose.
 *
 * La barra de arriba contesta «¿está todo bien?» antes de la primera fila.
 */
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

    const activas = llaves.filter(l => estadoDeLlave(l) === 'activa').length;
    const sinUsar = llaves.filter(l => estadoDeLlave(l) === 'sin-usar').length;
    const apagadas = llaves.length - activas - sinUsar;

    return (
        <div className='overflow-hidden rounded-xl border border-gray-200 shadow-sm'>

            {/* Contesta «¿está todo bien?» antes de leer una sola fila */}
            <div className='flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-slate-50'>
                <span className='text-xs font-semibold text-slate-900'>
                    {llaves.length} {llaves.length === 1 ? 'llave' : 'llaves'}
                </span>
                {activas > 0 && <><Punto /><span className='text-xs text-slate-600'>{activas} {activas === 1 ? 'activa' : 'activas'}</span></>}
                {sinUsar > 0 && <><Punto /><span className='text-xs font-medium text-amber-700'>{sinUsar} sin usar</span></>}
                {apagadas > 0 && <><Punto /><span className='text-xs text-slate-400'>{apagadas} {apagadas === 1 ? 'apagada' : 'apagadas'}</span></>}
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='bg-slate-50 border-b border-gray-200'>
                        <tr className='text-[10.5px] uppercase tracking-[0.08em] text-slate-500'>
                            <th className='text-left font-bold px-4 py-2.5'>Integración</th>
                            <th className='text-left font-bold px-4 py-2.5'>Identificador</th>
                            <th className='text-left font-bold px-4 py-2.5'>Estado</th>
                            <th className='text-right font-bold px-4 py-2.5'>Usos</th>
                            <th className='w-12'></th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {llaves.map(llave => {
                            const estado = estadoDeLlave(llave);
                            const apagada = estado === 'caducada' || estado === 'revocada';

                            return (
                                <tr key={llave._id} className='group hover:bg-slate-50/70 transition-colors'>

                                    <td className='px-4 py-2.5'>
                                        <div className='flex items-center gap-2.5'>
                                            <span className={`shrink-0 grid place-items-center w-[30px] h-[30px] rounded-lg ${
                                                estado === 'activa' ? 'bg-[#29c50c]/10 text-[#1f9a08]'
                                                    : estado === 'sin-usar' ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                <KeyIcon size={15} />
                                            </span>
                                            <div className='min-w-0'>
                                                <div className={`font-semibold leading-[1.3] truncate ${apagada ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {llave.name}
                                                </div>
                                                <div className='text-[11.5px] leading-[1.3] text-slate-400 truncate'>
                                                    {llave.createdByName || 'origen desconocido'}
                                                    {' · '}
                                                    {llave.lastUsedAt
                                                        ? `última consulta ${haceCuanto(llave.lastUsedAt)}`
                                                        : `creada ${haceCuanto(llave.createdAt)}`}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className='px-4 py-2.5'>
                                        <code className='inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600'>
                                            {llave.pista}
                                        </code>
                                    </td>

                                    <td className='px-4 py-2.5'>
                                        <Estado estado={estado} expiresAt={llave.expiresAt} />
                                    </td>

                                    <td className='px-4 py-2.5 text-right tabular-nums'>
                                        <span className={`font-semibold ${llave.usageCount > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {(llave.usageCount ?? 0).toLocaleString('es-VE')}
                                        </span>
                                    </td>

                                    <td className='px-4 py-2.5 text-right whitespace-nowrap'>
                                        {confirmando === llave._id ? (
                                            <span className='inline-flex items-center gap-1.5'>
                                                <button
                                                    type='button'
                                                    disabled={guardando}
                                                    onClick={() => onRevocar(llave._id)}
                                                    className='px-2.5 py-1 rounded-md text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50'
                                                >
                                                    Eliminar
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => onPedirConfirmacion(null)}
                                                    className='px-2 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-100 transition-colors'
                                                >
                                                    No
                                                </button>
                                            </span>
                                        ) : (
                                            /* Gris hasta que el cursor entra en la fila: una columna de
                                               botones rojos grita desde todas y acaba ignorándose. */
                                            <button
                                                type='button'
                                                onClick={() => onPedirConfirmacion(llave._id)}
                                                title={`Eliminar «${llave.name}»`}
                                                aria-label={`Eliminar la llave ${llave.name}`}
                                                className='grid place-items-center w-7 h-7 ml-auto rounded-md text-slate-300 group-hover:text-slate-500 hover:!text-rose-600 hover:!bg-rose-50 transition-colors'
                                            >
                                                <TrashIcon size={15} />
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


/** El separador de la barra de resumen. */
const Punto = () => <span className='w-[3px] h-[3px] rounded-full bg-slate-300' />;


/**
 * En qué estado está una llave.
 *
 * «Sin usar» es un estado propio y no un detalle: una llave emitida que nunca
 * se usó suele ser una que se copió mal, o una integración que quedó a medias.
 * Es la que conviene mirar primero.
 */
function estadoDeLlave(llave) {
    if (llave.active === false) return 'revocada';
    if (llave.expiresAt && new Date(llave.expiresAt).getTime() <= Date.now()) return 'caducada';
    if (!llave.lastUsedAt) return 'sin-usar';
    return 'activa';
}


/** El estado, como un punto de color con su palabra. */
function Estado({ estado, expiresAt }) {

    const estilos = {
        'activa':   { color: 'text-[#1f9a08]', punto: 'bg-[#29c50c]', halo: 'rgba(41,197,12,0.16)', texto: 'Activa' },
        'sin-usar': { color: 'text-amber-700', punto: 'bg-amber-500', halo: 'rgba(245,158,11,0.18)', texto: 'Sin usar' },
        'caducada': { color: 'text-slate-400', punto: 'bg-slate-300', halo: 'transparent', texto: 'Caducada' },
        'revocada': { color: 'text-slate-400', punto: 'bg-slate-300', halo: 'transparent', texto: 'Revocada' },
    }[estado];

    return (
        <span className={`inline-flex items-center gap-[7px] text-[11.5px] font-semibold ${estilos.color}`}>
            <span
                className={`w-1.5 h-1.5 rounded-full ${estilos.punto}`}
                style={{ boxShadow: `0 0 0 3px ${estilos.halo}` }}
            />
            {estilos.texto}
            {estado === 'caducada' && expiresAt && (
                <span className='font-normal text-slate-400'>el {formatearFecha(expiresAt, true)}</span>
            )}
        </span>
    );
}


/**
 * «hace 4 min», «hace 3 días».
 *
 * Una fecha exacta obliga a restar mentalmente para saber si una llave sigue
 * viva. Lo que se pregunta al mirar esta columna es «¿hace mucho?», y a eso
 * responde mejor un tiempo relativo.
 */
function haceCuanto(valor) {
    if (!valor) return '—';

    const ms = Date.now() - new Date(valor).getTime();
    if (!Number.isFinite(ms)) return '—';
    if (ms < 0) return 'recién';

    const minutos = Math.floor(ms / 60000);
    if (minutos < 1) return 'recién';
    if (minutos < 60) return `hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;

    const meses = Math.floor(dias / 30);
    if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;

    return `el ${formatearFecha(valor, true)}`;
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
