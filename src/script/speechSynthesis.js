'use client';

export default class SpeckAlert{
    constructor(){
        this.machine = window.speechSynthesis;
        this.voices = this.machine.getVoices();
        this.voices = this.machine.getVoices();
        this.voices = this.machine.getVoices();
        this.voices = this.machine.getVoices();
        const getVoivce = this.voices.filter(voice => voice.name === 'Microsoft Sabina - Spanish (Mexico)');
        this.voice_default = getVoivce.length > 0 ? getVoivce : this.voices[1];
    }

    speak = async text => {
        this.voices = this.machine.getVoices();
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.voice = this.voice_default;
        this.machine.speak(utterThis);
    }

    changue_voice = (voice_name, callback) => {
        const isExists = this.voices.filter(voice => voice.name === voice_name);
        if(isExists.length > 0){
            this.voice_default = isExists[0];
        }
        else{
            callback(`No voice related to that name has been found: ${voice_name}.`)
        }
    }
}


    ///// this function is deprecated

function speckAlert(text = '', voice = 'Microsoft Sabina - Spanish (Mexico)'){
    const synth = window.speechSynthesis;
    const voices =  synth.getVoices();
    const utterThis = new SpeechSynthesisUtterance(text);
    voices.forEach( v => {
        if(v.name === voice){
            utterThis.voice = v;
        }
    });
    return synth.speak(utterThis);
}
