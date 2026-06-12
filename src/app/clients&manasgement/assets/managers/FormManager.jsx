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
    const isEdit = !!editData;


  

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



    /* ── Envío del formulario ──────────────────────────────────────────────── */
    const onSubmit = async data => {
        setLoading(true);
        try {
            let res;

            // El <select> entrega 'activo'/'inactivo' (string); lo enviamos como
            // booleano: true = activo, false = inactivo.
            const payload = { ...data, status: data.status === 'activo' };

            if (isEdit) {
                /*
                 * PUT /managerlocal/id=:id
                 * El controller actualiza el documento directamente con el body.
                 * Se incluye local (= localName) y otherLocals para que
                 * putManagerId sincronice correctamente las referencias.
                 */
                res = await requestAction({
                    url:    `/managerlocal/id=${editData._id}`,
                    action: 'PUT',
                    // img: URLs existentes que el usuario conserva (sincroniza eliminaciones)
                    body: { ...payload, img: imagesResult.urls },
                });
            }
            else {
                /*
                 * POST /managerlocal
                 * La ruta usa multer (uploadNoveltie.fields), por lo que el
                 * Content-Type debe ser multipart/form-data. Axios lo gestiona
                 * automáticamente al recibir una instancia de FormData.
                 * El campo otherLocals se envía como JSON string (el controller lo parsea).
                 */
                const formData = new FormData();
                Object.entries(payload).forEach(([key, val]) => {
                    formData.append(key, val ?? '');
                });

                // Imágenes nuevas del DropZone → campo 'img' (multer del backend: maxCount 3)
                imagesResult.files.forEach(({ file }) => formData.append('img', file));

                res = await requestAction({
                    url:    `/managerlocal?establishment=${establishmentId}`,
                    action: 'POST',
                    body:   formData,
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
        <div className='bg-white rounded-2xl p-8 w-[480px] max-h-[85vh] overflow-y-auto shadow-2xl z-100'>

            {/* Encabezado del formulario */}
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0'>
                    <Image
                        src='/ico/userList/patient_list.svg'
                        alt='gerente'
                        width={22}
                        height={22}
                    />
                </div>
                <div>
                    <h2 className='text-lg font-semibold text-slate-800 tracking-tight'>
                        {isEdit ? 'Editar gerente' : 'Nuevo gerente'}
                    </h2>
                    <p className='text-xs text-slate-400'>
                        {isEdit
                            ? `Modificando: ${editData?.name || editData?.burden}`
                            : 'Completa los campos para registrar un gerente'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>

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

                {/* ── Imágenes (DropZone) ──────────────────────────────────── */}
                <Field label='Imágenes del gerente'>
                    <DropZoneImage
                        getImageCallback={(result) => setImagesResult(result)}
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
                        className='flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors'
                    >
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        disabled={loading}
                        className='flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
