'use client'
import ZoomImg from '@/components/zoomImage/ZoomImg';
import { ImgProvider } from '@/contexts/imgContext';

// Importa los componentes de manera dinámica
import PublicationsBox from '@/components/Publications/PublicationsBox';

import Aside_Eyelash from '@/components/aside/aside_establishment/Aside_Eyelash';
import ChatGeneral365 from '@/components/chats/chat_general_365/ChatGeneral365';
import FilterNoveltyForLobby from '@/components/filter_data_for_lobby/FilterComponent.jsx';
import AlertInputLive from '@/components/alert_input/AlertIput.jsx';

import SectionConfigVoice from '@/components/config_window/assets/config_voices'



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
                justifyContent: 'flex-start',
                position: 'relative',
                gap: '.5rem',
                maxWidth: '1750px'
            }}
        >
            <ImgProvider>
                {/* Solo el muro de novedades; el panel de "Consulta de alertas" y
                    "Conectados" (AsideInfoUser) se retiró. */}
                <PublicationsBox filterSignal={null} />

                <Aside_Eyelash position='r' title='Alertas' urlIco={'/ico/icons8-counter-50.png'} eyelash={0}>
                    {(methods) => (
                        <AlertInputLive {...methods} />
                    )}
                </Aside_Eyelash>

                <Aside_Eyelash position='r' title='Filtros para envio' urlIco={'/ico/icons8-filtro-vac\u00edo-30.png'} eyelash={1}>
                    {(methods) => (
                        <FilterNoveltyForLobby {...methods} />
                    )}
                </Aside_Eyelash>

                <Aside_Eyelash position='r' title='Parlante' urlIco={'/ico/icons8-megaphone-50.png'} eyelash={2}>
                    <SectionConfigVoice />
                </Aside_Eyelash>

                <Aside_Eyelash position='r' title='Chat365' urlIco={'/ico/icons8-chat-24.png'} eyelash={3} isDrag={true}>
                    {(methods) => (
                        <ChatGeneral365  {...methods} />
                    )}
                </Aside_Eyelash>


                <ZoomImg />
            </ImgProvider>

        </div>
    );
}
