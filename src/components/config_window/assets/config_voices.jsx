'use client';

import { useEffect, useRef, useState } from 'react';
import useSpeckAlert from '@/hook/useSpeckAlert';
import useAuthOnServer from '@/hook/auth';


// Bandera por idioma de la voz. Piper trae es-ES/es-MX/en-US/pt-BR; las
// nativas o del dispositivo a veces solo 'es'/'en'/'pt'.
const LANG_FLAG = { 'es-ES': '🇪🇸', 'es-MX': '🇲🇽', 'en-US': '🇺🇸', 'pt-BR': '🇧🇷' };
const flagOf = (lang = '') =>
    LANG_FLAG[lang]
    ?? (lang.startsWith('es') ? '🌎' : lang.startsWith('en') ? '🇺🇸' : lang.startsWith('pt') ? '🇧🇷' : '🔊');

// Calidad del modelo → etiqueta + color del chip (tintes claros, en armonía
// con el resto del sistema: verde/azul/ámbar/gris suaves).
const QUALITY = {
    high:   { label: 'Alta',   cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
    medium: { label: 'Media',  cls: 'text-sky-700 bg-sky-50 ring-sky-200' },
    low:    { label: 'Baja',   cls: 'text-amber-700 bg-amber-50 ring-amber-200' },
    x_low:  { label: 'Ligera', cls: 'text-slate-600 bg-slate-100 ring-slate-200' },
};

// Motor de síntesis → etiqueta legible
const ENGINE_LABEL = {
    piper: 'Piper · IA local',
    native: 'Voz nativa',
    cordova: 'Dispositivo',
    'audio-fallback': 'Google',
};

const TEST_PHRASE = 'Hola, esta es una prueba de voz de Jarvis 365.';


// Ícono de bocina con 0–3 ondas según el nivel (SVG nítido, escalable y
// teñible con currentColor — reemplaza los PNG base64 borrosos anteriores).
function VolumeIcon({ level }) {
    const waves = level <= 0 ? 0 : level < 0.4 ? 1 : level < 0.75 ? 2 : 3;
    return (
        <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor' stroke='none' />
            {level <= 0 && <path d='M16 9.5l5 5M21 9.5l-5 5' />}
            {waves >= 1 && <path d='M15.5 8.8a4 4 0 0 1 0 6.4' />}
            {waves >= 2 && <path d='M17.7 6.5a7 7 0 0 1 0 11' />}
            {waves >= 3 && <path d='M19.8 4.4a10 10 0 0 1 0 15.2' />}
        </svg>
    );
}


/*
 * EL CANDADO DE LA SECCIÓN.
 *
 * Se dibuja ENCIMA de los controles y los deja desenfocados detrás, en vez de
 * esconderlos: así se ve que la consola existe y está configurada, y lo único
 * que falta es el permiso. Quitarlos de la pantalla haría creer que la voz no
 * está andando — y sí lo está.
 *
 * Los controles además van `disabled` de verdad. Este panel explica; no es lo
 * que impide tocarlos, porque una capa encima se saltea con el teclado.
 */
function CandadoDeAdmin() {
    return (
        <div className='candado-admin absolute inset-0 z-10 grid place-items-center rounded-xl
                        bg-white/55 backdrop-blur-[3px] px-4 text-center'>

            <div className='flex flex-col items-center gap-2'>
                <span className='relative grid place-items-center h-12 w-12 rounded-2xl
                                 bg-white ring-1 ring-emerald-200 text-emerald-600
                                 shadow-[0_8px_22px_-10px_rgba(41,197,12,.55)]'>
                    {/* El halo respira despacio: llama la atención sin pedirla. */}
                    <span className='candado-halo absolute inset-0 rounded-2xl ring-2 ring-emerald-400/45' aria-hidden='true' />
                    <svg width='21' height='21' viewBox='0 0 24 24' fill='none' stroke='currentColor'
                        strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round'>
                        <rect x='4' y='10.5' width='16' height='10' rx='2.5' />
                        <path d='M8 10.5V7a4 4 0 0 1 8 0v3.5' />
                        <path d='M12 14.5v2' />
                    </svg>
                </span>

                <p className='text-[0.82rem] font-semibold tracking-tight text-slate-800'>
                    Sección para administradores
                </p>
                <p className='max-w-[30ch] text-[0.66rem] leading-relaxed text-slate-500'>
                    Las alertas se siguen escuchando con la voz configurada. Cambiarla es una
                    preferencia de toda la sala, y por eso la ajusta un administrador.
                </p>
            </div>
        </div>
    );
}


/*
 * Consola de voz de las alertas habladas (drawer "Parlante" del Lobby y
 * ventana de configuración). Tarjeta CLARA en armonía con el resto del
 * sistema (blanco/slate + verde de marca #29c50c):
 *   · readout de la voz activa (bandera + idioma + calidad + motor),
 *   · selector nativo enriquecido (no se recorta dentro del drawer),
 *   · botón de prueba con ecualizador animado mientras habla,
 *   · volumen con medidor de bocina SVG y lectura en %.
 * Toda la lógica sigue en useSpeckAlert; aquí solo cambia la presentación.
 */
export default function SectionConfigVoice() {

    const {
        listVoicesState, voice_definitive, changeVoice, changueVolume,
        volumeState, speak, stop, currentEngine, downloadProgress, isLoading, isSupported,
    } = useSpeckAlert();

    /*
     * QUIÉN PUEDE CAMBIAR LA VOZ.
     *
     * El motor sigue funcionando para todos: `useSpeckAlert` arranca igual,
     * descarga su modelo y habla las alertas con lo que haya configurado. Lo
     * que se cierra es la manija — elegir voz, probarla y mover el volumen—,
     * porque es una preferencia de la sala entera y no de quien la mira.
     *
     * SE ESPERA A QUE LA SESIÓN CONTESTE. Mientras `stateSession` está en
     * 'loading', `admin` todavía es undefined: bloquear ahí le mostraría el
     * candado a un administrador durante el primer instante, que se lee como
     * que le quitaron el permiso.
     */
    const { dataSessionState } = useAuthOnServer();
    const sesionResuelta = Boolean(dataSessionState?.stateSession)
        && dataSessionState.stateSession !== 'loading';
    const bloqueado = sesionResuelta && dataSessionState?.dataSession?.admin !== true;

    // Feedback visual de "hablando": el hook no expone evento de fin, así que
    // se estima por la frase de prueba (o se corta con Detener).
    const [testing, setTesting] = useState(false);
    const timerRef = useRef(null);
    useEffect(() => () => clearTimeout(timerRef.current), []);

    const selected = listVoicesState.find(v => v.name === voice_definitive) || null;
    const level = Number(volumeState) || 0;
    const volPct = Math.round(level * 100);
    const downloading = downloadProgress > 0 && downloadProgress < 100;

    const handleTest = () => {
        if (testing) {
            stop?.();
            setTesting(false);
            clearTimeout(timerRef.current);
            return;
        }
        speak(TEST_PHRASE);
        setTesting(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setTesting(false), 3200);
    };

    return (
        <div className='w-full h-full p-3'>
            <div className='voice-console w-full h-full overflow-y-auto rounded-2xl bg-white text-slate-800 ring-1 ring-slate-200 shadow-[0_8px_28px_-14px_rgba(15,23,42,.22)] flex flex-col gap-4 p-4'>

                {/* Encabezado: identidad + motor activo */}
                <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                        <span className='grid place-items-center h-8 w-8 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 shrink-0'>
                            <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor' stroke='none' /><path d='M15.5 8.8a4 4 0 0 1 0 6.4' /><path d='M17.9 6.4a7.5 7.5 0 0 1 0 11.2' /></svg>
                        </span>
                        <div className='leading-tight min-w-0'>
                            <h2 className='text-[0.95rem] font-semibold tracking-tight truncate text-slate-800'>Consola de voz</h2>
                            <p className='text-[0.6rem] uppercase tracking-[0.18em] text-slate-500'>Alertas habladas</p>
                        </div>
                    </div>
                    <span className='shrink-0 text-[0.6rem] font-semibold px-2 py-1 rounded-full bg-slate-100 ring-1 ring-slate-200 text-slate-600 whitespace-nowrap'>
                        {ENGINE_LABEL[currentEngine] ?? currentEngine}
                    </span>
                </div>

                {/* Readout de la voz seleccionada */}
                <div className='rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-3'>
                    <p className='text-[0.58rem] uppercase tracking-[0.18em] text-slate-500 mb-1'>Voz activa</p>
                    {selected ? (
                        <div className='flex items-center gap-2 min-w-0'>
                            <span className='text-2xl leading-none shrink-0'>{flagOf(selected.lang)}</span>
                            <div className='min-w-0 flex-1'>
                                <p className='font-mono text-[0.9rem] text-emerald-700 truncate'>{selected.name}</p>
                                <p className='text-[0.62rem] text-slate-500'>{selected.lang}</p>
                            </div>
                            {selected.quality && QUALITY[selected.quality] && (
                                <span className={`shrink-0 text-[0.56rem] font-bold px-2 py-[3px] rounded-full ring-1 ${QUALITY[selected.quality].cls}`}>
                                    {QUALITY[selected.quality].label}
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className='font-mono text-[0.85rem] text-slate-400'>— sin voz seleccionada —</p>
                    )}
                </div>

                {/* LOS CONTROLES, EN UN SOLO GRUPO.
                    Van juntos porque se bloquean juntos: el candado se dibuja
                    encima de este bloque y no de la tarjeta entera, así el
                    encabezado y la voz activa siguen legibles — saber QUÉ voz
                    está sonando le sirve a cualquiera. */}
                <div className='relative flex flex-col gap-4'>

                {/* Selector de voz (nativo: nunca se recorta dentro del drawer) */}
                <label className='block'>
                    <span className='text-[0.58rem] uppercase tracking-[0.18em] text-slate-500'>Cambiar voz</span>
                    <div className='relative mt-1'>
                        <select
                            aria-label='Voz para las alertas'
                            value={voice_definitive || ''}
                            disabled={bloqueado || isLoading || listVoicesState.length === 0}
                            onChange={e => changeVoice(e.target.value)}
                            className='w-full appearance-none rounded-xl bg-white text-slate-800 text-[0.82rem] pl-3 pr-9 py-2.5 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50'
                        >
                            {listVoicesState.length === 0 && (
                                <option value='' style={{ color: '#1e293b', background: '#fff' }}>{isLoading ? 'Cargando voces…' : 'Sin voces disponibles'}</option>
                            )}
                            {listVoicesState.map(v => (
                                <option key={v.name} value={v.name} style={{ color: '#1e293b', background: '#fff' }}>
                                    {flagOf(v.lang)} {v.name}{v.quality ? ` · ${QUALITY[v.quality]?.label ?? v.quality}` : ''}
                                </option>
                            ))}
                        </select>
                        <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'><path d='M6 9l6 6 6-6' /></svg>
                        </span>
                    </div>
                </label>

                {/* Prueba de voz con ecualizador */}
                <button
                    type='button'
                    onClick={handleTest}
                    disabled={bloqueado || isLoading || !selected}
                    aria-label={testing ? 'Detener prueba de voz' : 'Probar voz'}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 ring-1 transition disabled:opacity-40 disabled:cursor-not-allowed ${testing ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200 hover:bg-slate-100'}`}
                >
                    <span className='grid place-items-center h-9 w-9 rounded-full shrink-0 bg-[#29c50c] text-slate-900 transition group-hover:brightness-110'>
                        {testing ? (
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><rect x='6' y='5' width='4' height='14' rx='1' /><rect x='14' y='5' width='4' height='14' rx='1' /></svg>
                        ) : (
                            <svg width='15' height='15' viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>
                        )}
                    </span>
                    <span className={`voice-eq ${testing ? 'is-speaking' : ''}`} aria-hidden='true'>
                        <i /><i /><i /><i /><i />
                    </span>
                    <span className='ml-auto text-[0.8rem] font-semibold text-slate-700'>{testing ? 'Detener' : 'Probar voz'}</span>
                </button>

                {/* Volumen */}
                <div className='rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-3'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-[0.58rem] uppercase tracking-[0.18em] text-slate-500'>Volumen</span>
                        <span className='font-mono text-[0.9rem] font-bold text-emerald-700 tabular-nums'>{volPct}%</span>
                    </div>
                    <div className='flex items-center gap-3'>
                        <span className={level <= 0 ? 'text-slate-400 shrink-0' : 'text-emerald-600 shrink-0'}>
                            <VolumeIcon level={level} />
                        </span>
                        <input
                            type='range'
                            min={0}
                            max={1}
                            step={0.05}
                            value={volumeState}
                            disabled={bloqueado}
                            onChange={e => changueVolume(Number(e.target.value))}
                            aria-label='Volumen de las alertas'
                            className='voice-range flex-1'
                        />
                    </div>
                </div>

                    {/* El candado va al final del grupo para quedar por encima
                        en el orden de pintado, sin necesidad de z-index. */}
                    {bloqueado && <CandadoDeAdmin />}
                </div>

                {/* Estados: descarga del modelo / carga del motor / no soportado */}
                {downloading && (
                    <div>
                        <div className='flex items-center justify-between text-[0.62rem] text-slate-500 mb-1'>
                            <span>Descargando modelo de voz…</span>
                            <span className='font-mono'>{downloadProgress}%</span>
                        </div>
                        <div className='h-1.5 rounded-full bg-slate-200 overflow-hidden'>
                            <div className='h-full bg-emerald-500 transition-[width] duration-300' style={{ width: `${downloadProgress}%` }} />
                        </div>
                    </div>
                )}
                {isLoading && !downloading && (
                    <div className='flex items-center gap-2 text-[0.7rem] text-slate-500'>
                        <span className='h-4 w-4 rounded-full border-2 border-emerald-500/70 border-t-transparent animate-spin' />
                        Cargando motor de voz…
                    </div>
                )}
                {!isLoading && !isSupported && listVoicesState.length === 0 && (
                    <p className='text-[0.7rem] text-amber-600'>Este dispositivo no soporta síntesis de voz.</p>
                )}
            </div>
        </div>
    );
}