import axiosStand from '@/libs/axios.fetch';
import IP from '@/libs/dataFecth';




const getMenuAll = (category, callback) => {
    axiosStand.get(`https://${IP}/menu`)
        .then(response => {
            let menuList = [];
            const categoryList = [];
            response.data.forEach(menu => {
                if(categoryList.indexOf(menu.category) < 0){ 
                    categoryList.push(menu.category);
                }
                if(category === 'all'){
                    menuList.push(menu);
                }
                else if(menu.category === category){
                    menuList.push(menu);
                }
            });
            
            callback( null, { menuList, categoryList } );
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        })
};




const getMenuById = (id, callback) => {
    axiosStand.get(`https://${IP}/menu/id=${id}`)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const sendMenu = (body, callback) => {
    axiosStand.post(`https://${IP}/menu`, body)
        .then(response => {
            console.log()
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const putMenu = (body, callback) => {
    axiosStand.post(`https://${IP}/menu/put`, body)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const deleteMenu = (id, callback) => {
    axiosStand.delete(`https://${IP}/menu/id=${id}`)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        })
};




const getLocalLigth = async callback => {
    try {
        const listLocal = await aaxiosStand.get(`https://${IP}/localLigth`);
        callback(null, listLocal.data);
    } 
    catch(err){
        callback(err);
    }
}




export { getMenuAll, getMenuById, sendMenu, putMenu, deleteMenu, getLocalLigth };