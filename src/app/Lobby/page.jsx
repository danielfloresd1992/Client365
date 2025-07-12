import dynamic from 'next/dynamic';
import Nav from './Nav/Nav';

import { ImgProvider } from '@/contexts/imgContext';
// Importa los componentes de manera dinámica
const PublicationsBox = dynamic(() => import('@/components/Publications/PublicationsBox.jsx'));
const AsideInfoUser = dynamic(() => import('@/app/Lobby/AsideInfoUser/AsideInfoUser.jsx'));
const ZoomImg = dynamic(() => import('@/components/zoomImage/ZoomImg.jsx'));
const AlertInputLive = dynamic(() => import('@/components/alert_input/AlertIput'));
const Config_window = dynamic(() => import('@/components/config_window/Config_window'));



export default function Lobby(){
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                alignContent: 'flex-start',
                flexWrap: 'wrap',
                width: '100%',
                height: '100vh',
                justifyContent: 'center',
                position: 'relative',
                gap: '.5rem' ,
                position: 'fixed',
                maxWidth: '1750px'
            }}
        >
            <ImgProvider>
                <Nav />
                <PublicationsBox />
                <AsideInfoUser />
                <ZoomImg />
                <AlertInputLive />
                <Config_window />
            </ImgProvider>
        </div>
    );
}