import axiosInstance from '@/libs/ajaxClient/axios.fetch';



export const fetchUserData = async () => {
    try {
        const response = await axiosInstance.get('/user/AllById?inabilited=false');
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
};




export const userById = async (id) => {
    try {
        const response = await axiosInstance.get(`/user?id=${id}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching user data for ID ${id}:`, error);
        throw error;
    }
};


/**
 * Solicita el registro de asistencia de un usuario para un día específico.
 * @param {string} dni - El DNI o identificador del usuario.
 * @param {string} dateISO - Fecha normalizada (00:00:00) en formato ISO.
 * 
 * 
*/
export const getAttendanceByDate = async (dni, dateISO) => {
    try {
        const response = await axiosInstance.get(`/user/attendance/${dni}?date=${dateISO}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};





export const updateUserByRrhh = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/user/${id}`, data);
        return response.data;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}


/**
 * Solicita el reporte individual de asistencia de un empleado.
 * @param {string} userId - ObjectId del empleado.
 * @param {string} from   - Fecha inicio en formato YYYY-MM-DD.
 * @param {string} to     - Fecha fin en formato YYYY-MM-DD.
 * @returns {{ status, user, records, summary, period }}
 */
export const getAttendanceReport = async (userId, from, to) => {
    try {
        const response = await axiosInstance.get(`/user/attendance/report?userId=${userId}&from=${from}&to=${to}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};


/**
 * Solicita el reporte global de asistencia para TODOS los empleados activos.
 * Usa una única aggregation en el servidor para evitar N consultas individuales.
 * @param {string} from - Fecha inicio en formato YYYY-MM-DD.
 * @param {string} to   - Fecha fin en formato YYYY-MM-DD.
 * @returns {{ status, period, totals, employees[] }}
 *   employees[] tiene: { _id, name, surName, dni, jobInformation,
 *                        lateWeekday, lateWeekend, extraDays, totalPresent, img }
 */
export const getGlobalAttendanceReport = async (from, to) => {
    try {
        const response = await axiosInstance.get(`/user/attendance/global-report?from=${from}&to=${to}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};


export const saveGroupDynamicSchedule = async (payload) => {
    try {
        const response = await axiosInstance.post('/user/schedule/dynamic/group', payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Agrega un comentario al documento de asistencia de un día (solo usuarios super).
 * @param {{ userId?: string, dni?: string, date: string, message: string }} payload
 * @returns {{ status, result }} result = documento Attendance con comments populados
 */
export const addAttendanceComment = async (payload) => {
    try {
        const response = await axiosInstance.post('/user/attendance/comment', payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Designa o quita la guardia del día de un usuario (solo administradores).
 * El backend valida que no exista otra guardia del mismo departamento esa fecha.
 * @param {{ userId?: string, dni?: string, date: string, onDuty: boolean }} payload
 */
export const setOnDutyGuard = async (payload) => {
    try {
        const response = await axiosInstance.post('/user/attendance/on-duty', payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Designa o quita el auxiliar del día de un usuario (solo administradores).
 * Misma regla que la guardia: único por departamento, fecha y turno.
 * @param {{ userId?: string, dni?: string, date: string, auxiliary: boolean }} payload
 */
export const setAuxiliaryRole = async (payload) => {
    try {
        const response = await axiosInstance.post('/user/attendance/auxiliary', payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Aprueba o rechaza las horas extras de un día. Solo administradores.
 *
 * El excedente del día lo deriva el SERVIDOR del propio registro. `approvedMinutes`
 * es opcional y sirve para aprobar solo una parte (de 3 h generadas, autorizar 1 h);
 * omitirlo aprueba el total. El servidor valida esa cantidad contra su propio
 * cálculo, así que el cliente no puede inflar lo aprobado.
 * @param {{ userId?, dni?, date: string, status: 'approved'|'rejected', note?: string, approvedMinutes?: number }} payload
 */
export const decideOvertime = async (payload) => {
    try {
        const response = await axiosInstance.post('/user/attendance/overtime', payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Ficha del personal de HOY: jornada efectiva de cada usuario (override por
 * fecha > regla semanal > defecto), marcaje y roles del día.
 * @returns {{ date: string, dayNumber: number, roster: Array }}
 */
export const getTodayRoster = async () => {
    try {
        const response = await axiosInstance.get('/user/roster/today');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Rol del día SOLO del usuario en sesión (encargado de turno / auxiliar).
 * Liviano: no trae todo el roster. @returns {{ onDuty, auxiliary }}
 */
export const getMyDayRole = async () => {
    try {
        const response = await axiosInstance.get('/user/day-role/today');
        return response.data;
    }
    catch (error) {
        throw error;
    }
}


/**
 * Directorio de usuarios: lista paginada y buscable por name/surName (SIN password).
 * @param {{ page?: number, limit?: number, search?: string }} params
 * @returns {{ status, page, limit, search, totalUsers, totalPages, users[] }}
 */
export const getUsersList = async ({ page = 1, limit = 12, search = '', signal = null } = {}) => {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set('search', search);
        // `signal` permite cancelar: un buscador dispara una consulta por
        // pulsación y sin cancelar gana la que vuelve última, no la última que
        // se pidió.
        const response = await axiosInstance.get(`/user/list?${params.toString()}`, signal ? { signal } : undefined);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};

