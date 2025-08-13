'use client';
//import Speech from 'speak-tts';
import { useState, useEffect, useCallback } from 'react';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import { useSelector, useDispatch } from 'react-redux';

import { setVoicesDefinitive } from '@/store/slices/voiceDefinitive';
import { setVoiceVolumeDefinitive } from '@/store/slices/volumeVoiceDefinitive';


export default function useSpeckAlert() {


    const dispatch = useDispatch();
    const voice_definitive = useSelector(store => store.voiceDefinitive);
    const [listVoicesState, setListVoicesState] = useState([]);
    const [voiceSeletedState, setVoiceSelectedState] = useState(null);
    const [volumeState, setVolumeState] = useState(1);



    useEffect(() => {
        if (typeof window !== 'undefined') {

            const loadVoices = () => {
                setListVoicesState(speechSynthesis.getVoices());
            }
            speechSynthesis.addEventListener('voiceschanged', loadVoices);

            return () => {
                speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            };
        }
    }, []);



    useEffect(() => {
        if (listVoicesState.length > 0) {
            const voiceStorange = AppManagerConfigStorange.get('voice_definitive');
            if (voiceStorange) changeVoice(voiceStorange);

            const volumeStorage = AppManagerConfigStorange.get('voice_volume');
            if (volumeStorage) changueVolume(voiceStorange);
            alert(!voice_definitive && !voiceStorange);
            if (!voice_definitive && !voiceStorange) changeVoice('Microsoft Paola Online (Natural) - Spanish (Venezuela)')
        }
    }, [listVoicesState]);



    const changueVolume = number => {
        AppManagerConfigStorange.set('voice_volume', number);
        setVolumeState(number);
    };



    const changeVoice = (nameVoice) => {
        if (typeof nameVoice !== 'string') throw new Error('The parameter must be of type string');
        AppManagerConfigStorange.set('voice_definitive', nameVoice);
        const seleted = speechSynthesis.getVoices().find((voice) => voice.name === nameVoice);
        dispatch(setVoicesDefinitive(seleted));
        setVoiceSelectedState(seleted);
    };




    const speak = useCallback((text = '') => {
        const machine = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.voice = voice_definitive;
        utterThis.volume = volumeState;
        machine.speak(utterThis);
    }, [voice_definitive, volumeState]);




    return { listVoicesState, changeVoice, voice_definitive, speak, changueVolume, volumeState };
}