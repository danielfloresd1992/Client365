'use client';
//import Speech from 'speak-tts';
import { useState, useEffect } from 'react';


export default function useSpeckAlert() {

    const [ voices, setVoices ] = useState([]);
    const [ voiceDefault, setVoiceDefault ] = useState(null);
    const [ volumeState, setVolumeState ] = useState(1);
    

    useEffect(() => {
        if(window !== undefined){
            if(voices.length < 1){
                const serializableVoices = speechSynthesis.getVoices().map(voice => ({
                    name: voice.name,
                  }));
                setVoices(serializableVoices);
            }
        }
    }, [ voices ]);



  
    const speak = (text='') => {
        const machine = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(text);
        const matchingVoice = speechSynthesis.getVoices().find((voice) => voice.name === voiceDefault);
        utterThis.voice = matchingVoice;
        utterThis.volume = volumeState;

        machine.speak(utterThis);
    };


    const changueVolume = number => {
        if(typeof number !== 'number') throw new Error('The parameter must be of type number');
        return setVolumeState(number);
    };

    const changeVoice = (voiceName, errorCallback) => {
        return setVoiceDefault(state => state = voiceName);
    };
    
    return { speak, changeVoice, changueVolume, voices, voiceDefault };
}