export default function dataFecthServer() {
    let ip;
    if (process.env.NODE_ENV === 'production') {
        ip = '72.68.60.254:443/api_jarvis/v1';

    }
    else {
        ip = 'amazona365.ddns.net:3006/api_jarvis_dev/v1';
    }
    return ip;
}