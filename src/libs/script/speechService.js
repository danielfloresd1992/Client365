'use client';

/**
 * Servicio singleton de Text-to-Speech multiplataforma.
 *
 * Estrategia de 4 motores (auto-detecta cuál funciona):
 *  1. Piper TTS via WASM — motor neuronal, 100% cliente. Import dinámico.
 *  2. Web Speech API (speechSynthesis) — navegadores que lo soportan.
 *  3. Cordova TTS nativo — usa cordova-plugin-tts-advanced (Android/iOS TTS).
 *  4. Audio fallback via Google Translate TTS — último recurso.
 *
 * Resuelve:
 *  - Auto-detección de motores disponibles al iniciar.
 *  - Cola de utterances para que no se pisen alertas simultáneas.
 *  - Unlock de audio en iOS/Android (requiere 1er gesto del usuario).
 *  - Splitting de textos largos (200 chars).
 *  - Timeout en Piper para evitar colas congeladas.
 */

const MAX_CHUNK_LENGTH = 200;
const PIPER_TIMEOUT_MS = 30000; // 30s máximo para que Piper genere audio

/** Detecta si el plugin TTS de Cordova está disponible (directo) */
function hasCordovaTTS() {
    return typeof window !== 'undefined' && window.TTS && typeof window.TTS.speak === 'function';
}

/** Detecta si el plugin soporta getVoices (cordova-plugin-tts-advanced) */
function hasCordovaGetVoices() {
    return hasCordovaTTS() && typeof window.TTS.getVoices === 'function';
}

/** Detecta si la app corre dentro de un iframe Cordova (postMessage bridge) */
function hasCordovaBridge() {
    return typeof window !== 'undefined' &&
        window.parent !== window &&
        window.location.hostname === 'jarvis365.net';
}

// Voces Piper disponibles en español (y otros idiomas útiles)
const PIPER_VOICES = [
    { id: 'es_ES-davefx-medium', name: 'David (España)', lang: 'es-ES', quality: 'medium' },
    { id: 'es_ES-sharvard-medium', name: 'Sharvard (España)', lang: 'es-ES', quality: 'medium' },
    { id: 'es_ES-carlfm-x_low', name: 'Carlos (España - Ligero)', lang: 'es-ES', quality: 'x_low' },
    { id: 'es_ES-mls_10246-low', name: 'MLS 10246 (España)', lang: 'es-ES', quality: 'low' },
    { id: 'es_ES-mls_9972-low', name: 'MLS 9972 (España)', lang: 'es-ES', quality: 'low' },
    { id: 'es_MX-ald-medium', name: 'Aldo (México)', lang: 'es-MX', quality: 'medium' },
    { id: 'es_MX-claude-high', name: 'Claude (México - Alta calidad)', lang: 'es-MX', quality: 'high' },
    { id: 'en_US-amy-medium', name: 'Amy (English US)', lang: 'en-US', quality: 'medium' },
    { id: 'en_US-danny-low', name: 'Danny (English US)', lang: 'en-US', quality: 'low' },
    { id: 'pt_BR-faber-medium', name: 'Faber (Português BR)', lang: 'pt-BR', quality: 'medium' },
];

const DEFAULT_VOICE_ID = 'es_MX-ald-medium';

function hasSpeechSynthesis() {
    return typeof window !== 'undefined'
        && typeof speechSynthesis !== 'undefined'
        && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Promesa con timeout */
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[Timeout] ${label} excedió ${ms}ms`)), ms)
        ),
    ]);
}

class SpeechService {
    constructor() {
        this._queue = [];
        this._speaking = false;
        this._unlocked = false;
        this._voices = [];
        this._selectedVoice = null;
        this._selectedVoiceId = DEFAULT_VOICE_ID;
        this._selectedVoiceLang = 'es-MX';
        this._volume = 1;
        this._ready = false;
        this._readyPromise = null;
        this._onVoicesChange = null;
        this._currentAudio = null;
        this._preloadPromise = null;
        this._downloadProgress = 0;
        this._onDownloadProgress = null;

        // Import dinámico de Piper — null si no se pudo cargar
        this._piperTTS = null;
        this._piperAvailable = false;
        this._lastPiperVoiceId = null; // track para saber si hay que resetear la sesión

        // Cordova TTS
        this._cordovaAvailable = false;
        this._cordovaVoices = [];

        // Motor activo: 'piper' | 'native' | 'cordova' | 'audio-fallback'
        this._engine = 'audio-fallback'; // default seguro hasta que se auto-detecte

        if (typeof window !== 'undefined') {
            this._readyPromise = this._init();
        }
    }

    /* -------------------------------------------------- */
    /*  Init                                               */
    /* -------------------------------------------------- */
    async _ensureReady() {
        if (this._readyPromise) await this._readyPromise;
    }

    async _init() {
        console.log('[SpeechService] Iniciando...');

        // 1. Intentar cargar Piper TTS dinámicamente
        await this._tryLoadPiper();

        // 2. Detectar Cordova TTS
        await this._tryDetectCordovaTTS();

        // 3. Construir lista de voces según lo que esté disponible
        this._buildVoiceList();

        // 4. Auto-detectar el mejor motor
        this._autoDetectEngine();

        // 5. Seleccionar voz por defecto
        this._selectDefaultVoice();

        if (this._onVoicesChange) this._onVoicesChange(this._voices);

        this._ready = true;
        console.log(`[SpeechService] Listo — motor: "${this._engine}", voces: ${this._voices.length}`);
    }

    async _tryLoadPiper() {
        try {
            this._piperTTS = await import('@mintplex-labs/piper-tts-web');
            this._piperAvailable = true;
            console.log('[SpeechService] Piper TTS cargado correctamente');
        } catch (e) {
            this._piperTTS = null;
            this._piperAvailable = false;
            console.warn('[SpeechService] Piper TTS no disponible:', e.message);
        }
    }

    async _tryDetectCordovaTTS() {
        // Método 1: Plugin directo (cuando cordova.js está cargado en la página)
        if (!hasCordovaTTS()) {
            // Esperar brevemente por si deviceready está pendiente
            if (typeof window !== 'undefined' && (window.cordova || window._cordovaNative)) {
                await new Promise((resolve) => {
                    const check = () => {
                        if (hasCordovaTTS()) resolve();
                        else setTimeout(check, 200);
                    };
                    check();
                    setTimeout(resolve, 3000);
                });
            }
        }

        // Método 2: Bridge postMessage (app cargada en iframe por launcher Cordova)
        if (!hasCordovaTTS() && hasCordovaBridge()) {
            this._cordovaAvailable = true;
            this._cordovaBridge = true;
            this._cordovaVoices = [];
            console.log('[SpeechService] Cordova TTS detectado via postMessage bridge');
            return;
        }

        if (hasCordovaTTS()) {
            this._cordovaAvailable = true;
            try {
                if (hasCordovaGetVoices()) {
                    const voices = await new Promise((resolve, reject) => {
                        window.TTS.getVoices((v) => resolve(v), (e) => reject(e));
                    });
                    this._cordovaVoices = voices || [];
                    console.log(`[SpeechService] Cordova TTS detectado con ${this._cordovaVoices.length} voces`);
                } else {
                    this._cordovaVoices = [];
                    console.log('[SpeechService] Cordova TTS detectado (sin getVoices)');
                }
            } catch (e) {
                this._cordovaVoices = [];
                console.log('[SpeechService] Cordova TTS detectado (sin listado de voces)');
            }
        } else if (!this._cordovaBridge) {
            console.log('[SpeechService] Cordova TTS no disponible');
        }
    }

    _buildVoiceList() {
        this._voices = [];

        // Voces Piper (solo si Piper cargó y NO estamos en Cordova bridge)
        if (this._piperAvailable && !this._cordovaBridge) {
            for (const v of PIPER_VOICES) {
                this._voices.push({
                    name: v.name,
                    lang: v.lang,
                    voiceURI: `piper:${v.id}`,
                    localService: true,
                    piperVoiceId: v.id,
                    quality: v.quality,
                    engine: 'piper',
                });
            }
        }

        // Voces nativas del navegador
        if (hasSpeechSynthesis()) {
            try {
                const nativeVoices = speechSynthesis.getVoices();
                if (nativeVoices.length > 0) {
                    for (const v of nativeVoices) {
                        this._voices.push({
                            name: `[Nativa] ${v.name}`,
                            lang: v.lang,
                            voiceURI: v.voiceURI,
                            localService: v.localService,
                            nativeVoice: v,
                            engine: 'native',
                        });
                    }
                }
            } catch (e) { /* sin voces nativas */ }
        }

        // Voces Cordova nativas (Android/iOS TTS via plugin)
        if (this._cordovaAvailable) {
            if (this._cordovaVoices.length > 0) {
                for (const v of this._cordovaVoices) {
                    this._voices.push({
                        name: `[Dispositivo] ${v.name || v.identifier || 'Voz'}`,
                        lang: v.language || v.lang || 'es',
                        voiceURI: `cordova:${v.identifier || v.name}`,
                        localService: true,
                        cordovaVoice: v,
                        engine: 'cordova',
                    });
                }
            } else {
                // Plugin disponible pero sin listado — agregar voces genéricas
                this._voices.push(
                    { name: '[Dispositivo] Español', lang: 'es-ES', voiceURI: 'cordova:es', engine: 'cordova' },
                    { name: '[Dispositivo] English', lang: 'en-US', voiceURI: 'cordova:en', engine: 'cordova' },
                    { name: '[Dispositivo] Português', lang: 'pt-BR', voiceURI: 'cordova:pt', engine: 'cordova' },
                );
            }
        }

        // Voces Audio Fallback (siempre disponibles como último recurso)
        this._voices.push(
            { name: 'Google Español', lang: 'es', voiceURI: 'audio-fallback', engine: 'audio-fallback' },
            { name: 'Google English', lang: 'en', voiceURI: 'audio-fallback', engine: 'audio-fallback' },
            { name: 'Google Português', lang: 'pt', voiceURI: 'audio-fallback', engine: 'audio-fallback' },
        );
    }

    _autoDetectEngine() {
        // En Cordova: prioridad al TTS nativo del dispositivo
        // En navegador: Piper > Native > Audio Fallback
        if (this._cordovaAvailable) {
            this._engine = 'cordova';
            console.log('[SpeechService] Motor principal: Cordova TTS nativo (prioridad en móvil)');
            return;
        }

        if (this._piperAvailable) {
            this._engine = 'piper';
            console.log('[SpeechService] Motor principal: Piper TTS (WASM)');
            return;
        }

        if (hasSpeechSynthesis()) {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                this._engine = 'native';
                console.log('[SpeechService] Motor principal: Web Speech API');
                return;
            }
        }

        this._engine = 'audio-fallback';
        console.log('[SpeechService] Motor principal: Audio fallback (Google TTS)');
    }

    _selectDefaultVoice() {
        if (this._engine === 'piper') {
            const def = this._voices.find(v => v.piperVoiceId === DEFAULT_VOICE_ID);
            if (def) {
                this._selectedVoice = def;
                this._selectedVoiceId = DEFAULT_VOICE_ID;
                this._selectedVoiceLang = def.lang;
                // Pre-descargar modelo en background
                this._preloadPiperModel(DEFAULT_VOICE_ID);
                return;
            }
        }

        if (this._engine === 'native') {
            const esVoice = this._voices.find(
                v => v.engine === 'native' && v.lang && v.lang.startsWith('es')
            );
            if (esVoice) {
                this._selectedVoice = esVoice;
                this._selectedVoiceLang = esVoice.lang;
                return;
            }
        }

        // Cordova
        if (this._engine === 'cordova') {
            const cordovaEs = this._voices.find(
                v => v.engine === 'cordova' && v.lang && v.lang.startsWith('es')
            );
            if (cordovaEs) {
                this._selectedVoice = cordovaEs;
                this._selectedVoiceLang = cordovaEs.lang;
                return;
            }
        }

        // Audio fallback
        const fallback = this._voices.find(v => v.engine === 'audio-fallback' && v.lang === 'es');
        if (fallback) {
            this._selectedVoice = fallback;
            this._selectedVoiceLang = 'es';
        }
    }

    _loadNativeVoicesAsync() {
        return new Promise((resolve) => {
            if (!hasSpeechSynthesis()) return resolve([]);

            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) return resolve(voices);

            const onVoices = () => {
                speechSynthesis.removeEventListener('voiceschanged', onVoices);
                resolve(speechSynthesis.getVoices());
            };
            speechSynthesis.addEventListener('voiceschanged', onVoices);

            setTimeout(() => {
                speechSynthesis.removeEventListener('voiceschanged', onVoices);
                resolve(speechSynthesis.getVoices());
            }, 3000);
        });
    }

    _preloadPiperModel(voiceId) {
        if (!this._piperTTS) return;
        this._preloadPromise = this._doPreload(voiceId);
        return this._preloadPromise;
    }

    async _doPreload(voiceId) {
        try {
            await this._piperTTS.download(voiceId, (progress) => {
                if (progress.total > 0) {
                    this._downloadProgress = Math.round((progress.loaded / progress.total) * 100);
                    if (this._onDownloadProgress) {
                        this._onDownloadProgress(this._downloadProgress);
                    }
                }
            });
            this._downloadProgress = 100;
            console.log(`[SpeechService] Modelo Piper "${voiceId}" cacheado`);
        } catch (e) {
            console.warn('[SpeechService] No se pudo pre-descargar modelo Piper:', e.message);
        }
    }

    /* -------------------------------------------------- */
    /*  Unlock (iOS / Android)                             */
    /* -------------------------------------------------- */
    unlock() {
        if (this._unlocked) return;

        try {
            const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
            audio.volume = 0;
            audio.play().catch(() => {});
        } catch (e) { /* ignore */ }

        if (hasSpeechSynthesis()) {
            try {
                const u = new SpeechSynthesisUtterance('');
                u.volume = 0;
                speechSynthesis.speak(u);
            } catch (e) { /* ignore */ }
        }

        this._unlocked = true;
    }

    /* -------------------------------------------------- */
    /*  Voces                                              */
    /* -------------------------------------------------- */
    getVoices() {
        return this._voices;
    }

    onVoicesChanged(cb) {
        this._onVoicesChange = cb;

        // Si hay voces nativas pendientes de cargar, escuchar cambios
        if (cb && hasSpeechSynthesis()) {
            const handler = () => {
                // Reconstruir la lista y notificar
                this._buildVoiceList();
                if (this._onVoicesChange) this._onVoicesChange(this._voices);
            };
            speechSynthesis.addEventListener('voiceschanged', handler);
            this._nativeVoicesHandler = handler;
        } else if (this._nativeVoicesHandler && hasSpeechSynthesis()) {
            speechSynthesis.removeEventListener('voiceschanged', this._nativeVoicesHandler);
            this._nativeVoicesHandler = null;
        }
    }

    onDownloadProgress(cb) {
        this._onDownloadProgress = cb;
    }

    selectVoiceByName(name) {
        const v = this._voices.find((voice) => voice.name === name);
        if (v) {
            this._selectedVoice = v;
            this._selectedVoiceLang = v.lang || 'es-MX';
            this._selectedVoiceId = v.piperVoiceId || null;

            // En Cordova bridge, mantener siempre el motor cordova
            if (this._cordovaBridge) {
                this._engine = 'cordova';
            } else {
                this._engine = v.engine || 'audio-fallback';
                // Si es voz Piper, pre-descargar modelo
                if (v.engine === 'piper' && v.piperVoiceId) {
                    this._preloadPiperModel(v.piperVoiceId);
                }
            }

            console.log(`[SpeechService] Voz seleccionada: "${name}" (motor: ${this._engine})`);
            return true;
        }
        console.warn(`[SpeechService] Voz no encontrada: "${name}"`);
        return false;
    }

    selectBestSpanishVoice() {
        if (this._voices.length === 0) return null;

        // Prioridad: Piper medium/high > Native español > Audio fallback
        if (this._piperAvailable) {
            const piperEs = this._voices.filter(
                v => v.engine === 'piper' && v.lang && v.lang.startsWith('es')
            );
            const best = piperEs.find(v => v.quality === 'high')
                || piperEs.find(v => v.quality === 'medium')
                || piperEs[0];

            if (best) {
                this._selectedVoice = best;
                this._selectedVoiceLang = best.lang;
                this._engine = 'piper';
                this._selectedVoiceId = best.piperVoiceId;
                this._preloadPiperModel(best.piperVoiceId);
                return best;
            }
        }

        // Nativas español
        const nativeEs = this._voices.filter(
            v => v.engine === 'native' && v.lang && v.lang.startsWith('es')
        );
        if (nativeEs.length > 0) {
            this._selectedVoice = nativeEs[0];
            this._selectedVoiceLang = nativeEs[0].lang;
            this._engine = 'native';
            return nativeEs[0];
        }

        // Audio fallback español
        const fallbackEs = this._voices.find(v => v.engine === 'audio-fallback' && v.lang === 'es');
        if (fallbackEs) {
            this._selectedVoice = fallbackEs;
            this._selectedVoiceLang = 'es';
            this._engine = 'audio-fallback';
            return fallbackEs;
        }

        return null;
    }

    getSelectedVoice() {
        return this._selectedVoice;
    }

    getSelectedVoiceName() {
        return this._selectedVoice?.name || null;
    }

    /* -------------------------------------------------- */
    /*  Volumen                                            */
    /* -------------------------------------------------- */
    setVolume(vol) {
        this._volume = Math.max(0, Math.min(1, Number(vol) || 0));
    }

    getVolume() {
        return this._volume;
    }

    /* -------------------------------------------------- */
    /*  Speak (con cola y splitting)                       */
    /* -------------------------------------------------- */
    async speak(text) {
        if (!text || typeof text !== 'string') return;
        await this._ensureReady();

        const chunks = this._splitText(text.trim());
        for (const chunk of chunks) {
            this._queue.push(chunk);
        }
        this._processQueue();
    }

    stop() {
        this._queue = [];
        this._speaking = false;

        if (hasSpeechSynthesis()) {
            try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
        }
        if (this._currentAudio) {
            this._currentAudio.pause();
            this._currentAudio = null;
        }
    }

    _splitText(text) {
        if (text.length <= MAX_CHUNK_LENGTH) return [text];

        const chunks = [];
        const sentences = text.match(/[^.;,!?]+[.;,!?]?\s*/g) || [text];
        let current = '';

        for (const sentence of sentences) {
            if ((current + sentence).length > MAX_CHUNK_LENGTH && current) {
                chunks.push(current.trim());
                current = sentence;
            } else {
                current += sentence;
            }
        }
        if (current.trim()) chunks.push(current.trim());

        return chunks;
    }

    async _processQueue() {
        if (this._speaking || this._queue.length === 0) return;

        await this._ensureReady();
        this._speaking = true;
        const text = this._queue.shift();

        try {
            await this._speakWithEngine(text, this._engine);
        }
        catch (e) {
            console.warn(`[SpeechService] Motor "${this._engine}" falló:`, e.message);
            // Intentar cadena de fallback excluyendo el motor que falló
            try {
                await this._speakWithFallback(text, this._engine);
            } catch (fallbackError) {
                console.error('[SpeechService] TODOS los motores fallaron:', fallbackError.message);
            }
        }
        finally {
            this._speaking = false;
            if (this._queue.length > 0) {
                this._processQueue();
            }
        }
    }

    /** Ejecuta un motor específico */
    async _speakWithEngine(text, engine) {
        if (engine === 'piper') {
            return await this._speakPiper(text);
        } else if (engine === 'native') {
            return await this._speakNative(text);
        } else if (engine === 'cordova') {
            return await this._speakCordova(text);
        } else {
            return await this._speakAudioFallback(text);
        }
    }

    /** Cadena de fallback: prueba cada motor saltando el que ya falló */
    async _speakWithFallback(text, excludeEngine = null) {
        const engines = ['piper', 'native', 'cordova', 'audio-fallback'];

        for (const engine of engines) {
            if (engine === excludeEngine) continue;
            if (engine === 'piper' && !this._piperAvailable) continue;
            if (engine === 'native' && !hasSpeechSynthesis()) continue;
            if (engine === 'cordova' && !this._cordovaAvailable) continue;

            try {
                console.log(`[SpeechService] Intentando fallback: "${engine}"`);
                await this._speakWithEngine(text, engine);
                return; // éxito
            } catch (e) {
                console.warn(`[SpeechService] Fallback "${engine}" falló:`, e.message);
            }
        }

        throw new Error('Ningún motor de TTS disponible');
    }

    /* -------------------------------------------------- */
    /*  Motor 1: Piper TTS (WASM - Neural)                 */
    /* -------------------------------------------------- */

    /**
     * WORKAROUND: La librería @mintplex-labs/piper-tts-web usa un singleton
     * interno (TtsSession._instance). Cuando cambias de voiceId, solo actualiza
     * el campo voiceId pero NO recarga el modelo ONNX ni el config.
     * Resultado: siempre suena la primera voz que se cargó.
     *
     * Fix: destruir el singleton (TtsSession._instance = null) cuando el
     * voiceId cambió, forzando que se cree una nueva sesión con el modelo correcto.
     */
    _resetPiperSessionIfNeeded(voiceId) {
        if (!this._piperTTS) return;
        if (this._lastPiperVoiceId && this._lastPiperVoiceId !== voiceId) {
            // Destruir el singleton para forzar nueva sesión con nuevo modelo
            if (this._piperTTS.TtsSession) {
                this._piperTTS.TtsSession._instance = null;
                console.log(`[SpeechService] Sesión Piper reseteada: ${this._lastPiperVoiceId} → ${voiceId}`);
            }
        }
        this._lastPiperVoiceId = voiceId;
    }

    async _speakPiper(text) {
        if (!this._piperTTS) {
            throw new Error('Piper TTS no cargado');
        }

        const voiceId = this._selectedVoiceId || DEFAULT_VOICE_ID;

        // Resetear sesión si cambió la voz (fix del bug del singleton)
        this._resetPiperSessionIfNeeded(voiceId);

        // Esperar preload si hay uno en progreso
        if (this._preloadPromise) {
            try {
                await withTimeout(this._preloadPromise, PIPER_TIMEOUT_MS, 'Preload Piper');
            } catch (e) {
                console.warn('[SpeechService] Preload timeout, intentando predict directo');
            }
        }

        // predict() con timeout para no congelar la cola
        const wav = await withTimeout(
            this._piperTTS.predict({ text, voiceId }),
            PIPER_TIMEOUT_MS,
            `Piper predict(${voiceId})`
        );

        return this._playBlob(wav);
    }

    /* -------------------------------------------------- */
    /*  Motor 2: Web Speech API (speechSynthesis)          */
    /* -------------------------------------------------- */
    _speakNative(text) {
        return new Promise((resolve, reject) => {
            if (!hasSpeechSynthesis()) {
                return reject(new Error('speechSynthesis no disponible'));
            }

            if (speechSynthesis.paused) speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(text);

            if (this._selectedVoice?.nativeVoice) {
                utterance.voice = this._selectedVoice.nativeVoice;
                utterance.lang = this._selectedVoice.nativeVoice.lang;
            } else {
                utterance.lang = this._selectedVoiceLang || 'es-ES';
            }

            utterance.volume = this._volume;
            utterance.rate = 1;
            utterance.pitch = 1;

            let keepAlive = null;
            let settled = false;

            const done = (err) => {
                if (settled) return;
                settled = true;
                if (keepAlive) clearInterval(keepAlive);
                if (err) reject(err); else resolve();
            };

            utterance.onend = () => done(null);
            utterance.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    done(null);
                } else {
                    done(new Error(`Error nativo: ${e.error}`));
                }
            };

            // Chrome keep-alive workaround
            const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
            if (isChrome) {
                keepAlive = setInterval(() => {
                    if (speechSynthesis.speaking && !speechSynthesis.paused) {
                        speechSynthesis.pause();
                        speechSynthesis.resume();
                    }
                }, 10000);
            }

            // Timeout de seguridad para native (15s)
            setTimeout(() => done(null), 15000);

            speechSynthesis.speak(utterance);
        });
    }

    /* -------------------------------------------------- */
    /*  Motor 3: Cordova TTS nativo (Android/iOS)           */
    /* -------------------------------------------------- */
    _speakCordova(text) {
        // Bridge postMessage: app en iframe, plugins en el launcher padre
        if (this._cordovaBridge) {
            return new Promise((resolve, reject) => {
                const id = 'tts_' + Date.now() + '_' + Math.random().toString(36).slice(2);

                const onMessage = (event) => {
                    if (event.data?.id !== id) return;
                    window.removeEventListener('message', onMessage);
                    if (event.data.type === 'TTS_DONE') resolve();
                    else reject(new Error(event.data.error || 'TTS error'));
                };

                window.addEventListener('message', onMessage);

                // Timeout de seguridad
                setTimeout(() => {
                    window.removeEventListener('message', onMessage);
                    resolve(); // resolver para no bloquear la cola
                }, 15000);

                window.parent.postMessage({
                    type: 'TTS_SPEAK',
                    id,
                    text,
                    locale: this._selectedVoiceLang || 'es-ES',
                }, '*');
            });
        }

        return new Promise((resolve, reject) => {
            if (!hasCordovaTTS()) {
                return reject(new Error('Cordova TTS no disponible'));
            }

            const lang = this._selectedVoiceLang || 'es-ES';
            const identifier = this._selectedVoice?.cordovaVoice?.identifier || null;

            const options = { text, locale: lang, rate: 1.0 };
            if (identifier) options.identifier = identifier;

            window.TTS.speak(
                options,
                () => resolve(),
                (err) => reject(new Error(`Cordova TTS error: ${err}`))
            );
        });
    }

    /* -------------------------------------------------- */
    /*  Motor 4: Audio fallback (Google Translate TTS)      */
    /* -------------------------------------------------- */
    async _speakAudioFallback(text) {
        const lang = (this._selectedVoiceLang || 'es').substring(0, 2);
        const encoded = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

        // Intentar fetch + blob (funciona en WebViews donde URL directa falla)
        try {
            const response = await fetch(url, {
                mode: 'cors',
                headers: { 'Referer': 'https://translate.google.com/' },
            });
            if (response.ok) {
                const blob = await response.blob();
                return this._playBlob(blob);
            }
        } catch (e) {
            // fetch falló, intentar URL directa como último recurso
            console.warn('[SpeechService] Fetch de Google TTS falló, intentando URL directa');
        }

        return this._playUrl(url);
    }

    /* -------------------------------------------------- */
    /*  Reproducción de audio (compartido)                 */
    /* -------------------------------------------------- */
    _playBlob(blob) {
        const url = URL.createObjectURL(blob);
        return this._playUrl(url, true);
    }

    _playUrl(url, revokeAfter = false) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.volume = this._volume;
            this._currentAudio = audio;

            let settled = false;
            const done = (err) => {
                if (settled) return;
                settled = true;
                if (revokeAfter) URL.revokeObjectURL(url);
                this._currentAudio = null;
                if (err) reject(err); else resolve();
            };

            audio.onended = () => done(null);
            audio.onerror = (e) => done(new Error(`Error de audio: ${e.type || e}`));
            audio.play().catch((err) => done(err));
        });
    }

    /* -------------------------------------------------- */
    /*  Gestión de modelos Piper                           */
    /* -------------------------------------------------- */

    async getStoredModels() {
        if (!this._piperTTS) return [];
        try { return await this._piperTTS.stored(); }
        catch (e) { return []; }
    }

    async downloadModel(voiceId, onProgress) {
        if (!this._piperTTS) throw new Error('Piper no disponible');
        await this._piperTTS.download(voiceId, (progress) => {
            if (progress.total > 0 && onProgress) {
                onProgress(Math.round((progress.loaded / progress.total) * 100));
            }
        });
    }

    async removeModel(voiceId) {
        if (!this._piperTTS) return;
        try { await this._piperTTS.remove(voiceId); }
        catch (e) { console.warn('[SpeechService] Error eliminando modelo:', e); }
    }

    /* -------------------------------------------------- */
    /*  Estado                                             */
    /* -------------------------------------------------- */
    isReady() { return this._ready; }
    isSupported() { return typeof window !== 'undefined'; }
    getEngine() { return this._engine; }
    isSpeaking() { return this._speaking; }
    getDownloadProgress() { return this._downloadProgress; }
    isPiperAvailable() { return this._piperAvailable; }
}

// Singleton
const speechService = typeof window !== 'undefined' ? new SpeechService() : null;
export default speechService;
