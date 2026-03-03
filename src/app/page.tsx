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

                        <div className='relative'>
                            {/* Decorative glow behind the card */}
                            <div className='absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#4e8300]/20 via-[#82c91e]/10 to-transparent blur-2xl pointer-events-none' />

                            <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-white/80 backdrop-blur-xl p-6 md:p-8 shadow-[0_24px_48px_rgba(56,88,20,0.12),0_8px_20px_rgba(0,0,0,0.04)] overflow-hidden'>
                                {/* Accent strip */}
                                <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4e8300] via-[#6cae1f] to-[#a3d977]' />

                                {/* Logo */}
                                <div className='flex justify-center items-center py-4'>
                                    <Image src='/Jarvis365.png' width={520} height={160} alt='Amazonas365' priority className='w-full max-w-[380px] h-auto object-contain drop-shadow-lg' />
                                </div>

                                {/* Tagline */}
                                <p className='text-center text-sm text-slate-500 font-medium tracking-wide mt-2 mb-5'>
                                    Plataforma integral de supervisión empresarial
                                </p>

                                {/* Stats */}
                                <div className='grid grid-cols-3 gap-3'>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-white to-[#f8fbf4] p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-2xl font-bold text-[#4e8300]'>24/7</p>
                                        <p className='mt-1 text-xs uppercase tracking-wider text-slate-500'>Cobertura</p>
                                    </div>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-white to-[#f8fbf4] p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-2xl font-bold text-[#4e8300]'>365</p>
                                        <p className='mt-1 text-xs uppercase tracking-wider text-slate-500'>Días al año</p>
                                    </div>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-white to-[#f8fbf4] p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-2xl font-bold text-[#4e8300]'>100%</p>
                                        <p className='mt-1 text-xs uppercase tracking-wider text-slate-500'>Objetivo</p>
                                    </div>
                                </div>

                                {/* Decorative dots */}
                                <div className='absolute -bottom-3 -right-3 w-24 h-24 opacity-[0.04]'>
                                    <svg viewBox='0 0 100 100' fill='currentColor' className='text-[#4e8300]'>
                                        {[...Array(25)].map((_, i) => <circle key={i} cx={10 + (i % 5) * 20} cy={10 + Math.floor(i / 5) * 20} r='3' />)}
                                    </svg>
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

                        <div className='mt-6 w-full'>
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

                {/* ── Reportes365 Section ──────────────────────────────────── */}
                <section className='w-full px-4 md:px-8 lg:px-12 pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-[#c8ddb4] bg-gradient-to-br from-[#f7fbf2] via-white to-[#f0f7e8] p-6 md:p-10 overflow-hidden relative'>
                        {/* Decorative background shapes */}
                        <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#4e8300]/[0.05] to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none' />
                        <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#82c91e]/[0.05] to-transparent rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none' />

                        <div className='relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                            {/* Left — Info */}
                            <div className='space-y-5'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#c8ddb4] bg-[#eef6e4] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#4e8300]'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                                    Nueva plataforma
                                </span>

                                <h2 className='text-2xl md:text-3xl font-bold text-slate-800 leading-tight'>
                                    Reportes365: documenta y gestiona con precisión
                                </h2>

                                <p className='text-sm md:text-base text-slate-600 leading-relaxed'>
                                    Nuestra plataforma de reportes te permite crear, editar y entregar documentos de gestión directamente desde la operación.
                                    Conecta supervisión, evidencia y análisis en un solo lugar para decisiones más rápidas.
                                </p>

                                <div className='grid grid-cols-2 gap-3'>
                                    {['Reportes de novedades', 'Documentos configurables', 'Exportación a PDF', 'Gestión en tiempo real'].map((feat) => (
                                        <div key={feat} className='flex items-start gap-2'>
                                            <span className='mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#eef6e4] flex items-center justify-center'>
                                                <svg className='w-3 h-3 text-[#4e8300]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            <span className='text-sm text-slate-700'>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href='https://jarvis365reporte.netlify.app/'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center gap-2 rounded-lg bg-[#4e8300] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3f6b00] transition-all hover:shadow-lg hover:shadow-[#4e8300]/20 hover:-translate-y-0.5'
                                >
                                    Ir a Reportes365
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3' /></svg>
                                </a>
                            </div>

                            {/* Right — Visual preview card */}
                            <div className='relative'>
                                <div className='absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#4e8300]/10 via-[#82c91e]/5 to-transparent blur-xl pointer-events-none' />
                                <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-white/90 backdrop-blur-md shadow-[0_20px_50px_rgba(56,88,20,0.10)] p-6 space-y-4'>
                                    {/* Mock header */}
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#4e8300] to-[#6cae1f] flex items-center justify-center shadow-md'>
                                            <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                                        </div>
                                        <div>
                                            <p className='text-sm font-bold text-slate-800'>Reportes365</p>
                                            <p className='text-xs text-slate-500'>Plataforma de documentos</p>
                                        </div>
                                        <span className='ml-auto inline-flex items-center rounded-full bg-[#eef6e4] px-2.5 py-0.5 text-[10px] font-bold text-[#4e8300] uppercase tracking-wide'>Activo</span>
                                    </div>

                                    {/* Mock document rows */}
                                    <div className='space-y-2.5'>
                                        {['Reporte de novedades — Sede Norte', 'Informe mensual — Operaciones', 'Documento de entrega — Turno AM'].map((doc, idx) => (
                                            <div key={idx} className='flex items-center gap-3 rounded-lg border border-slate-100 bg-[#fbfdf9] px-3 py-2.5'>
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#4e8300]' : idx === 1 ? 'bg-[#f59e0b]' : 'bg-slate-300'}`} />
                                                <p className='text-xs text-slate-600 flex-1'>{doc}</p>
                                                <svg className='w-3.5 h-3.5 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' /></svg>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock stats bar */}
                                    <div className='flex gap-3 pt-2 border-t border-slate-100'>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#4e8300]'>12</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Creados</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#f59e0b]'>3</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Pendientes</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-slate-700'>98%</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Completado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                {/* ── JarvisExpress showcase ── */}
                <section className='w-full px-4 md:px-8 lg:px-12 pb-10'>
                    <RevealBlock className='relative max-w-6xl mx-auto overflow-hidden rounded-3xl border border-[#c8ddb4]/50 bg-gradient-to-br from-[#f4f9ef] via-white to-[#eef6e4] p-6 md:p-10 lg:p-14'>
                        {/* Decorative shapes */}
                        <div className='absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#4e8300]/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none' />
                        <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#82c91e]/[0.05] to-transparent rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none' />

                        <div className='relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                            {/* Left — Info */}
                            <div className='space-y-5'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#c8ddb4] bg-[#eef6e4] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#4e8300]'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' /></svg>
                                    Plataforma operativa
                                </span>

                                <h2 className='text-2xl md:text-3xl font-bold text-slate-800 leading-tight'>
                                    JarvisExpress: control operativo en tiempo real
                                </h2>

                                <p className='text-sm md:text-base text-slate-600 leading-relaxed'>
                                    La plataforma que conecta cada punto de operación con supervisión en vivo.
                                    Gestiona alertas, novedades, multimedia y estándares de calidad desde un único panel intuitivo y rápido.
                                </p>

                                <div className='grid grid-cols-2 gap-3'>
                                    {['Alertas en tiempo real', 'Bandeja multimedia', 'Arrastrar y soltar imágenes', 'Estándares de calidad'].map((feat) => (
                                        <div key={feat} className='flex items-start gap-2'>
                                            <span className='mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#eef6e4] flex items-center justify-center'>
                                                <svg className='w-3 h-3 text-[#4e8300]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            <span className='text-sm text-slate-700'>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href='https://jarvis-express.netlify.app/'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center gap-2 rounded-lg bg-[#4e8300] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3f6b00] transition-all hover:shadow-lg hover:shadow-[#4e8300]/20 hover:-translate-y-0.5'
                                >
                                    Ir a JarvisExpress
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3' /></svg>
                                </a>
                            </div>

                            {/* Right — Visual preview card */}
                            <div className='relative'>
                                <div className='absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#4e8300]/10 via-[#82c91e]/5 to-transparent blur-xl pointer-events-none' />
                                <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-white/90 backdrop-blur-md shadow-[0_20px_50px_rgba(56,88,20,0.10)] p-6 space-y-4'>
                                    {/* Mock header */}
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#4e8300] to-[#6cae1f] flex items-center justify-center shadow-md'>
                                            <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' /></svg>
                                        </div>
                                        <div>
                                            <p className='text-sm font-bold text-slate-800'>JarvisExpress</p>
                                            <p className='text-xs text-slate-500'>Panel de operaciones</p>
                                        </div>
                                        <span className='ml-auto inline-flex items-center rounded-full bg-[#eef6e4] px-2.5 py-0.5 text-[10px] font-bold text-[#4e8300] uppercase tracking-wide'>En línea</span>
                                    </div>

                                    {/* Mock operations feed */}
                                    <div className='space-y-2.5'>
                                        {[
                                            { label: 'Alerta — Novedad sede Centro', color: 'bg-red-400' },
                                            { label: 'Imagen recibida — Turno PM', color: 'bg-[#4e8300]' },
                                            { label: 'Calidad aprobada — Cocina Norte', color: 'bg-[#f59e0b]' },
                                        ].map((item, idx) => (
                                            <div key={idx} className='flex items-center gap-3 rounded-lg border border-slate-100 bg-[#fbfdf9] px-3 py-2.5'>
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                <p className='text-xs text-slate-600 flex-1'>{item.label}</p>
                                                <svg className='w-3.5 h-3.5 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' /></svg>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock stats bar */}
                                    <div className='flex gap-3 pt-2 border-t border-slate-100'>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#4e8300]'>24</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Alertas</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#f59e0b]'>8</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Pendientes</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-slate-700'>100%</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Operativo</p>
                                        </div>
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