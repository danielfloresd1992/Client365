
import Nav from './Nav/Nav';
import ZoomImg from '@/components/zoomImage/ZoomImg';
import { ImgProvider } from '@/contexts/imgContext';

// Importa los componentes de manera dinámica
import PublicationsBox from '@/components/Publications/PublicationsBox';
import AsideInfoUser from '@/app/Lobby/AsideInfoUser/AsideInfoUser';




export default function Lobby() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                alignContent: 'flex-start',
                flexWrap: 'wrap',
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                position: 'relative',
                gap: '.5rem',
                maxWidth: '1750px'
            }}
        >
            <ImgProvider>
                <Nav />
                <PublicationsBox />
                <AsideInfoUser />
                <ZoomImg />
            </ImgProvider>
        </div>
    );
}