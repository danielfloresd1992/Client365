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