import axiosInstance from '@/libs/ajaxClient/axios.fetch';



export const fetchFileData = async (file) => {  
    try {
        if(!file) return null;

        const formData = new FormData();
        formData.append('img', file)

        const response = await axiosInstance.post('/multimedia', formData);
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }       
};