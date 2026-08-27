'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import speechService from '@/libs/script/speechService';
import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';


/**
 * LA VOZ DE EDGE.
 *
 * El nombre EXACTO con que Windows publica esa voz. `speechService` republica
 * las nativas con el prefijo «[Nativa] », así que este nombre NO aparece tal
 * cual en `getVoices()`: la comparación va contra `nativeVoice`, que es el
 * objeto tal como lo entrega el navegador. Buscar la cadena cruda en la lista
 * no encontraría nada, y el efecto no correría nunca sin decir por qué.
 */
const VOZ_DE_EDGE = 'Microsoft Paola Online (Natural) - Spanish (Venezuela)';

/**
 * ¿Corre en Microsoft Edge?
 *
 * `userAgentData.brands` es lo confiable —y trae «Microsoft Edge» como marca
 * propia— pero solo existe en navegadores Chromium y en contexto seguro. La
 * cadena de agente queda de respaldo: en el Edge actual dice `Edg/`, sin la
 * `e` final, que es justo lo que lo distingue del `Edge/` del viejo EdgeHTML
 * y del Chrome a secas.
 */
const enMicrosoftEdge = () => {
    if (typeof navigator === 'undefined') return false;

    const marcas = navigator.userAgentData?.brands;
    if (Array.isArray(marcas)) return marcas.some(m => m?.brand === 'Microsoft Edge');

    return /\bEdg\//.test(navigator.userAgent || '');
};


export default function useSpeckAlert() {

    const dispatch = useDispatch();
    const voice_definitive = useSelector(store => store.voiceDefinitive);
    const volumeDefinitive = useSelector(store => store.volumeVoiceDefinitive);
    const [listVoicesState, setListVoicesState] = useState([]);
    const [volumeState, setVolumeState] = useState(1);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [currentEngine, setCurrentEngine] = useState('piper');
    const [isLoading, setIsLoading] = useState(true);


    // Cargar voces y escuchar progreso de descarga
    useEffect(() => {
        if (!speechService) {
            setIsLoading(false);
            return;
        }

        // Esperar a que el servicio esté listo
        speechService._ensureReady().then(() => {
            setListVoicesState(speechService.getVoices());
            setCurrentEngine(speechService.getEngine());
            setIsLoading(false);
        });

        // Escuchar cambios de voces y progreso de descarga. onVoicesChanged /
        // onDownloadProgress devuelven la función de desuscripción: así cada
        // componente quita SOLO su listener al desmontar (antes se pasaba null
        // y silenciaba a todos los demás consumidores del hook).
        const unsubscribeVoices = speechService.onVoicesChanged((voices) => {
            setListVoicesState(voices);
        });

        const unsubscribeProgress = speechService.onDownloadProgress((progress) => {
            setDownloadProgress(progress);
        });

        return () => {
            unsubscribeVoices();
            unsubscribeProgress();
        };
    }, []);


    // Cuando las voces estén listas, restaurar configuración guardada
    useEffect(() => {
        if (!speechService || listVoicesState.length === 0) return;

        // Restaurar voz guardada
        const savedVoiceName = AppManagerConfigStorange.get('voice_definitive');
        if (savedVoiceName && speechService.selectVoiceByName(savedVoiceName)) {
            dispatch(setVoicesDefinitive(savedVoiceName));
        } 
        else if (!voice_definitive) {
            // Si no hay voz guardada, seleccionar la mejor voz en español
            const best = speechService.selectBestSpanishVoice();
            if (best) {
                AppManagerConfigStorange.set('voice_definitive', best.name);
                dispatch(setVoicesDefinitive(best.name));
            }
        }

        // Restaurar volumen guardado
        const savedVolume = AppManagerConfigStorange.get('voice_volume');
        if (savedVolume != null) {
            const vol = Number(savedVolume);
            speechService.setVolume(vol);
            setVolumeState(vol);
            dispatch(setVoiceVolumeDefinitive(vol));
        }
    }, [listVoicesState]);


    // Sincroniza el volumen entre todas las instancias del hook (el slider del
    // Lobby y el de Config_window comparten el valor vía Redux)
    useEffect(() => {
        setVolumeState(volumeDefinitive);
    }, [volumeDefinitive]);


    // Unlock de audio en el primer click/touch del usuario (requerido en mobile)
    useEffect(() => {
        if (!speechService) return;

        const handleUserGesture = () => {
            speechService.unlock();
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchend', handleUserGesture);
        };

        window.addEventListener('click', handleUserGesture, { once: true });
        window.addEventListener('touchend', handleUserGesture, { once: true });

        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchend', handleUserGesture);
        };
    }, []);


    const changueVolume = useCallback((number) => {
        const vol = Number(number);
        AppManagerConfigStorange.set('voice_volume', vol);
        if (speechService) speechService.setVolume(vol);
        setVolumeState(vol);
        dispatch(setVoiceVolumeDefinitive(vol));
    }, [dispatch]);


    const changeVoice = useCallback((nameVoice) => {
        if (typeof nameVoice !== 'string') return;
        AppManagerConfigStorange.set('voice_definitive', nameVoice);
        if (speechService) {
            speechService.selectVoiceByName(nameVoice);
            setCurrentEngine(speechService.getEngine());
        }
        dispatch(setVoicesDefinitive(nameVoice));
    }, [dispatch]);


    /*
     * EN EDGE, PAOLA MANDA AL CARGAR.
     *
     * Va DESPUÉS de `changeVoice` a propósito y no junto a los otros efectos:
     * lo usa como dependencia, y declarado más arriba la referencia caería en
     * zona muerta y reventaría en el render. Un efecto corre después del
     * render sin importar dónde se declare.
     *
     * NO PELEA CON LA RESTAURACIÓN. El efecto que lee la configuración
     * guardada depende de la misma lista de voces, así que podrían correr en
     * cualquier orden. Convergen igual porque este ESCRIBE en el mismo
     * localStorage que aquel LEE: corra antes o después, los dos terminan en
     * Paola.
     *
     * SE APLICA UNA SOLA VEZ. `onVoicesChanged` vuelve a disparar cuando Edge
     * termina de traer sus voces en línea; sin el pestillo, un administrador
     * que eligiera otra voz se la vería revertida a mitad de sesión. Forzada
     * al cargar, respetada después.
     */
    const paolaImpuesta = useRef(false);

    useEffect(() => {
        if (paolaImpuesta.current) return;
        if (!speechService || listVoicesState.length === 0) return;
        if (!enMicrosoftEdge()) return;

        const paola = listVoicesState.find(v => v.nativeVoice?.name === VOZ_DE_EDGE);

        // Sin esa voz instalada no hay nada que imponer: se deja la
        // configuración guardada como está.
        if (!paola) return;

        paolaImpuesta.current = true;
        changeVoice(paola.name);
    }, [listVoicesState, changeVoice]);


    const speak = useCallback((text = '') => {
        if (!speechService || !text) return;
        speechService.speak(text);
    }, []);


    const stop = useCallback(() => {
        if (speechService) speechService.stop();
    }, []);


    return {
        listVoicesState,
        changeVoice,
        voice_definitive,
        speak,
        stop,
        changueVolume,
        volumeState,
        downloadProgress,
        currentEngine,
        isLoading,
        isSupported: speechService?.isSupported() ?? false,
    };
}
