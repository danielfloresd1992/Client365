export default function parserCookie(cookieString){
    const coockePart = cookieString[0].split('; ');
    const cookies ={};
    coockePart.forEach(part => {
        const [key, value] = part.split('=');
        cookies[key] = value;
    });
    return cookies;
}