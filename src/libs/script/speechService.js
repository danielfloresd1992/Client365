'use client';

/**
 * Servicio singleton de Text-to-Speech multiplataforma.
 *
 * Estrategia de 2 motores:
 *  1. Web Speech API (speechSynthesis) — navegadores que lo soportan.
 *  2. Audio fallback via Google Translate TTS — WebViews de Cordova/Android
 *     que no tienen speechSynthesis. Genera un MP3 y lo reproduce con Audio().
 *
 * También resuelve:
 *  - Cola de utterances para que no se pisen alertas simultáneas.
 *  - Unlock de audio en iOS/Android (requiere 1er gesto del usuario).
 *  - Splitting de textos largos (200 chars para Chrome, 200 chars para audio).
 *  - Selección de voz con fallback por idioma español.
 */

const MAX_CHUNK_LENGTH = 200;

// Detectar si speechSynthesis está disponible y funcional
function hasSpeechSynthesis() {
    return typeof window !== 'undefined'
        && typeof speechSynthesis !== 'undefined'
        && typeof SpeechSynthesisUtterance !== 'undefined';
}

class SpeechService {
    constructor() {
        this._queue = [];
        this._speaking = false;
        this._unlocked = false;
        this._voices = [];
        this._selectedVoice = null;
        this._selectedVoiceLang = 'es-ES';
        this._volume = 1;
        this._ready = false;
        this._readyPromise = null;
        this._onVoicesChange = null;
        this._useNative = false;  // true = speechSynthesis, false = audio fallback
        this._currentAudio = null;

        if (typeof window !== 'undefined') {
            this._readyPromise = this._init();
        }
    }

    /* -------------------------------------------------- */
    /*  Init                                               */
    /* -------------------------------------------------- */
    async _init() {
        if (hasSpeechSynthesis()) {
            // Intentar cargar voces para verificar que realmente funciona
            await this._loadVoices();

            // Si después de esperar hay voces, usar speechSynthesis
            if (this._voices.length > 0) {
                this._useNative = true;
                speechSynthesis.addEventListener('voiceschanged', () => {
                    this._voices = speechSynthesis.getVoices();
                    if (this._onVoicesChange) this._onVoicesChange(this._voices);
                });
                console.log('[SpeechService] Usando Web Speech API');
            } else {
                // speechSynthesis existe pero no devuelve voces (Cordova WebView)
                this._useNative = false;
                this._setupAudioFallbackVoices();
                console.log('[SpeechService] speechSynthesis sin voces, usando audio fallback');
            }
        } else {
            this._useNative = false;
            this._setupAudioFallbackVoices();
            console.log('[SpeechService] speechSynthesis no disponible, usando audio fallback');
        }

        this._ready = true;
    }

    _loadVoices() {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                this._voices = voices;
                return resolve();
            }

            const onVoices = () => {
                this._voices = speechSynthesis.getVoices();
                speechSynthesis.removeEventListener('voiceschanged', onVoices);
                resolve();
            };
            speechSynthesis.addEventListener('voiceschanged', onVoices);

            // Timeout: si voiceschanged nunca se dispara (Cordova)
            setTimeout(() => {
                speechSynthesis.removeEventListener('voiceschanged', onVoices);
                if (this._voices.length === 0) {
                    this._voices = speechSynthesis.getVoices();
                }
                resolve();
            }, 3000);
        });
    }

    /**
     * Cuando speechSynthesis no está disponible, ofrece una lista
     * de "voces" virtuales que representan idiomas soportados por el fallback.
     */
    _setupAudioFallbackVoices() {
        this._voices = [
            { name: 'Español (España)', lang: 'es', voiceURI: 'audio-fallback', localService: false },
            { name: 'Español (México)', lang: 'es', voiceURI: 'audio-fallback', localService: false },
            { name: 'Español (Venezuela)', lang: 'es', voiceURI: 'audio-fallback', localService: false },
            { name: 'English (US)', lang: 'en', voiceURI: 'audio-fallback', localService: false },
            { name: 'Português (Brasil)', lang: 'pt', voiceURI: 'audio-fallback', localService: false },
        ];
        this._selectedVoice = this._voices[0];
        this._selectedVoiceLang = 'es';
        if (this._onVoicesChange) this._onVoicesChange(this._voices);
    }

    /* -------------------------------------------------- */
    /*  Unlock (iOS / Android)                             */
    /* -------------------------------------------------- */
    unlock() {
        if (this._unlocked) return;

        if (this._useNative && hasSpeechSynthesis()) {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            speechSynthesis.speak(u);
        } else {
            // Unlock audio context con un audio silencioso
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
                audio.volume = 0;
                audio.play().catch(() => {});
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
    }

    selectVoiceByName(name) {
        const v = this._voices.find((voice) => voice.name === name);
        if (v) {
            this._selectedVoice = v;
            this._selectedVoiceLang = v.lang || 'es';
            return true;
        }
        return false;
    }

    selectBestSpanishVoice() {
        if (this._voices.length === 0) return null;

        const esVoices = this._voices.filter(
            (v) => v.lang && v.lang.startsWith('es')
        );
        if (esVoices.length === 0) return null;

        // Prioridad: Online/Natural/Premium > local
        const premium = esVoices.find(
            (v) => /online|natural|premium|enhanced/i.test(v.name)
        );
        if (premium) {
            this._selectedVoice = premium;
            this._selectedVoiceLang = premium.lang;
            return premium;
        }

        this._selectedVoice = esVoices[0];
        this._selectedVoiceLang = esVoices[0].lang;
        return esVoices[0];
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
    speak(text) {
        if (!text || typeof text !== 'string') return;

        const chunks = this._splitText(text.trim());
        for (const chunk of chunks) {
            this._queue.push(chunk);
        }
        this._processQueue();
    }

    stop() {
        this._queue = [];
        this._speaking = false;

        if (this._useNative && hasSpeechSynthesis()) {
            speechSynthesis.cancel();
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

    _processQueue() {
        if (this._speaking || this._queue.length === 0) return;

        this._speaking = true;
        const text = this._queue.shift();

        if (this._useNative) {
            this._speakNative(text);
        } else {
            this._speakAudioFallback(text);
        }
    }

    /* -------------------------------------------------- */
    /*  Motor 1: Web Speech API (speechSynthesis)          */
    /* -------------------------------------------------- */
    _speakNative(text) {
        if (!hasSpeechSynthesis()) {
            this._speaking = false;
            this._processQueue();
            return;
        }

        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);

        if (this._selectedVoice && this._selectedVoice.voiceURI !== 'audio-fallback') {
            utterance.voice = this._selectedVoice;
            utterance.lang = this._selectedVoice.lang;
        } else {
            utterance.lang = this._selectedVoiceLang || 'es-ES';
        }

        utterance.volume = this._volume;
        utterance.rate = 1;
        utterance.pitch = 1;

        const done = () => {
            if (keepAlive) clearInterval(keepAlive);
            this._speaking = false;
            this._processQueue();
        };

        utterance.onend = done;
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn('[SpeechService] Error nativo:', e.error);
            }
            done();
        };

        // Chrome keep-alive workaround
        let keepAlive = null;
        const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
        if (isChrome) {
            keepAlive = setInterval(() => {
                if (speechSynthesis.speaking && !speechSynthesis.paused) {
                    speechSynthesis.pause();
                    speechSynthesis.resume();
                }
            }, 10000);
        }

        speechSynthesis.speak(utterance);
    }

    /* -------------------------------------------------- */
    /*  Motor 2: Audio fallback (Google Translate TTS)      */
    /*  Funciona en cualquier WebView que soporte Audio()   */
    /* -------------------------------------------------- */
    _speakAudioFallback(text) {
        const lang = (this._selectedVoiceLang || 'es').substring(0, 2);
        const encoded = encodeURIComponent(text);

        // Google Translate TTS endpoint (no requiere API key, límite ~200 chars)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

        const audio = new Audio(url);
        audio.volume = this._volume;
        this._currentAudio = audio;

        audio.onended = () => {
            this._currentAudio = null;
            this._speaking = false;
            this._processQueue();
        };

        audio.onerror = (e) => {
            console.warn('[SpeechService] Error audio fallback:', e);
            this._currentAudio = null;
            this._speaking = false;
            this._processQueue();
        };

        audio.play().catch((err) => {
            console.warn('[SpeechService] No se pudo reproducir audio:', err);
            this._currentAudio = null;
            this._speaking = false;
            this._processQueue();
        });
    }

    /* -------------------------------------------------- */
    /*  Estado                                             */
    /* -------------------------------------------------- */
    isReady() {
        return this._ready;
    }

    isSupported() {
        // Siempre soportado: speechSynthesis o audio fallback
        return typeof window !== 'undefined';
    }

    isUsingNative() {
        return this._useNative;
    }

    isSpeaking() {
        return this._speaking;
    }
}

// Singleton
const speechService = typeof window !== 'undefined' ? new SpeechService() : null;
export default speechService;
