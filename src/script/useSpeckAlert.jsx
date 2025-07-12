'use client';
import { useState, useEffect } from 'react';


export default function useSpeckAlert() {

    const [ machine, setMachine ] = useState();
    const [ voices, setVoices ] = useState([]);
    const [ voiceDefault, setVoiceDefault ] = useState(null);
    const [ volumeState, setVolumeState ] = useState(1);
    
    useEffect(() => {
        if(voices.length < 1){
            setVoices(speechSynthesis.getVoices());
        }
    }, [ voices ]);


    useEffect(() => {
        if(window !== undefined){
            setMachine(window.speechSynthesis);
            setVoices(speechSynthesis.getVoices());
            const getVoice = voices.find((voice) => voice.name === 'Microsoft Sabina - Spanish (Mexico)');
            //setVoiceDefault(getVoice || voices[1]);
        }
    }, [ voiceDefault, volumeState ]);

  
    const speak = (text='') => {
        const utterThis = new SpeechSynthesisUtterance(text);
        const matchingVoice = voices.find((voice) => voice.name === voiceDefault);
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