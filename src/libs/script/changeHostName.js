'use client';
export default function changeHostNameForImg(url) {
    try {
        return url;
        let dns = '';
        const hostname = window.location.host;
        if (hostname === '72.68.60.254:3005') {
            dns = `https://72.68.60.254${url.split('https://amazona365.ddns.net')[1]}`;
        }
        else if (hostname === '72.68.60.201:3000') {
            dns = `https://72.68.60.201${url.split('https://amazona365.ddns.net')[1]}`;
        }
        else {
            dns = url;
        }
        return dns;
    }
    catch (error) {
        console.log(error);
    }
}