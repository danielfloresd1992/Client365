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
 *   editData  {object|null}  – Gerente a editar. null = modo creación.
 *   onSave    {function}     – Callback(savedManager, isEdit) al guardar con éxito.
 *   close     {function}     – Cierra el modal.
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


export default function FormManager({ editData, onSave, close }) {

    /* ── Hooks ─────────────────────────────────────────────────────────────── */
    const dispatch          = useDispatch();
    const { requestAction } = useAxios();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    /* ── Estado ────────────────────────────────────────────────────────────── */
    const [locals,  setLocals]  = useState([]);   // lista de locales para el select
    const [loading, setLoading] = useState(false); // estado de envío del form
    const isEdit = !!editData;


    /* ── Cargar locales al montar ──────────────────────────────────────────── */
    useEffect(() => {
        /**
         * Se usa el endpoint /localLigth que devuelve la lista de locales
         * con campos mínimos (_id, name) para no sobrecargar la respuesta.
         */
        requestAction({ url: '/localLigth', action: 'GET' })
            .then(res => {
                if (res.status === 200) setLocals(res.data);
            })
            .catch(err => console.error('Error al cargar locales:', err));
    }, []);


    /* ── Pre-rellenar campos en modo edición ───────────────────────────────── */
    useEffect(() => {
        if (isEdit) {
            reset({
                name:           editData.name           || '',
                burden:         editData.burden         || '',
                numberManager:  editData.numberManager  || '',
                status:         editData.status         || 'activo',
                characteristic: editData.characteristic || '',
                // En modo edición el local ya viene populado; usamos su _id
                localName: editData.local?._id || editData.localName || '',
            });
        } else {
            // Valores por defecto al crear
            reset({ status: 'activo', otherLocals: '[]' });
        }
    }, [editData]);


    /* ── Envío del formulario ──────────────────────────────────────────────── */
    const onSubmit = async data => {
        setLoading(true);
        try {
            let res;

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
                    body: {
                        ...data,
                        local:       data.localName,        // el controller espera local como _id
                        otherLocals: editData.otherLocals ?? [],
                    },
                });
            } else {
                /*
                 * POST /managerlocal
                 * La ruta usa multer (uploadNoveltie.fields), por lo que el
                 * Content-Type debe ser multipart/form-data. Axios lo gestiona
                 * automáticamente al recibir una instancia de FormData.
                 * El campo otherLocals se envía como JSON string (el controller lo parsea).
                 */
                const formData = new FormData();
                Object.entries(data).forEach(([key, val]) => {
                    formData.append(key, val ?? '');
                });
                formData.append('otherLocals', '[]'); // el manager nuevo comienza sin otros locales

                res = await requestAction({
                    url:    '/managerlocal',
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
                onSave(res.data, isEdit);
            }

        } catch (err) {
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
        } finally {
            setLoading(false);
        }
    };


    /* ── Render ────────────────────────────────────────────────────────────── */
    return (
        <div className='bg-white rounded-2xl p-8 w-[480px] max-h-[85vh] overflow-y-auto shadow-2xl'>

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
                    <h2 className='text-lg font-bold text-gray-800'>
                        {isEdit ? 'Editar gerente' : 'Nuevo gerente'}
                    </h2>
                    <p className='text-xs text-gray-400'>
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

                {/* ── Local asignado ─────────────────────────────────────────── */}
                <Field label='Local asignado *' error={errors.localName?.message}>
                    <select
                        {...register('localName', { required: 'Debes seleccionar un local' })}
                        className={inputCls}
                    >
                        <option value=''>— Seleccionar local —</option>
                        {locals.map(local => (
                            <option key={local._id} value={local._id}>
                                {local.name}
                            </option>
                        ))}
                    </select>
                </Field>

                {/* ── Botones ────────────────────────────────────────────────── */}
                <div className='flex gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={close}
                        className='flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors'
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
        <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>{label}</label>
            {children}
            {error && (
                <p className='text-red-500 text-xs mt-[2px]'>{error}</p>
            )}
        </div>
    );
}

/* Clases base para los inputs / selects / textarea */
const inputCls = `
    w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200
    transition-colors bg-white text-gray-800
`.trim();
