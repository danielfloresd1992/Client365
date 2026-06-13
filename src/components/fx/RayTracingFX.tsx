'use client';
import { useEffect, useRef } from 'react';

/**
 * RayTracingFX — Capa de fondo en <canvas> con efecto de "trazado de rayos":
 * fuente de luz que orbita, god-rays volumétricos, orbes de luz (bokeh) y
 * partículas que captan la luz. Paleta corporativa: verde #29c50c + dorados/cobres.
 * Pensado para colocarse como fondo absoluto dentro de una sección (pointer-events:none).
 *
 * Se dimensiona a su contenedor padre, respeta prefers-reduced-motion y limita el dpr.
 */
export default function RayTracingFX({
    className = '',
    intensity = 1,
}: { className?: string; intensity?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let w = 0;
        let h = 0;
        let dpr = 1;

        const measure = () => {
            const rect = canvas.getBoundingClientRect();
            w = Math.max(1, rect.width);
            h = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
        };

        // ---- Orbes de luz (bokeh) ----
        type Orb = { x: number; y: number; r: number; hue: string; px: number; py: number; ph: number };
        let orbs: Orb[] = [];
        // ---- Partículas ----
        type P = { x: number; y: number; r: number; spd: number; drift: number; tone: string; a: number };
        let particles: P[] = [];

        const orbColors = ['rgba(41,197,12,', 'rgba(217,164,65,', 'rgba(181,118,59,'];
        const motes = ['rgba(231,201,142,', 'rgba(159,232,143,', 'rgba(255,255,255,'];

        const seed = () => {
            orbs = Array.from({ length: 3 }, (_, i) => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.min(w, h) * (0.18 + Math.random() * 0.16),
                hue: orbColors[i % orbColors.length],
                px: Math.random() * Math.PI * 2,
                py: Math.random() * Math.PI * 2,
                ph: Math.random() * Math.PI * 2,
            }));
            const n = Math.round((w * h) / 26000);
            particles = Array.from({ length: Math.max(18, Math.min(60, n)) }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.6 + Math.random() * 1.8,
                spd: 5 + Math.random() * 14,
                drift: (Math.random() - 0.5) * 8,
                tone: motes[(Math.random() * motes.length) | 0],
                a: 0.12 + Math.random() * 0.35,
            }));
        };

        measure();
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        ro?.observe(canvas);
        window.addEventListener('resize', measure);

        const start = performance.now();
        let last = start;
        let raf = 0;

        const draw = (now: number) => {
            const t = (now - start) / 1000;
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';

            // Fuente de luz que orbita (arriba-derecha)
            const lx = w * (0.72 + Math.cos(t * 0.25) * 0.12);
            const ly = h * (0.1 + Math.sin(t * 0.3) * 0.05);

            // ---- God-rays volumétricos ----
            ctx.save();
            ctx.translate(lx, ly);
            const beams = 8;
            const len = Math.max(w, h) * 1.3;
            for (let i = 0; i < beams; i++) {
                const ang = Math.PI * 0.62 + (i - beams / 2) * 0.14 + Math.sin(t * 0.25 + i) * 0.02;
                const spread = 30 + i * 5;
                const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
                g.addColorStop(0, `rgba(217,164,65,${0.08 * intensity})`);
                g.addColorStop(0.4, `rgba(41,197,12,${0.035 * intensity})`);
                g.addColorStop(1, 'rgba(217,164,65,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang - 0.015) * len - spread, Math.sin(ang) * len);
                ctx.lineTo(Math.cos(ang + 0.015) * len + spread, Math.sin(ang) * len);
                ctx.closePath();
                ctx.fill();
            }
            // halo de la fuente
            const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * 0.35);
            halo.addColorStop(0, `rgba(231,201,142,${0.22 * intensity})`);
            halo.addColorStop(1, 'rgba(231,201,142,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(w, h) * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ---- Orbes de luz (bokeh) ----
            for (const o of orbs) {
                const ox = o.x + Math.cos(t * 0.18 + o.px) * w * 0.06;
                const oy = o.y + Math.sin(t * 0.16 + o.py) * h * 0.06;
                const pulse = 0.7 + 0.3 * Math.sin(t * 0.9 + o.ph);
                const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r * pulse);
                g.addColorStop(0, `${o.hue}${0.1 * intensity})`);
                g.addColorStop(0.6, `${o.hue}${0.04 * intensity})`);
                g.addColorStop(1, `${o.hue}0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(ox, oy, o.r * pulse, 0, Math.PI * 2);
                ctx.fill();
            }

            // ---- Banda de luz diagonal (caustic) que cruza lentamente ----
            const sweep = ((t * 0.06) % 1.4) - 0.2;
            const sx = sweep * w;
            const band = ctx.createLinearGradient(sx - 120, 0, sx + 120, h);
            band.addColorStop(0, 'rgba(255,247,224,0)');
            band.addColorStop(0.5, `rgba(255,247,224,${0.06 * intensity})`);
            band.addColorStop(1, 'rgba(255,247,224,0)');
            ctx.fillStyle = band;
            ctx.fillRect(0, 0, w, h);

            // ---- Partículas ----
            for (const p of particles) {
                if (!reduce) {
                    p.y -= p.spd * dt;
                    p.x += p.drift * dt;
                    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                    if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                }
                const tw = 0.6 + 0.4 * Math.sin(t * 2 + p.x);
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                g.addColorStop(0, `${p.tone}${(p.a * tw * intensity).toFixed(3)})`);
                g.addColorStop(1, `${p.tone}0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalCompositeOperation = 'source-over';

            if (!reduce) raf = requestAnimationFrame(draw);
        };

        raf = requestAnimationFrame(draw);
        // Para reduced-motion: pintar un frame estático
        if (reduce) { cancelAnimationFrame(raf); draw(start); }

        return () => {
            cancelAnimationFrame(raf);
            ro?.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [intensity]);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
