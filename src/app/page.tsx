

import Footer from '../components/Footer/Footer.jsx';
import Image from 'next/image.js';
import BackAnimate from '@/components/componentAnimation/backAnimate/BackAnimate';
import CardPresentation from '@/components/cards/cardPresentation';




export default function page() {



    return (
        <>
            <main className='prensetantionContent'>
                <BackAnimate />

                <section className='__width-complete __height-complete __center_center' style={{ position: 'absolute' }} >
                    <div className='__width-complete __padding4rem logo-content animation-shadow block'>
                        <div style={{ width: 'fit-content', margin: 'auto' }}>
                            <figure>
                                <Image src='/Jarvis365.png' width={400} height={120} alt='logo' layout='responsive' draggable={false} />
                            </figure>
                        </div>
                    </div>
                </section>

            </main>
            <section className='bg-black relative prensetantionContent min-h-screen p-8 flex items-center gap-[8rem]' style={{ backgroundColor: '#212121', height: 'unset' }}>

                <div className='relative w-full h-[30%] flex flex-col items-center justify-center gap-[2rem]'>
                    <h1 className='text-4xl sans-serif text-center' style={{ color: '#bbbbbb' }}>Algunas de las optimizaciones de esta herramienta</h1>
                    <p className='indent-4' style={{ color: 'aliceblue' }}>Nuestra herramienta a demostrado la capacidad de establecer y aumentar los procesos de nuestros clientes, ayudandolos asi a saber en que areas especificas estan teniendo dificultades y dar una pronta solución mediante el analisis de datos.</p>

                </div>
                <div className='relative w-full h-[70%] flex justify-center items-center flex-wrap gap-[2rem]'>

                    <CardPresentation urlImg='/ico/clientes-integration.png' title='Integración' description='Capacidad de poder integrar con facilidad todos los dispotivos de los clientes a nuestro sistema.' />

                    <CardPresentation urlImg='/ico/protection-data.png' title='Seguridad' description='Garantizamos la seguridad y confidencialidad de los datos de nuestros clientes, asegurando que tu información esté siempre protegida.' />

                    <CardPresentation urlImg='/ico/pie-chart-for-election.png' title='Análisis' description='Nuestra herramienta ofrece una captura, manipulación y filtración de datos superior, permitiendo una selección y uso estadístico eficiente.' />

                    <CardPresentation urlImg='/ico/descarga-rápida.png' title='Rapidez' description='Nuestra herramienta permite reportar en tiempo real los incidentes o novedades presentadas en el local o establecimiento de nuestros clientes.' />

                </div>

            </section>
            <Footer />
        </>
    );
}