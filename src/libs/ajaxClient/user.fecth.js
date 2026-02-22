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
        const response = await axiosInstance.put(`/user/${id}`,data);
        return response.data;
    } 
    catch (error) {
        console.log(error);
        throw error;
    }
}



