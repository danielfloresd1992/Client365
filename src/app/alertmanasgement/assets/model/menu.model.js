import axiosStand from '@/libs/ajaxClient/axios.fetch';




const getMenuAll = (category, callback) => {
    axiosStand.get(`/menu`)
        .then(response => {
            let menuList = [];
            const categoryList = [];
            response.data.forEach(menu => {
                if (categoryList.indexOf(menu.category) < 0) {
                    categoryList.push(menu.category);
                }
                if (category === 'all') {
                    menuList.push(menu);
                }
                else if (menu.category === category) {
                    menuList.push(menu);
                }
            });

            callback(null, { menuList, categoryList });
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        })
};




const getMenuById = (id, callback) => {
    axiosStand.get(`/menu/id=${id}`)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const sendMenu = (body, callback) => {
    axiosStand.post(`/menu`, body)
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
    axiosStand.post(`/menu/put`, body)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const deleteMenu = (id, callback) => {
    axiosStand.delete(`/menu/id=${id}`)
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
        const listLocal = await axiosStand.get(`/localLigth`);
        callback(null, listLocal.data);
    }
    catch (err) {
        callback(err);
    }
}




export { getMenuAll, getMenuById, sendMenu, putMenu, deleteMenu, getLocalLigth };