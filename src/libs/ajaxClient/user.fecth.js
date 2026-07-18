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



