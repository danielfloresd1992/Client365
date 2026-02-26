"use client";

import Footer from '../components/Footer/Footer.jsx';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';

const services = [
    {
        title: 'Investigación operativa',
        description: 'Identificamos y estructuramos procesos críticos para impulsar eficiencia, control y crecimiento del negocio.',
    },
    {
        title: 'Asistencia gerencial',
        description: 'Acompañamos a socios y directivos con información accionable para corregir fallas del día a día.',
    },
    {
        title: 'Detección de oportunidades',
        description: 'Detectamos oportunidades ocultas en la operación diaria para elevar productividad y experiencia del cliente.',
    },
    {
        title: 'Reportes estratégicos',
        description: 'Transformamos datos en reportes claros para decidir más rápido y con mayor precisión.',
    },
];

const benefits = [
    'Mejora de eficacia en operaciones y servicio',
    'Detección temprana de desviaciones y riesgos',
    'Mayor control de productividad y estándares',
    'Seguimiento 24/7 con enfoque objetivo',
];

const processSteps = [
    {
        step: '01',
        title: 'Diagnóstico operativo',
        description: 'Levantamos información del negocio, puntos de control y objetivos estratégicos.',
    },
    {
        step: '02',
        title: 'Seguimiento diario',
        description: 'Monitoreamos procesos clave y trazamos alertas para incidencias y desviaciones.',
    },
    {
        step: '03',
        title: 'Análisis y priorización',
        description: 'Transformamos eventos diarios en hallazgos accionables priorizados por impacto.',
    },
    {
        step: '04',
        title: 'Reporte y mejora continua',
        description: 'Entregamos reportes de gestión para ejecutar mejoras y elevar resultados.',
    },
];

const sectors = [
    'Restaurantes y franquicias',
    'Retail y tiendas multisede',
    'Centros de servicio y atención',
    'Operaciones con gestión remota',
];

const faqs = [
    {
        question: '¿Qué tipo de resultados podemos esperar?',
        answer: 'Mayor control de procesos, reducción de pérdidas operativas y mejoras medibles en atención y tiempos de servicio.',
    },
    {
        question: '¿Con qué frecuencia se entrega información?',
        answer: 'La operación se monitorea de forma continua y los reportes se entregan con enfoque oportuno para la toma de decisiones.',
    },
    {
        question: '¿El servicio aplica para operaciones multisede?',
        answer: 'Sí. El modelo está diseñado para centralizar supervisión y estandarizar seguimiento en una o múltiples sedes.',
    },
];

const monthlyControlData = [72, 76, 79, 83, 86, 90];
const monthlyControlLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

const operationalGains = [
    { area: 'Atención', value: 82 },
    { area: 'Productividad', value: 77 },
    { area: 'Calidad', value: 88 },
    { area: 'Cumplimiento', value: 84 },
];

const resourceDistribution = [
    { id: 0, value: 38, label: 'Supervisión' },
    { id: 1, value: 24, label: 'Análisis' },
    { id: 2, value: 20, label: 'Reportes' },
    { id: 3, value: 18, label: 'Mejora continua' },
];

type RevealBlockProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
};

function RevealBlock({ children, className = '', delay = 0 }: RevealBlockProps) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`${className} transform-gpu transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
            {children}
        </div>
    );
}

export default function Page() {
    return (
        <>
            <main className='w-full bg-white text-slate-700'>
                <section className='w-full bg-gradient-to-br from-[#f0f5ea] via-[#e7efdc] to-[#dde7cc] px-4 md:px-8 lg:px-12 py-16 md:py-20'>
                    <RevealBlock className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
                        <div className='space-y-6'>
                            <span className='inline-flex items-center rounded-full border border-[#dce8d4] bg-[#f4f9ef] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4e8300]'>
                                Gestión y gerencia remota 24/7 · 365
                            </span>
                            <h1 className='text-3xl md:text-5xl font-bold leading-tight text-slate-800'>
                                Herramienta empresarial para controlar y asegurar la gestión diaria de tu negocio
                            </h1>
                            <p className='text-sm md:text-base leading-relaxed text-slate-600'>
                                En Amazonas365 monitoreamos, analizamos y acompañamos la operación de empresas para mejorar servicio, reducir pérdidas y fortalecer la toma de decisiones con información oportuna.
                            </p>

                            <div className='flex flex-wrap gap-3'>
                                <a
                                    href='https://api.whatsapp.com/send?phone=13038757299&text=%C2%A1Hello!%20I%20want%20more%20info%20about%20%40amazonas365_%20'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center justify-center rounded-lg bg-[#4e8300] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f6b00] transition-colors'
                                >
                                    Contactar por WhatsApp
                                </a>
                                <a
                                    href='/auth'
                                    className='inline-flex items-center justify-center rounded-lg border border-[#d4dec8] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f7faf4] transition-colors'
                                >
                                    Iniciar sesión
                                </a>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-[#a1a1a1] p-6 md:p-8 shadow-[0_16px_35px_rgba(56,88,20,0.10)]'>
                            <Image src='/Jarvis365.png' width={520} height={160} alt='Amazonas365' priority className='w-full h-auto object-contain' />
                            <div className='mt-6 grid grid-cols-2 gap-3'>
                                <div className='rounded-xl border border-[#dde8d0] bg-white p-4'>
                                    <p className='text-xs uppercase tracking-wide text-slate-500'>Cobertura</p>
                                    <p className='mt-1 text-xl font-bold text-slate-800'>24/7</p>
                                </div>
                                <div className='rounded-xl border border-[#dde8d0] bg-white p-4'>
                                    <p className='text-xs uppercase tracking-wide text-slate-500'>Gestión</p>
                                    <p className='mt-1 text-xl font-bold text-slate-800'>365 días</p>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-10'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                        <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Nuestros servicios</h2>
                        <p className='mt-2 text-sm md:text-base text-slate-600'>
                            Diseñados para acompañar el seguimiento de gestión empresarial con foco en resultados medibles.
                        </p>

                        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {services.map((service) => (
                                <article key={service.title} className='rounded-xl border border-slate-200 bg-[#fbfdf9] p-5'>
                                    <h3 className='text-base font-semibold text-slate-800'>{service.title}</h3>
                                    <p className='mt-2 text-sm leading-relaxed text-slate-600'>{service.description}</p>
                                </article>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-16'>
                    <RevealBlock className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-5'>
                        <div className='lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                            <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>¿Por qué empresas confían en Amazonas365?</h2>
                            <ul className='mt-5 space-y-3'>
                                {benefits.map((benefit) => (
                                    <li key={benefit} className='flex items-start gap-2 text-sm md:text-base text-slate-700'>
                                        <span className='mt-1 h-2 w-2 rounded-full bg-[#5d8a1d]' />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <aside className='lg:col-span-2 rounded-2xl border border-slate-200 bg-[#f8fbf4] p-6 md:p-8'>
                            <h3 className='text-lg font-bold text-slate-800'>Indicadores de referencia</h3>
                            <div className='mt-4 space-y-3'>
                                <div className='rounded-lg border border-[#dce8d4] bg-white p-3'>
                                    <p className='text-xs uppercase text-slate-500'>Atención de mesa</p>
                                    <p className='text-xl font-bold text-[#4e8300]'>2–3 mins</p>
                                </div>
                                <div className='rounded-lg border border-[#dce8d4] bg-white p-3'>
                                    <p className='text-xs uppercase text-slate-500'>Servicio de plato</p>
                                    <p className='text-sm font-semibold text-slate-700'>Entrada 8 mins · Principal 15 mins · Postre 5 mins</p>
                                </div>
                                <div className='rounded-lg border border-[#dce8d4] bg-white p-3'>
                                    <p className='text-xs uppercase text-slate-500'>Limpieza de mesa</p>
                                    <p className='text-xl font-bold text-[#4e8300]'>3–4 mins</p>
                                </div>
                            </div>
                        </aside>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                        <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Panel visual de gestión</h2>
                        <p className='mt-2 text-sm md:text-base text-slate-600'>
                            Visualiza tendencias, rendimiento por área y distribución del esfuerzo operativo para decisiones más rápidas.
                        </p>

                        <div className='mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4'>
                            <div className='w-full flex gap-2 flex-wrap'>
                                <div className='w-[49%]'>
                                    <RevealBlock delay={100} className='rounded-xl border border-slate-200 bg-[#fbfdf9] p-4'>
                                        <h3 className='text-sm font-semibold text-slate-800'>Tendencia mensual de control (%)</h3>
                                        <LineChart
                                            height={220}
                                            xAxis={[{ scaleType: 'point', data: monthlyControlLabels }]}
                                            series={[{ data: monthlyControlData, label: 'Eficacia', color: '#4e8300' }]}
                                            grid={{ horizontal: true }}
                                        />
                                    </RevealBlock>
                                </div>
                                <div className='w-[49%]'>
                                     <RevealBlock delay={180} className='rounded-xl border border-slate-200 bg-[#fbfdf9] p-4'>
                                        <h3 className='text-sm font-semibold text-slate-800'>Rendimiento por área</h3>
                                        <BarChart
                                            height={220}
                                            xAxis={[{ scaleType: 'band', data: operationalGains.map((item) => item.area) }]}
                                            series={[{ data: operationalGains.map((item) => item.value), label: 'Score', color: '#6c9e21' }]}
                                            grid={{ horizontal: true }}
                                        />
                                    </RevealBlock>
                                 </div>
                               
                                <div className='w-full flex justify-center'>
                                    <div className='w-[40%]'>
                                        <RevealBlock delay={260} className='rounded-xl border border-slate-200 bg-[#fbfdf9] p-4'>
                                            <h3 className='text-sm font-semibold text-slate-800'>Distribución de gestión</h3>
                                            <PieChart
                                                height={220}
                                                series={[
                                                    {
                                                        data: resourceDistribution,
                                                        innerRadius: 45,
                                                        outerRadius: 82,
                                                        paddingAngle: 3,
                                                        cornerRadius: 4,
                                                        cx: 95,
                                                        cy: 100,
                                                    },
                                                ]}
                                            />
                                        </RevealBlock>
                                    </div>
                                </div>
                            </div>

                           

                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-10'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                        <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Cómo trabajamos</h2>
                        <p className='mt-2 text-sm md:text-base text-slate-600'>
                            Un método simple y disciplinado para convertir datos operativos en decisiones de gestión.
                        </p>

                        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
                            {processSteps.map((item) => (
                                <article key={item.step} className='rounded-xl border border-slate-200 bg-[#fbfdf9] p-4'>
                                    <span className='inline-flex rounded-md bg-[#eef6e4] px-2 py-1 text-xs font-bold text-[#4e8300]'>Paso {item.step}</span>
                                    <h3 className='mt-3 text-sm md:text-base font-semibold text-slate-800'>{item.title}</h3>
                                    <p className='mt-2 text-sm leading-relaxed text-slate-600'>{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-10'>
                    <RevealBlock className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5'>
                        <div className='rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                            <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Sectores que atendemos</h2>
                            <p className='mt-2 text-sm md:text-base text-slate-600'>
                                Adaptamos el seguimiento de gestión al contexto operativo y estándar de cada industria.
                            </p>
                            <ul className='mt-5 space-y-3'>
                                {sectors.map((sector) => (
                                    <li key={sector} className='rounded-lg border border-slate-200 bg-[#fbfdf9] px-4 py-3 text-sm text-slate-700'>
                                        {sector}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='rounded-2xl border border-[#dbe8ce] bg-gradient-to-br from-[#f5faef] to-[#edf4e3] p-6 md:p-8'>
                            <h3 className='text-lg md:text-xl font-bold text-slate-800'>Impacto en gestión</h3>
                            <div className='mt-5 grid grid-cols-2 gap-3'>
                                <div className='rounded-lg border border-[#d9e5cd] bg-white p-4'>
                                    <p className='text-xs text-slate-500 uppercase'>Control operativo</p>
                                    <p className='mt-1 text-lg font-bold text-[#4e8300]'>En tiempo real</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-white p-4'>
                                    <p className='text-xs text-slate-500 uppercase'>Cobertura</p>
                                    <p className='mt-1 text-lg font-bold text-[#4e8300]'>24/7 · 365</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-white p-4'>
                                    <p className='text-xs text-slate-500 uppercase'>Reportes</p>
                                    <p className='mt-1 text-lg font-bold text-[#4e8300]'>Objetivos y claros</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-white p-4'>
                                    <p className='text-xs text-slate-500 uppercase'>Decisiones</p>
                                    <p className='mt-1 text-lg font-bold text-[#4e8300]'>Más rápidas</p>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-10'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
                        <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Preguntas frecuentes</h2>
                        <div className='mt-5 space-y-3'>
                            {faqs.map((faq) => (
                                <article key={faq.question} className='rounded-lg border border-slate-200 bg-[#fbfdf9] p-4'>
                                    <h3 className='text-sm md:text-base font-semibold text-slate-800'>{faq.question}</h3>
                                    <p className='mt-2 text-sm text-slate-600'>{faq.answer}</p>
                                </article>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                <section className='w-full px-4 md:px-8 lg:px-12 pb-16'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-[#cfe0bc] bg-gradient-to-r from-[#f4f9ed] to-[#e8f1dc] p-6 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5'>
                        <div>
                            <h2 className='text-2xl md:text-3xl font-bold text-slate-800'>Haz más eficiente la gestión de tu empresa</h2>
                            <p className='mt-2 text-sm md:text-base text-slate-600'>
                                Conecta supervisión, análisis y ejecución en una sola herramienta para operar con más control y confianza.
                            </p>
                        </div>
                        <a
                            href='https://api.whatsapp.com/send?phone=13038757299&text=%C2%A1Hello!%20I%20want%20more%20info%20about%20%40amazonas365_%20'
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center justify-center rounded-lg bg-[#4e8300] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3f6b00] transition-colors whitespace-nowrap'
                        >
                            Solicitar asesoría
                        </a>
                    </RevealBlock>
                </section>
            </main>

            <Footer />
        </>
    );
}