'use client';
import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import type { ImageFile, GalleryItem } from "@/types/dropZone";
import type { Props } from "@/interfaces/IDropZone";


const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


export function DropZoneImage({
    getImageCallback,
    filesLimit = 3,
    maxSizeMB = 10,
    accept = DEFAULT_ACCEPT,
    hint,
    initialImages,
}: Props): JSX.Element {

    const [items, setItems]     = useState<GalleryItem[]>([]);
    const [isDragging, setDrag] = useState<boolean>(false);
    const [error, setError]     = useState<string>('');
    const inputRef              = useRef<HTMLInputElement>(null);

    const maxBytes = maxSizeMB * 1024 * 1024;
    const isFull   = items.length >= filesLimit;


    /* ── Sincroniza el resultado dual hacia el padre ──────────────────────── */
    const emit = (list: GalleryItem[], err: string): void => {
        const files: ImageFile[] = [];
        const urls:  string[]    = [];
        for (const it of list) {
            if (it.kind === 'new') files.push({ file: it.file, base64: it.base64 });
            else                   urls.push(it.url);
        }
        getImageCallback({ files, urls }, err);
    };


    /* ── Modo edición: precargar las URLs existentes ──────────────────────── */
    const initialKey = (initialImages ?? []).join('||');
    useEffect(() => {
        const existing: GalleryItem[] = (initialImages ?? []).map(url => ({ kind: 'existing', url }));
        setItems(existing);
        emit(existing, '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey]);


    /* ── Helpers ───────────────────────────────────────────────────────────── */

    /** Lee un File y lo convierte a data-URL base64. */
    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
            reader.readAsDataURL(file);
        });

    /** Valida tipo (imagen), extensión y peso. Devuelve '' si es válido. */
    const validate = (file: File): string => {
        if (!file.type.startsWith('image/')) return `"${file.name}" no es una imagen.`;
        if (!accept.includes(file.type)) {
            const exts = accept.map(t => t.split('/')[1]).join(', ');
            return `Formato no permitido. Solo: ${exts}.`;
        }
        if (file.size > maxBytes)            return `"${file.name}" supera ${maxSizeMB}MB.`;
        return '';
    };

    /** Procesa archivos nuevos: valida, convierte y actualiza estado + callback. */
    const addFiles = async (files: FileList | File[]): Promise<void> => {
        const incoming = Array.from(files);
        const accepted: GalleryItem[] = [];
        let   err = '';

        for (const file of incoming) {
            if (items.length + accepted.length >= filesLimit) {
                err = `Máximo ${filesLimit} ${filesLimit === 1 ? 'imagen' : 'imágenes'}.`;
                break;
            }
            const invalid = validate(file);
            if (invalid) { err = invalid; continue; }

            try {
                const base64 = await toBase64(file);
                accepted.push({ kind: 'new', file, base64 });
            } catch {
                err = `Error al procesar "${file.name}".`;
            }
        }

        const next = [...items, ...accepted];
        setItems(next);
        setError(err);
        emit(next, err);
    };

    /** Elimina la imagen (nueva o existente) del índice indicado. */
    const removeImage = (index: number): void => {
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        setError('');
        emit(next, '');
    };


    /* ── Eventos (Drag & Drop API + input) ─────────────────────────────────── */
    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!isFull) setDrag(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDrag(false);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = ''; // permite re-seleccionar el mismo archivo
    };


    /* ── Formato de peso legible ───────────────────────────────────────────── */
    const humanSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    /** Nombre legible para una URL existente. */
    const urlName = (url: string): string => {
        try { return decodeURIComponent(url.split('/').pop() || url); }
        catch { return url; }
    };


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <section className='w-full flex flex-col gap-3'>

            {/* Zona de arrastre / click */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isFull && inputRef.current?.click()}
                role='button'
                tabIndex={0}
                aria-disabled={isFull}
                className={`
                    w-full rounded-xl border-2 border-dashed
                    flex flex-col items-center justify-center text-center gap-1
                    px-4 py-6 transition-colors
                    ${isFull
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                        : isDragging
                            ? 'border-emerald-400 bg-emerald-50 cursor-copy'
                            : 'border-slate-300 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer'}
                `}
            >
                <input
                    ref={inputRef}
                    type='file'
                    accept={accept.join(',')}
                    multiple={filesLimit > 1}
                    onChange={handleInputChange}
                    className='hidden'
                    disabled={isFull}
                />

                {/* Icono */}
                <svg
                    className={`w-8 h-8 mb-1 ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`}
                    fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'
                >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
                </svg>

                {isFull ? (
                    <p className='text-sm font-medium text-slate-500'>
                        Límite alcanzado ({filesLimit})
                    </p>
                ) : (
                    <>
                        <p className='text-sm font-medium text-slate-600'>
                            <span className='text-emerald-600'>Arrastra imágenes</span> o haz clic para seleccionar
                        </p>
                        <p className='text-[11px] text-slate-400'>
                            {hint ?? `${accept.map(t => t.split('/')[1].toUpperCase()).join(', ')} · hasta ${maxSizeMB}MB · máx. ${filesLimit}`}
                        </p>
                    </>
                )}
            </div>

            {/* Mensaje de error */}
            {error && (
                <p className='text-xs text-red-500 flex items-center gap-1'>
                    <span>⚠</span> {error}
                </p>
            )}

            {/* Previsualizaciones (existentes + nuevas) */}
            {items.length > 0 && (
                <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                    {items.map((item, index) => {
                        const src     = item.kind === 'new' ? item.base64 : item.url;
                        const name    = item.kind === 'new' ? item.file.name : urlName(item.url);
                        const subInfo = item.kind === 'new' ? humanSize(item.file.size) : 'guardada';

                        return (
                            <div
                                key={item.kind === 'new' ? `new-${name}-${index}` : `url-${item.url}-${index}`}
                                className='group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100'
                            >
                                <img
                                    src={src}
                                    alt={name}
                                    className='w-full h-full object-cover'
                                />

                                {/* Distintivo de imagen ya guardada */}
                                {item.kind === 'existing' && (
                                    <span className='absolute top-1 left-1 text-[8px] font-semibold bg-emerald-500/90 text-white px-1.5 py-[1px] rounded-full'>
                                        guardada
                                    </span>
                                )}

                                {/* Botón eliminar */}
                                <button
                                    type='button'
                                    onClick={() => removeImage(index)}
                                    title='Eliminar imagen'
                                    className='
                                        absolute top-1 right-1 w-6 h-6 rounded-full
                                        bg-black/55 text-white text-sm leading-none
                                        flex items-center justify-center
                                        opacity-0 group-hover:opacity-100
                                        hover:bg-red-500 transition-all
                                    '
                                >
                                    ×
                                </button>

                                {/* Pie: nombre + info */}
                                <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-3 pb-1'>
                                    <p className='text-[9px] text-white/90 truncate'>{name}</p>
                                    <p className='text-[8px] text-white/60'>{subInfo}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
