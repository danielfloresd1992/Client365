import { useState, useEffect, useRef, useContext } from 'react';
import { myUserContext } from '@/contexts/userContext';
import { useForm } from 'react-hook-form';
import { Label, TextInput, Checkbox, Select, FileInput , HelperText} from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import { HiMail } from "react-icons/hi";
import { fetchFileData } from '@/libs/ajaxClient/file.fecth';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WORK_TYPE_OPTIONS = [
    { value: 'laboral', label: 'Laboral' },
    { value: 'extra', label: 'Extra' },
    { value: 'descanso', label: 'Descanso' },
];

// Etiquetas en español para los campos registrados en updateByUser.change
const FIELD_LABELS = {
    dni: 'Cédula',
    name: 'Nombre',
    surName: 'Apellido',
    email: 'Correo',
    img: 'Foto',
    inabilited: 'Habilitación',
    jobInformation: 'Info. laboral',
    workSchedule: 'Horario',
    admin: 'Admin',
    super: 'Súper',
    phone: 'Teléfono',
    user: 'Usuario',
};

const buildDefaultScheduleByDay = (existingMap) => {
    const result = {};
    for (let i = 0; i <= 6; i++) {
        const key = String(i);
        const existing = existingMap?.[key] || existingMap?.get?.(key) || null;
        result[key] = {
            workType: existing?.workType || 'laboral',
            shift: existing?.shift || 'Diurno',
            startTime: existing?.startTime || '08:00',
            endTime: existing?.endTime || '17:00',
        };
    }
    return result;
};



export default function UserEditForm({ initialData, onSave=() => {}, onCancel, departmentList=[], positionList=[] }) {
    // Control de secciones basado en si los datos existen en initialData

    const [ dataUser , setDataUser] = useState(initialData);
    const [hasJobInfo, setHasJobInfo] = useState(!!initialData?.jobInformation);
    const [hasSchedule, setHasSchedule] = useState(!!initialData?.workSchedule);
    const [scheduleByDay, setScheduleByDay] = useState(() =>
        buildDefaultScheduleByDay(initialData?.workSchedule?.scheduleByDay)
    );
    const textErrorRef = useRef(null);

    // Últimas 5 modificaciones registradas por el backend, más reciente primero
    const modificationHistory = [...(initialData?.updateByUser || [])].slice(-5).reverse();

    
    const userContext = useContext(myUserContext);

  
    
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, dirtyFields }
    } = useForm({ defaultValues: initialData });

    // La foto no es un input controlado (FileInput sube el archivo y guarda la
    // URL con setValue), así que se registra "virtual" para que react-hook-form
    // la valide igual que al resto: obligatoria SOLO si el documento del
    // usuario todavía no tiene imagen.
    register('img', {
        validate: (value) => {
            if (initialData?.img) return true;
            return Boolean(value)
                || 'La foto es obligatoria: este usuario no tiene imagen registrada.';
        }
    });
 
    
    // 💡 IMPORTANTE: Resetear el formulario cuando cambie initialData

    useEffect(() => {
        if (initialData) {
            reset(initialData);
            setHasJobInfo(!!initialData.jobInformation);
            setHasSchedule(!!initialData.workSchedule);
            setScheduleByDay(buildDefaultScheduleByDay(initialData?.workSchedule?.scheduleByDay));
        }
    }, [initialData, reset]);


    const onSubmit = (data) => {
        // Enviar SOLO lo modificado: así el historial updateByUser del backend
        // registra únicamente los campos que realmente cambiaron.
        const payload = {};

        // Campos simples: se incluyen solo si el usuario los tocó (dirtyFields)
        ['dni', 'name', 'surName', 'email', 'inabilited', 'img'].forEach(field => {
            if (dirtyFields[field]) payload[field] = data[field];
        });

        // Subobjetos: si cambió cualquier subcampo se envía el objeto COMPLETO
        // fusionado con el original — el backend hace $set del subdocumento
        // entero y un parcial borraría los campos no enviados.
        if (dirtyFields.jobInformation) {
            payload.jobInformation = { ...initialData?.jobInformation, ...data.jobInformation };
            delete payload.jobInformation._id;
        }

        const hasScheduleChanged = JSON.stringify(scheduleByDay) !==
            JSON.stringify(buildDefaultScheduleByDay(initialData?.workSchedule?.scheduleByDay));

        if (dirtyFields.workSchedule || hasScheduleChanged) {
            payload.workSchedule = {
                ...initialData?.workSchedule,
                ...data.workSchedule,
                scheduleByDay,
            };
            delete payload.workSchedule._id;
            // Limpiar campos legacy que ya no se usan
            delete payload.workSchedule.startTime;
            delete payload.workSchedule.endTime;
            delete payload.workSchedule.restDays;
        }

        if (Object.keys(payload).length === 0) {
            alert('No hay cambios para guardar');
            return;
        }

        onSave(initialData._id, payload);
    };

    const updateDayField = (dayKey, field, value) => {
        setScheduleByDay((prev) => {
            const updated = { ...prev };
            updated[dayKey] = { ...updated[dayKey], [field]: value };
            // Si cambia a descanso, limpiar horarios
            if (field === 'workType' && value === 'descanso') {
                updated[dayKey].startTime = null;
                updated[dayKey].endTime = null;
            }
            if (field === 'workType' && value !== 'descanso') {
                updated[dayKey].startTime = updated[dayKey].startTime || '08:00';
                updated[dayKey].endTime = updated[dayKey].endTime || '17:00';
            }
            return updated;
        });
    };



    const handleFileChange = async (event) => {
        const file = event.target.files[0]; // Obtenemos el primer archivo seleccionado
        if (file) {
            console.log("Archivo cargado:", file.name);
            console.log("Tamaño:", file.size);
            // Aquí es donde disparas tu lógica
            const response = await fetchFileData(file);
            const newImageUrl = response.url;
            setDataUser({...dataUser, img: newImageUrl});
            // shouldValidate: al subir la foto se limpia el error de "obligatoria"
            setValue('img', newImageUrl, { shouldDirty: true, shouldValidate: true });
        }
    };



    if(!userContext?.dataSessionState?.dataSession){ 
        onCancel();
        return null
    }


    return (
       <div className='bg-white p-6 rounded-xl shadow-2xl border'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold'>Editar Perfil: {initialData?.name} {initialData.surName}</h2>
                <div className='full'>

                </div>
                <button onClick={onCancel} className='text-gray-400 hover:text-red-500'>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-h-[70vh] overflow-y-auto px-2'>
                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Datos personales</h3>
                    {/* Sección de Cédula de Identidad */}
                    <div className='w-full'>
                        <div className='w-full'>
                            <Label htmlFor='dni'>Cédula de Identidad</Label>
                            <TextInput
                                id='dni'
                                type='number'
                                color={errors.dni ? 'failure' : 'gray'}
                                sizing='sm'
                                placeholder='Ej: 12345678'
                                // Obligatoria: si el documento no la tiene hay que
                                // cargarla, y si ya la tiene no se puede vaciar.
                                {...register('dni', {
                                    validate: (value) =>
                                        String(value ?? '').trim() !== ''
                                        || 'La cédula es obligatoria: este usuario no la tiene registrada.'
                                })}
                            />
                            {/* Muestra el error de validación si existe */}
                            {errors.dni?.message && (
                                <HelperText color='failure'>{errors.dni.message}</HelperText>
                            )}
                        </div>
                    </div>
                </div>

                <div className='w-full flex gap-[.5rem]'>
                    <div className='w-[50%]'>
                        <Label htmlFor='name'>Primer nombre</Label>

                        <TextInput
                            id='name'
                            type='text'
                            color={errors.name ? 'failure' : 'gray'}
                            sizing='sm'
                            placeholder='Ej: Juan'
                            // Conexión con useForm y Yup
                            {...register('name')}
                        />
                        {errors.name?.message && (
                            <HelperText color='failure'>{errors.name.message}</HelperText>
                        )}
                    </div>

                    <div className='w-[50%]'>
                        <Label htmlFor='surName'>Primer apellido</Label>

                        <TextInput
                            id='surName'
                            type='text'
                            color={errors.surName ? 'failure' : 'gray'}
                            sizing='sm'
                            placeholder='Ej: Sanchez'
                            // Conexión con useForm y Yup
                            {...register('surName')}
                        />
                        {errors.surName?.message && (
                            <HelperText color='failure'>{errors.surName.message}</HelperText>
                        )}
                    </div>
                </div>


                <div className='w-[100%]'>
                    <Label htmlFor='email'>Correo</Label>

                    <TextInput
                        id='email'
                        type='email'
                        icon={HiMail}
                        color={errors.email ? 'failure' : 'gray'}
                        sizing='sm'
                        placeholder='Ej: juan@correo.com'
                        // Conexión con useForm y Yup
                        {...register('email')}
                    />
                    {errors.email?.message && (
                        <HelperText color='failure'>{errors.email.message}</HelperText>
                    )}
                </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Información Laboral</h3>
            
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Departamento */}
                        <div>
                            <div className='mb-2 block'>
                                <Label htmlFor='department'>Departamento</Label>
                            </div>
                            <Select 
                                id='department' 
                                {...register('jobInformation.department')}
                                color={errors.jobInformation?.department ? 'failure' : 'gray'}
                            >
                                <option value=''>Selecciona un departamento</option>    
                                {
                                    departmentList.map(department => (
                                        <option key={department} className='text-[#000000]' value={department}>{department}</option>
                                    ))
                                }
                
                            </Select>
                            {errors.jobInformation?.department && (
                                <p className='text-red-500 text-xs mt-1'>{errors.jobInformation.department.message}</p>
                            )}
                        </div>

                        {/* Puesto / Cargo */}
                    <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='position'>Puesto</Label>
                        </div>
                        <Select 
                            id='position' 
                            {...register('jobInformation.position')}
                            color={errors.jobInformation?.position ? 'failure' : 'gray'}
                        >
                            <option className='text-[#000000]' value=''>Selecciona un puesto</option>
                            {
                                positionList.map(text => (
                                    <option key={text} className='text-[#000000]' value={text}>{text}</option>
                                ))
                            }

                        </Select>
                        {errors.jobInformation?.position && (
                            <p className='text-red-500 text-xs mt-1'>{errors.jobInformation.position.message}</p>
                        )}
                        </div>
                    </div>

                    <div className='w-[50%]'>
                        <Label htmlFor='detail'>Atributo del empleado</Label>

                        <TextInput
                            id='detail'
                            type='text'
                            color={errors.jobInformation?.detail ? 'failure' : 'gray'}
                            sizing='sm'
                            placeholder='Ej: Equipo de supervisión'
                            // Conexión con useForm y Yup
                            {...register('jobInformation.detail')}
                        />
                        {errors.jobInformation?.detail?.message && (
                            <HelperText color='failure'>{errors.jobInformation.detail.message}</HelperText>
                        )}
                    </div>
                    
                </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Horario por Día</h3>

                    {/* Turno global por defecto */}
                    <div className='mb-4 max-w-xs'>
                        <div className='mb-2 block'>
                            <Label htmlFor='shiftType'>Turno Global (por defecto)</Label>
                        </div>
                        <Select
                            id='shiftType'
                            {...register('workSchedule.shiftType')}
                            color={errors.workSchedule?.shiftType ? 'failure' : 'gray'}
                        >
                            <option value='Diurno'>Diurno</option>
                            <option value='Nocturno'>Nocturno</option>
                        </Select>
                    </div>

                    {/* Grid de scheduleByDay */}
                    <div className='overflow-x-auto rounded-lg border border-gray-200'>
                        <table className='w-full text-sm text-left'>
                            <thead className='bg-gray-100 text-gray-600 uppercase text-xs'>
                                <tr>
                                    <th className='px-3 py-2'>Día</th>
                                    <th className='px-3 py-2'>Tipo</th>
                                    <th className='px-3 py-2'>Turno</th>
                                    <th className='px-3 py-2'>Entrada</th>
                                    <th className='px-3 py-2'>Salida</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DAY_NAMES.map((dayName, idx) => {
                                    const key = String(idx);
                                    const day = scheduleByDay[key] || {};
                                    const isDescanso = day.workType === 'descanso';
                                    return (
                                        <tr key={key} className={`border-t ${isDescanso ? 'bg-amber-50' : 'bg-white'}`}>
                                            <td className='px-3 py-2 font-medium text-gray-700 whitespace-nowrap'>{dayName}</td>
                                            <td className='px-3 py-2'>
                                                <select
                                                    className='block w-full rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500'
                                                    value={day.workType || 'laboral'}
                                                    onChange={(e) => updateDayField(key, 'workType', e.target.value)}
                                                >
                                                    {WORK_TYPE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className='px-3 py-2'>
                                                <select
                                                    className='block w-full rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500'
                                                    value={day.shift || 'Diurno'}
                                                    onChange={(e) => updateDayField(key, 'shift', e.target.value)}
                                                    disabled={isDescanso}
                                                >
                                                    <option value='Diurno'>Diurno</option>
                                                    <option value='Nocturno'>Nocturno</option>
                                                </select>
                                            </td>
                                            <td className='px-3 py-2'>
                                                <input
                                                    type='time'
                                                    className='block w-full rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
                                                    value={day.startTime || ''}
                                                    onChange={(e) => updateDayField(key, 'startTime', e.target.value)}
                                                    disabled={isDescanso}
                                                />
                                            </td>
                                            <td className='px-3 py-2'>
                                                <input
                                                    type='time'
                                                    className='block w-full rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
                                                    value={day.endTime || ''}
                                                    onChange={(e) => updateDayField(key, 'endTime', e.target.value)}
                                                    disabled={isDescanso}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Flags globales del horario */}
                <div className='w-full'>
                    <div className='w-full flex-col items-center'>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='lateArrivalControl' {...register('workSchedule.lateArrivalControl')} />
                            <Label htmlFor='lateArrivalControl' className='flex'>
                                ¿Se le aplica la regla de llegada tarde?
                            </Label>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='lateArrivalTracking' {...register('workSchedule.lateArrivalTracking')} />
                            <Label htmlFor='lateArrivalTracking' className='flex'>
                                ¿Se debe hacer seguimiento/notificación?
                            </Label>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='outForkSchedule' {...register('workSchedule.outForkSchedule')} />
                            <Label htmlFor='outForkSchedule' className='flex'>
                                ¿Sacar usuario del horario?
                            </Label>
                        </div>
                        {/* Horas extras automáticas: lo que trabaje por encima de
                            su jornada base (9h diurno / 12h nocturno) queda
                            aprobado sin pasar por un administrador. */}
                        <div className='flex items-center gap-2'>
                            <Checkbox id='autoApproveOvertime' {...register('workSchedule.autoApproveOvertime')} />
                            <Label htmlFor='autoApproveOvertime' className='flex flex-col'>
                                <span>¿Genera horas extras automáticamente?</span>
                                <span className='text-[11px] font-normal text-gray-500'>
                                    Se aprueban solas, sin revisión de un administrador
                                </span>
                            </Label>
                        </div>
                    </div>
                </div>

         

                <div className='flex items-center justify-center gap-2'>
                        <Checkbox id='agree' {...register('inabilited')} />
                        <Label htmlFor='agree' className='flex'>
                            Inhabilitar usuario
                        </Label> 
                </div>

                <div className='w-full'>

                    <Label className="mb-2 block" htmlFor="file-upload-helper-text">
                       {"Subir foto '(Operacional)'"}{!initialData?.img && <span className='text-red-500'> *</span>}
                    </Label>
                    <FileInput
                        id="file-upload-helper-text"
                        color={errors.img ? 'failure' : undefined}
                        onChange={handleFileChange}
                    />
                    {errors.img?.message ? (
                        <HelperText color='failure'>{errors.img.message}</HelperText>
                    ) : (
                        <HelperText className="mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px).</HelperText>
                    )}
                </div>
                

                {/* Historial de modificaciones (updateByUser del backend) */}
                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Últimas modificaciones</h3>
                    {modificationHistory.length === 0 ? (
                        <p className='text-xs text-gray-400'>Sin modificaciones registradas.</p>
                    ) : (
                        <ul className='flex flex-col gap-1.5'>
                            {modificationHistory.map((entry, index) => (
                                <li
                                    key={entry._id || index}
                                    className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5'
                                >
                                    <span className='font-semibold text-gray-700 whitespace-nowrap'>
                                        {entry.idRef?.name
                                            ? `${entry.idRef.name} ${entry.idRef.surName || ''}`.trim()
                                            : 'Admin'}
                                    </span>
                                    <span className='text-gray-400 whitespace-nowrap'>
                                        {entry.createdAt
                                            ? new Date(entry.createdAt).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })
                                            : ''}
                                    </span>
                                    <span className='flex flex-wrap gap-1'>
                                        {(entry.change || []).map((field, i) => (
                                            <span
                                                key={`${field}-${i}`}
                                                className='bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-600'
                                            >
                                                {FIELD_LABELS[field] || field}
                                            </span>
                                        ))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer del Formulario - Botones de acción */}
                <div className='flex gap-3 pt-6 sticky bottom-0 bg-white border-t border-gray-100 mt-4'>
                    <button 
                        type='button' 
                        onClick={onCancel} 
                        className='btn-neutral btn-sm flex-1'
                    >
                        Cancelar
                    </button>
                    <button 
                        type='submit' 
                        className='btn-primary btn-sm flex-1'
                    >
                        Actualizar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
