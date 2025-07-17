import axios from 'axios';
import https from 'https';
import IP from '@/libs/dataFecth';


// Crear una instancia de CookieJar


// Crear un agente HTTPS que ignore la verificación de certificados
const agent = new https.Agent({
    rejectUnauthorized: false,
});

// Configurar la instancia de Axios para usar el agente HTTPS y manejar cookies manualmente
const axiosInstance = axios.create({
    baseURL: IP,
    httpsAgent: agent,
    withCredentials: true, // Asegúrate de que las cookies se envíen en las solicitudes
    headers: {
        'Source-Application': 'Jarvis365',
        'Version-App': '1.1',
    },
});


export default axiosInstance;