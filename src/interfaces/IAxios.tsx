import https from 'https';

interface IHeader {
    [key: string]:  string
};


export interface IHttpsInstance{
    httpsAgent: https.Agent,
    headers: IHeader,
    withCredentials: boolean
};



export interface IrequestActionProps{
    url: string,
    action: string,
    body: any
}

// Implementación del hook

export interface IuseAxios {
    
}


export interface IAxiosConfigProps{
    withCredentials: boolean,
    isInterceptors: any
};
