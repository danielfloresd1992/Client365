'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import speechService from '@/libs/script/speechService';
import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';


export default function useSpeckAlert() {

    const dispatch = useDispatch();
    const voice_definitive = useSelector(store => store.voiceDefinitive);
    const [listVoicesState, setListVoicesState] = useState([]);
    const [volumeState, setVolumeState] = useState(1);


    // Cargar voces
    useEffect(() => {
        if (!speechService) return;

        const updateVoices = () => {
            const voices = speechService.getVoices();
            setListVoicesState(voices);
        };

        // Voces iniciales (pueden ya estar cargadas)
        const initial = speechService.getVoices();
        if (initial.length > 0) {
            setListVoicesState(initial);
        }

        // Escuchar cambios
        speechService.onVoicesChanged((voices) => {
            setListVoicesState(voices);
        });

        return () => {
            speechService.onVoicesChanged(null);
        };
    }, []);


    // Cuando las voces estén listas, restaurar configuración guardada
    useEffect(() => {
        if (!speechService || listVoicesState.length === 0) return;

        // Restaurar voz guardada
        const savedVoiceName = AppManagerConfigStorange.get('voice_definitive');
        if (savedVoiceName && speechService.selectVoiceByName(savedVoiceName)) {
            dispatch(setVoicesDefinitive(savedVoiceName));
        } else if (!voice_definitive) {
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
        }
        dispatch(setVoicesDefinitive(nameVoice));
    }, [dispatch]);


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
        isSupported: speechService?.isSupported() ?? false,
    };
}
