
import '../style/styles.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// Victor Mono: dígitos casi cuadrados para los contadores del panel analítico
import '@fontsource/victor-mono/400.css';
import '@fontsource/victor-mono/500.css';
import dynamic from 'next/dynamic';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Head from 'next/head';
import AppShell from '@/components/AppNav/AppShell';
import AlertLiveJarvis from '@/components/alertSpeackComponent';
import LoandingPage from '@/components/loandingComponent/loandingPage';
import ErrorServerAlert from '@/components/error/Error_Server'


const AlertInputLive = dynamic(() => import('@/components/alert_input/AlertIput'));
const Config_window = dynamic(() => import('@/components/config_window/Config_window'));
const ImageViewer = dynamic(() => import('@/components/ImageViewer/ImageViewer'));


import FixedBottomBar from '@/components/Footer/FixedBottomBar';

import Modal from "../components/modals/Modal";
import Favicon from '/public/favicon.ico';

//redux
import Providers from '../store/Providers';
import { SessionProvider } from '@/contexts/userContext'


export const metadata = {
    title: 'Jarvis365',
    description: 'Tu herramienta las 365 días del año',
    icons: [{ rel: 'icon', url: Favicon.src }],
    manifest: '/manifest.json',
};



export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode }>) {




    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <Head>
                <meta name="robots" content="noindex, nofollow"></meta>
                <meta name="google-site-verification" content="y0qtg0BfcGqooJZXzWhcf5_0W04rodr3hPdyLLr8qN0" />
            </Head>
            <body className={`${GeistSans.className} h-[100vh] pt-2 px-[10px] pb-[40px] bg-white`}>
                <SessionProvider>
                    <Providers>
                        <LoandingPage title='loanding...'>
                            <AppShell>{children}</AppShell>
                            <Modal />
                            <AlertLiveJarvis />
                            <Config_window />
                            <FixedBottomBar />
                            <ImageViewer />
                        </LoandingPage>
                    </Providers>
                    <ErrorServerAlert />
                </SessionProvider >
            </body>

        </html>
    );
}
