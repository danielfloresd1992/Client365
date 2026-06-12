'use client';
/**
 * FormManager.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario de creación y edición de gerentes.
 *
 * Modos de operación:
 *   • Crear  → POST /managerlocal   (multipart/form-data — la ruta usa multer)
 *   • Editar → PUT  /managerlocal/id=:id  (JSON)
 *
 * Props:
 *   editData       {object|null}  – Gerente a editar. null = modo creación.
 *   onSave         {function}     – Callback(savedManager, isEdit) al guardar con éxito.
 *   close          {function}     – Cierra el modal.
 *   defaultLocalId {string?}      – Local pre-seleccionado al crear (ej. desde la
 *                                   tarjeta de un establecimiento concreto).
 *
 * Campos del modelo Manager:
 *   burden          (String, required) – cargo / etiqueta del puesto
 *   name            (String)           – nombre completo
 *   numberManager   (Number, required) – número de contacto o identificador
 *   status          (String, required) – 'activo' | 'inactivo'
 *   characteristic  (String, required) – descripción / notas
 *   localName       (ObjectId → Local) – local asignado (enviado como _id)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect }    from 'react';
import { useForm }                from 'react-hook-form';
import { useDispatch }            from 'react-redux';
import { setConfigModal }         from '@/store/slices/globalModal.js';
import Image                      from 'next/image';
import useAxios                   from '@/hook/useAxios';
import { DropZoneImage }          from '@/components/dropZone';


export default function FormManager({ editData, onSave, close, establishmentId, defaultLocalId }) {


    const dispatch          = useDispatch();
    const { requestAction } = useAxios();


    const { register,handleSubmit,reset,formState: { errors } } = useForm();


    const [loading, setLoading] = useState(false); // estado de envío del form
    // Resultado dual del DropZone: { files: nuevas (subir), urls: existentes que se conservan }
    const [imagesResult, setImagesResult] = useState({ files: [], urls: [] });
    const [imageError, setImageError]     = useState(''); // error de validación de imágenes
    const isEdit = !!editData;

    // Nº de imágenes obligatorias al crear un gerente
    const REQUIRED_IMAGES = 3;


  

    /* ── Pre-rellenar campos en modo edición ───────────────────────────────── */
    useEffect(() => {
        if (isEdit) {
            reset({
                name:           editData.name           || '',
                burden:         editData.burden         || '',
                numberManager:  editData.numberManager  || '',
                // El <select> trabaja con strings; normalizamos por si el backend
                // ya devuelve un booleano (true → 'activo', false → 'inactivo').
                status: (editData.status === false || editData.status === 'inactivo') ? 'inactivo' : 'activo',
                characteristic: editData.characteristic || '',
                // En modo edición el local ya viene populado; usamos su _id
     
            });
        } 
        else {
            // Valores por defecto al crear (local pre-seleccionado si se indicó)
            reset({ status: 'activo', otherLocals: '[]', localName: defaultLocalId || '' });
        }
    }, [editData, defaultLocalId]);



    /* ── Subida de imágenes ────────────────────────────────────────────────── */
    /*
     * Sube cada imagen nueva al endpoint POST /multimedia (campo 'img', maxCount 1)
     * y devuelve la lista de URLs retornadas por el backend. El endpoint procesa
     * un solo archivo por petición, por lo que se sube una por una.
     */
    const uploadImages = async (files) => {
        const urls = [];
        for (const { file } of files) {
            const formData = new FormData();
            formData.append('img', file);

            const upload = await requestAction({
                url:    '/multimedia',
                action: 'POST',
                body:   formData,
            });

            if (upload?.data?.url) urls.push(upload.data.url);
        }
        return urls;
    };


    /* ── Envío del formulario ──────────────────────────────────────────────── */
    const onSubmit = async data => {

        // Las 3 imágenes del gerente son obligatorias tanto al crear como al editar.
        // Se valida el total (existentes conservadas + nuevas) antes de subir nada
        // ni enviar el manager.
        const totalImages = imagesResult.urls.length + imagesResult.files.length;
        if (totalImages < REQUIRED_IMAGES) {
            setImageError(`Debes agregar las ${REQUIRED_IMAGES} imágenes del gerente`);
            return;
        }
        setImageError('');

        setLoading(true);
        try {
            let res;

            // El <select> entrega 'activo'/'inactivo' (string); lo enviamos como
            // booleano: true = activo, false = inactivo.
            const payload = { ...data, status: data.status === 'activo' };

            // Procesamos las imágenes primero: subimos las nuevas a /multimedia
            // y combinamos sus URLs con las existentes que el usuario conserva.
            const uploadedUrls = await uploadImages(imagesResult.files);
            payload.img = [...imagesResult.urls, ...uploadedUrls];

            if (isEdit) {
                /*
                 * PUT /managerlocal/id=:id
                 * El controller actualiza el documento directamente con el body.
                 * img: URLs existentes conservadas + URLs de las nuevas imágenes.
                 */
                res = await requestAction({
                    url:    `/managerlocal/id=${editData._id}`,
                    action: 'PUT',
                    body:   payload,
                });
            }
            else {
                /*
                 * POST /managerlocal
                 * Las imágenes ya fueron subidas y convertidas a URLs, por lo que
                 * el body se envía como JSON con img = lista de URLs.
                 */
                res = await requestAction({
                    url:    `/managerlocal?establishment=${establishmentId}`,
                    action: 'POST',
                    body:   payload,
                });
            }

            if (res.status === 200) {
                dispatch(setConfigModal({
                    title:      'Guardado',
                    description: isEdit
                        ? 'Gerente actualizado correctamente'
                        : 'Gerente creado correctamente',
                    modalOpen:  true,
                    type:       'successfull',
                    isCallback: null,
                }));

                const returnData = {...res.data}
                if(isEdit) returnData._id = editData?._id
                onSave(res.data, isEdit);
            }

        } 
        catch (err) {
            const msg = err?.response?.data?.message
                     || err?.response?.data
                     || 'Error al guardar el gerente';

            dispatch(setConfigModal({
                title:      'Error',
                description: String(msg),
                modalOpen:  true,
                type:       'error',
                isCallback: null,
            }));
        } 
        finally {
            setLoading(false);
        }
    };



    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden w-[480px] max-h-[85vh] flex flex-col z-100'>

            {/* ── HEADER ────────────────────────────────────────────────── */}
            <div className='bg-[#8f8f8f] px-6 py-5'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                        <Image
                            src='/ico/userList/patient_list.svg'
                            alt='gerente'
                            width={20}
                            height={20}
                            style={{ filter: 'brightness(10)' }}
                        />
                    </div>
                    <div>
                        <h2 className='text-white font-bold text-base'>
                            {isEdit ? 'Editar gerente' : 'Nuevo gerente'}
                        </h2>
                        <p className='text-slate-100 text-xs'>
                            {isEdit
                                ? `Editando: ${editData?.name || editData?.burden || ''}`
                                : 'Completa los campos para registrar un gerente'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── FORM ──────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit(onSubmit)} className='p-6 flex flex-col gap-4 overflow-y-auto'>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 1: DATOS DEL GERENTE                            */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='👤' title='Datos del gerente' />

                {/* ── Nombre ────────────────────────────────────────────────── */}
                <Field label='Nombre completo'>
                    <input
                        {...register('name')}
                        className={inputCls}
                        placeholder='Ej: María González'
                    />
                </Field>

                {/* ── Cargo ─────────────────────────────────────────────────── */}
                <Field label='Cargo *' error={errors.burden?.message}>
                    <input
                        {...register('burden', { required: 'El cargo es obligatorio' })}
                        className={inputCls}
                        placeholder='Ej: Gerente de turno, Supervisor'
                    />
                </Field>

                {/* ── Número ────────────────────────────────────────────────── */}
                <Field label='Número de contacto *' error={errors.numberManager?.message}>
                    <input
                        {...register('numberManager', { required: 'El número es obligatorio' })}
                        type='number'
                        className={inputCls}
                        placeholder='Número de teléfono o ID'
                    />
                </Field>

                {/* ── Estado ────────────────────────────────────────────────── */}
                <Field label='Estado *' error={errors.status?.message}>
                    <select
                        {...register('status', { required: 'El estado es obligatorio' })}
                        className={inputCls}
                    >
                        <option value='activo'>Activo</option>
                        <option value='inactivo'>Inactivo</option>
                    </select>
                </Field>

                {/* ── Característica / Notas ────────────────────────────────── */}
                <Field label='Característica *' error={errors.characteristic?.message}>
                    <textarea
                        {...register('characteristic', { required: 'La característica es obligatoria' })}
                        className={`${inputCls} resize-none`}
                        rows={3}
                        placeholder='Descripción, notas o cualidades del gerente'
                    />
                </Field>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 2: IMÁGENES                                     */}
                {/* ═══════════════════════════════════════════════════════ */}
                <SectionHeader icon='🖼️' title='Imágenes del gerente' />

                {/* ── Imágenes (DropZone) ──────────────────────────────────── */}
                <Field label='Imágenes del gerente *' error={imageError}>
                    <DropZoneImage
                        getImageCallback={(result) => {
                            setImagesResult(result);
                            if (imageError) setImageError('');
                        }}
                        initialImages={editData?.img ?? []}
                        filesLimit={3}
                        maxSizeMB={10}
                    />
                </Field>

                {/* ── Botones ────────────────────────────────────────────────── */}
                <div className='flex gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={close}
                        className='
                            flex-1 py-3 rounded-xl
                            border border-slate-300 text-slate-600 font-medium text-sm
                            hover:bg-slate-50 active:scale-[0.99]
                            transition-all duration-200
                        '
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        disabled={loading}
                        className='
                            flex-1 py-3 rounded-xl
                            bg-emerald-600 text-white font-semibold text-sm
                            hover:bg-emerald-700 active:scale-[0.99]
                            transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        '
                    >
                        {loading
                            ? 'Guardando...'
                            : isEdit ? 'Actualizar' : 'Crear gerente'}
                    </button>
                </div>

            </form>
        </div>
    );
}



/* ─────────────────────────────────────────────────────────────────────────────
 * SectionHeader — Separador visual de sección dentro del formulario.
 * Muestra un icono + título + línea divisora.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function SectionHeader({ icon, title }) {
    return (
        <div className='flex items-center gap-2 pt-4 pb-2 mt-2 border-t border-slate-100 first:border-t-0 first:mt-0 first:pt-0'>
            <span className='text-base'>{icon}</span>
            <h3 className='text-sm font-semibold text-slate-700 tracking-tight'>{title}</h3>
            <div className='flex-1 border-t border-slate-200 ml-2' />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Field — wrapper de campo de formulario con label y mensaje de error.
 * Props: label, error?, children
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Field({ label, error, children }) {
    return (
        <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium text-slate-700'>{label}</label>
            {children}
            {error && (
                <p className='text-red-500 text-xs mt-[2px]'>{error}</p>
            )}
        </div>
    );
}

/* Clases base para los inputs / selects / textarea */
const inputCls = `
    w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
    focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
    transition-colors bg-white text-slate-800 placeholder:text-slate-400
`.trim();
