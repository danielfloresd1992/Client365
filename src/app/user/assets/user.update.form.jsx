import { useState, useEffect, useRef, useContext } from 'react';
import { myUserContext } from '@/contexts/userContext';
import { useForm } from 'react-hook-form';
import { Label, TextInput, Checkbox, Select, FileInput , HelperText} from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import { HiMail } from "react-icons/hi";
import { fetchFileData } from '@/libs/ajaxClient/file.fecth';



export default function UserEditForm({ initialData, onSave=() => {}, onCancel, departmentList=[], positionList=[] }) {
    // Control de secciones basado en si los datos existen en initialData

    const  [ dataUser , setDataUser] = useState(initialData);
    const [hasJobInfo, setHasJobInfo] = useState(!!initialData?.jobInformation);
    const [hasSchedule, setHasSchedule] = useState(!!initialData?.workSchedule);
    const textErrorRef = useRef(null);

    
    const userContext = useContext(myUserContext);

    console.log(userContext);
    
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm();
 
    // 💡 IMPORTANTE: Resetear el formulario cuando cambie initialData

    useEffect(() => {
        if (initialData) {
            reset(initialData);
            setHasJobInfo(!!initialData.jobInformation);
            setHasSchedule(!!initialData.workSchedule);
        }
    }, [initialData, reset]);


    const onSubmit = (data) => {
        const payload = { ...data };
    
        // Si la hora está vacía, la eliminamos para que no falle el Regex del backend
        if (payload.workSchedule?.endTime === '') {
            payload.workSchedule.endTime = undefined; 
        }
        // Aseguramos que solo viajen 5 caracteres (HH:mm)
        if (payload.workSchedule?.endTime) {
            payload.workSchedule.endTime = payload.workSchedule.endTime.substring(0, 5);
        }

        onSave(initialData._id, payload);
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
            setValue('img', newImageUrl, { shouldDirty: true });
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
                            <Label 
                                htmlFor='dni' 
                                value='Cédula de Identidad' 
                                color='gray'
                            >CI</Label>
                            <TextInput 
                                id='dni'
                                type='number' 
                                color={errors.dni ? 'failure' : 'gray'} 
                                sizing='sm' 
                                placeholder='Ej: 12345678' 
                                // Conexión con useForm y Yup
                                {...register('dni')}
                                // Muestra el error de validación si existe
                                helperText={errors.dni?.message && (
                                    <span className='font-medium text-red-500'>
                                        {errors.dni.message}
                                    </span>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className='w-full flex gap-[.5rem]'>
                    <div className='w-[50%]'>
                        <Label 
                            htmlFor='name' 
                            value='Cédula de Identidad' 
                            color='info'
                        >Primer nombre</Label>

                        <TextInput 
                            id='name'
                            type='text' 
                            color={errors.name ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Jaun' 
                            // Conexión con useForm y Yup
                            {...register('name')}
                            // Muestra el error de validación si existe
                            helperText={errors.name?.message && (
                                <span className='font-medium text-red-500'>
                                    {errors.name.message}
                                </span>
                            )}
                        />
                    </div>
                    
                    <div className='w-[50%]'>
                        <Label 
                            htmlFor='surName' 
                            value='Primer apellido' 
                            color='info'
                        >Primer apellido</Label>

                        <TextInput 
                            id='name'
                            type='text' 
                            color={errors.surName ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Sanches' 
                            // Conexión con useForm y Yup
                            {...register('surName')}
                            // Muestra el error de validación si existe
                            helperText={errors.surName?.message && (
                                <span className='font-medium text-red-500'>
                                    {errors.surName.message}
                                </span>
                            )}
                        />
                    </div>
                </div>


                <div className='w-[100%]'>
                    <Label 
                            htmlFor='email' 
                            value='email' 
                            color='info'
                    >Coreo</Label>

                    <TextInput 
                        id='email'
                        type='email' 
                        icon={HiMail}
                        color={errors.email ? 'failure' : 'info'} 
                        sizing='sm' 
                        placeholder='Ej: Jaun' 
                            // Conexión con useForm y Yup
                        {...register('email')}
                            // Muestra el error de validación si existe
                        helperText={errors.email?.message && (
                            <span className='font-medium text-red-500'>
                                {errors.email.message}
                            </span>
                        )}
                     />
                </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Información Laboral</h3>
            
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Departamento */}
                        <div>
                            <div className='mb-2 block'>
                                <Label htmlFor='department' value='Departamento' />
                            </div>
                            <Select 
                                id='department' 
                                {...register('jobInformation.department')}
                                color={errors.jobInformation?.department ? 'failure' : 'gray'}
                            >
                                <option value=''>Selecciona un departamento</option>    
                                {
                                    departmentList.map(department => (
                                        <option className='text-[#000000]' value={department}>{department}</option>
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
                            <Label htmlFor='position' value='Puesto' />
                        </div>
                        <Select 
                            id='position' 
                            {...register('jobInformation.position')}
                            color={errors.jobInformation?.position ? 'failure' : 'gray'}
                        >
                            <option className='text-[#000000]' value=''>Selecciona un puesto</option>
                            {
                                positionList.map(text => (
                                    <option className='text-[#000000]' value={text}>{text}</option>
                                ))
                            }

                        </Select>
                        {errors.jobInformation?.position && (
                            <p className='text-red-500 text-xs mt-1'>{errors.jobInformation.position.message}</p>
                        )}
                        </div>
                    </div>

                    <div className='w-[50%]'>
                        <Label 
                            htmlFor='detail' 
                            value='Detalle' 
                            color='info'
                        >Atributo del empleado</Label>

                        <TextInput 
                            id='name'
                            type='text' 
                            color={errors.detail ? 'failure' : 'info'} 
                            sizing='sm' 
                            placeholder='Ej: Equipo de supervición' 
                            // Conexión con useForm y Yup
                            {...register('jobInformation.detail')}
                            // Muestra el error de validación si existe
                            helperText={errors.name?.detail && (
                                <span className='font-medium text-red-500'>
                                    {errors.name.detail}
                                </span>
                            )}
                        />
                    </div>
                    
                </div>

                <div className='border-t border-gray-200 pt-6 mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Horario de Trabajo</h3>
                    
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* Tipo de Turno */}
                        <div>
                            <div className='mb-2 block'>
                                <Label htmlFor='shiftType' value='Tipo de Turno' />
                            </div>
                            <Select 
                                id='shiftType' 
                                {...register('workSchedule.shiftType')}
                                color={errors.workSchedule?.shiftType ? 'failure' : 'gray'}
                            >
                                <option className='text-[#000000]' value='Diurno'>Diurno</option>
                                <option className='text-[#000000]' value='Nocturno'>Nocturno</option>
                            </Select>
                            </div>

                            {/* Hora de Entrada */}
                            <div>
                            <div className='mb-2 block'>
                                <Label htmlFor='startTime' value='Hora de Entrada' />
                            </div>
                            <TextInput 
                                id='startTime' 
                                type='time' 
                                {...register('workSchedule.startTime')}
                                color={errors.workSchedule?.startTime ? 'failure' : 'gray'}
                                helperText={errors.workSchedule?.startTime?.message}
                            />
                        </div>

                        {/* Hora de Salida */}
                    <div>
                        <div className='mb-2 block'>
                            <Label htmlFor='endTime' value='Hora de Salida' />
                        </div>
                        <TextInput 
                            id='endTime' 
                            type='time' 
                            {...register('workSchedule.endTime')}
                            color={errors.workSchedule?.endTime ? 'failure' : 'gray'}
                            helperText={errors.workSchedule?.endTime?.message}
                        />
                    </div>
                </div>


                {/* Días de Descanso (Array de números) */}
                <div className='mt-6'>
                    <h3 className='text-lg font-semibold text-gray-700 mb-4'>Días libres</h3>
                    <Label value='Días de Descanso (Selecciona de 1 a 3 días)' className='mb-2 block' />
                        <div className='flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                                <div key={day} className='flex items-center gap-2'>
                                    <Checkbox 
                                        id={`day-${index}`} 
                                        // Registramos la posición específica
                                        {...register(`workSchedule.restDays.${index}`)} 
                                        // ¡IMPORTANTE!: Quitamos la propiedad value
                                    />
                                    <Label htmlFor={`day-${index}`} color='grey'>{day}</Label>
                                </div>
                            ))}
                        </div>
                        {errors.workSchedule?.restDays && (
                        <p className='text-red-500 text-xs mt-2 font-medium'>
                            {errors.workSchedule.restDays.message}
                        </p>
                        )}
                    </div>
                </div>
                                    

                <div className='w-full'>
                     <div className='w-full flex-col items-center '>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='lateArrivalControl' {...register('workSchedule.lateArrivalControl')} />
                            <Label htmlFor='lateArrivalControl' className='flex' color='gray'>
                                ¿Se le aplica la regla de llegada tarde?
                            </Label> 
                        </div>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='lateArrivalTracking' {...register('workSchedule.lateArrivalTracking')} />
                            <Label htmlFor='lateArrivalTracking' className='flex' color='gray'>
                                ¿Se debe hacer seguimiento/notificación?
                            </Label> 
                        </div>
                        <div className='flex items-center gap-2'>
                            <Checkbox id='outForkSchedule' {...register('workSchedule.outForkSchedule')} />
                            <Label htmlFor='outForkSchedule' className='flex' color='gray'>
                                ¿Sacar usuario del horario?
                            </Label> 
                        </div>
                    </div>
                </div>

         

                <div className='flex items-center justify-center gap-2'>
                        <Checkbox id='agree' {...register('inabilited')} />
                        <Label htmlFor='agree' className='flex' color='gray'>
                            Inhabilitar usuario
                        </Label> 
                </div>

                <div className='w-full'>

                    <Label className="mb-2 block" htmlFor="file-upload-helper-text">
                        Subir foto '(Operacional)'
                    </Label>
                    <FileInput id="file-upload-helper-text" onChange={handleFileChange} />
                    <HelperText className="mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px).</HelperText>
                </div>
                

                {/* ... Resto de tus inputs irían aquí siguiendo el mismo patrón ... */}

                {/* Footer del Formulario - Botones de acción */}
                <div className='flex gap-3 pt-6 sticky bottom-0 bg-white border-t border-gray-100 mt-4'>
                    <button 
                        type='button' 
                        onClick={onCancel} 
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancelar
                    </button>
                    <button 
                        type='submit' 
                        className='flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all'
                    >
                        Actualizar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}