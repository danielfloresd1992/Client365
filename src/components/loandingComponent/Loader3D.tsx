'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * Loader3D — Pantalla de carga corporativa renderizada en <canvas>.
 * Paleta: marfil (fondo), verde #29c50c y dorados/cobres como acentos.
 * Una tuerca/engranaje en líneas grises (sin relleno) con iluminación tipo
 * "trazado de rayos": fuente de luz que orbita, sheen metálico que barre el
 * engranaje, god-rays volumétricos, partículas con bloom y barra de carga al centro.
 * Todo lo animado se pinta por frame en el canvas.
 */
export default function Loader3D({ title = 'Cargando...' }: { title?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let w = 0;
        let h = 0;
        let dpr = 1;

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // ---- Paleta corporativa ----
        const C = {
            ivory1: '#f7f2e4',
            ivory2: '#efe7d4',
            green: '#29c50c',
            greenSoft: '#9fe88f',
            gold: '#d9a441',
            goldSoft: '#e7c98e',
            copper: '#b5763b',
            steelLo: '#6b7178',
            steelMid: '#8b949d',
            steelHi: '#cfd6dd',
        };

        // ---- Partículas de polvo que captan la luz ----
        type P = { x: number; y: number; r: number; spd: number; drift: number; tone: string; a: number };
        const tones = [C.goldSoft, C.greenSoft, C.copper, '#ffffff'];
        let particles: P[] = [];
        const seedParticles = () => {
            const n = Math.round((w * h) / 42000);
            particles = Array.from({ length: Math.max(28, Math.min(70, n)) }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.6 + Math.random() * 2.2,
                spd: 6 + Math.random() * 16,
                drift: (Math.random() - 0.5) * 10,
                tone: tones[(Math.random() * tones.length) | 0],
                a: 0.15 + Math.random() * 0.45,
            }));
        };
        seedParticles();

        const teeth = 10;
        const toothHalf = (11 * Math.PI) / 180;
        const hasConic = typeof (ctx as any).createConicGradient === 'function';
        const hasLetterSpacing = 'letterSpacing' in ctx;

        const buildGear = (cx: number, cy: number, rTip: number, rBase: number, rot: number) => {
            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
                const a = rot + ((Math.PI * 2) / teeth) * i;
                const p1a = a - toothHalf;
                const p2a = a - toothHalf / 2;
                const p3a = a + toothHalf / 2;
                const p4a = a + toothHalf;
                const x1 = cx + rBase * Math.cos(p1a), y1 = cy + rBase * Math.sin(p1a);
                const x2 = cx + rTip * Math.cos(p2a), y2 = cy + rTip * Math.sin(p2a);
                const x3 = cx + rTip * Math.cos(p3a), y3 = cy + rTip * Math.sin(p3a);
                const x4 = cx + rBase * Math.cos(p4a), y4 = cy + rBase * Math.sin(p4a);
                if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
            }
            ctx.closePath();
        };

        // Sheen metálico orientado hacia la luz (efecto "trazado de rayos")
        const metalStroke = (cx: number, cy: number, lightDir: number): CanvasGradient | string => {
            if (!hasConic) return C.steelMid;
            const g = (ctx as any).createConicGradient(lightDir, cx, cy) as CanvasGradient;
            g.addColorStop(0.0, C.goldSoft);   // punto caliente (lado iluminado)
            g.addColorStop(0.04, C.steelHi);
            g.addColorStop(0.14, C.steelMid);
            g.addColorStop(0.30, C.steelLo);   // lado en sombra
            g.addColorStop(0.50, C.steelLo);
            g.addColorStop(0.60, C.greenSoft); // destello verde
            g.addColorStop(0.68, C.steelMid);
            g.addColorStop(0.85, C.steelHi);
            g.addColorStop(0.96, C.copper);    // destello cobre
            g.addColorStop(1.0, C.goldSoft);
            return g;
        };

        const start = performance.now();
        let last = start;

        const render = (now: number) => {
            const t = (now - start) / 1000;
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            const cx = w / 2;
            const cy = h / 2;
            const R = Math.min(w, h) * (w < 600 ? 0.32 : 0.26);

            // Fuente de luz que orbita lentamente
            const lx = cx + Math.cos(t * 0.45) * w * 0.22;
            const ly = h * 0.18 + Math.sin(t * 0.6) * h * 0.04;
            const lightDir = Math.atan2(cy - ly, cx - lx);

            // ---- Fondo marfil ----
            const bg = ctx.createRadialGradient(cx, cy * 0.85, R * 0.2, cx, cy, Math.max(w, h) * 0.75);
            bg.addColorStop(0, C.ivory1);
            bg.addColorStop(1, C.ivory2);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            // ---- God-rays volumétricos desde la fuente de luz ----
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.translate(lx, ly);
            const beams = 9;
            for (let i = 0; i < beams; i++) {
                const ang = (Math.PI / 2) + (i - beams / 2) * 0.16 + Math.sin(t * 0.3 + i) * 0.03;
                const len = Math.max(w, h) * 1.1;
                const spread = 26 + i * 4;
                const grd = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
                grd.addColorStop(0, 'rgba(231,201,142,0.10)');
                grd.addColorStop(0.35, 'rgba(217,164,65,0.05)');
                grd.addColorStop(1, 'rgba(217,164,65,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang - 0.02) * len - spread, Math.sin(ang) * len);
                ctx.lineTo(Math.cos(ang + 0.02) * len + spread, Math.sin(ang) * len);
                ctx.closePath();
                ctx.fill();
            }
            // halo de la fuente
            const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
            halo.addColorStop(0, 'rgba(231,201,142,0.5)');
            halo.addColorStop(1, 'rgba(231,201,142,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, 160, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ---- Resplandor ambiental detrás del engranaje ----
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const amb = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
            amb.addColorStop(0, 'rgba(41,197,12,0.10)');
            amb.addColorStop(0.6, 'rgba(217,164,65,0.06)');
            amb.addColorStop(1, 'rgba(217,164,65,0)');
            ctx.fillStyle = amb;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ---- Engranaje principal (solo líneas, con sheen tipo ray-tracing) ----
            const rot = t * 0.35;
            const strokeMetal = metalStroke(cx, cy, lightDir);

            ctx.save();
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(217,164,65,0.35)';
            ctx.shadowBlur = 22;

            // dientes
            buildGear(cx, cy, R, R * 0.82, rot);
            ctx.strokeStyle = strokeMetal;
            ctx.lineWidth = Math.max(2, R * 0.02);
            ctx.stroke();

            // anillo del cubo
            ctx.beginPath();
            ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // perforaciones del cubo (detalle moderno)
            ctx.save();
            ctx.strokeStyle = C.steelMid;
            ctx.lineWidth = Math.max(1.4, R * 0.012);
            for (let i = 0; i < 6; i++) {
                const a = rot + (Math.PI * 2 / 6) * i;
                const hx = cx + Math.cos(a) * R * 0.6;
                const hy = cy + Math.sin(a) * R * 0.6;
                ctx.beginPath();
                ctx.arc(hx, hy, R * 0.045, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // anillo interior punteado en sentido contrario
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-t * 0.5);
            ctx.strokeStyle = 'rgba(41,197,12,0.55)';
            ctx.lineWidth = Math.max(1.2, R * 0.01);
            ctx.setLineDash([R * 0.05, R * 0.08]);
            ctx.beginPath();
            ctx.arc(0, 0, R * 0.28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // chispa especular que recorre el borde del engranaje
            const sparkA = rot + lightDir;
            const sx = cx + Math.cos(sparkA) * R;
            const sy = cy + Math.sin(sparkA) * R;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const spark = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.18);
            spark.addColorStop(0, 'rgba(255,248,225,0.9)');
            spark.addColorStop(0.4, 'rgba(231,201,142,0.5)');
            spark.addColorStop(1, 'rgba(231,201,142,0)');
            ctx.fillStyle = spark;
            ctx.beginPath();
            ctx.arc(sx, sy, R * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ---- Partículas ----
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const p of particles) {
                p.y -= p.spd * dt;
                p.x += p.drift * dt;
                if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                const tw = 0.6 + 0.4 * Math.sin(t * 2 + p.x);
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                g.addColorStop(0, p.tone);
                g.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.globalAlpha = p.a * tw;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // ---- Arco de progreso alrededor de la tuerca ----
            const ringR = R * 1.16;
            const ringW = Math.max(3, R * 0.03);

            // pista tenue
            ctx.save();
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(107,113,120,0.16)';
            ctx.lineWidth = ringW;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // arco luminoso que gira (verde→dorado)
            const arcLen = Math.PI * 0.62;
            const a0 = (t * 1.6) % (Math.PI * 2);
            const a1 = a0 + arcLen;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = ringW;
            const e0x = cx + Math.cos(a0) * ringR, e0y = cy + Math.sin(a0) * ringR;
            const e1x = cx + Math.cos(a1) * ringR, e1y = cy + Math.sin(a1) * ringR;
            const arcG = ctx.createLinearGradient(e0x, e0y, e1x, e1y);
            arcG.addColorStop(0, 'rgba(41,197,12,0)');
            arcG.addColorStop(0.3, C.green);
            arcG.addColorStop(0.8, C.gold);
            arcG.addColorStop(1, 'rgba(217,164,65,0)');
            ctx.strokeStyle = arcG;
            ctx.shadowColor = 'rgba(41,197,12,0.55)';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, a0, a1);
            ctx.stroke();

            // punto guía brillante en la cabeza del arco
            ctx.shadowColor = 'rgba(255,247,224,0.9)';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#fff7e0';
            ctx.beginPath();
            ctx.arc(e1x, e1y, Math.max(2.5, R * 0.024), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ---- Título ----
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '500 13px Roboto, system-ui, sans-serif';
            if (hasLetterSpacing) (ctx as any).letterSpacing = '3px';
            ctx.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2));
            ctx.fillStyle = '#7c7158';
            ctx.fillText(title.toUpperCase(), cx, cy + R * 1.42);
            ctx.restore();

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [title]);

    return (
        <div className="ld3d-root">
            <canvas ref={canvasRef} className="ld3d-canvas" />

            {/* Logo corporativo en la esquina */}
            <div className="ld3d-brand">
                <Image
                    src="/RBG-Logo-AMAZONAS 365-Original.png"
                    width={190}
                    height={86}
                    priority
                    alt="AMAZONAS 365"
                    className="ld3d-logo"
                />
            </div>
        </div>
    );
}
