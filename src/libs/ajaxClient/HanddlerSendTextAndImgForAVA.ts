import { DateToCreateComplete } from '@/types/submitAuth';
import { NumbeTeUser } from '@/types/dataBasic';
import sendTextJarvis from '@/libs/sendMsmJarvis';

import { AxiosResponse } from 'axios';



export const sendStatusDataCreateUserForJarvis = async (userData: DateToCreateComplete): Promise<void> => {
    try{
        const { email, password, user, phone } = userData;
        const SentTextUser: string = `*El usuario se creo de manera exitosa🥳*\nUse estos datos para iniciar session\nemail: ${email}\npassword: ${password}\n\nNota: Para iniciar sessión en JarvisExpress usa este usuario: ${user}`;
        const mumberTel: NumbeTeUser = `58${phone}@c.us`;
        const res:AxiosResponse<unknown> = await sendTextJarvis(SentTextUser, mumberTel);
    }
    catch(err){ 
        console.log(err);
    }
};




export const sendStatusDataUpdateUserForJarvis = async (userData: DateToCreateComplete): Promise<void> => {
    try{
        
        const { email, newPassword, user, phone } = userData;
        const SentTextUser: string = `*El usuario se actualizo de manera exitosa🥳*\nUse estos datos para iniciar session\nemail: ${email}\npassword: ${newPassword}\n\nNota: Para iniciar sessión en JarvisExpress usa este usuario: ${user}`;
        const mumberTel: NumbeTeUser = `58${phone}@c.us`;
        const res:AxiosResponse<unknown> = await sendTextJarvis(SentTextUser, mumberTel);
    }
    catch(err){
        console.log(err);
    }
};