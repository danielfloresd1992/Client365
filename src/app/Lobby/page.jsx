'use client'
import Nav from './Nav/Nav';
import ZoomImg from '@/components/zoomImage/ZoomImg';
import { ImgProvider } from '@/contexts/imgContext';

// Importa los componentes de manera dinámica
import PublicationsBox from '@/components/Publications/PublicationsBox';
import AsideInfoUser from '@/app/Lobby/AsideInfoUser/AsideInfoUser';
import AlertLiveJarvis from '@/components/alertSpeackComponent';

import Aside_Eyelash from '@/components/aside/aside_establishment/Aside_Eyelash';
import ChatGeneral365 from '@/components/chats/chat_general_365/ChatGeneral365';
import FilterNoveltyForLobby from '@/components/filter_data_for_lobby/FilterComponent.jsx';
import AlertInputLive from '@/components/alert_input/AlertIput.jsx';



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


                <Aside_Eyelash position='l' title='Alertas' urlIco={'/ico/icons8-counter-50.png'} eyelash={0}>
                    {(methods) => (
                        <AlertInputLive {...methods} />
                    )}
                </Aside_Eyelash>

                <Aside_Eyelash position='l' title='Filtros' urlIco={'/ico/icons8-filtro-vacío-30.png'} eyelash={1}>
                    {(methods) => (
                        <FilterNoveltyForLobby {...methods} />
                    )}
                </Aside_Eyelash>

                <Aside_Eyelash position='l' title='Parlante' urlIco={'/ico/icons8-megaphone-50.png'} eyelash={2}>
                    <h2>coming soong...</h2>
                </Aside_Eyelash>

                <Aside_Eyelash position='l' title='Chat365' urlIco={'/ico/icons8-chat-24.png'} eyelash={3}>
                    {(methods) => (
                        <ChatGeneral365  {...methods} />
                    )}
                </Aside_Eyelash>


                <ZoomImg />
            </ImgProvider>
            <AlertLiveJarvis />
        </div>
    );
}