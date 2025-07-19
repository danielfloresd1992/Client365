
import "./globals.css";
import "./page.module.css";
import '../style/style.css';
import '../style/Lobby.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { Inter } from 'next/font/google';
import Head from 'next/head';
import Header from '@/components/Header/Header';
import LoandingPage from '@/components/loandingComponent/loandingPage';

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
                    <body className={inter.className}>
                        <LoandingPage title='loanding...'>
                            <Header />
                            {children}
                            <Modal />

                        </LoandingPage>
                    </body>
                </SessionProvider>
            </Providers>
        </html>
    );
}
