'use client';

import { useState, useContext, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';

import useContextMenuPosition from '@/hook/useContextMenuPosition';
import useSubmitLock from '@/hook/useSubmitLock';
import ContextMenu from '@/components/ContextMenu';
import { myUserContext } from '@/contexts/userContext';
import { setConfigModal } from '@/store/slices/globalModal';
import { addAttendanceComment, saveGroupDynamicSchedule, setOnDutyGuard, setAuxiliaryRole } from '@/libs/ajaxClient/user.fecth';

import UserScheduleCalendar from '../user.schedule.calendar';
import UserCommentForm from '../forms/user.comment.form';
import UserDayAssignForm from '../forms/user.day.assign.form';
import UserNextMonthScheduleForm from '../forms/user.nextmonth.schedule.form';

import AttendanceCell from './AttendanceCell';
import { attendanceCache } from '../state/attendanceCache';
import { dayKeyOf } from '../state/schedulePending';

/**
 * La fila de UN empleado: su ficha a la izquierda y una celda por cada día.
 *
 * Se llamaba UserList, que se leía como "la lista de usuarios" cuando en
 * realidad pinta una sola fila. La lista la arma /user recorriendo empleados.
 */
export default forwardRef(function UserRow({
    user,
    daysRange,
    onEditClick,
    onOpenDynamicSchedule,
    selectedDateMap = {},
    isDraggingSelection = false,
    onStartDragSelection,
    onDragOverCell,
    onClearSelectedDates
}, ref) {


    const userState = user
    const { dataSessionState } = useContext(myUserContext);
    const dispatch = useDispatch();




    const remplazeUrl = (url) => {
        if (!url) return null;
        return url;
        return 'https://amazona365.ddns.net:3006' + url.split('https://amazona365.ddns.net')[1]
    };



    // La `ref` va al NODO de la fila (más abajo, en el contenedor).
    //
    // Antes había acá un useImperativeHandle que exponía { updateUserInList },
    // apuntando a una función vacía que nadie llamaba. El efecto real era que
    // `userRefs.current[id]` en /user no era un elemento sino ese objeto: al
    // llegar desde una notificación, `fila.scrollIntoView(...)` reventaba la
    // página entera con un error de cliente.


    // Cerrojo contra el doble submit de las acciones del menú contextual.
    // Cada acción usa su propia clave, así designar guardia no bloquea asignar
    // jornada. Ver useSubmitLock: el cerrojo es un ref porque el estado no se
    // actualiza a tiempo para frenar el segundo clic de un doble clic.
    const { run: runLocked } = useSubmitLock();



    // Context menu state
    const {
        position: contextMenuPosition,
        handleContextMenu,
        closeMenu: closeContextMenu
    } = useContextMenuPosition();



    const [contextMenuUser, setContextMenuUser] = useState(null);

    // Modal de calendario con el horario completo del operador
    const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);

    // Modal para agregar un comentario sobre el día de un operador
    const [showCommentForm, setShowCommentForm] = useState(false);
    // Modal del patrón semanal aplicado al MES SIGUIENTE (overrides por fecha)
    const [showNextMonthForm, setShowNextMonthForm] = useState(false);

    // Fecha de la celda donde ocurrió el click derecho (null si fue sobre el nombre)
    const [contextMenuDate, setContextMenuDate] = useState(null);

    // Modal para asignar guardia/extra sobre la fecha clickeada ('laboral' | 'extra' | null)
    const [assignFormMode, setAssignFormMode] = useState(null);

    // Handler para click derecho
    const onUserContextMenu = (e) => {
        handleContextMenu(e);
        setContextMenuUser(user);
        const cell = e.target?.closest?.('[data-dateiso]');
        setContextMenuDate(cell ? new Date(cell.getAttribute('data-dateiso')) : null);
    };

    // Info del día clickeado: tipo efectivo (override en caché > regla semanal),
    // si la jornada ya está cerrada (con hora de salida marcada) y si el
    // usuario tiene la guardia del día (onDuty) en esa fecha.
    const getMenuDayInfo = () => {
        if (!contextMenuDate) return { type: null, closed: false, onDuty: false, auxiliary: false };
        const normalized = new Date(contextMenuDate);
        normalized.setHours(0, 0, 0, 0);
        const cached = attendanceCache.get(`${userState?.dni}-${normalized.toISOString()}`);
        const rule = userState?.workSchedule?.scheduleByDay?.[String(normalized.getDay())];
        return {
            type: cached?.scheduleOverride?.workType || rule?.workType || 'laboral',
            closed: Boolean(cached?.checkOut),
            onDuty: Boolean(cached?.onDuty),
            auxiliary: Boolean(cached?.auxiliary),
        };
    };
    const { type: menuDayType, closed: menuDayClosed, onDuty: menuDayOnDuty, auxiliary: menuDayAuxiliary } = getMenuDayInfo();

    // Departamentos habilitados para la guardia del día (igual que el backend)
    const ONDUTY_DEPARTMENTS = ['Operaciones', 'Reportes', 'Sistemas y desarrollo'];
    const canHaveOnDuty = ONDUTY_DEPARTMENTS.includes(userState?.jobInformation?.department);

    // Designa o quita la guardia del día para la fecha clickeada.
    // Cada acción lleva su propia clave de cerrojo: designar guardia y designar
    // auxiliar son independientes y no tienen por qué bloquearse entre sí.
    const toggleOnDutyGuard = (onDuty) => runLocked(async () => {
        try {
            const dateObj = new Date(contextMenuDate);
            dateObj.setHours(0, 0, 0, 0);
            await setOnDutyGuard({
                userId: userState._id,
                dni: userState.dni,
                date: dateObj.toISOString(),
                onDuty,
            });
            // La celda se refresca sola por el evento socket del backend
            dispatch(setConfigModal({
                type: 'successfull',
                title: onDuty ? 'Encargado de turno designado' : 'Encargado de turno retirado',
                description: onDuty
                    ? `${userState?.name} queda como encargado de turno.`
                    : `${userState?.name} ya no es el encargado de turno.`,
                modalOpen: true,
            }));
            return true;
        } catch (error) {
            console.error('Error asignando guardia del día:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo asignar',
                description: error?.response?.data?.message || 'Hubo un problema al asignar la guardia. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'onDuty');

    // Designa o quita el auxiliar del día para la fecha clickeada
    const toggleAuxiliaryRole = (auxiliary) => runLocked(async () => {
        try {
            const dateObj = new Date(contextMenuDate);
            dateObj.setHours(0, 0, 0, 0);
            await setAuxiliaryRole({
                userId: userState._id,
                dni: userState.dni,
                date: dateObj.toISOString(),
                auxiliary,
            });
            // La celda se refresca sola por el evento socket del backend
            dispatch(setConfigModal({
                type: 'successfull',
                title: auxiliary ? 'Auxiliar designado' : 'Auxiliar retirado',
                description: auxiliary
                    ? `${userState?.name} queda como auxiliar del día.`
                    : `${userState?.name} ya no es auxiliar del día.`,
                modalOpen: true,
            }));
            return true;
        } catch (error) {
            console.error('Error asignando auxiliar del día:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo asignar',
                description: error?.response?.data?.message || 'Hubo un problema al asignar el auxiliar. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'auxiliary');

    // Guarda un override de jornada para la fecha clickeada (mismo endpoint que "Editar grupo")
    const saveDayOverride = (args) => runLocked(async () => {
        const { workType, shift = null, startTime = null, endTime = null, note = null, from = null, to = null } = args || {};
        try {
            // Fechas objetivo: rango completo para vacaciones (un documento por
            // día), o solo el día donde se hizo click derecho
            let dates = [];
            if (workType === 'vacaciones' && from && to) {
                const start = new Date(`${from}T00:00:00.000Z`);
                const end = new Date(`${to}T00:00:00.000Z`);
                const MAX_DAYS = 62;
                for (let d = new Date(start); d <= end && dates.length < MAX_DAYS; d.setUTCDate(d.getUTCDate() + 1)) {
                    dates.push(new Date(d).toISOString());
                }
                if (dates.length === 0) throw new Error('El rango de fechas de las vacaciones no es válido.');
            } else {
                const dateObj = new Date(contextMenuDate);
                dateObj.setHours(0, 0, 0, 0);
                dates = [dateObj.toISOString()];
            }

            const response = await saveGroupDynamicSchedule({
                updates: dates.map((dateISO) => ({
                    userId: userState._id,
                    dni: userState.dni,
                    date: dateISO,
                    workType,
                    shift,
                    startTime,
                    endTime,
                    note,
                })),
                adminUserId: dataSessionState?.dataSession?._id,
            });

            // El endpoint responde 200 aunque el item falle: revisar los errores
            const itemErrors = response?.data?.errors || [];
            if (itemErrors.length > 0) throw new Error(itemErrors[0]?.error || 'No se pudo guardar el horario');

            const DESCRIPTIONS = {
                descanso: 'Día marcado como descanso/libre.',
                laboral: 'Guardia asignada para la fecha.',
                extra: 'Día extra asignado para la fecha.',
                permiso: 'Permiso asignado con su comentario.',
                vacaciones: `Vacaciones asignadas (${dates.length} día${dates.length !== 1 ? 's' : ''}).`,
                falta: 'Día marcado como falta.',
            };
            dispatch(setConfigModal({
                type: 'successfull',
                title: 'Horario actualizado',
                description: DESCRIPTIONS[workType] || 'Cambio de horario guardado.',
                modalOpen: true,
            }));
            // La celda se refresca sola por el evento socket del backend
            return true;
        } catch (error) {
            console.error('Error asignando jornada:', error);
            dispatch(setConfigModal({
                type: 'error',
                title: 'No se pudo guardar',
                description: error?.response?.data?.message || error?.message || 'Hubo un problema al guardar el horario. Intenta nuevamente.',
                modalOpen: true,
            }));
            return false;
        }
    }, 'dayOverride');


    if (user.workSchedule.outForkSchedule) return null;



    return (
        <>
            <div
                ref={ref}
                data-userid={user._id}
                className='flex border-b border-gray-300 bg-white hover:bg-gray-50 transition-colors select-none'
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={onUserContextMenu}
            >

                {/* COLUMNA PEGAJOSA (NOMBRE DEL USUARIO) */}
                <div className='sticky left-0 z-10 w-48 min-w-[12rem] bg-white border-r border-gray-300 flex items-center flex-col gap-2'>
                    <div className='w-full flex items-center gap-3'>

                        <div className={`min-w-[56px] w-[50px] h-full ${userState?.img ? '' : 'bg-slate-200'} flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm border border-gray-200 overflow-hidden`} title={dataSessionState?.dataSession?.name === 'Sorielis' && userState?.name === 'Sorielis' ? 'Eres marron!' : userState?.dni}>
                            <img className='w-full h-full object-cover' src={remplazeUrl(userState?.img) || '/ico/icons8-usuario-masculino-en-círculo-96.png'} alt='user-profile-ico' />
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 py-2">
                            <p className='font-black text-[15px] md:text-[16px] text-gray-900 leading-tight truncate'>{userState?.name}</p>
                            <p className='font-bold text-[12px] md:text-[13px] text-gray-600 leading-tight truncate'>{userState?.surName}</p>
                            <p className='text-[10px] md:text-[11px] font-bold text-gray-400 mt-1 truncate uppercase tracking-widest'>{userState?.jobInformation?.position || 'Sin definir'}</p>
                            {userState?.createdOn && (
                                <p className='text-[9px] md:text-[10px] font-semibold text-gray-400 leading-tight truncate'>
                                    Ingreso: {new Date(userState.createdOn).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                        {/* Tuerca de edición — visible solo para administradores */}
                        {dataSessionState?.dataSession?.admin === true && (
                            <button
                                onClick={() => {
                                    onClearSelectedDates?.();
                                    onEditClick(userState);
                                }}
                                className='absolute top-[5px] right-[5px] pointer'>
                                <img className='w-[30px] opacity-30 hover:opacity-100' src='/ico/icons8-configuración-48.png' alt='config-ico-09' />
                            </button>
                        )}
                    </div>

                </div>

                {/* CELDAS DE DATOS (Iteramos los días de nuevo para este usuario) */}
                {user && daysRange.map((day) => {
                    return (
                        <div
                            key={`${user._id}-${day.fullDateISO}`}
                            data-dateiso={day.fullDateISO}
                            /* Coordenadas de la celda para poder encontrarla desde
                               fuera: es como /user?userId=…&date=… la localiza al
                               llegar desde una notificación, sin tener que pasar una
                               ref por cada una de las más de dos mil celdas. */
                            data-userid={user._id}
                            data-daykey={dayKeyOf(day.dateObj)}
                            onMouseDown={(event) => onStartDragSelection?.(day.fullDateISO, event.button)}
                            onMouseEnter={() => onDragOverCell?.(day.fullDateISO)}
                            className={`flex-shrink-0 w-24 p-1 border-r border-gray-300 flex items-center justify-center cursor-pointer
                            ${day.isToday ? 'bg-blue-50/20 shadow-[inset_3px_0_0_#3b82f6,inset_-3px_0_0_#3b82f6]' : ''}
                            ${selectedDateMap[day.fullDateISO] ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-100/70' : ''}`}
                        >
                            {/* Invocamos al hijo pasándole los datos necesarios */}
                            <AttendanceCell
                                user={user}
                                userId={user._id}
                                dni={user.dni}
                                dateObj={day.dateObj}
                                scheduleByDay={userState?.workSchedule?.scheduleByDay}
                            />
                        </div>
                    );
                })}
            </div>

            <ContextMenu
                position={contextMenuPosition}
                open={!!contextMenuPosition}
                onClose={closeContextMenu}
            >
                <div className='flex flex-col'>
                    {/* Cabecera: empleado sobre el que se abrió el menú */}
                    <p className='px-3 pt-1.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[210px] border-b border-gray-100 mb-1'>
                        {contextMenuUser?.name} {contextMenuUser?.surName}
                    </p>

                    <button
                        role='menuitem'
                        className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                        onClick={() => {
                            closeContextMenu();
                            setShowScheduleCalendar(true);
                        }}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                            <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                            <line x1='16' y1='2' x2='16' y2='6'></line>
                            <line x1='8' y1='2' x2='8' y2='6'></line>
                            <line x1='3' y1='10' x2='21' y2='10'></line>
                        </svg>
                        Ver horario
                    </button>

                    <button
                        role='menuitem'
                        className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                        onClick={() => {
                            closeContextMenu();
                            onEditClick?.(contextMenuUser);
                        }}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                            <path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'></path>
                            <path d='m15 5 4 4'></path>
                        </svg>
                        Editar usuario
                    </button>

                    {/* Patrón semanal del mes siguiente — modifica: solo administradores */}
                    {dataSessionState?.dataSession?.admin === true && (
                        <button
                            role='menuitem'
                            className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                            onClick={() => {
                                closeContextMenu();

                                // Regla: sin cargo, departamento y horario por
                                // defecto no se puede proyectar el mes siguiente.
                                // 'Sin definir' cuenta como no establecido.
                                const position = userState?.jobInformation?.position;
                                const department = userState?.jobInformation?.department;
                                const scheduleByDay = userState?.workSchedule?.scheduleByDay || {};
                                const hasDefaultSchedule = Object.values(scheduleByDay)
                                    .some(rule => rule && (rule.workType || rule.startTime));

                                const missingValues = [];
                                if (!position || position === 'Sin definir') missingValues.push('el cargo');
                                if (!department || department === 'Sin definir') missingValues.push('el departamento');
                                if (!hasDefaultSchedule) missingValues.push('el horario por defecto');

                                if (missingValues.length > 0) {
                                    const listado = missingValues.length > 1
                                        ? `${missingValues.slice(0, -1).join(', ')} y ${missingValues.at(-1)}`
                                        : missingValues[0];
                                    dispatch(setConfigModal({
                                        type: 'error',
                                        title: 'Faltan datos del usuario',
                                        description: `Antes de modificar el mes siguiente debes establecer ${listado} de ${userState?.name} ${userState?.surName} desde "Editar usuario".`,
                                        modalOpen: true,
                                    }));
                                    return;
                                }

                                setShowNextMonthForm(true);
                            }}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                                <line x1='16' y1='2' x2='16' y2='6'></line>
                                <line x1='8' y1='2' x2='8' y2='6'></line>
                                <path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01'></path>
                            </svg>
                            Cambiar horario del mes siguiente
                        </button>
                    )}

                    {/* Acciones de jornada (MODIFICAN el dia): solo administradores.
                        No aplican si la jornada ya cerro (checkOut). Comentarios aparte (super). */}
                    {dataSessionState?.dataSession?.admin === true && contextMenuDate && !menuDayClosed && (
                        <>
                            <div className='h-px bg-gray-100 my-1' />

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    saveDayOverride({ workType: 'descanso' });
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'></path>
                                </svg>
                                Marcar descanso
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    saveDayOverride({ workType: 'falta' });
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-400'>
                                    <circle cx='12' cy='12' r='10'></circle>
                                    <path d='m15 9-6 6'></path>
                                    <path d='m9 9 6 6'></path>
                                </svg>
                                Marcar falta
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('laboral');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <circle cx='12' cy='12' r='10'></circle>
                                    <polyline points='12 6 12 12 16 14'></polyline>
                                </svg>
                                Asignar guardia
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('permiso');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'></path>
                                    <path d='M14 2v4a2 2 0 0 0 2 2h4'></path>
                                    <path d='M10 9H8'></path>
                                    <path d='M16 13H8'></path>
                                    <path d='M16 17H8'></path>
                                </svg>
                                Asignar permiso
                            </button>

                            <button
                                role='menuitem'
                                className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                onClick={() => {
                                    closeContextMenu();
                                    setAssignFormMode('vacaciones');
                                }}
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                    <circle cx='12' cy='12' r='4'></circle>
                                    <path d='M12 2v2'></path>
                                    <path d='M12 20v2'></path>
                                    <path d='m4.93 4.93 1.41 1.41'></path>
                                    <path d='m17.66 17.66 1.41 1.41'></path>
                                    <path d='M2 12h2'></path>
                                    <path d='M20 12h2'></path>
                                    <path d='m6.34 17.66-1.41 1.41'></path>
                                    <path d='m19.07 4.93-1.41 1.41'></path>
                                </svg>
                                Asignar vacaciones
                            </button>

                            {/* Guardia del día — solo departamentos habilitados */}
                            {canHaveOnDuty && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        // Designar abre el formulario (horario + turno); quitar es directo
                                        if (menuDayOnDuty) toggleOnDutyGuard(false);
                                        else setAssignFormMode('guardia');
                                    }}
                                >
                                    {menuDayOnDuty ? (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-blue-500'>
                                            <path d='M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5'></path>
                                            <path d='M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                            <line x1='2' y1='2' x2='22' y2='22'></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-blue-500'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    )}
                                    {menuDayOnDuty ? 'Quitar encargado de turno' : 'Designar encargado de turno'}
                                </button>
                            )}

                            {/* Auxiliar del día — solo departamentos habilitados */}
                            {canHaveOnDuty && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        // Designar abre el formulario (horario + turno); quitar es directo
                                        if (menuDayAuxiliary) toggleAuxiliaryRole(false);
                                        else setAssignFormMode('auxiliar');
                                    }}
                                >
                                    {menuDayAuxiliary ? (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-500'>
                                            <path d='M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5'></path>
                                            <path d='M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                            <line x1='2' y1='2' x2='22' y2='22'></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-red-500'>
                                            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'></path>
                                            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'></path>
                                        </svg>
                                    )}
                                    {menuDayAuxiliary ? 'Quitar auxiliar' : 'Designar auxiliar'}
                                </button>
                            )}

                            {/* Extra: solo cuando el día efectivo es libre/descanso */}
                            {menuDayType === 'descanso' && (
                                <button
                                    role='menuitem'
                                    className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                                    onClick={() => {
                                        closeContextMenu();
                                        setAssignFormMode('extra');
                                    }}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon>
                                    </svg>
                                    Marcar extra
                                </button>
                            )}
                        </>
                    )}

                    {/* Solo usuarios super y con click derecho sobre una celda de día */}
                    {dataSessionState?.dataSession?.super === true && contextMenuDate && (
                        <button
                            role='menuitem'
                            className='w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                            onClick={() => {
                                closeContextMenu();
                                setShowCommentForm(true);
                            }}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4 flex-shrink-0 text-gray-400'>
                                <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                            </svg>
                            Agregar comentario
                        </button>
                    )}
                </div>
            </ContextMenu>

            {/* Calendario del horario del operador — portal para escapar del zoom de la grilla */}
            {showScheduleCalendar && typeof window !== 'undefined' && createPortal(
                <UserScheduleCalendar
                    user={userState}
                    onClose={() => setShowScheduleCalendar(false)}
                />,
                document.body
            )}

            {/* Formulario de comentario — guarda en el documento Attendance del día */}
            {showCommentForm && typeof window !== 'undefined' && createPortal(
                <UserCommentForm
                    user={userState}
                    dateObj={contextMenuDate}
                    onCancel={() => setShowCommentForm(false)}
                    onSave={(texto) => runLocked(async () => {
                        try {
                            await addAttendanceComment({
                                userId: userState._id,
                                dni: userState.dni,
                                date: contextMenuDate?.toISOString(),
                                message: texto,
                            });
                            // La celda se refresca sola por el evento socket del backend
                            setShowCommentForm(false);
                        } catch (error) {
                            console.error('Error guardando comentario:', error);
                            // Cerrar el formulario y avisar por el modal global
                            setShowCommentForm(false);
                            dispatch(setConfigModal({
                                type: 'error',
                                title: 'No se pudo guardar',
                                description: error?.response?.status === 403
                                    ? 'No tienes permisos para agregar comentarios (se requiere usuario super).'
                                    : (error?.response?.data?.message || 'Hubo un problema al guardar el comentario. Intenta nuevamente.'),
                                modalOpen: true,
                            }));
                        }
                    }, 'comment')}
                />,
                document.body
            )}

            {/* Patrón semanal → overrides por fecha en TODO el mes siguiente */}
            {showNextMonthForm && typeof window !== 'undefined' && createPortal(
                <UserNextMonthScheduleForm
                    user={userState}
                    onCancel={() => setShowNextMonthForm(false)}
                    onSave={(updates) => runLocked(async () => {
                        try {
                            const response = await saveGroupDynamicSchedule({
                                updates: updates.map(u => ({ ...u, userId: userState._id, dni: userState.dni })),
                                adminUserId: dataSessionState?.dataSession?._id,
                            });
                            const itemErrors = response?.data?.errors || [];
                            if (itemErrors.length > 0) throw new Error(itemErrors[0]?.error || 'No se pudo aplicar el horario');

                            setShowNextMonthForm(false);
                            dispatch(setConfigModal({
                                type: 'successfull',
                                title: 'Horario del mes siguiente aplicado',
                                description: `Se guardaron ${updates.length} día(s) como cambios por fecha. El horario por defecto y el mes en curso no se modificaron.`,
                                modalOpen: true,
                            }));
                            // Las celdas se refrescan solas por los eventos socket del backend
                        } catch (error) {
                            console.error('Error aplicando horario del mes siguiente:', error);
                            dispatch(setConfigModal({
                                type: 'error',
                                title: 'No se pudo aplicar',
                                description: error?.response?.status === 403
                                    ? 'No tienes permisos para modificar horarios (se requiere administrador).'
                                    : (error?.response?.data?.message || error?.message || 'Hubo un problema al guardar. Intenta nuevamente.'),
                                modalOpen: true,
                            }));
                        }
                    }, 'nextMonth')}
                />,
                document.body
            )}

            {/* Formulario para asignar guardia o día extra sobre la fecha clickeada */}
            {assignFormMode && typeof window !== 'undefined' && createPortal(
                <UserDayAssignForm
                    user={userState}
                    dateObj={contextMenuDate}
                    mode={assignFormMode}
                    onCancel={() => setAssignFormMode(null)}
                    onSave={async (payload) => {
                        // Roles del día (guardia/auxiliar): primero fija el horario
                        // laboral del día y luego designa el rol (el backend valida
                        // turno único por departamento)
                        if (payload.workType === 'guardia' || payload.workType === 'auxiliar') {
                            const savedSchedule = await saveDayOverride({
                                workType: 'laboral',
                                shift: payload.shift,
                                startTime: payload.startTime,
                                endTime: payload.endTime,
                            });
                            if (!savedSchedule) return;
                            const designated = payload.workType === 'guardia'
                                ? await toggleOnDutyGuard(true)
                                : await toggleAuxiliaryRole(true);
                            if (designated) setAssignFormMode(null);
                            return;
                        }
                        const saved = await saveDayOverride(payload);
                        if (saved) setAssignFormMode(null);
                    }}
                />,
                document.body
            )}
        </>
    );
});
