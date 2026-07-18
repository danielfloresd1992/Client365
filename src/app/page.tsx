"use client";

import Footer from '../components/Footer/Footer.jsx';
import Image from 'next/image';
import RayTracingFX from '../components/fx/RayTracingFX';
import NewsWallMini from '../components/fx/NewsWallMini';
import Jarvis365Logo from '../components/fx/Jarvis365Logo';
import type { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState, useRef } from 'react';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';




const services = [
    {
        icon: (
            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
            </svg>
        ),
        title: 'Investigación operativa',
        description: 'Identificamos y estructuramos procesos críticos para impulsar eficiencia, control y crecimiento del negocio.',
    },
    {
        icon: (
            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' />
            </svg>
        ),
        title: 'Asistencia gerencial',
        description: 'Acompañamos a socios y directivos con información accionable para corregir fallas del día a día.',
    },
    {
        icon: (
            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v-5.5m3 5.5V8.25m3 3v-2' />
            </svg>
        ),
        title: 'Detección de oportunidades',
        description: 'Detectamos oportunidades ocultas en la operación diaria para elevar productividad y experiencia del cliente.',
    },
    {
        icon: (
            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' />
            </svg>
        ),
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

const companyStats = [
    { value: 5, suffix: '+', label: 'Años de experiencia' },
    { value: 50, suffix: '+', label: 'Empresas atendidas' },
    { value: 200, suffix: '+', label: 'Sedes monitoreadas' },
    { value: 99, suffix: '%', label: 'Disponibilidad' },
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

const kpiHighlights = [
    { value: '90%', label: 'Eficacia operativa', trend: '+18%', color: '#29c50c' },
    { value: '88', label: 'Score de calidad', trend: '+12%', color: '#d9a441' },
    { value: '84%', label: 'Cumplimiento', trend: '+9%', color: '#b5763b' },
];

// Paleta corporativa para gráficas (verde + dorados/cobres, no monocromática)
const chartColors = ['#29c50c', '#d9a441', '#b5763b', '#7bbf2a'];

// Estilos de eje/grid para las gráficas sobre el panel marfil claro
const chartAxisSx = {
    '& .MuiChartsAxis-tickLabel': { fill: '#6b7158 !important' },
    '& .MuiChartsAxis-line': { stroke: 'rgba(107,113,88,0.25)' },
    '& .MuiChartsAxis-tick': { stroke: 'rgba(107,113,88,0.25)' },
    '& .MuiChartsGrid-line': { stroke: 'rgba(107,113,88,0.12)' },
    '& .MuiChartsLegend-series text': { fill: '#5a6048 !important' },
    '& .MuiChartsLegend-mark': { rx: '3px' },
};

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



function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 2000;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                start = target;
                clearInterval(timer);
            }
            setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);

    return (
        <span ref={(node) => { inViewRef(node); (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node; }}>
            {count}{suffix}
        </span>
    );
}




export default function Page() {
    return (
        <>
            <main className='w-full bg-[#f7f2e4] text-slate-700'>
                {/* ── HERO / PORTADA ── */}
                <section className='relative w-full overflow-hidden bg-gradient-to-br from-[#f1e9d7] via-[#e9dec8] to-[#e0d4ba] px-2.5 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-20 md:py-24'>
                    {/* Capa de trazado de rayos (god-rays, orbes y partículas de luz) */}
                    <RayTracingFX className='absolute inset-0 w-full h-full z-0 pointer-events-none' intensity={1} />

                    {/* Decorative background elements */}
                    <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#29c50c]/[0.07] to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none' />
                    <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#7bd42a]/[0.06] to-transparent rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none' />
                    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(41,197,12,0.04),transparent_70%)] pointer-events-none' />

                    <RevealBlock className='relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
                        <div className='space-y-6 text-center lg:text-left'>
                            <span className='inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-[#f5eedd]/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#29c50c]'>
                                <span className='relative flex h-2 w-2'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#29c50c] opacity-75' />
                                    <span className='relative inline-flex rounded-full h-2 w-2 bg-[#29c50c]' />
                                </span>
                                Gestión y gerencia remota 24/7 · 365
                            </span>

                            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] text-slate-800'>
                                Control total de la{' '}
                                <span className='relative inline-block'>
                                    <span className='relative z-10 text-[#29c50c]'>gestión diaria</span>
                                    <span className='absolute bottom-1 left-0 w-full h-3 bg-[#29c50c]/10 rounded-sm -z-0' />
                                </span>{' '}
                                de tu negocio
                            </h1>

                            <p className='text-sm sm:text-base md:text-lg leading-relaxed text-slate-600 max-w-xl mx-auto lg:mx-0'>
                                <strong className='text-slate-700'>Amazonas365</strong> es la empresa que monitorea, analiza y acompaña la operación de tu negocio para mejorar servicio, reducir pérdidas y fortalecer cada decisión con información oportuna.
                            </p>

                            <div className='flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start'>
                                <a
                                    href='https://api.whatsapp.com/send?phone=13038757299&text=%C2%A1Hello!%20I%20want%20more%20info%20about%20%40amazonas365_%20'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#29c50c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f9a08] transition-all hover:shadow-lg hover:shadow-[#d9a441]/40 hover:-translate-y-0.5'
                                >
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' /></svg>
                                    Contactar por WhatsApp
                                </a>
                                <a
                                    href='/auth'
                                    className='inline-flex items-center justify-center rounded-xl border border-[#d4dec8] bg-[#faf5ea]/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f7f2e4] hover:border-[#29c50c]/30 transition-all'
                                >
                                    Iniciar sesión
                                    <svg className='w-4 h-4 ml-2' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3' /></svg>
                                </a>
                            </div>

                            {/* Trust badges */}
                            <div className='flex items-center gap-4 justify-center lg:justify-start pt-2'>
                                <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                                    <svg className='w-4 h-4 text-[#29c50c]' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    Monitoreo 24/7
                                </div>
                                <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                                    <svg className='w-4 h-4 text-[#29c50c]' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    Sin contratos largos
                                </div>
                                <div className='hidden sm:flex items-center gap-1.5 text-xs text-slate-500'>
                                    <svg className='w-4 h-4 text-[#29c50c]' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    Resultados medibles
                                </div>
                            </div>
                        </div>

                        <div className='relative order-first lg:order-last'>
                            {/* Decorative glow behind the card */}
                            <div className='absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#d9a441]/20 via-[#b5763b]/12 to-transparent blur-2xl pointer-events-none' />

                            <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-[#faf5ea]/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-[0_24px_48px_rgba(31,154,8,0.12),0_8px_20px_rgba(0,0,0,0.04)] overflow-hidden'>
                                {/* Fondo: muro de novedades en vivo, difuminado */}
                                <NewsWallMini className='absolute inset-0 z-0 blur-[2px] sm:blur-[2px] opacity-75 pointer-events-none select-none' />
                                {/* Velo marfil para legibilidad del contenido */}
                                <div className='absolute inset-0 z-0 bg-gradient-to-b from-[#faf5ea]/80 via-[#faf5ea]/60 to-[#faf5ea]/85 pointer-events-none' />

                                {/* Accent strip */}
                                <div className='absolute top-0 left-0 right-0 z-10 h-1 bg-gradient-to-r from-[#29c50c] via-[#d9a441] to-[#b5763b]' />

                                {/* Logo */}
                                <div className='relative z-10 flex justify-center items-center py-3 sm:py-4'>
                                    <Jarvis365Logo variant='light' className='relative w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] h-auto' />
                                </div>

                                {/* Tagline */}
                                <p className='relative z-10 text-center text-xs sm:text-sm text-slate-500 font-medium tracking-wide mt-2 mb-4 sm:mb-5'>
                                    Plataforma integral de supervisión empresarial
                                </p>

                                {/* Stats */}
                                <div className='relative z-10 grid grid-cols-3 gap-2 sm:gap-3'>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-[#f8f3e6] to-[#f4edda] p-3 sm:p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-xl sm:text-2xl font-bold text-[#29c50c]'>24/7</p>
                                        <p className='mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500'>Cobertura</p>
                                    </div>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-[#f8f3e6] to-[#f4edda] p-3 sm:p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-xl sm:text-2xl font-bold text-[#29c50c]'>365</p>
                                        <p className='mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500'>Días al año</p>
                                    </div>
                                    <div className='rounded-xl border border-[#dde8d0] bg-gradient-to-b from-[#f8f3e6] to-[#f4edda] p-3 sm:p-4 text-center transition-transform hover:scale-[1.03]'>
                                        <p className='text-xl sm:text-2xl font-bold text-[#29c50c]'>100%</p>
                                        <p className='mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500'>Objetivo</p>
                                    </div>
                                </div>

                                {/* Decorative dots */}
                                <div className='absolute -bottom-3 -right-3 w-24 h-24 opacity-[0.04]'>
                                    <svg viewBox='0 0 100 100' fill='currentColor' className='text-[#29c50c]'>
                                        {[...Array(25)].map((_, i) => <circle key={i} cx={10 + (i % 5) * 20} cy={10 + Math.floor(i / 5) * 20} r='3' />)}
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>

                    {/* Animated company stats counter */}
                    <RevealBlock delay={300} className='max-w-6xl mx-auto mt-12 sm:mt-16'>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'>
                            {companyStats.map((stat) => (
                                <div key={stat.label} className='rounded-xl border border-[#d4dec8]/60 bg-[#faf5ea]/70 backdrop-blur-sm p-4 sm:p-5 text-center transition-all hover:bg-[#f7f2e4] hover:shadow-md'>
                                    <p className='text-2xl sm:text-3xl md:text-4xl font-bold text-[#29c50c]'>
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </p>
                                    <p className='mt-1 text-xs sm:text-sm text-slate-600'>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                {/* ── SOBRE AMAZONAS365 ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 bg-[#f7f2e4]'>
                    <RevealBlock className='max-w-6xl mx-auto'>
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
                            <div className='space-y-5'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#c8ddb4] bg-[#f2ead8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#29c50c]'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' /></svg>
                                    Quiénes somos
                                </span>

                                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 leading-tight'>
                                    Amazonas365: supervisión empresarial que transforma operaciones
                                </h2>

                                <p className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                                    Somos una empresa especializada en <strong className='text-slate-700'>gestión y gerencia remota</strong> para negocios que necesitan control operativo continuo. Desde nuestra fundación, hemos ayudado a decenas de empresas en sectores como restaurantes, franquicias y retail a alcanzar estándares de excelencia en su operación diaria.
                                </p>

                                <p className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                                    Nuestro equipo trabaja <strong className='text-slate-700'>los 365 días del año, las 24 horas</strong>, monitoreando procesos clave, detectando desviaciones en tiempo real y entregando información accionable para que cada decisión cuente.
                                </p>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2'>
                                    {['Supervisión operativa remota', 'Análisis de datos en tiempo real', 'Equipos dedicados por cuenta', 'Reportes de gestión ejecutivos'].map((item) => (
                                        <div key={item} className='flex items-center gap-2'>
                                            <span className='flex-shrink-0 w-5 h-5 rounded-full bg-[#f2ead8] flex items-center justify-center'>
                                                <svg className='w-3 h-3 text-[#29c50c]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            <span className='text-sm text-slate-700'>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Company values card */}
                            <div className='relative'>
                                <div className='absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#d9a441]/12 via-[#b5763b]/6 to-transparent blur-xl pointer-events-none' />
                                <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-gradient-to-br from-[#f6efdf] via-[#f8f3e6] to-[#efe7d4] p-5 sm:p-6 md:p-8 space-y-5 shadow-lg'>
                                    <div className='flex justify-center'>
                                        <Image src='/RBG-Logo-AMAZONAS 365-Original.png' width={280} height={180} alt='Logo Amazonas365' className='w-full max-w-[200px] sm:max-w-[240px] h-auto object-contain' />
                                    </div>

                                    <div className='space-y-3'>
                                        <div className='rounded-xl border border-[#dde8d0] bg-[#f7f2e4] p-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center'>
                                                    <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z' /><path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                                                </div>
                                                <div>
                                                    <p className='text-sm font-bold text-slate-800'>Nuestra misión</p>
                                                    <p className='text-xs text-slate-600'>Elevar el estándar operativo de cada empresa que acompañamos</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='rounded-xl border border-[#dde8d0] bg-[#f7f2e4] p-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center'>
                                                    <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' /></svg>
                                                </div>
                                                <div>
                                                    <p className='text-sm font-bold text-slate-800'>Nuestro enfoque</p>
                                                    <p className='text-xs text-slate-600'>Datos en tiempo real + acción inmediata = resultados medibles</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='rounded-xl border border-[#dde8d0] bg-[#f7f2e4] p-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center'>
                                                    <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' /></svg>
                                                </div>
                                                <div>
                                                    <p className='text-sm font-bold text-slate-800'>Nuestro compromiso</p>
                                                    <p className='text-xs text-slate-600'>Cobertura 24/7 los 365 días con equipos dedicados</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                {/* ── SERVICIOS ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-[#f7f2e4] p-5 sm:p-6 md:p-8'>
                        <div className='text-center max-w-2xl mx-auto'>
                            <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>Nuestros servicios</h2>
                            <p className='mt-2 text-sm sm:text-base text-slate-600'>
                                Diseñados para acompañar el seguimiento de gestión empresarial con foco en resultados medibles.
                            </p>
                        </div>

                        <div className='mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            {services.map((service, idx) => (
                                <RevealBlock key={service.title} delay={idx * 100}>
                                    <article className='group rounded-xl border border-slate-200 bg-[#fbf6ea] p-5 sm:p-6 transition-all hover:border-[#29c50c]/30 hover:shadow-md hover:-translate-y-0.5 h-full'>
                                        <div className='w-11 h-11 rounded-xl bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform'>
                                            {service.icon}
                                        </div>
                                        <h3 className='text-base sm:text-lg font-semibold text-slate-800'>{service.title}</h3>
                                        <p className='mt-2 text-sm leading-relaxed text-slate-600'>{service.description}</p>
                                    </article>
                                </RevealBlock>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                {/* ── BENEFICIOS + INDICADORES ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-12 sm:pb-16'>
                    <RevealBlock className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5'>
                        <div className='lg:col-span-3 rounded-2xl border border-slate-200 bg-[#f7f2e4] p-5 sm:p-6 md:p-8'>
                            <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>¿Por qué empresas confían en Amazonas365?</h2>
                            <ul className='mt-5 space-y-3'>
                                {benefits.map((benefit, idx) => (
                                    <li key={benefit} className='flex items-start gap-3 text-sm sm:text-base text-slate-700'>
                                        <span className='flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[#f2ead8] flex items-center justify-center text-xs font-bold text-[#29c50c]'>{idx + 1}</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <aside className='lg:col-span-2 rounded-2xl border border-slate-200 bg-[#f4edda] p-5 sm:p-6 md:p-8'>
                            <h3 className='text-lg font-bold text-slate-800'>Indicadores de referencia</h3>
                            <div className='mt-4 space-y-3'>
                                <div className='rounded-lg border border-[#dce8d4] bg-[#f7f2e4] p-3 sm:p-4'>
                                    <p className='text-xs uppercase text-slate-500'>Atención de mesa</p>
                                    <p className='text-xl font-bold text-[#29c50c]'>2–3 mins</p>
                                </div>
                                <div className='rounded-lg border border-[#dce8d4] bg-[#f7f2e4] p-3 sm:p-4'>
                                    <p className='text-xs uppercase text-slate-500'>Servicio de plato</p>
                                    <p className='text-xs sm:text-sm font-semibold text-slate-700'>Entrada 8 mins · Principal 15 mins · Postre 5 mins</p>
                                </div>
                                <div className='rounded-lg border border-[#dce8d4] bg-[#f7f2e4] p-3 sm:p-4'>
                                    <p className='text-xs uppercase text-slate-500'>Limpieza de mesa</p>
                                    <p className='text-xl font-bold text-[#29c50c]'>3–4 mins</p>
                                </div>
                            </div>
                        </aside>
                    </RevealBlock>
                </section>

                {/* ── PANEL VISUAL DE GESTIÓN (GRÁFICAS) ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-12 sm:pb-14'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-[#e3d8c0] bg-gradient-to-br from-[#f8f3e6] via-[#f4edda] to-[#efe7d4] p-5 sm:p-6 md:p-8 overflow-hidden relative shadow-[0_24px_48px_-20px_rgba(120,90,40,0.20),0_0_30px_-14px_rgba(217,164,65,0.25)]'>
                        {/* Franja superior de acento (verde→dorado→cobre) */}
                        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#29c50c] via-[#d9a441] to-[#b5763b]' />
                        {/* Glows ambientales tipo trazado de rayos */}
                        <div className='absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle,rgba(41,197,12,0.16),transparent_70%)] -translate-y-1/3 translate-x-1/4 pointer-events-none' />
                        <div className='absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle,rgba(217,164,65,0.12),transparent_70%)] translate-y-1/3 -translate-x-1/4 pointer-events-none' />

                        <div className='relative'>
                            <div className='text-center max-w-2xl mx-auto mb-6 sm:mb-8'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#29c50c]/40 bg-[#29c50c]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#2e8b3e] mb-4'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' /></svg>
                                    Panel analítico
                                </span>
                                <h2 className='text-2xl sm:text-3xl font-bold text-[#3a3526]'>Panel visual de gestión</h2>
                                <p className='mt-2 text-sm sm:text-base text-[#6b6450]'>
                                    Visualiza tendencias, rendimiento por área y distribución del esfuerzo operativo para decisiones más rápidas.
                                </p>
                            </div>

                            {/* KPI Highlight Cards */}
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8'>
                                {kpiHighlights.map((kpi, idx) => (
                                    <RevealBlock key={kpi.label} delay={idx * 100}>
                                        <div className='rounded-xl border border-[#e6dcc6] bg-[#fdfaf2] p-4 sm:p-5 flex items-center gap-4 transition-all hover:bg-[#f7f2e4] hover:border-[#29c50c]/30 hover:-translate-y-0.5' style={{ boxShadow: `0 10px 26px -16px ${kpi.color}70` }}>
                                            <div className='flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl' style={{ background: `linear-gradient(135deg, ${kpi.color}, ${kpi.color}aa)`, boxShadow: `0 0 18px -2px ${kpi.color}` }}>
                                                {kpi.value}
                                            </div>
                                            <div className='min-w-0'>
                                                <p className='text-sm font-semibold text-[#3a3526] truncate'>{kpi.label}</p>
                                                <p className='text-xs font-bold flex items-center gap-1' style={{ color: kpi.color }}>
                                                    <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25' /></svg>
                                                    {kpi.trend} vs periodo anterior
                                                </p>
                                            </div>
                                        </div>
                                    </RevealBlock>
                                ))}
                            </div>

                            {/* Charts Grid - Fully responsive */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
                                <RevealBlock delay={100} className='rounded-xl border border-[#e6dcc6] bg-[#fbf6ea] p-4 sm:p-5'>
                                    <div className='flex items-center justify-between mb-2'>
                                        <h3 className='text-sm font-semibold text-[#3a3526]'>Tendencia mensual de control (%)</h3>
                                        <span className='hidden sm:inline-flex items-center rounded-full bg-[#29c50c]/15 border border-[#29c50c]/30 px-2 py-0.5 text-[10px] font-bold text-[#2e8b3e]'>+18%</span>
                                    </div>
                                    <div className='w-full overflow-x-auto'>
                                        <div className='min-w-[280px]'>
                                            <LineChart
                                                height={240}
                                                xAxis={[{ scaleType: 'point', data: monthlyControlLabels }]}
                                                series={[{ data: monthlyControlData, label: 'Eficacia', color: '#29c50c', area: true }]}
                                                grid={{ horizontal: true }}
                                                sx={{
                                                    ...chartAxisSx,
                                                    '& .MuiAreaElement-root': { fillOpacity: 0.16, filter: 'drop-shadow(0 4px 10px rgba(41,197,12,0.4))' },
                                                    '& .MuiLineElement-root': { strokeWidth: 3, filter: 'drop-shadow(0 0 6px rgba(41,197,12,0.7))' },
                                                    '& .MuiMarkElement-root': { fill: '#29c50c', stroke: '#eaffe0' },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </RevealBlock>

                                <RevealBlock delay={200} className='rounded-xl border border-[#e6dcc6] bg-[#fbf6ea] p-4 sm:p-5'>
                                    <div className='flex items-center justify-between mb-2'>
                                        <h3 className='text-sm font-semibold text-[#3a3526]'>Rendimiento por área</h3>
                                        <span className='hidden sm:inline-flex items-center rounded-full bg-[#d9a441]/15 border border-[#d9a441]/30 px-2 py-0.5 text-[10px] font-bold text-[#e7c98e]'>Promedio: 83</span>
                                    </div>
                                    <div className='w-full overflow-x-auto'>
                                        <div className='min-w-[280px]'>
                                            <BarChart
                                                height={240}
                                                xAxis={[{ scaleType: 'band', data: operationalGains.map((item) => item.area), colorMap: { type: 'ordinal', colors: chartColors } }]}
                                                series={[{ data: operationalGains.map((item) => item.value), label: 'Score' }]}
                                                grid={{ horizontal: true }}
                                                borderRadius={7}
                                                sx={{
                                                    ...chartAxisSx,
                                                    '& .MuiBarElement-root': { filter: 'drop-shadow(0 4px 7px rgba(120,90,40,0.22))' },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </RevealBlock>

                                <RevealBlock delay={300} className='md:col-span-2 rounded-xl border border-[#e6dcc6] bg-[#fbf6ea] p-4 sm:p-5'>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center'>
                                        <div>
                                            <h3 className='text-sm font-semibold text-[#3a3526] mb-1'>Distribución de gestión</h3>
                                            <p className='text-xs text-[#6b6450] mb-3'>Cómo se distribuye el esfuerzo operativo del equipo de supervisión.</p>
                                            <div className='space-y-2'>
                                                {resourceDistribution.map((item) => (
                                                    <div key={item.label} className='flex items-center gap-2'>
                                                        <div className='w-3 h-3 rounded-full' style={{ backgroundColor: chartColors[item.id], boxShadow: `0 0 8px ${chartColors[item.id]}` }} />
                                                        <span className='text-xs text-[#5a5440] flex-1'>{item.label}</span>
                                                        <span className='text-xs font-bold text-[#3a3526]'>{item.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className='w-full overflow-x-auto flex justify-center'>
                                            <div className='min-w-[220px] max-w-[320px] w-full'>
                                                <PieChart
                                                    height={220}
                                                    series={[
                                                        {
                                                            data: resourceDistribution.map((item) => ({
                                                                ...item,
                                                                color: chartColors[item.id],
                                                            })),
                                                            innerRadius: 45,
                                                            outerRadius: 82,
                                                            paddingAngle: 3,
                                                            cornerRadius: 4,
                                                            cx: 95,
                                                            cy: 100,
                                                        },
                                                    ]}
                                                    sx={{
                                                        ...chartAxisSx,
                                                        '& .MuiChartsLegend-root': { display: 'none' },
                                                        '& .MuiPieArc-root': { stroke: 'rgba(248,243,230,0.85)', strokeWidth: 1.5 },
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </RevealBlock>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                {/* ── Reportes365 Section ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-[#c8ddb4] bg-gradient-to-br from-[#f6efdf] via-[#f8f3e6] to-[#efe7d4] p-5 sm:p-6 md:p-10 overflow-hidden relative'>
                        {/* Decorative background shapes */}
                        <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#29c50c]/[0.05] to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none' />
                        <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#7bd42a]/[0.05] to-transparent rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none' />

                        <div className='relative grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center'>
                            {/* Left — Info */}
                            <div className='space-y-4 sm:space-y-5'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#c8ddb4] bg-[#f2ead8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#29c50c]'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                                    Nueva plataforma
                                </span>

                                <h2 className='text-2xl sm:text-3xl font-bold text-slate-800 leading-tight'>
                                    Reportes365: documenta y gestiona con precisión
                                </h2>

                                <p className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                                    Nuestra plataforma de reportes te permite crear, editar y entregar documentos de gestión directamente desde la operación.
                                    Conecta supervisión, evidencia y análisis en un solo lugar para decisiones más rápidas.
                                </p>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'>
                                    {['Reportes de novedades', 'Documentos configurables', 'Exportación a PDF', 'Gestión en tiempo real'].map((feat) => (
                                        <div key={feat} className='flex items-start gap-2'>
                                            <span className='mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#f2ead8] flex items-center justify-center'>
                                                <svg className='w-3 h-3 text-[#29c50c]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            <span className='text-sm text-slate-700'>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href='https://jarvis365reporte.netlify.app/'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center justify-center sm:justify-start gap-2 rounded-xl bg-[#29c50c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f9a08] transition-all hover:shadow-lg hover:shadow-[#d9a441]/40 hover:-translate-y-0.5 w-full sm:w-auto'
                                >
                                    Ir a Reportes365
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3' /></svg>
                                </a>
                            </div>

                            {/* Right — Visual preview card */}
                            <div className='relative'>
                                <div className='absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#d9a441]/12 via-[#b5763b]/6 to-transparent blur-xl pointer-events-none' />
                                <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-[#faf5ea]/90 backdrop-blur-md shadow-[0_20px_50px_rgba(31,154,8,0.10)] p-4 sm:p-6 space-y-3 sm:space-y-4'>
                                    {/* Mock header */}
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center shadow-md'>
                                            <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                                        </div>
                                        <div>
                                            <p className='text-sm font-bold text-slate-800'>Reportes365</p>
                                            <p className='text-xs text-slate-500'>Plataforma de documentos</p>
                                        </div>
                                        <span className='ml-auto inline-flex items-center rounded-full bg-[#f2ead8] px-2.5 py-0.5 text-[10px] font-bold text-[#29c50c] uppercase tracking-wide'>Activo</span>
                                    </div>

                                    {/* Mock document rows */}
                                    <div className='space-y-2.5'>
                                        {['Reporte de novedades — Sede Norte', 'Informe mensual — Operaciones', 'Documento de entrega — Turno AM'].map((doc, idx) => (
                                            <div key={idx} className='flex items-center gap-3 rounded-lg border border-slate-100 bg-[#fbf6ea] px-3 py-2.5'>
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#29c50c]' : idx === 1 ? 'bg-[#d9a441]' : 'bg-slate-300'}`} />
                                                <p className='text-xs text-slate-600 flex-1'>{doc}</p>
                                                <svg className='w-3.5 h-3.5 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' /></svg>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock stats bar */}
                                    <div className='flex gap-3 pt-2 border-t border-slate-100'>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#29c50c]'>12</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Creados</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#d9a441]'>3</p>
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
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='relative max-w-6xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-[#c8ddb4]/50 bg-gradient-to-br from-[#f5eedd] via-[#f8f3e6] to-[#f2ead8] p-5 sm:p-6 md:p-10 lg:p-14'>
                        {/* Decorative shapes */}
                        <div className='absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#29c50c]/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none' />
                        <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#7bd42a]/[0.05] to-transparent rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none' />

                        <div className='relative grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center'>
                            {/* Left — Info */}
                            <div className='space-y-4 sm:space-y-5'>
                                <span className='inline-flex items-center gap-2 rounded-full border border-[#c8ddb4] bg-[#f2ead8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#29c50c]'>
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' /></svg>
                                    Plataforma operativa
                                </span>

                                <h2 className='text-2xl sm:text-3xl font-bold text-slate-800 leading-tight'>
                                    JarvisExpress: control operativo en tiempo real
                                </h2>

                                <p className='text-sm sm:text-base text-slate-600 leading-relaxed'>
                                    La plataforma que conecta cada punto de operación con supervisión en vivo.
                                    Gestiona alertas, novedades, multimedia y estándares de calidad desde un único panel intuitivo y rápido.
                                </p>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'>
                                    {['Alertas en tiempo real', 'Bandeja multimedia', 'Arrastrar y soltar imágenes', 'Estándares de calidad'].map((feat) => (
                                        <div key={feat} className='flex items-start gap-2'>
                                            <span className='mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#f2ead8] flex items-center justify-center'>
                                                <svg className='w-3 h-3 text-[#29c50c]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            <span className='text-sm text-slate-700'>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href='https://jarvis-express.netlify.app/'
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center justify-center sm:justify-start gap-2 rounded-xl bg-[#29c50c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f9a08] transition-all hover:shadow-lg hover:shadow-[#d9a441]/40 hover:-translate-y-0.5 w-full sm:w-auto'
                                >
                                    Ir a JarvisExpress
                                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3' /></svg>
                                </a>
                            </div>

                            {/* Right — Visual preview card */}
                            <div className='relative'>
                                <div className='absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#d9a441]/12 via-[#b5763b]/6 to-transparent blur-xl pointer-events-none' />
                                <div className='relative rounded-2xl border border-[#d4dec8]/60 bg-[#faf5ea]/90 backdrop-blur-md shadow-[0_20px_50px_rgba(31,154,8,0.10)] p-4 sm:p-6 space-y-3 sm:space-y-4'>
                                    {/* Mock header */}
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center shadow-md'>
                                            <svg className='w-5 h-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' /></svg>
                                        </div>
                                        <div>
                                            <p className='text-sm font-bold text-slate-800'>JarvisExpress</p>
                                            <p className='text-xs text-slate-500'>Panel de operaciones</p>
                                        </div>
                                        <span className='ml-auto inline-flex items-center rounded-full bg-[#f2ead8] px-2.5 py-0.5 text-[10px] font-bold text-[#29c50c] uppercase tracking-wide'>En línea</span>
                                    </div>

                                    {/* Mock operations feed */}
                                    <div className='space-y-2.5'>
                                        {[
                                            { label: 'Alerta — Novedad sede Centro', color: 'bg-red-400' },
                                            { label: 'Imagen recibida — Turno PM', color: 'bg-[#29c50c]' },
                                            { label: 'Calidad aprobada — Cocina Norte', color: 'bg-[#d9a441]' },
                                        ].map((item, idx) => (
                                            <div key={idx} className='flex items-center gap-3 rounded-lg border border-slate-100 bg-[#fbf6ea] px-3 py-2.5'>
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                <p className='text-xs text-slate-600 flex-1'>{item.label}</p>
                                                <svg className='w-3.5 h-3.5 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' /></svg>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock stats bar */}
                                    <div className='flex gap-3 pt-2 border-t border-slate-100'>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#29c50c]'>24</p>
                                            <p className='text-[10px] text-slate-500 uppercase'>Alertas</p>
                                        </div>
                                        <div className='flex-1 text-center'>
                                            <p className='text-lg font-bold text-[#d9a441]'>8</p>
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

                {/* ── CÓMO TRABAJAMOS ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-[#f7f2e4] p-5 sm:p-6 md:p-8'>
                        <div className='text-center max-w-2xl mx-auto'>
                            <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>Cómo trabajamos</h2>
                            <p className='mt-2 text-sm sm:text-base text-slate-600'>
                                Un método simple y disciplinado para convertir datos operativos en decisiones de gestión.
                            </p>
                        </div>

                        <div className='mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                            {processSteps.map((item, idx) => (
                                <RevealBlock key={item.step} delay={idx * 120}>
                                    <article className='relative rounded-xl border border-slate-200 bg-[#fbf6ea] p-5 h-full transition-all hover:border-[#29c50c]/30 hover:shadow-md'>
                                        <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#29c50c] to-[#5cc41f] flex items-center justify-center text-white text-sm font-bold mb-3'>
                                            {item.step}
                                        </div>
                                        <h3 className='text-sm sm:text-base font-semibold text-slate-800'>{item.title}</h3>
                                        <p className='mt-2 text-sm leading-relaxed text-slate-600'>{item.description}</p>
                                    </article>
                                </RevealBlock>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                {/* ── SECTORES + IMPACTO ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5'>
                        <div className='rounded-2xl border border-slate-200 bg-[#f7f2e4] p-5 sm:p-6 md:p-8'>
                            <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>Sectores que atendemos</h2>
                            <p className='mt-2 text-sm sm:text-base text-slate-600'>
                                Adaptamos el seguimiento de gestión al contexto operativo y estándar de cada industria.
                            </p>
                            <ul className='mt-5 space-y-3'>
                                {sectors.map((sector, idx) => (
                                    <li key={sector} className='flex items-center gap-3 rounded-lg border border-slate-200 bg-[#fbf6ea] px-4 py-3 text-sm text-slate-700 transition-all hover:border-[#29c50c]/30 hover:bg-[#f5eedd]'>
                                        <span className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#29c50c]/10 to-[#7bd42a]/10 flex items-center justify-center text-xs font-bold text-[#29c50c]'>{String(idx + 1).padStart(2, '0')}</span>
                                        {sector}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='rounded-2xl border border-[#dbe8ce] bg-gradient-to-br from-[#f6efdf] to-[#ece2cd] p-5 sm:p-6 md:p-8'>
                            <h3 className='text-lg sm:text-xl font-bold text-slate-800'>Impacto en gestión</h3>
                            <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                <div className='rounded-lg border border-[#d9e5cd] bg-[#f7f2e4] p-4 transition-all hover:shadow-md'>
                                    <p className='text-xs text-slate-500 uppercase'>Control operativo</p>
                                    <p className='mt-1 text-base sm:text-lg font-bold text-[#29c50c]'>En tiempo real</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-[#f7f2e4] p-4 transition-all hover:shadow-md'>
                                    <p className='text-xs text-slate-500 uppercase'>Cobertura</p>
                                    <p className='mt-1 text-base sm:text-lg font-bold text-[#29c50c]'>24/7 · 365</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-[#f7f2e4] p-4 transition-all hover:shadow-md'>
                                    <p className='text-xs text-slate-500 uppercase'>Reportes</p>
                                    <p className='mt-1 text-base sm:text-lg font-bold text-[#29c50c]'>Objetivos y claros</p>
                                </div>
                                <div className='rounded-lg border border-[#d9e5cd] bg-[#f7f2e4] p-4 transition-all hover:shadow-md'>
                                    <p className='text-xs text-slate-500 uppercase'>Decisiones</p>
                                    <p className='mt-1 text-base sm:text-lg font-bold text-[#29c50c]'>Más rápidas</p>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </section>

                {/* ── FAQ ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-10 sm:pb-12'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-[#f7f2e4] p-5 sm:p-6 md:p-8'>
                        <div className='text-center max-w-2xl mx-auto mb-5 sm:mb-6'>
                            <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>Preguntas frecuentes</h2>
                            <p className='mt-2 text-sm sm:text-base text-slate-600'>
                                Resolvemos las dudas más comunes sobre nuestros servicios de supervisión empresarial.
                            </p>
                        </div>
                        <div className='space-y-3 max-w-3xl mx-auto'>
                            {faqs.map((faq, idx) => (
                                <RevealBlock key={faq.question} delay={idx * 100}>
                                    <article className='rounded-xl border border-slate-200 bg-[#fbf6ea] p-4 sm:p-5 transition-all hover:border-[#29c50c]/20 hover:shadow-sm'>
                                        <div className='flex items-start gap-3'>
                                            <span className='flex-shrink-0 w-6 h-6 rounded-full bg-[#f2ead8] flex items-center justify-center mt-0.5'>
                                                <svg className='w-3.5 h-3.5 text-[#29c50c]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                                            </span>
                                            <div>
                                                <h3 className='text-sm sm:text-base font-semibold text-slate-800'>{faq.question}</h3>
                                                <p className='mt-2 text-sm text-slate-600 leading-relaxed'>{faq.answer}</p>
                                            </div>
                                        </div>
                                    </article>
                                </RevealBlock>
                            ))}
                        </div>
                    </RevealBlock>
                </section>

                {/* ── CTA FINAL ── */}
                <section className='w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-12 sm:pb-16'>
                    <RevealBlock className='max-w-6xl mx-auto rounded-2xl border border-[#cfe0bc] bg-gradient-to-br from-[#f5eedd] via-[#f2ead8] to-[#e6dcc4] p-6 sm:p-8 md:p-10 overflow-hidden relative'>
                        <div className='absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#29c50c]/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none' />
                        <div className='relative flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 text-center lg:text-left'>
                            <div className='space-y-2'>
                                <h2 className='text-2xl sm:text-3xl font-bold text-slate-800'>Haz más eficiente la gestión de tu empresa</h2>
                                <p className='text-sm sm:text-base text-slate-600 max-w-xl'>
                                    Conecta supervisión, análisis y ejecución en una sola herramienta para operar con más control y confianza.
                                </p>
                            </div>
                            <a
                                href='https://api.whatsapp.com/send?phone=13038757299&text=%C2%A1Hello!%20I%20want%20more%20info%20about%20%40amazonas365_%20'
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#29c50c] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white hover:bg-[#1f9a08] transition-all hover:shadow-lg hover:shadow-[#d9a441]/40 hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto'
                            >
                                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' /></svg>
                                Solicitar asesoría
                            </a>
                        </div>
                    </RevealBlock>
                </section>
            </main>

            <Footer />
        </>
    );
}