// data
import { Dispatch, ReactNode, SetStateAction } from 'react';

export type LegaceDataUser = {
    admin?:boolean
    createdOn?: string,
    date?: string,
    inabilited?: boolean,
    number: number,
    password: string, 
    user: string,
    name: string, 
    surName: string
    _id: string
}
 


export type DataToCreateUserBasic = {
    email: string ,
    password: string
}



export type DateToCreateComplete = {
    email: string 
    password?: string | undefined,  
    newPassword?: string | undefined, 
    phone: string, 
    user: string, 
    name: string, 
    surName: string
}



export type DateToCreateCompleteForm = {
    email: string, 
    password?: string | undefined, 
    newPassword?: string | undefined, 
    confirmPassword: string,
    code_tel: string, 
    codeConfirmTel: string, 
    tel: string, 
    user: string,
    name: string, 
    surName: string
}



export type LevelPassword = {
    level?: number,
    color?: string
    pass?: boolean,
    msm?: string
} | null





//functions and props




export type CreateUserProps = {
    setType: (type: string) => void,
    callback: (error: unknown | null, dataUser: DateToCreateComplete | null) => void | null,
    update: {
        dataUserLegace: LegaceDataUser
    } | null
}

export interface ILegacePropsForm{
    componentUpdateUser: (data: LegaceDataUser | null) => React.ReactNode;
}


export type HanddlerCreateUser = (error: Error | null, dataForCallback:DateToCreateComplete | null) => void 



// 

export type SessionState = {
    stateSession: 'loading' | 'authenticated' | 'unauthenticated';
    dataSession: any;
}



export type SessionContextProps = {
    dataSessionState: any;
    errorState: ErrorAuth | null,
    setErrorState: Dispatch<ErrorAuth | null>;
    setState: Dispatch<SetStateAction<SessionState>>;
}


export type SessionProviderProps = {
    children: ReactNode;
}


export type ErrorAuth = {
    status: number,
    menssage: string,
    error: 'Continue' | 'Processing' | 'Bad Request' | 'Unauthorized' | 'Forbidden' | 'Conflict' | 'Internal Server Error'
}


export type ReturFunc = {
    signIn: any,
    logOut: any,
    dataSessionState: any,
    errorState: any
}