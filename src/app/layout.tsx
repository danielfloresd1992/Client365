
import "./globals.css";
import "./page.module.css";
import '../style/style.css';
import '../style/Lobby.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import Header from '@/components/Header/Header';
import LoandingPage from '@/components/loandingComponent/loandingPage';


const AlertInputLive = dynamic(() => import('@/components/alert_input/AlertIput'));
const Config_window = dynamic(() => import('@/components/config_window/Config_window'));


import FixedBottomBar from '@/components/Footer/FixedBottomBar';

import Modal from "../components/useModal/Modal";
import Favicon from '/public/favicon.ico';

//redux
import Providers from '../store/Providers';
import { SessionProvider } from '@/contexts/userContext'
const inter = Inter({ subsets: ['latin'] });


export const metadata = {
    title: 'Jarvis365',
    description: 'Tu herramienta las 365 días del año',
    icons: [{ rel: 'icon', url: Favicon.src }],
};



export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <Providers>
                <Head>
                    <meta name="google-site-verification" content="tnPQy_iWErCY9GT9NhJlLBKrQ16kuOo1SSIKyNKiWks" />
                </Head>
                <SessionProvider>
                    <body className={`${inter.className} h-[100vh] p-[48px_10px_40px_10px] bg-white`}>
                        <LoandingPage title='loanding...'>
                            <Header />
                            {children}
                            <Modal />

                        </LoandingPage>
                        <Config_window />
                        <FixedBottomBar>
                            {/*<AlertInputLive /> */}
                        </FixedBottomBar>
                    </body>
                </SessionProvider>
            </Providers>
        </html>
    );
}
