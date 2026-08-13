'use client';

import { useContext, useEffect, useState } from 'react';
import { ImgContext } from '@/contexts/imgContext';

/**
 * Visor de imágenes a pantalla completa, con zoom.
 *
 * PROTECCIÓN CONTRA LA DESCARGA — QUÉ HACE Y QUÉ NO
 *
 * Se cierran todas las vías fáciles de sacar la imagen:
 *
 *   · menú contextual (clic derecho)   → bloqueado en todo el visor
 *   · arrastrar la imagen fuera        → bloqueado en la imagen y en la capa
 *   · clic central (abrir en pestaña)  → bloqueado
 *   · mantener pulsado en móvil        → bloqueado (-webkit-touch-callout)
 *   · seleccionar y copiar             → bloqueado (user-select)
 *   · Ctrl/Cmd+S mientras está abierto → bloqueado
 *
 * Además la imagen se pinta como FONDO de un div, no con una etiqueta <img>.
 * Es la diferencia entre que el navegador ofrezca "Guardar imagen como…" y que
 * no tenga ninguna imagen que ofrecer: sobre un fondo CSS esa opción no existe.
 *
 * LO QUE ESTO NO IMPIDE, Y CONVIENE NO CREER QUE SÍ
 *
 * La imagen ya está descargada en el equipo cuando se ve. Quien quiera puede
 * abrir las herramientas del navegador, mirar la pestaña de red, copiar la
 * dirección y abrirla, o sencillamente hacer una captura de pantalla. Nada de
 * lo de acá lo evita, y ninguna técnica del lado del navegador puede.
 *
 * Esto sube el costo para el usuario común, que es un objetivo legítimo. Lo que
 * de verdad protege una imagen se decide en el servidor: enlaces que caducan,
 * marca de agua, o no entregarla a quien no le corresponde.
 */
export default function ZoomImg() {
    const { src, closeImg } = useContext(ImgContext);
    const [zoom, setZoom] = useState(50);
    const [proporcion, setProporcion] = useState(3 / 2);

    const abierto = Boolean(src);

    // Un fondo CSS no tiene alto propio: hay que dárselo, y con una proporción
    // fija una foto vertical saldría con franjas arriba y abajo. Se lee el
    // tamaño real de la imagen y se usa el suyo.
    //
    // La carga es gratis: el navegador ya la tiene en caché porque el mismo
    // `src` se está pintando de fondo.
    useEffect(() => {
        if (!src) return;

        let vigente = true;
        const img = new Image();
        img.onload = () => {
            if (vigente && img.naturalWidth && img.naturalHeight) {
                setProporcion(img.naturalWidth / img.naturalHeight);
            }
        };
        img.src = src;

        return () => { vigente = false; };
    }, [src]);

    useEffect(() => {
        document.body.style.overflow = abierto ? 'hidden' : 'auto';
    }, [abierto]);

    // Ctrl/Cmd+S guardaría la página entera, y con ella la imagen. Se corta
    // solo mientras el visor está abierto: fuera de acá no hay por qué
    // quitarle al usuario un atajo del navegador.
    //
    // Escape cierra, que es lo que se espera de una capa a pantalla completa.
    useEffect(() => {
        if (!abierto) return;

        const onKey = (e) => {
            if (e.key === 'Escape') { closeImg(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault();
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [abierto, closeImg]);

    const bloquear = (e) => e.preventDefault();

    return (
        <div
            className='boxModal-Component __boxModal-Component-imgZoom scrolltheme1 no-descarga'
            style={{ display: abierto ? 'flex' : 'none' }}
            onContextMenu={bloquear}
            onDragStart={bloquear}
            // Clic central: abriría la imagen en otra pestaña, y desde ahí sí
            // se puede guardar.
            onAuxClick={bloquear}
            onClick={(e) => {
                // Solo cierra al pulsar el fondo, no la imagen ni el control.
                if (e.target === e.currentTarget) closeImg();
            }}
        >
            <label className='label-zoom'>
                Zoom
                <input
                    className='label-zoom-input drag'
                    type='range'
                    value={zoom}
                    min='40'
                    max='200'
                    step={1}
                    onChange={(e) => setZoom(e.target.value)}
                />
            </label>

            {/*
              La imagen va como FONDO, no como <img>. Así el navegador no tiene
              un elemento de imagen que ofrecer al guardar ni que arrastrar.
              `contain` la muestra entera, sin recortar, sea cual sea su forma.
            */}
            <div
                className='img-zoom__lienzo'
                style={{
                    width: `${zoom}%`,
                    aspectRatio: proporcion,
                    backgroundImage: abierto ? `url("${src}")` : 'none',
                }}
                role='img'
                aria-label='Imagen ampliada'
                onContextMenu={bloquear}
                onDragStart={bloquear}
            />
        </div>
    );
}
