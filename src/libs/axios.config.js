import axios from 'axios';

const axiosInstance = axios.create({
 
    withCredentials: true,
    headers: {
        'Source-Application': 'Jarvis365',
        'Version-App': '1.1'
    }
});

export default axiosInstance;