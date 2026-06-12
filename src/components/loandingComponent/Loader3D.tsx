'use client';
import Image from 'next/image';

/**
 * Loader3D — Pantalla de carga minimalista y corporativa.
 * Fondo claro, una tuerca/engranaje grande en líneas grises (sin relleno) girando
 * y ocupando la mitad superior, barra de carga y el logo de AMAZONAS 365 en una esquina.
 */
export default function Loader3D({ title = 'Cargando...' }: { title?: string }) {
    return (
        <div className="ld3d-root">
            {/* Tuerca / engranaje en silueta (solo líneas) */}
            <div className='w-full h-full flex justify-center items-center flex-col'> 

                <div className="ld3d-gear-wrap">
                    <svg className="ld3d-gear" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="ld3dSteel" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stopColor="#c4ccd4" />
                                <stop offset="0.5" stopColor="#8b949d" />
                                <stop offset="1" stopColor="#5f676e" />
                            </linearGradient>
                        </defs>

                        {/* Engranaje principal */}
                        <g
                            className="ld3d-gear-spin"
                            fill="none"
                            stroke="url(#ld3dSteel)"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M87.30 42.75 L95.79 45.59 L95.79 54.41 L87.30 57.25 L84.44 66.06 L89.63 73.35 L84.45 80.48 L75.92 77.79 L68.42 83.24 L68.34 92.18 L59.96 94.91 L54.63 87.72 L45.37 87.72 L40.04 94.91 L31.66 92.18 L31.58 83.24 L24.08 77.79 L15.55 80.48 L10.37 73.35 L15.56 66.06 L12.70 57.25 L4.21 54.41 L4.21 45.59 L12.70 42.75 L15.56 33.94 L10.37 26.65 L15.55 19.52 L24.08 22.21 L31.58 16.76 L31.66 7.82 L40.04 5.09 L45.37 12.28 L54.63 12.28 L59.96 5.09 L68.34 7.82 L68.42 16.76 L75.92 22.21 L84.45 19.52 L89.63 26.65 L84.44 33.94 Z" />
                            <circle cx="50" cy="50" r="20" />
                        </g>

                        {/* Anillo interior punteado girando en sentido contrario (detalle moderno) */}
                        <circle
                            className="ld3d-gear-inner"
                            cx="50" cy="50" r="12"
                            fill="none"
                            stroke="#aab2ba"
                            strokeWidth="1.4"
                            strokeDasharray="3 5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                {/* Barra de carga + texto */}
                <div className="ld3d-meta">
                    <div className="ld3d-bar"><span /></div>
                    <p className="ld3d-title">{title}</p>
                </div>
            </div>
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

            <style>{`
                .ld3d-root{
                    position:fixed; inset:0; z-index:1000;
                    display:flex; flex-direction:column; align-items:center;
                    justify-content:flex-start;
                    background:linear-gradient(180deg,#fbfcfd 0%,#eef1f4 100%);
                    font-family:'Roboto', system-ui, sans-serif;
                }

                /* Tuerca grande ocupando la mitad superior */
                .ld3d-gear-wrap{
           
                    display:flex; align-items:center; justify-content:center;
                }
                .ld3d-gear{
                   width:190px; height:190px;
                    filter:drop-shadow(0 10px 22px rgba(95,103,110,.22));
                    overflow:visible;
                }
                .ld3d-gear-spin{
                    transform-origin:50px 50px;
                    animation:ld3d-spin 9s linear infinite;
                }
                .ld3d-gear-inner{
                    transform-origin:50px 50px;
                    animation:ld3d-spin-rev 6s linear infinite;
                }
                @keyframes ld3d-spin{ to{ transform:rotate(360deg); } }
                @keyframes ld3d-spin-rev{ to{ transform:rotate(-360deg); } }

                /* Barra de carga + texto */
                .ld3d-meta{
                    display:flex; flex-direction:column; align-items:center; gap:16px;
                    margin-top:8px;
                }
                .ld3d-bar{
                    width:220px; height:5px; border-radius:99px; overflow:hidden;
                    background:#e2e6ea;
                    box-shadow:inset 0 1px 2px rgba(0,0,0,.06);
                }
                .ld3d-bar span{
                    display:block; width:42%; height:100%; border-radius:99px;
                    background:linear-gradient(90deg,#2e8b3e,#8cc63f);
                    box-shadow:0 0 10px rgba(140,198,63,.5);
                    animation:ld3d-bar 1.4s ease-in-out infinite;
                }
                @keyframes ld3d-bar{
                    0%{ transform:translateX(-115%); }
                    100%{ transform:translateX(340%); }
                }
                .ld3d-title{
                    margin:0; color:#8a929a; font-size:.82rem; font-weight:500;
                    letter-spacing:.18em; text-transform:uppercase;
                    animation:ld3d-fade 1.6s ease-in-out infinite;
                }
                @keyframes ld3d-fade{ 0%,100%{ opacity:.45; } 50%{ opacity:1; } }

                /* Logo en la esquina inferior derecha */
                .ld3d-brand{ position:fixed; right:28px; bottom:24px; }
                .ld3d-logo{ width:190px; height:auto; max-width:200px; object-fit:contain; opacity:.92; }

                @media (max-width:600px){
                    .ld3d-gear-wrap{ height:46vh; }
                    .ld3d-gear{ height:min(40vh, 80vw); }
                    .ld3d-brand{ right:50%; transform:translateX(50%); bottom:20px; }
                }

                @media (prefers-reduced-motion: reduce){
                    .ld3d-gear-spin{ animation:ld3d-spin 18s linear infinite; }
                    .ld3d-gear-inner{ animation:none; }
                }
            `}</style>
        </div>
    );
}
