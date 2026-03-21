'use client';

/**
 * Servicio singleton de Text-to-Speech multiplataforma.
 *
 * Resuelve:
 *  - Cola de utterances para que no se pisen alertas simultáneas.
 *  - Unlock de audio en iOS/Android (requiere 1er gesto del usuario).
 *  - Splitting de textos largos para evitar el corte de Chrome (~15 s).
 *  - Selección de voz con fallback por idioma español.
 *  - Fallback a Audio() cuando speechSynthesis no está disponible.
 */

const MAX_UTTERANCE_LENGTH = 200; // Chrome corta ~15 s ≈ 200 chars en español

class SpeechService {
    constructor() {
        this._queue = [];
        this._speaking = false;
        this._unlocked = false;
        this._voices = [];
        this._selectedVoice = null;
        this._volume = 1;
        this._ready = false;
        this._readyPromise = null;
        this._onVoicesChange = null;

        if (typeof window !== 'undefined') {
            this._readyPromise = this._init();
        }
    }

    /* -------------------------------------------------- */
    /*  Init                                               */
    /* -------------------------------------------------- */
    async _init() {
        if (typeof speechSynthesis === 'undefined') {
            console.warn('[SpeechService] speechSynthesis no disponible');
            this._ready = false;
            return;
        }

        // Las voces pueden tardar en cargar (Chrome las carga async)
        await this._loadVoices();
        speechSynthesis.addEventListener('voiceschanged', () => {
            this._voices = speechSynthesis.getVoices();
            if (this._onVoicesChange) this._onVoicesChange(this._voices);
        });

        this._ready = true;
    }

    _loadVoices() {
        return new Promise((resolve) => {
            this._voices = speechSynthesis.getVoices();
            if (this._voices.length > 0) return resolve();

            const onVoices = () => {
                this._voices = speechSynthesis.getVoices();
                speechSynthesis.removeEventListener('voiceschanged', onVoices);
                resolve();
            };
            speechSynthesis.addEventListener('voiceschanged', onVoices);

            // Timeout por si voiceschanged nunca se dispara
            setTimeout(() => {
                if (this._voices.length === 0) {
                    this._voices = speechSynthesis.getVoices();
                }
                resolve();
            }, 3000);
        });
    }

    /* -------------------------------------------------- */
    /*  Unlock (iOS / Android)                             */
    /* -------------------------------------------------- */
    /**
     * Debe llamarse una vez dentro de un handler de evento de usuario
     * (click, touchend, etc.) para desbloquear audio en mobile.
     */
    unlock() {
        if (this._unlocked) return;
        if (typeof speechSynthesis === 'undefined') return;

        // Truco: reproducir un utterance vacío desbloquea el audio context
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        speechSynthesis.speak(u);

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

    /**
     * Selecciona voz por nombre exacto.
     * Retorna true si la encontró, false si no.
     */
    selectVoiceByName(name) {
        const v = this._voices.find((voice) => voice.name === name);
        if (v) {
            this._selectedVoice = v;
            return true;
        }
        return false;
    }

    /**
     * Selecciona la mejor voz española disponible en la plataforma.
     * Prioriza voces "Online/Natural" > voces locales > cualquier es-*.
     */
    selectBestSpanishVoice() {
        if (this._voices.length === 0) return null;

        const esVoices = this._voices.filter(
            (v) => v.lang && v.lang.startsWith('es')
        );

        if (esVoices.length === 0) return null;

        // Prioridad: Online/Natural/Premium > local
        const premium = esVoices.find(
            (v) =>
                /online|natural|premium|enhanced/i.test(v.name)
        );
        if (premium) {
            this._selectedVoice = premium;
            return premium;
        }

        // Fallback: primera voz española
        this._selectedVoice = esVoices[0];
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
        if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.cancel();
        }
    }

    _splitText(text) {
        if (text.length <= MAX_UTTERANCE_LENGTH) return [text];

        const chunks = [];
        // Cortar en puntos naturales: punto, coma, punto y coma
        const sentences = text.match(/[^.;,!?]+[.;,!?]?\s*/g) || [text];
        let current = '';

        for (const sentence of sentences) {
            if ((current + sentence).length > MAX_UTTERANCE_LENGTH && current) {
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

        if (typeof speechSynthesis === 'undefined') {
            // Sin soporte — limpiar cola silenciosamente
            this._queue = [];
            return;
        }

        // Chrome bug: speechSynthesis puede quedar "stuck". Cancelar antes de hablar.
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }

        this._speaking = true;
        const text = this._queue.shift();
        const utterance = new SpeechSynthesisUtterance(text);

        if (this._selectedVoice) {
            utterance.voice = this._selectedVoice;
            utterance.lang = this._selectedVoice.lang;
        } else {
            utterance.lang = 'es-ES';
        }

        utterance.volume = this._volume;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => {
            this._speaking = false;
            this._processQueue();
        };

        utterance.onerror = (e) => {
            // 'interrupted' y 'canceled' no son errores reales
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn('[SpeechService] Error:', e.error);
            }
            this._speaking = false;
            this._processQueue();
        };

        // Chrome bug: si pasan >15 s sin interacción, se pausa.
        // Workaround: timer que hace resume cada 10 s.
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

        const originalOnEnd = utterance.onend;
        utterance.onend = (e) => {
            if (keepAlive) clearInterval(keepAlive);
            originalOnEnd(e);
        };
        const originalOnError = utterance.onerror;
        utterance.onerror = (e) => {
            if (keepAlive) clearInterval(keepAlive);
            originalOnError(e);
        };

        speechSynthesis.speak(utterance);
    }

    /* -------------------------------------------------- */
    /*  Estado                                             */
    /* -------------------------------------------------- */
    isReady() {
        return this._ready;
    }

    isSupported() {
        return typeof window !== 'undefined' && typeof speechSynthesis !== 'undefined';
    }

    isSpeaking() {
        return this._speaking;
    }
}

// Singleton
const speechService = typeof window !== 'undefined' ? new SpeechService() : null;
export default speechService;
