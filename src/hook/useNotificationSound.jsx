'use client';


export default function useNotificationSound(){

        const play = (type, callback) => {
            if(type === 'tree_tone'){ 
                if(window){
                    const NOTIFICATION_TREE_TONE = new Audio('/audio/notification_tree_tone.mp3');
                    NOTIFICATION_TREE_TONE.play();
                    NOTIFICATION_TREE_TONE.onended = () => {
                        callback();
                        NOTIFICATION_TREE_TONE.onended = null;
                    }
                }
            }
            else if(type === 'one_tone'){ 
                if(window){
                    const NOTIFICATION_ONE_TONE = new Audio('/audio/notification_one_tone.mp3');
                    NOTIFICATION_ONE_TONE.play();
                    NOTIFICATION_ONE_TONE.onended = () => {
                        callback();
                        NOTIFICATION_ONE_TONE.onended = null;
                    }
                }
            }
        }

        return {
            play,
            nameSoundsArr: ['tree_tone']
        }

}